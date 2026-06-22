const { getPool, sql } = require('../database/connection')

async function publicar({ id_usuario, tipo, titulo, subtitulo = null, id_referencia = null }) {
  try {
    const pool = await getPool()
    await pool.request()
      .input('id_usuario',    sql.Int,         id_usuario)
      .input('tipo',          sql.VarChar(30),  tipo)
      .input('titulo',        sql.VarChar(200), titulo)
      .input('subtitulo',     sql.VarChar(300), subtitulo)
      .input('id_referencia', sql.Int,          id_referencia)
      .query(`
        INSERT INTO dbo.feed_item (id_usuario, tipo, titulo, subtitulo, id_referencia)
        VALUES (@id_usuario, @tipo, @titulo, @subtitulo, @id_referencia)
      `)
  } catch (e) { console.error('[Feed] Erro ao publicar:', e.message) }
}

async function listar(id_usuario_logado, pagina = 1) {
  const pool = await getPool()
  const r = await pool.request()
    .input('uid',    sql.Int, id_usuario_logado)
    .input('offset', sql.Int, (pagina - 1) * 20)
    .query(`
      SELECT
        f.id_feed_item, f.tipo, f.titulo, f.subtitulo, f.id_referencia,
        CONVERT(VARCHAR(16), f.data_criacao, 120) AS data_criacao,
        u.id_usuario, u.nome AS nome_usuario, u.foto_url,
        (SELECT COUNT(*) FROM dbo.feed_reacao r WHERE r.id_feed_item = f.id_feed_item) AS total_reacoes,
        CASE WHEN EXISTS (SELECT 1 FROM dbo.feed_reacao r WHERE r.id_feed_item = f.id_feed_item AND r.id_usuario = @uid) THEN 1 ELSE 0 END AS eu_curti
      FROM dbo.feed_item f
      INNER JOIN dbo.usuario u ON u.id_usuario = f.id_usuario
      INNER JOIN dbo.usuario_perfil up ON up.id_usuario = f.id_usuario AND up.ativo = 1
        AND up.id_perfil = (SELECT id_perfil FROM dbo.perfil WHERE nome = 'aluno')
      WHERE u.ativo = 1
      ORDER BY f.id_feed_item DESC
      OFFSET @offset ROWS FETCH NEXT 20 ROWS ONLY
    `)
  return r.recordset
}

async function reagir(id_feed_item, id_usuario) {
  const pool = await getPool()
  const jaExiste = await pool.request()
    .input('f', sql.Int, id_feed_item)
    .input('u', sql.Int, id_usuario)
    .query(`SELECT 1 FROM dbo.feed_reacao WHERE id_feed_item = @f AND id_usuario = @u`)

  if (jaExiste.recordset.length) {
    await pool.request()
      .input('f', sql.Int, id_feed_item)
      .input('u', sql.Int, id_usuario)
      .query(`DELETE FROM dbo.feed_reacao WHERE id_feed_item = @f AND id_usuario = @u`)
    return { curtiu: false }
  } else {
    await pool.request()
      .input('f', sql.Int, id_feed_item)
      .input('u', sql.Int, id_usuario)
      .query(`INSERT INTO dbo.feed_reacao (id_feed_item, id_usuario) VALUES (@f, @u)`)
    return { curtiu: true }
  }
}

module.exports = { publicar, listar, reagir }
