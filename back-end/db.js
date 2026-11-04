require("dotenv").config({
  path: require("node:path").join(__dirname, ".env"),
});

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl:
    process.env.DB_SSL === "true"
      ? {
          minVersion: "TLSv1.2",
          rejectUnauthorized: true,
        }
      : undefined,

  waitForConnections: true,
  connectionLimit: 5,
  connectTimeout: 15000,
});

module.exports = pool;
