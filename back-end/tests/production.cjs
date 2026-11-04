const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const realRequire = createRequire(path.join(__dirname, "../server.js"));
const users = new Map();
const sessions = new Map();
const pool = {
  async query() { return []; },
  async execute(sql, values) {
    if (sql.startsWith("DELETE FROM sessions WHERE expires_at")) {
      for (const [sid, value] of sessions) if (value.expires_at <= values[0]) sessions.delete(sid);
      return [{ affectedRows: 0 }];
    }
    if (sql.startsWith("SELECT data FROM sessions")) {
      const value = sessions.get(values[0]);
      return [value && value.expires_at > values[1] ? [{ data: value.data }] : []];
    }
    if (sql.startsWith("INSERT INTO sessions")) {
      sessions.set(values[0], { expires_at: values[1], data: values[2] });
      return [{ affectedRows: 1 }];
    }
    if (sql.startsWith("UPDATE sessions")) {
      const value = sessions.get(values[1]);
      if (value) value.expires_at = values[0];
      return [{ affectedRows: value ? 1 : 0 }];
    }
    if (sql.startsWith("DELETE FROM sessions WHERE sid")) {
      sessions.delete(values[0]); return [{ affectedRows: 1 }];
    }
    if (sql.startsWith("INSERT INTO users")) {
      users.set(values[2], { id: values[0], name: values[1], email: values[2], password_hash: values[3] });
      return [{ affectedRows: 1 }];
    }
    if (sql.includes("FROM users WHERE email")) return [[...users.values()].filter(user => user.email === values[0])];
    if (sql.includes("FROM users WHERE id")) return [[...users.values()].filter(user => user.id === values[0])];
    throw new Error("SQL inesperado: " + sql);
  },
  async end() {},
};
function application() {
  const localModule = { exports: {} };
  function customRequire(name) {
    if (name === "./db") return pool;
    if (name === "node:fs") return { existsSync: () => true };
    if (name === "express") {
      const express = realRequire(name);
      const wrapped = () => express();
      wrapped.json = express.json;
      wrapped.static = () => (req, res, next) => {
        if (req.path === "/") return res.type("html").send("<html>FitLife</html>");
        next();
      };
      return wrapped;
    }
    return realRequire(name);
  }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../server.js"), "utf8"), {
    require: customRequire, module: localModule, __dirname: path.join(__dirname, ".."),
    process: { env: { NODE_ENV: "production", PORT: "0", SESSION_SECRET: "test-only-secret" } },
    console, Buffer, setInterval,
  });
  return localModule.exports;
}
async function close(server) {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
(async () => {
  let server;
  try {
    server = await application().start();
    let base = "http://127.0.0.1:" + server.address().port;
    const request = (url, body, cookie) => fetch(base + url, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json", "X-Forwarded-Proto": "https", ...(cookie ? { Cookie: cookie } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    assert.match(await (await request("/")).text(), /FitLife/);
    assert.equal((await request("/api/health")).status, 200);
    assert.equal((await request("/api/auth/me")).status, 401);
    const account = { name: "Teste", email: "teste@example.com", password: "test-password-123" };
    assert.equal((await request("/api/auth/register", account)).status, 201);
    const login = await request("/api/auth/login", account);
    assert.equal(login.status, 200);
    const setCookie = login.headers.get("set-cookie");
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /Secure/i);
    assert.match(setCookie, /SameSite=Lax/i);
    const cookie = setCookie.split(";")[0];
    assert.equal((await request("/api/auth/me", null, cookie)).status, 200);
    assert.equal(sessions.size, 1);
    await close(server);
    server = await application().start();
    base = "http://127.0.0.1:" + server.address().port;
    assert.equal((await request("/api/auth/me", null, cookie)).status, 200);
    assert.equal((await request("/api/auth/logout", {}, cookie)).status, 204);
    assert.equal((await request("/api/auth/me", null, cookie)).status, 401);
    for (let i = 0; i < 31; i++) await request("/api/auth/login", {email: "", password: ""});
    assert.equal((await request("/api/auth/login", account)).status, 429);
    console.log("PASS: HTTP real, /api, frontend simulado, bcrypt real, cookie seguro, sessão após reinício, logout e limite de tentativas. Banco simulado.");
  } finally { if (server) await close(server); }
})().catch(error => {console.error(error); process.exitCode = 1;});
