const { getPool, sql } = require('../database/connection')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

async function login(email, senha) {
  const pool = await getPool()

  const result = await pool.request()
    .input('email', sql.VarChar, email)
    .query(`
      SELECT u.id_usuario, u.nome, u.email, u.senha_hash, u.ativo, u.senha_provisoria,
             STRING_AGG(p.nome, ',') AS perfis
      FROM dbo.usuario u
      LEFT JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
      LEFT JOIN dbo.perfil p          ON p.id_perfil  = up.id_perfil  AND p.ativo  = 1
      WHERE u.email = @email
      GROUP BY u.id_usuario, u.nome, u.email, u.senha_hash, u.ativo, u.senha_provisoria
    `)

  const usuario = result.recordset[0]
  if (!usuario) throw { status: 401, mensagem: 'E-mail ou senha inválidos' }
  if (!usuario.ativo) throw { status: 403, mensagem: 'Usuário inativo' }

  const senhaOk = await bcrypt.compare(senha, usuario.senha_hash.toString())
  if (!senhaOk) throw { status: 401, mensagem: 'E-mail ou senha inválidos' }

  const perfis = usuario.perfis ? usuario.perfis.split(',') : ['aluno']

  // perfil principal = maior privilégio
  const perfilPrincipal = perfis.includes('admin')
    ? 'admin'
    : perfis.includes('personal')
      ? 'personal'
      : 'aluno'

  const payload = {
    id:               usuario.id_usuario,
    nome:             usuario.nome,
    email:            usuario.email,
    perfil:           perfilPrincipal,
    perfis,
    senha_provisoria: usuario.senha_provisoria,
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '8h' })

  return { token, usuario: payload }
}

async function registro({ nome, email, senha, telefone }) {
  const pool = await getPool()
  const hash = await bcrypt.hash(senha, 10)

  const result = await pool.request()
    .input('nome',     sql.VarChar(120),   nome)
    .input('email',    sql.VarChar(120),   email)
    .input('cpf',      sql.VarChar(11),    '00000000000')
    .input('hash',     sql.VarBinary(256), Buffer.from(hash))
    .input('telefone', sql.VarChar(20),    telefone ? telefone.replace(/\D/g, '') : null)
    .query(`
      INSERT INTO dbo.usuario (nome, cpf, email, senha_hash, telefone, administrador, senha_provisoria)
      OUTPUT INSERTED.id_usuario
      VALUES (@nome, @cpf, @email, @hash, @telefone, 0, 0)
    `)

  const id = result.recordset[0].id_usuario

  // vincula perfil 'aluno' automaticamente
  await pool.request()
    .input('id_usuario', sql.Int, id)
    .query(`
      INSERT INTO dbo.usuario_perfil (id_usuario, id_perfil)
      SELECT @id_usuario, id_perfil FROM dbo.perfil WHERE nome = 'aluno'
    `)

  return id
}

async function criarUsuario({ nome, email, cpf, senha, administrador = false }) {
  const pool = await getPool()
  const hash = await bcrypt.hash(senha, 10)

  const result = await pool.request()
    .input('nome', sql.VarChar(120), nome)
    .input('email', sql.VarChar(120), email)
    .input('cpf', sql.VarChar(11), cpf.replace(/\D/g, ''))
    .input('hash', sql.VarBinary(256), Buffer.from(hash))
    .input('admin', sql.Bit, administrador ? 1 : 0)
    .query(`
      INSERT INTO dbo.usuario (nome, email, cpf, senha_hash, administrador, senha_provisoria)
      OUTPUT INSERTED.id_usuario
      VALUES (@nome, @email, @cpf, @hash, @admin, 1)
    `)

  return result.recordset[0].id_usuario
}

module.exports = { login, registro, criarUsuario }
