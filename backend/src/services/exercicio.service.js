const { getPool, sql } = require('../database/connection')

async function listar({ busca, grupo, ativo } = {}) {
  const pool = await getPool()
  const req = pool.request()
  let where = 'WHERE 1=1'
  if (busca)         { req.input('busca', sql.VarChar(100), `%${busca}%`); where += ' AND (e.nome LIKE @busca OR e.equipamento LIKE @busca)' }
  if (grupo)         { req.input('grupo', sql.VarChar(60),  grupo);         where += ' AND e.grupo_muscular = @grupo' }
  if (ativo !== undefined) { req.input('ativo', sql.Bit, ativo ? 1 : 0);   where += ' AND e.ativo = @ativo' }

  const result = await req.query(`
    SELECT id_exercicio, nome, grupo_muscular, equipamento, descricao, video_url, ativo, data_criacao
    FROM dbo.exercicio e
    ${where}
    ORDER BY e.grupo_muscular, e.nome
  `)
  return result.recordset
}

async function buscarPorId(id) {
  const pool = await getPool()
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`SELECT * FROM dbo.exercicio WHERE id_exercicio = @id`)
  return result.recordset[0] || null
}

async function criar(dados) {
  const { nome, grupo_muscular, equipamento, descricao, video_url } = dados
  const pool = await getPool()
  const result = await pool.request()
    .input('nome',           sql.VarChar(120), nome)
    .input('grupo_muscular', sql.VarChar(60),  grupo_muscular)
    .input('equipamento',    sql.VarChar(60),  equipamento || null)
    .input('descricao',      sql.VarChar(500), descricao || null)
    .input('video_url',      sql.VarChar(300), video_url || null)
    .query(`
      INSERT INTO dbo.exercicio (nome, grupo_muscular, equipamento, descricao, video_url)
      OUTPUT INSERTED.id_exercicio
      VALUES (@nome, @grupo_muscular, @equipamento, @descricao, @video_url)
    `)
  return { id_exercicio: result.recordset[0].id_exercicio }
}

async function atualizar(id, dados) {
  const { nome, grupo_muscular, equipamento, descricao, video_url } = dados
  const pool = await getPool()
  await pool.request()
    .input('id',             sql.Int,          id)
    .input('nome',           sql.VarChar(120), nome)
    .input('grupo_muscular', sql.VarChar(60),  grupo_muscular)
    .input('equipamento',    sql.VarChar(60),  equipamento || null)
    .input('descricao',      sql.VarChar(500), descricao || null)
    .input('video_url',      sql.VarChar(300), video_url || null)
    .query(`
      UPDATE dbo.exercicio
      SET nome = @nome, grupo_muscular = @grupo_muscular, equipamento = @equipamento,
          descricao = @descricao, video_url = @video_url
      WHERE id_exercicio = @id
    `)
}

async function toggleAtivo(id) {
  const pool = await getPool()
  await pool.request()
    .input('id', sql.Int, id)
    .query(`UPDATE dbo.exercicio SET ativo = ~ativo WHERE id_exercicio = @id`)
}

async function salvarVideoFilekey(id, filekey) {
  const pool = await getPool()
  await pool.request()
    .input('id',      sql.Int,          id)
    .input('filekey', sql.VarChar(500),  filekey)
    .query(`UPDATE dbo.exercicio SET video_url = @filekey WHERE id_exercicio = @id`)
}

async function removerVideoFilekey(id) {
  const pool = await getPool()
  await pool.request()
    .input('id', sql.Int, id)
    .query(`UPDATE dbo.exercicio SET video_url = NULL WHERE id_exercicio = @id`)
}

module.exports = { listar, buscarPorId, criar, atualizar, toggleAtivo, salvarVideoFilekey, removerVideoFilekey }
