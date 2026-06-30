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
      u.administrador,
      CONVERT(VARCHAR(10), u.data_criacao, 103) AS data_criacao,
      STRING_AGG(p.nome, ',') AS perfis
    FROM dbo.usuario u
    LEFT JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
    LEFT JOIN dbo.perfil p          ON p.id_perfil  = up.id_perfil  AND p.ativo  = 1
    WHERE (u.nome LIKE @busca OR u.email LIKE @busca)
      ${ativoFiltro}
    GROUP BY u.id_usuario, u.nome, u.email, u.telefone, u.ativo, u.administrador, u.data_criacao
    ORDER BY u.data_criacao DESC
  `)

  return result.recordset.map(u => ({
    ...u,
    perfis: u.perfis ? u.perfis.split(',') : [],
  }))
}

async function buscarPorId(id_usuario) {
  const pool = await getPool()

  const result = await pool.request()
    .input('id', sql.Int, id_usuario)
    .query(`
      SELECT
        u.id_usuario, u.nome, u.email, u.telefone, u.cpf,
        u.data_nascimento, u.sexo, u.bio, u.foto_url, u.data_fim_carencia,
        u.ativo, u.administrador,
        STRING_AGG(p.nome, ',') AS perfis
      FROM dbo.usuario u
      LEFT JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
      LEFT JOIN dbo.perfil p          ON p.id_perfil  = up.id_perfil  AND p.ativo  = 1
      WHERE u.id_usuario = @id
      GROUP BY u.id_usuario, u.nome, u.email, u.telefone, u.cpf,
               u.data_nascimento, u.sexo, u.bio, u.foto_url, u.data_fim_carencia, u.ativo, u.administrador
    `)

  if (!result.recordset[0]) return null
  const u = result.recordset[0]
  return { ...u, perfis: u.perfis ? u.perfis.split(',') : [] }
}

async function criar({ nome, email, telefone, senha, perfis = [] }) {
  const pool = await getPool()

  const existente = await pool.request()
    .input('email', sql.VarChar(120), email)
    .query(`SELECT id_usuario FROM dbo.usuario WHERE email = @email`)

  if (existente.recordset.length > 0) {
    const err = new Error('Já existe um usuário cadastrado com este e-mail.')
    err.status = 409
    throw err
  }

  if (!senha) {
    const err = new Error('Senha é obrigatória.')
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

  if (perfis.length > 0) {
    const lista = perfis.map(p => `'${p}'`).join(',')
    await pool.request()
      .input('id_usuario', sql.Int, id)
      .query(`
        INSERT INTO dbo.usuario_perfil (id_usuario, id_perfil)
        SELECT @id_usuario, id_perfil FROM dbo.perfil WHERE nome IN (${lista})
      `)
  }

  return id
}

async function atualizar(id_usuario, { nome, email, telefone, senha, perfis, cpf, data_nascimento, sexo, bio, data_fim_carencia }) {
  const pool = await getPool()
  const cpfDigitos = cpf ? String(cpf).replace(/\D/g, '') : '00000000000'

  if (senha) {
    const hash = await bcrypt.hash(senha, 10)
    await pool.request()
      .input('id',                sql.Int,           id_usuario)
      .input('nome',              sql.VarChar(120),   nome)
      .input('email',             sql.VarChar(120),   email)
      .input('telefone',          sql.VarChar(20),    telefone ? telefone.replace(/\D/g, '') : null)
      .input('cpf',               sql.VarChar(11),    cpfDigitos)
      .input('data_nascimento',   sql.Date,           data_nascimento || null)
      .input('sexo',              sql.VarChar(1),     sexo || null)
      .input('bio',               sql.VarChar(500),   bio || null)
      .input('data_fim_carencia', sql.Date,           data_fim_carencia || null)
      .input('hash',              sql.VarBinary(256), Buffer.from(hash))
      .query(`
        UPDATE dbo.usuario
        SET nome = @nome, email = @email, telefone = @telefone,
            cpf = @cpf, data_nascimento = @data_nascimento, sexo = @sexo, bio = @bio,
            data_fim_carencia = @data_fim_carencia,
            senha_hash = @hash, senha_provisoria = 1
        WHERE id_usuario = @id
      `)
  } else {
    await pool.request()
      .input('id',                sql.Int,          id_usuario)
      .input('nome',              sql.VarChar(120),  nome)
      .input('email',             sql.VarChar(120),  email)
      .input('telefone',          sql.VarChar(20),   telefone ? telefone.replace(/\D/g, '') : null)
      .input('cpf',               sql.VarChar(11),   cpfDigitos)
      .input('data_nascimento',   sql.Date,          data_nascimento || null)
      .input('sexo',              sql.VarChar(1),    sexo || null)
      .input('bio',               sql.VarChar(500),  bio || null)
      .input('data_fim_carencia', sql.Date,          data_fim_carencia || null)
      .query(`
        UPDATE dbo.usuario
        SET nome = @nome, email = @email, telefone = @telefone,
            cpf = @cpf, data_nascimento = @data_nascimento, sexo = @sexo, bio = @bio,
            data_fim_carencia = @data_fim_carencia
        WHERE id_usuario = @id
      `)
  }

  if (Array.isArray(perfis)) {
    await pool.request()
      .input('id', sql.Int, id_usuario)
      .query(`DELETE FROM dbo.usuario_perfil WHERE id_usuario = @id`)

    if (perfis.length > 0) {
      const lista = perfis.map(p => `'${p}'`).join(',')
      await pool.request()
        .input('id_usuario', sql.Int, id_usuario)
        .query(`
          INSERT INTO dbo.usuario_perfil (id_usuario, id_perfil)
          SELECT @id_usuario, id_perfil FROM dbo.perfil WHERE nome IN (${lista})
        `)
    }
  }
}

async function toggleAtivo(id_usuario) {
  const pool = await getPool()
  await pool.request()
    .input('id', sql.Int, id_usuario)
    .query(`UPDATE dbo.usuario SET ativo = 1 - ativo WHERE id_usuario = @id`)
}

module.exports = { listar, buscarPorId, criar, atualizar, toggleAtivo }
