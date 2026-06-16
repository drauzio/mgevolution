const { getPool, sql } = require('../database/connection')

async function listar() {
  const pool = await getPool()
  const pergs = await pool.request().query(`
    SELECT id_avaliacao_fitness_pergunta AS id, codigo, pergunta, tipo,
           obrigatorio, exibir_detalhe_sim, descricao_detalhe_sim, ordem, ativo
    FROM dbo.avaliacao_fitness_pergunta
    ORDER BY ordem, id_avaliacao_fitness_pergunta
  `)
  const opts = await pool.request().query(`
    SELECT id_avaliacao_fitness_pergunta AS id_pergunta,
           id_avaliacao_fitness_pergunta_opcao AS id, valor, ordem
    FROM dbo.avaliacao_fitness_pergunta_opcao
    WHERE ativo = 1 ORDER BY ordem
  `)
  const opcoesMap = {}
  opts.recordset.forEach(o => {
    if (!opcoesMap[o.id_pergunta]) opcoesMap[o.id_pergunta] = []
    opcoesMap[o.id_pergunta].push({ id: o.id, valor: o.valor, ordem: o.ordem })
  })
  return pergs.recordset.map(p => ({ ...p, opcoes: opcoesMap[p.id] || [] }))
}

async function buscar(id) {
  const pool = await getPool()
  const p = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT id_avaliacao_fitness_pergunta AS id, codigo, pergunta, tipo,
             obrigatorio, exibir_detalhe_sim, descricao_detalhe_sim, ordem, ativo
      FROM dbo.avaliacao_fitness_pergunta
      WHERE id_avaliacao_fitness_pergunta = @id
    `)
  if (!p.recordset[0]) return null
  const opts = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT id_avaliacao_fitness_pergunta_opcao AS id, valor, ordem
      FROM dbo.avaliacao_fitness_pergunta_opcao
      WHERE id_avaliacao_fitness_pergunta = @id AND ativo = 1
      ORDER BY ordem
    `)
  return { ...p.recordset[0], opcoes: opts.recordset }
}

async function criar({ codigo, pergunta, tipo, obrigatorio, exibir_detalhe_sim, descricao_detalhe_sim, ordem, opcoes = [] }) {
  const pool = await getPool()
  const tx = pool.transaction()
  await tx.begin()
  try {
    const r = await tx.request()
      .input('codigo',              sql.VarChar(50),  codigo)
      .input('pergunta',            sql.VarChar(250), pergunta)
      .input('tipo',                sql.VarChar(20),  tipo || 'opcao')
      .input('obrigatorio',         sql.Bit,          obrigatorio ? 1 : 0)
      .input('exibir_detalhe_sim',  sql.Bit,          exibir_detalhe_sim ? 1 : 0)
      .input('descricao_detalhe_sim', sql.VarChar(120), descricao_detalhe_sim || null)
      .input('ordem',               sql.Int,          Number(ordem) || 0)
      .query(`
        INSERT INTO dbo.avaliacao_fitness_pergunta
          (codigo, pergunta, tipo, obrigatorio, exibir_detalhe_sim, descricao_detalhe_sim, ordem)
        OUTPUT INSERTED.id_avaliacao_fitness_pergunta
        VALUES (@codigo, @pergunta, @tipo, @obrigatorio, @exibir_detalhe_sim, @descricao_detalhe_sim, @ordem)
      `)
    const id = r.recordset[0].id_avaliacao_fitness_pergunta
    for (let i = 0; i < opcoes.length; i++) {
      const v = opcoes[i]?.valor?.trim()
      if (!v) continue
      await tx.request()
        .input('id',    sql.Int,         id)
        .input('valor', sql.VarChar(100), v)
        .input('ordem', sql.Int,         i + 1)
        .query(`INSERT INTO dbo.avaliacao_fitness_pergunta_opcao (id_avaliacao_fitness_pergunta, valor, ordem) VALUES (@id, @valor, @ordem)`)
    }
    await tx.commit()
    return id
  } catch (err) { await tx.rollback(); throw err }
}

async function atualizar(id, { pergunta, tipo, obrigatorio, exibir_detalhe_sim, descricao_detalhe_sim, ordem, ativo, opcoes = [] }) {
  const pool = await getPool()
  const tx = pool.transaction()
  await tx.begin()
  try {
    await tx.request()
      .input('id',                  sql.Int,          id)
      .input('pergunta',            sql.VarChar(250), pergunta)
      .input('tipo',                sql.VarChar(20),  tipo)
      .input('obrigatorio',         sql.Bit,          obrigatorio ? 1 : 0)
      .input('exibir_detalhe_sim',  sql.Bit,          exibir_detalhe_sim ? 1 : 0)
      .input('descricao_detalhe_sim', sql.VarChar(120), descricao_detalhe_sim || null)
      .input('ordem',               sql.Int,          Number(ordem) || 0)
      .input('ativo',               sql.Bit,          ativo !== false ? 1 : 0)
      .query(`
        UPDATE dbo.avaliacao_fitness_pergunta SET
          pergunta = @pergunta, tipo = @tipo, obrigatorio = @obrigatorio,
          exibir_detalhe_sim = @exibir_detalhe_sim, descricao_detalhe_sim = @descricao_detalhe_sim,
          ordem = @ordem, ativo = @ativo
        WHERE id_avaliacao_fitness_pergunta = @id
      `)

    // Recria opções
    await tx.request().input('id', sql.Int, id)
      .query(`DELETE FROM dbo.avaliacao_fitness_pergunta_opcao WHERE id_avaliacao_fitness_pergunta = @id`)

    for (let i = 0; i < opcoes.length; i++) {
      const v = opcoes[i]?.valor?.trim()
      if (!v) continue
      await tx.request()
        .input('id',    sql.Int,         id)
        .input('valor', sql.VarChar(100), v)
        .input('ordem', sql.Int,         i + 1)
        .query(`INSERT INTO dbo.avaliacao_fitness_pergunta_opcao (id_avaliacao_fitness_pergunta, valor, ordem) VALUES (@id, @valor, @ordem)`)
    }

    await tx.commit()
  } catch (err) { await tx.rollback(); throw err }
}

module.exports = { listar, buscar, criar, atualizar }
