const { getPool, sql } = require('../database/connection')

async function listar() {
  const pool = await getPool()

  const [itensRes, perfisRes, gruposRes] = await Promise.all([
    pool.request().query(`
      SELECT
        mi.id_menu_item,
        mi.nome,
        mi.caminho,
        mi.icone,
        mi.ordem,
        mi.ativo,
        m.id_menu,
        m.nome  AS grupo,
        m.ordem AS grupo_ordem,
        STRING_AGG(p.nome, ',') AS perfis_vinculados
      FROM dbo.menu_item mi
      JOIN dbo.menu m ON m.id_menu = mi.id_menu
      LEFT JOIN dbo.menu_item_perfil mip ON mip.id_menu_item = mi.id_menu_item
      LEFT JOIN dbo.perfil p ON p.id_perfil = mip.id_perfil AND p.ativo = 1
      GROUP BY mi.id_menu_item, mi.nome, mi.caminho, mi.icone, mi.ordem, mi.ativo,
               m.id_menu, m.nome, m.ordem
      ORDER BY m.ordem, mi.ordem
    `),
    pool.request().query(`
      SELECT id_perfil, nome, descricao FROM dbo.perfil WHERE ativo = 1 ORDER BY id_perfil
    `),
    pool.request().query(`
      SELECT id_menu, nome, ordem FROM dbo.menu ORDER BY ordem
    `),
  ])

  const itens = itensRes.recordset.map(i => ({
    ...i,
    perfis_vinculados: i.perfis_vinculados ? i.perfis_vinculados.split(',') : [],
  }))

  return { itens, perfis: perfisRes.recordset, grupos: gruposRes.recordset }
}

async function atualizarPerfis(id_menu_item, perfisNomes) {
  const pool = await getPool()

  await pool.request()
    .input('id', sql.Int, id_menu_item)
    .query('DELETE FROM dbo.menu_item_perfil WHERE id_menu_item = @id')

  if (perfisNomes.length === 0) return

  const params = perfisNomes.map((_, i) => `@n${i}`).join(',')
  const req = pool.request().input('id', sql.Int, id_menu_item)
  perfisNomes.forEach((nome, i) => req.input(`n${i}`, sql.VarChar(30), nome))

  await req.query(`
    INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil)
    SELECT @id, p.id_perfil FROM dbo.perfil p WHERE p.nome IN (${params}) AND p.ativo = 1
  `)
}

async function criarItem({ id_menu, nome, caminho, icone, perfisNomes }) {
  const pool = await getPool()

  // Calcula próxima ordem no grupo
  const ordemRes = await pool.request()
    .input('id_menu', sql.Int, id_menu)
    .query('SELECT ISNULL(MAX(ordem), 0) + 1 AS proxima FROM dbo.menu_item WHERE id_menu = @id_menu')
  const ordem = ordemRes.recordset[0].proxima

  const result = await pool.request()
    .input('id_menu', sql.Int, id_menu)
    .input('nome',    sql.VarChar(60),  nome)
    .input('caminho', sql.VarChar(200), caminho)
    .input('icone',   sql.VarChar(60),  icone || 'Home')
    .input('ordem',   sql.Int,          ordem)
    .query(`
      INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, ativo)
      OUTPUT INSERTED.id_menu_item
      VALUES (@id_menu, @nome, @caminho, @icone, @ordem, 1)
    `)

  const id_menu_item = result.recordset[0].id_menu_item

  if (perfisNomes && perfisNomes.length > 0) {
    await atualizarPerfis(id_menu_item, perfisNomes)
  }

  return id_menu_item
}

async function atualizarItem(id_menu_item, { id_menu, nome, caminho, icone, perfisNomes }) {
  const pool = await getPool()

  await pool.request()
    .input('id',      sql.Int,          id_menu_item)
    .input('id_menu', sql.Int,          id_menu)
    .input('nome',    sql.VarChar(60),  nome)
    .input('caminho', sql.VarChar(200), caminho)
    .input('icone',   sql.VarChar(60),  icone || 'Home')
    .query(`
      UPDATE dbo.menu_item
      SET id_menu = @id_menu, nome = @nome, caminho = @caminho, icone = @icone
      WHERE id_menu_item = @id
    `)

  await atualizarPerfis(id_menu_item, perfisNomes || [])
}

async function deletarItem(id_menu_item) {
  const pool = await getPool()
  await pool.request()
    .input('id', sql.Int, id_menu_item)
    .query('DELETE FROM dbo.menu_item_perfil WHERE id_menu_item = @id')
  await pool.request()
    .input('id', sql.Int, id_menu_item)
    .query('DELETE FROM dbo.menu_item WHERE id_menu_item = @id')
}

async function reordenarItens(itens) {
  const pool = await getPool()
  await Promise.all(
    itens.map(({ id_menu_item, ordem }) =>
      pool.request()
        .input('id',    sql.Int, id_menu_item)
        .input('ordem', sql.Int, ordem)
        .query('UPDATE dbo.menu_item SET ordem = @ordem WHERE id_menu_item = @id')
    )
  )
}

module.exports = { listar, atualizarPerfis, criarItem, atualizarItem, deletarItem, reordenarItens }
