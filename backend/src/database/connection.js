const sql = require('mssql')

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  options: {
    encrypt: process.env.DB_ENCRYPT !== 'false',
    trustServerCertificate: true,
    ...(process.env.DB_INSTANCE ? { instanceName: process.env.DB_INSTANCE } : {}),
  },
  pool: { min: 2, max: 10 },
  connectionTimeout: 30000,
}

let pool = null

async function getPool() {
  if (pool) return pool
  pool = await sql.connect(config)
  pool.on('error', () => { pool = null })
  return pool
}

module.exports = { getPool, sql }
