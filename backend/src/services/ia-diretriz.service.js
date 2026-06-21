const { getPool, sql } = require('../database/connection')

async function listar(idNutricionista) {
  const pool = await getPool()
  const req = pool.request()
  const where = idNutricionista ? 'WHERE d.id_usuario = @idNutri' : ''
  if (idNutricionista) req.input('idNutri', sql.Int, idNutricionista)

  const dirs = await req.query(`
    SELECT d.id_diretriz, d.nome, d.tipo, d.conteudo, d.ativo, d.data_criacao,
           u.nome AS usuario_nome
    FROM dbo.ia_diretriz d
    JOIN dbo.usuario u ON u.id_usuario = d.id_usuario
    ${where}
    ORDER BY d.ativo DESC, d.data_criacao DESC
  `)

  const crits = await pool.request().query(`
    SELECT id_diretriz, criterio, valor FROM dbo.ia_diretriz_criterio
  `)

  const critMap = {}
  crits.recordset.forEach(c => {
    if (!critMap[c.id_diretriz]) critMap[c.id_diretriz] = []
    critMap[c.id_diretriz].push({ criterio: c.criterio, valor: c.valor })
  })

  return dirs.recordset.map(d => ({ ...d, criterios: critMap[d.id_diretriz] || [] }))
}

async function buscar(id) {
  const pool = await getPool()

  const dir = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT d.*, u.nome AS usuario_nome
      FROM dbo.ia_diretriz d
      JOIN dbo.usuario u ON u.id_usuario = d.id_usuario
      WHERE d.id_diretriz = @id
    `)

  if (!dir.recordset[0]) return null

  const crits = await pool.request()
    .input('id', sql.Int, id)
    .query(`SELECT criterio, valor FROM dbo.ia_diretriz_criterio WHERE id_diretriz = @id`)

  return { ...dir.recordset[0], criterios: crits.recordset }
}

async function criar(dados) {
  const pool = await getPool()
  const { id_usuario, nome, tipo, conteudo, criterios = [] } = dados

  const tx = pool.transaction()
  await tx.begin()
  try {
    const r = await tx.request()
      .input('id_usuario', sql.Int,           id_usuario)
      .input('nome',             sql.VarChar(100),   nome)
      .input('tipo',             sql.VarChar(20),    tipo || 'dieta')
      .input('conteudo',         sql.NVarChar(3000), conteudo)
      .query(`
        INSERT INTO dbo.ia_diretriz (id_usuario, nome, tipo, conteudo)
        OUTPUT INSERTED.id_diretriz
        VALUES (@id_usuario, @nome, @tipo, @conteudo)
      `)

    const id = r.recordset[0].id_diretriz
    await _salvarCriterios(tx, id, criterios)
    await tx.commit()
    return { id_diretriz: id }
  } catch (err) { await tx.rollback(); throw err }
}

async function atualizar(id, dados) {
  const pool = await getPool()
  const { nome, tipo, conteudo, ativo, criterios } = dados

  const tx = pool.transaction()
  await tx.begin()
  try {
    await tx.request()
      .input('id',      sql.Int,           id)
      .input('nome',    sql.VarChar(100),   nome)
      .input('tipo',    sql.VarChar(20),    tipo || 'dieta')
      .input('conteudo', sql.NVarChar(3000), conteudo)
      .input('ativo',   sql.Bit,            ativo !== undefined ? ativo : 1)
      .query(`
        UPDATE dbo.ia_diretriz
        SET nome = @nome, tipo = @tipo, conteudo = @conteudo, ativo = @ativo,
            data_atualizacao = SYSUTCDATETIME()
        WHERE id_diretriz = @id
      `)

    if (criterios !== undefined) {
      await tx.request().input('id', sql.Int, id)
        .query(`DELETE FROM dbo.ia_diretriz_criterio WHERE id_diretriz = @id`)
      await _salvarCriterios(tx, id, criterios)
    }

    await tx.commit()
  } catch (err) { await tx.rollback(); throw err }
}

async function deletar(id) {
  const pool = await getPool()
  await pool.request()
    .input('id', sql.Int, id)
    .query(`DELETE FROM dbo.ia_diretriz WHERE id_diretriz = @id`)
}

async function _salvarCriterios(tx, idDiretriz, criterios) {
  for (const c of criterios) {
    if (!c.criterio || !c.valor) continue
    await tx.request()
      .input('id_diretriz', sql.Int,         idDiretriz)
      .input('criterio',    sql.VarChar(30),  c.criterio)
      .input('valor',       sql.VarChar(50),  c.valor)
      .query(`
        INSERT INTO dbo.ia_diretriz_criterio (id_diretriz, criterio, valor)
        VALUES (@id_diretriz, @criterio, @valor)
      `)
  }
}

async function buscarParaGeracao(idUsuario, tipo, objetivo, sexo, nivel) {
  const pool = await getPool()

  const dirs = await pool.request()
    .input('idUsuario', sql.Int,        idUsuario)
    .input('tipo',      sql.VarChar(20), tipo || 'dieta')
    .query(`
      SELECT d.id_diretriz, d.conteudo
      FROM dbo.ia_diretriz d
      WHERE d.id_usuario = @idUsuario AND d.ativo = 1 AND d.tipo = @tipo
    `)

  if (!dirs.recordset.length) return null

  const ids = dirs.recordset.map(d => d.id_diretriz)
  const crits = await pool.request().query(`
    SELECT id_diretriz, criterio, valor
    FROM dbo.ia_diretriz_criterio
    WHERE id_diretriz IN (${ids.join(',')})
  `)

  const critMap = {}
  crits.recordset.forEach(c => {
    if (!critMap[c.id_diretriz]) critMap[c.id_diretriz] = []
    critMap[c.id_diretriz].push(c)
  })

  // Pontua cada diretriz: +1 ponto por critério que bate com o perfil
  let melhor = null, maiorPontos = -1

  for (const d of dirs.recordset) {
    const dc = critMap[d.id_diretriz] || []
    if (dc.length === 0) {
      // Sem critérios = diretriz genérica, pontuação 0
      if (maiorPontos < 0) { melhor = d; maiorPontos = 0 }
      continue
    }

    let pontos = 0
    for (const c of dc) {
      if (c.criterio === 'objetivo' && objetivo && c.valor.toLowerCase() === objetivo.toLowerCase()) pontos++
      if (c.criterio === 'sexo'     && sexo     && c.valor.toUpperCase() === sexo.toUpperCase())     pontos++
      if (c.criterio === 'nivel'    && nivel     && c.valor.toLowerCase() === nivel.toLowerCase())    pontos++
    }

    if (pontos > maiorPontos) { melhor = d; maiorPontos = pontos }
  }

  return melhor?.conteudo || null
}

module.exports = { listar, buscar, criar, atualizar, deletar, buscarParaGeracao }
