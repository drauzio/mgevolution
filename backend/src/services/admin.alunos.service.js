const { getPool, sql } = require('../database/connection')
const bcrypt = require('bcrypt')

async function listar({ busca = '', status = 'todos' } = {}) {
  const pool = await getPool()

  const req = pool.request().input('busca', sql.VarChar, `%${busca}%`)

  const ativoFiltro = status === 'ativos' ? 'AND u.ativo = 1'
    : status === 'inativos' ? 'AND u.ativo = 0'
    : ''

  const result = await req.query(`
    SELECT
      u.id_usuario,
      u.nome,
      u.email,
      u.telefone,
      u.ativo,
      CONVERT(VARCHAR(10), u.data_criacao, 103) AS data_criacao,
      per.nome  AS personal,
      CASE WHEN av.id_avaliacao_fitness IS NOT NULL THEN 1 ELSE 0 END AS avaliacao_concluida
    FROM dbo.usuario u
    INNER JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
    INNER JOIN dbo.perfil p          ON p.id_perfil  = up.id_perfil  AND p.nome = 'aluno'
    LEFT JOIN dbo.treino_protocolo tp ON tp.id_usuario = u.id_usuario AND tp.ativo = 1
    LEFT JOIN dbo.usuario per        ON per.id_usuario = tp.id_personal
    LEFT JOIN dbo.avaliacao_fitness av
           ON av.id_usuario = u.id_usuario AND av.status = 'concluida' AND av.ativo = 1
    WHERE (u.nome LIKE @busca OR u.email LIKE @busca)
      ${ativoFiltro}
    ORDER BY u.data_criacao DESC
  `)

  return result.recordset
}

async function criar({ nome, email, telefone, senha }) {
  const pool = await getPool()
  const hash = await bcrypt.hash(senha, 10)

  const result = await pool.request()
    .input('nome',     sql.VarChar(120), nome)
    .input('email',    sql.VarChar(120), email)
    .input('telefone', sql.VarChar(20),  telefone || null)
    .input('hash',     sql.VarBinary(256), Buffer.from(hash))
    .query(`
      INSERT INTO dbo.usuario (nome, cpf, email, senha_hash, telefone, administrador, senha_provisoria)
      OUTPUT INSERTED.id_usuario
      VALUES (@nome, '00000000000', @email, @hash, @telefone, 0, 1)
    `)

  const id = result.recordset[0].id_usuario

  await pool.request()
    .input('id_usuario', sql.Int, id)
    .query(`
      INSERT INTO dbo.usuario_perfil (id_usuario, id_perfil)
      SELECT @id_usuario, id_perfil FROM dbo.perfil WHERE nome = 'aluno'
    `)

  return id
}

async function buscarPorId(id_usuario) {
  const pool = await getPool()
  const result = await pool.request()
    .input('id', sql.Int, id_usuario)
    .query(`
      SELECT u.id_usuario, u.nome, u.email, u.telefone, u.ativo
      FROM dbo.usuario u
      WHERE u.id_usuario = @id
    `)
  return result.recordset[0] || null
}

async function atualizar(id_usuario, { nome, email, telefone, senha }) {
  const pool = await getPool()

  if (senha) {
    const hash = await bcrypt.hash(senha, 10)
    await pool.request()
      .input('id',       sql.Int,           id_usuario)
      .input('nome',     sql.VarChar(120),   nome)
      .input('email',    sql.VarChar(120),   email)
      .input('telefone', sql.VarChar(20),    telefone || null)
      .input('hash',     sql.VarBinary(256), Buffer.from(hash))
      .query(`
        UPDATE dbo.usuario
        SET nome = @nome, email = @email, telefone = @telefone,
            senha_hash = @hash, senha_provisoria = 1
        WHERE id_usuario = @id
      `)
  } else {
    await pool.request()
      .input('id',       sql.Int,          id_usuario)
      .input('nome',     sql.VarChar(120),  nome)
      .input('email',    sql.VarChar(120),  email)
      .input('telefone', sql.VarChar(20),   telefone || null)
      .query(`
        UPDATE dbo.usuario
        SET nome = @nome, email = @email, telefone = @telefone
        WHERE id_usuario = @id
      `)
  }
}

async function toggleAtivo(id_usuario) {
  const pool = await getPool()
  await pool.request()
    .input('id', sql.Int, id_usuario)
    .query(`UPDATE dbo.usuario SET ativo = 1 - ativo WHERE id_usuario = @id`)
}

module.exports = { listar, criar, buscarPorId, atualizar, toggleAtivo }
