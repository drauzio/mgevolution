require('dotenv').config()
const sql = require('mssql')
const fs = require('fs')
const path = require('path')

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
    ...(process.env.DB_INSTANCE ? { instanceName: process.env.DB_INSTANCE } : {}),
  },
}

const SEEDS_DIR = path.join(__dirname, '..', '..', 'database', 'seeds')

async function run() {
  let pool

  try {
    console.log('Conectando ao banco...')
    pool = await sql.connect(config)
    console.log('Conectado!\n')

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '_seeds')
      CREATE TABLE dbo._seeds (
        id       INT IDENTITY(1,1) PRIMARY KEY,
        arquivo  VARCHAR(200) NOT NULL UNIQUE,
        aplicado DATETIME NOT NULL DEFAULT GETDATE()
      )
    `)

    const arquivos = fs.readdirSync(SEEDS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort()

    for (const arquivo of arquivos) {
      const jaAplicado = await pool.request()
        .input('arquivo', sql.VarChar, arquivo)
        .query('SELECT 1 FROM dbo._seeds WHERE arquivo = @arquivo')

      if (jaAplicado.recordset.length > 0) {
        console.log(`  SKIP  ${arquivo}`)
        continue
      }

      const conteudo = fs.readFileSync(path.join(SEEDS_DIR, arquivo), 'utf8')

      const blocos = conteudo.split(/^\s*GO\s*$/im).filter(b => b.trim())

      for (const bloco of blocos) {
        if (bloco.trim()) await pool.request().query(bloco)
      }

      await pool.request()
        .input('arquivo', sql.VarChar, arquivo)
        .query('INSERT INTO dbo._seeds (arquivo) VALUES (@arquivo)')

      console.log(`  OK    ${arquivo}`)
    }

    console.log('\nSeeds concluídos.')
  } catch (e) {
    console.error('\nErro:', e.message)
    process.exit(1)
  } finally {
    if (pool) await pool.close()
  }
}

run()
