const pool = require("./db");

async function testConnection() {
  try {
    const [rows] = await pool.query("SELECT DATABASE() AS database_name");

    console.log("Conexão realizada! Banco:", rows[0].database_name);
  } catch (error) {
    console.error("Falha na conexão:", error.code);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testConnection();