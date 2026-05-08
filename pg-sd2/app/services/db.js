require("dotenv").config();
const mysql = require("mysql2/promise");

const config = {
  db: {
    host: process.env.DB_CONTAINER,
    port: Number(process.env.DB_PORT),
    user: "root",
    password: process.env.MYSQL_ROOT_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 2,
    queueLimit: 0,
  },
};

const pool = mysql.createPool(config.db);

async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = {
  query,
};