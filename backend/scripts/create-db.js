require('dotenv').config()
const sql = require('mssql')

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT) || 1433,
  database: 'master',
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  options: { encrypt: false, trustServerCertificate: true },
  connectionTimeout: 15000,
}

async function run() {
  let pool
  try {
    console.log('Conectando em', process.env.DB_SERVER, '...')
    pool = await sql.connect(config)
    console.log('Conectado!')

    await pool.request().query(`
      IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'mgevolution')
        CREATE DATABASE mgevolution COLLATE Latin1_General_CI_AI
    `)
    console.log('Banco mgevolution OK.')
  } catch (e) {
    console.error('Erro:', e.message)
    process.exit(1)
  } finally {
    if (pool) await pool.close()
  }
}

run()
