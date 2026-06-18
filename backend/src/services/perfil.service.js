const { getPool, sql } = require('../database/connection')
const bcrypt = require('bcrypt')

async function buscar(id_usuario) {
  const pool = await getPool()
  const r = await pool.request()
    .input('id', sql.Int, id_usuario)
    .query(`
      SELECT id_usuario, nome, email, telefone, cpf,
             data_nascimento, sexo, bio, foto_url
      FROM dbo.usuario
      WHERE id_usuario = @id AND ativo = 1
    `)
  return r.recordset[0] || null
}

async function atualizar(id_usuario, { nome, telefone, data_nascimento, sexo, bio }) {
  const pool = await getPool()
  await pool.request()
    .input('id',               sql.Int,          id_usuario)
    .input('nome',             sql.VarChar(120),  nome)
    .input('telefone',         sql.VarChar(20),   telefone ? telefone.replace(/\D/g, '') : null)
    .input('data_nascimento',  sql.Date,          data_nascimento || null)
    .input('sexo',             sql.VarChar(1),    sexo || null)
    .input('bio',              sql.VarChar(500),  bio || null)
    .query(`
      UPDATE dbo.usuario
      SET nome = @nome, telefone = @telefone,
          data_nascimento = @data_nascimento, sexo = @sexo, bio = @bio,
          data_atualizacao = SYSUTCDATETIME()
      WHERE id_usuario = @id AND ativo = 1
    `)
}

async function atualizarFoto(id_usuario, foto_url) {
  const pool = await getPool()
  await pool.request()
    .input('id',      sql.Int,          id_usuario)
    .input('foto',    sql.VarChar(500), foto_url)
    .query(`UPDATE dbo.usuario SET foto_url = @foto WHERE id_usuario = @id`)
}

async function trocarSenha(id_usuario, senhaAtual, novaSenha) {
  const pool = await getPool()
  const r = await pool.request()
    .input('id', sql.Int, id_usuario)
    .query(`SELECT senha_hash FROM dbo.usuario WHERE id_usuario = @id AND ativo = 1`)

  const usuario = r.recordset[0]
  if (!usuario) throw Object.assign(new Error('Usuário não encontrado'), { status: 404 })

  const ok = await bcrypt.compare(senhaAtual, usuario.senha_hash.toString())
  if (!ok) throw Object.assign(new Error('Senha atual incorreta'), { status: 400 })

  if (novaSenha.length < 6)
    throw Object.assign(new Error('A nova senha deve ter no mínimo 6 caracteres'), { status: 400 })

  const hash = await bcrypt.hash(novaSenha, 10)
  await pool.request()
    .input('id',   sql.Int,            id_usuario)
    .input('hash', sql.VarBinary(256), Buffer.from(hash))
    .query(`
      UPDATE dbo.usuario
      SET senha_hash = @hash, senha_provisoria = 0, data_atualizacao = SYSUTCDATETIME()
      WHERE id_usuario = @id
    `)
}

module.exports = { buscar, atualizar, atualizarFoto, trocarSenha }
