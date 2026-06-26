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

async function atualizar(id_usuario, { nome, telefone, data_nascimento, sexo, bio, cpf }) {
  const pool = await getPool()
  const cpfDigitos = cpf ? String(cpf).replace(/\D/g, '') : ''
  if (cpfDigitos && cpfDigitos !== '00000000000') {
    if (cpfDigitos.length !== 11 || !validarCPF(cpfDigitos))
      throw Object.assign(new Error('CPF inválido'), { status: 400 })
  }
  await pool.request()
    .input('id',               sql.Int,          id_usuario)
    .input('nome',             sql.VarChar(120),  nome)
    .input('telefone',         sql.VarChar(20),   telefone ? telefone.replace(/\D/g, '') : null)
    .input('data_nascimento',  sql.Date,          data_nascimento || null)
    .input('sexo',             sql.VarChar(1),    sexo || null)
    .input('bio',              sql.VarChar(500),  bio || null)
    .input('cpf',              sql.VarChar(11),   cpfDigitos || '00000000000')
    .query(`
      UPDATE dbo.usuario
      SET nome = @nome, telefone = @telefone,
          data_nascimento = @data_nascimento, sexo = @sexo, bio = @bio,
          cpf = @cpf,
          data_atualizacao = SYSUTCDATETIME()
      WHERE id_usuario = @id AND ativo = 1
    `)
}

function validarCPF(n) {
  if (/^(\d)\1{10}$/.test(n)) return false
  let s = 0
  for (let i = 0; i < 9; i++) s += Number(n[i]) * (10 - i)
  let d1 = (s * 10) % 11; if (d1 >= 10) d1 = 0
  if (d1 !== Number(n[9])) return false
  s = 0
  for (let i = 0; i < 10; i++) s += Number(n[i]) * (11 - i)
  let d2 = (s * 10) % 11; if (d2 >= 10) d2 = 0
  return d2 === Number(n[10])
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

async function excluirConta(id_usuario) {
  const pool = await getPool()

  const r = await pool.request()
    .input('id', sql.Int, id_usuario)
    .query(`SELECT nome, email FROM dbo.usuario WHERE id_usuario = @id AND ativo = 1`)

  const usuario = r.recordset[0]
  if (!usuario) throw Object.assign(new Error('Usuário não encontrado'), { status: 404 })

  await pool.request()
    .input('id',          sql.Int,          id_usuario)
    .input('nome',        sql.VarChar(100), usuario.nome)
    .input('dados_antes', sql.NVarChar,     JSON.stringify({ nome: usuario.nome, email: usuario.email }))
    .query(`
      INSERT INTO dbo.auditoria_log (id_usuario, nome_usuario, acao, entidade, id_entidade, descricao, dados_antes)
      VALUES (@id, @nome, 'EXCLUIR_CONTA', 'usuario', @id, 'Exclusão de conta solicitada pelo próprio usuário', @dados_antes)
    `)

  await pool.request()
    .input('id', sql.Int, id_usuario)
    .query(`
      UPDATE dbo.usuario
      SET ativo = 0,
          nome = 'Conta excluída',
          email = CONCAT('deleted_', CAST(id_usuario AS NVARCHAR(20)), '_', REPLACE(CAST(SYSUTCDATETIME() AS NVARCHAR(30)), ':', ''), '@deleted.local'),
          telefone = NULL,
          data_nascimento = NULL,
          sexo = NULL,
          bio = NULL,
          foto_url = NULL,
          data_atualizacao = SYSUTCDATETIME()
      WHERE id_usuario = @id AND ativo = 1
    `)
}

module.exports = { buscar, atualizar, atualizarFoto, trocarSenha, excluirConta }
