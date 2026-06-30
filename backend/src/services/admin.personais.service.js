const { getPool, sql } = require('../database/connection')
const bcrypt = require('bcrypt')

async function listar({ busca = '', status = 'todos' } = {}) {
  const pool = await getPool()
  const req = pool.request().input('busca', sql.VarChar, `%${busca}%`)

  const ativoFiltro = status === 'ativos'   ? 'AND u.ativo = 1'
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
      (
        SELECT COUNT(DISTINCT tp.id_usuario)
        FROM dbo.treino_protocolo tp
        WHERE tp.id_personal = u.id_usuario AND tp.ativo = 1
      ) AS qtd_alunos
    FROM dbo.usuario u
    INNER JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
    INNER JOIN dbo.perfil p          ON p.id_perfil  = up.id_perfil  AND p.nome = 'personal'
    WHERE (u.nome LIKE @busca OR u.email LIKE @busca)
      ${ativoFiltro}
    ORDER BY u.ativo DESC, u.nome
  `)

  return result.recordset
}

async function criar({ nome, email, telefone, senha }) {
  const pool = await getPool()

  // Se já existe usuário com este e-mail, apenas adiciona o perfil personal
  const existente = await pool.request()
    .input('email', sql.VarChar(120), email)
    .query(`SELECT id_usuario FROM dbo.usuario WHERE email = @email`)

  if (existente.recordset.length > 0) {
    const id = existente.recordset[0].id_usuario

    const jaVinculado = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 1 FROM dbo.usuario_perfil up
        INNER JOIN dbo.perfil p ON p.id_perfil = up.id_perfil
        WHERE up.id_usuario = @id AND p.nome = 'personal' AND up.ativo = 1
      `)

    if (jaVinculado.recordset.length > 0) {
      const err = new Error('Já existe um personal cadastrado com este e-mail.')
      err.status = 409
      throw err
    }

    await pool.request()
      .input('id_usuario', sql.Int, id)
      .query(`
        INSERT INTO dbo.usuario_perfil (id_usuario, id_perfil)
        SELECT @id_usuario, id_perfil FROM dbo.perfil WHERE nome = 'personal'
      `)

    return { id, vinculado: true }
  }

  // Usuário novo — senha obrigatória
  if (!senha) {
    const err = new Error('Senha é obrigatória para criar um novo usuário.')
    err.status = 400
    throw err
  }

  const hash = await bcrypt.hash(senha, 10)

  const result = await pool.request()
    .input('nome',     sql.VarChar(120),   nome)
    .input('email',    sql.VarChar(120),   email)
    .input('telefone', sql.VarChar(20),    telefone ? telefone.replace(/\D/g, '') : null)
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
      SELECT @id_usuario, id_perfil FROM dbo.perfil WHERE nome = 'personal'
    `)

  return { id, vinculado: false }
}

async function buscarPorId(id_usuario) {
  const pool = await getPool()
  const result = await pool.request()
    .input('id', sql.Int, id_usuario)
    .query(`
      SELECT u.id_usuario, u.nome, u.email, u.telefone, u.ativo
      FROM dbo.usuario u
      INNER JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
      INNER JOIN dbo.perfil p          ON p.id_perfil  = up.id_perfil  AND p.nome = 'personal'
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
      .input('telefone', sql.VarChar(20),    telefone ? telefone.replace(/\D/g, '') : null)
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
      .input('telefone', sql.VarChar(20),   telefone ? telefone.replace(/\D/g, '') : null)
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
