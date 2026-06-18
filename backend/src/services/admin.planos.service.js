const { getPool, sql } = require('../database/connection')

async function listar() {
  const pool = await getPool()
  const result = await pool.request().query(`
    SELECT
      p.id_plano,
      p.nome,
      p.descricao,
      p.preco,
      p.duracao_dias,
      p.ativo,
      p.data_criacao,
      (SELECT COUNT(*) FROM dbo.assinatura a WHERE a.id_plano = p.id_plano AND a.status = 'ativa') AS assinaturas_ativas
    FROM dbo.plano p
    ORDER BY p.ativo DESC, p.preco ASC
  `)
  return result.recordset
}

async function buscarPorId(id) {
  const pool = await getPool()
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        p.id_plano, p.nome, p.descricao, p.preco, p.duracao_dias, p.ativo, p.data_criacao,
        (SELECT COUNT(*) FROM dbo.assinatura a WHERE a.id_plano = p.id_plano AND a.status = 'ativa') AS assinaturas_ativas
      FROM dbo.plano p
      WHERE p.id_plano = @id
    `)
  return result.recordset[0] || null
}

async function criar({ nome, descricao, preco, duracao_dias }) {
  const pool = await getPool()
  const result = await pool.request()
    .input('nome',         sql.VarChar(100), nome)
    .input('descricao',    sql.VarChar(500), descricao || null)
    .input('preco',        sql.Decimal(10,2), Number(preco) || 0)
    .input('duracao_dias', sql.Int, Number(duracao_dias) || 30)
    .query(`
      INSERT INTO dbo.plano (nome, descricao, preco, duracao_dias)
      OUTPUT INSERTED.id_plano
      VALUES (@nome, @descricao, @preco, @duracao_dias)
    `)
  return { id_plano: result.recordset[0].id_plano }
}

async function atualizar(id, { nome, descricao, preco, duracao_dias }) {
  const pool = await getPool()
  await pool.request()
    .input('id',           sql.Int, id)
    .input('nome',         sql.VarChar(100), nome)
    .input('descricao',    sql.VarChar(500), descricao || null)
    .input('preco',        sql.Decimal(10,2), Number(preco) || 0)
    .input('duracao_dias', sql.Int, Number(duracao_dias) || 30)
    .query(`
      UPDATE dbo.plano
      SET nome = @nome, descricao = @descricao, preco = @preco, duracao_dias = @duracao_dias
      WHERE id_plano = @id
    `)
}

async function toggleAtivo(id) {
  const pool = await getPool()
  await pool.request()
    .input('id', sql.Int, id)
    .query(`UPDATE dbo.plano SET ativo = ~ativo WHERE id_plano = @id`)
}

module.exports = { listar, buscarPorId, criar, atualizar, toggleAtivo }
