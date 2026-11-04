const session = require("express-session");

const TTL = 8 * 60 * 60 * 1000;

class DatabaseSessionStore extends session.Store {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async initialize() {
    await this.pool.query(`CREATE TABLE IF NOT EXISTS sessions (
      sid VARCHAR(128) PRIMARY KEY,
      expires_at BIGINT NOT NULL,
      data MEDIUMTEXT NOT NULL,
      INDEX idx_sessions_expiry (expires_at)
    )`);
    await this.cleanup();
    this.timer = setInterval(() => this.cleanup().catch(error => {
      console.error("Erro ao limpar sessões:", error.code || error.message);
    }), 60 * 60 * 1000);
    this.timer.unref();
  }

  cleanup() {
    return this.pool.execute("DELETE FROM sessions WHERE expires_at <= ?", [Date.now()]);
  }

  get(sid, callback) {
    this.pool.execute("SELECT data FROM sessions WHERE sid = ? AND expires_at > ?", [sid, Date.now()])
      .then(([rows]) => {
        let data;
        try { data = rows.length ? JSON.parse(rows[0].data) : null; }
        catch (error) { callback(error); return; }
        callback(null, data);
      }, callback);
  }

  expiry(value) {
    return value.cookie?.expires ? new Date(value.cookie.expires).getTime() : Date.now() + TTL;
  }

  set(sid, value, callback = () => {}) {
    this.pool.execute(
      "INSERT INTO sessions (sid, expires_at, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE expires_at = ?, data = ?",
      [sid, this.expiry(value), JSON.stringify(value), this.expiry(value), JSON.stringify(value)]
    ).then(() => callback(null), callback);
  }

  touch(sid, value, callback = () => {}) {
    this.pool.execute("UPDATE sessions SET expires_at = ? WHERE sid = ?", [this.expiry(value), sid])
      .then(() => callback(null), callback);
  }

  destroy(sid, callback = () => {}) {
    this.pool.execute("DELETE FROM sessions WHERE sid = ?", [sid])
      .then(() => callback(null), callback);
  }

  close() {
    clearInterval(this.timer);
  }
}

module.exports = DatabaseSessionStore;
