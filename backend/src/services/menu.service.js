const { getPool, sql } = require('../database/connection')

async function getMenuByPerfis(perfis) {
  if (!perfis || perfis.length === 0) return []

  const pool = await getPool()

  // Monta parâmetros dinâmicos para o IN clause
  const params = perfis.map((_, i) => `@p${i}`).join(',')

  const req = pool.request()
  perfis.forEach((nome, i) => req.input(`p${i}`, sql.VarChar(30), nome))

  const result = await req.query(`
    SELECT DISTINCT
      mi.id_menu_item AS id,
      m.id_menu,
      m.nome          AS grupo,
      m.ordem         AS grupo_ordem,
      mi.nome,
      mi.caminho,
      mi.icone,
      mi.ordem
    FROM dbo.menu_item mi
    JOIN dbo.menu m               ON m.id_menu       = mi.id_menu
    JOIN dbo.menu_item_perfil mip ON mip.id_menu_item = mi.id_menu_item
    JOIN dbo.perfil p             ON p.id_perfil      = mip.id_perfil
    WHERE p.nome IN (${params})
      AND mi.ativo = 1
    ORDER BY grupo_ordem, ordem
  `)

  return result.recordset
}

module.exports = { getMenuByPerfis }
