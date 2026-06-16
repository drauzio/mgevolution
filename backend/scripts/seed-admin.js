require('dotenv').config()
const sql = require('mssql')
const bcrypt = require('bcrypt')

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

// Edite aqui antes de rodar
const ADMIN = {
  nome: 'Administrador',
  cpf: '00000000000',
  email: 'admin@mgevolution.com',
  senha: 'Admin@123',
}

async function run() {
  let pool
  try {
    pool = await sql.connect(config)

    const jaExiste = await pool.request()
      .input('email', sql.VarChar, ADMIN.email)
      .query('SELECT 1 FROM dbo.usuario WHERE email = @email')

    if (jaExiste.recordset.length > 0) {
      console.log('Usuário admin já existe.')
      return
    }

    const hash = await bcrypt.hash(ADMIN.senha, 10)

    await pool.request()
      .input('nome',  sql.VarChar(120),   ADMIN.nome)
      .input('cpf',   sql.VarChar(11),    ADMIN.cpf)
      .input('email', sql.VarChar(120),   ADMIN.email)
      .input('hash',  sql.VarBinary(256), Buffer.from(hash))
      .query(`
        INSERT INTO dbo.usuario (nome, cpf, email, senha_hash, administrador, senha_provisoria)
        VALUES (@nome, @cpf, @email, @hash, 1, 0)
      `)

    console.log('Admin criado com sucesso!')
    console.log(`  E-mail: ${ADMIN.email}`)
    console.log(`  Senha:  ${ADMIN.senha}`)
  } catch (e) {
    console.error('Erro:', e.message)
    process.exit(1)
  } finally {
    if (pool) await pool.close()
  }
}

run()
