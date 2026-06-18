const { getPool, sql } = require('../database/connection')

async function getAll() {
  const pool = await getPool()
  const r = await pool.request().query(`
    SELECT categoria, chave, label, descricao, valor, tipo, ordem
    FROM dbo.configuracao
    ORDER BY categoria, ordem, chave
  `)
  const grouped = {}
  for (const row of r.recordset) {
    if (!grouped[row.categoria]) grouped[row.categoria] = []
    grouped[row.categoria].push(row)
  }
  return grouped
}

async function getCategoria(categoria) {
  const pool = await getPool()
  const r = await pool.request()
    .input('cat', sql.VarChar(50), categoria)
    .query(`SELECT chave, valor, tipo FROM dbo.configuracao WHERE categoria = @cat`)
  const obj = {}
  for (const row of r.recordset) {
    obj[row.chave] = row.tipo === 'booleano' ? row.valor === '1' : row.tipo === 'numero' ? Number(row.valor) : row.valor
  }
  return obj
}

async function get(categoria, chave) {
  const pool = await getPool()
  const r = await pool.request()
    .input('cat',   sql.VarChar(50),  categoria)
    .input('chave', sql.VarChar(100), chave)
    .query(`SELECT valor, tipo FROM dbo.configuracao WHERE categoria = @cat AND chave = @chave`)
  const row = r.recordset[0]
  if (!row) return null
  if (row.tipo === 'booleano') return row.valor === '1'
  if (row.tipo === 'numero')   return Number(row.valor)
  return row.valor
}

async function set(categoria, chave, valor) {
  const pool = await getPool()
  await pool.request()
    .input('cat',   sql.VarChar(50),    categoria)
    .input('chave', sql.VarChar(100),   chave)
    .input('valor', sql.NVarChar(sql.MAX), valor != null ? String(valor) : null)
    .query(`
      UPDATE dbo.configuracao
      SET valor = @valor, atualizado_em = SYSUTCDATETIME()
      WHERE categoria = @cat AND chave = @chave
    `)
}

async function setMany(updates) {
  const pool = await getPool()
  for (const { categoria, chave, valor } of updates) {
    await pool.request()
      .input('cat',   sql.VarChar(50),    categoria)
      .input('chave', sql.VarChar(100),   chave)
      .input('valor', sql.NVarChar(sql.MAX), valor != null ? String(valor) : null)
      .query(`
        UPDATE dbo.configuracao
        SET valor = @valor, atualizado_em = SYSUTCDATETIME()
        WHERE categoria = @cat AND chave = @chave
      `)
  }
}

module.exports = { getAll, getCategoria, get, set, setMany }
