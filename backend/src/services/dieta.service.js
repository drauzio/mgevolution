const { getPool, sql } = require('../database/connection')

async function listarPlanos(idAluno) {
  const pool = await getPool()
  const req = pool.request()
  let where = 'WHERE 1=1'
  if (idAluno) { req.input('idAluno', sql.Int, idAluno); where += ' AND p.id_usuario = @idAluno' }

  const result = await req.query(`
    SELECT
      p.id_dieta_plano, p.nome, p.objetivo, p.calorias_meta, p.proteina_meta,
      p.ativo, p.data_inicio, p.data_fim, p.data_criacao,
      u.nome   AS aluno_nome,
      u.email  AS aluno_email,
      n.nome   AS nutricionista_nome,
      (SELECT COUNT(*) FROM dbo.dieta_refeicao r WHERE r.id_dieta_plano = p.id_dieta_plano) AS qtd_refeicoes
    FROM dbo.dieta_plano p
    JOIN dbo.usuario u  ON u.id_usuario  = p.id_usuario
    LEFT JOIN dbo.usuario n ON n.id_usuario = p.id_nutricionista
    ${where}
    ORDER BY p.ativo DESC, p.data_criacao DESC
  `)
  return result.recordset
}

async function buscarCompleto(idPlano) {
  const pool = await getPool()

  const plano = await pool.request()
    .input('id', sql.Int, idPlano)
    .query(`
      SELECT p.*, u.nome AS aluno_nome, u.email AS aluno_email,
             n.nome AS nutricionista_nome
      FROM dbo.dieta_plano p
      JOIN dbo.usuario u ON u.id_usuario = p.id_usuario
      LEFT JOIN dbo.usuario n ON n.id_usuario = p.id_nutricionista
      WHERE p.id_dieta_plano = @id
    `)

  if (!plano.recordset.length) return null

  const refeicoes = await pool.request()
    .input('id', sql.Int, idPlano)
    .query(`SELECT * FROM dbo.dieta_refeicao WHERE id_dieta_plano = @id ORDER BY ordem, id_dieta_refeicao`)

  const itens = await pool.request()
    .input('id', sql.Int, idPlano)
    .query(`
      SELECT i.*
      FROM dbo.dieta_refeicao_item i
      JOIN dbo.dieta_refeicao r ON r.id_dieta_refeicao = i.id_dieta_refeicao
      WHERE r.id_dieta_plano = @id
      ORDER BY i.id_dieta_refeicao, i.ordem
    `)

  return {
    ...plano.recordset[0],
    refeicoes: refeicoes.recordset.map(r => ({
      ...r,
      itens: itens.recordset.filter(i => i.id_dieta_refeicao === r.id_dieta_refeicao),
    })),
  }
}

async function buscarPlanoAtivo(idUsuario) {
  const pool = await getPool()
  const r = await pool.request()
    .input('id', sql.Int, idUsuario)
    .query(`SELECT TOP 1 id_dieta_plano FROM dbo.dieta_plano WHERE id_usuario = @id AND ativo = 1 ORDER BY data_criacao DESC`)
  if (!r.recordset[0]) return null
  return buscarCompleto(r.recordset[0].id_dieta_plano)
}

async function criar(dados, idCriador) {
  const pool = await getPool()
  const { id_usuario, id_nutricionista, nome, objetivo, calorias_meta, proteina_meta, observacoes,
          data_inicio, data_fim, refeicoes = [] } = dados

  const tx = pool.transaction()
  await tx.begin()
  try {
    const r1 = await tx.request()
      .input('id_usuario',       sql.Int,          id_usuario)
      .input('id_nutricionista', sql.Int,          id_nutricionista ? Number(id_nutricionista) : null)
      .input('nome',             sql.VarChar(120),  nome)
      .input('objetivo',         sql.VarChar(200),  objetivo || null)
      .input('calorias_meta',    sql.Int,           calorias_meta ? Number(calorias_meta) : null)
      .input('proteina_meta',    sql.Int,           proteina_meta ? Number(proteina_meta) : null)
      .input('observacoes',      sql.VarChar(500),  observacoes || null)
      .input('data_inicio',      sql.Date,          data_inicio || null)
      .input('data_fim',         sql.Date,          data_fim || null)
      .query(`
        INSERT INTO dbo.dieta_plano
          (id_usuario, id_nutricionista, nome, objetivo, calorias_meta, proteina_meta, observacoes, data_inicio, data_fim)
        OUTPUT INSERTED.id_dieta_plano
        VALUES (@id_usuario, @id_nutricionista, @nome, @objetivo, @calorias_meta, @proteina_meta, @observacoes, @data_inicio, @data_fim)
      `)

    const idPlano = r1.recordset[0].id_dieta_plano
    await _inserirRefeicoes(tx, idPlano, refeicoes)
    await tx.commit()
    return { id_dieta_plano: idPlano }
  } catch (err) { await tx.rollback(); throw err }
}

async function atualizar(idPlano, dados) {
  const pool = await getPool()
  const { id_nutricionista, nome, objetivo, calorias_meta, proteina_meta, observacoes,
          data_inicio, data_fim, ativo, refeicoes } = dados

  const tx = pool.transaction()
  await tx.begin()
  try {
    await tx.request()
      .input('id',               sql.Int,          idPlano)
      .input('id_nutricionista', sql.Int,          id_nutricionista ? Number(id_nutricionista) : null)
      .input('nome',             sql.VarChar(120),  nome)
      .input('objetivo',         sql.VarChar(200),  objetivo || null)
      .input('calorias_meta',    sql.Int,           calorias_meta ? Number(calorias_meta) : null)
      .input('proteina_meta',    sql.Int,           proteina_meta ? Number(proteina_meta) : null)
      .input('observacoes',      sql.VarChar(500),  observacoes || null)
      .input('data_inicio',      sql.Date,          data_inicio || null)
      .input('data_fim',         sql.Date,          data_fim || null)
      .input('ativo',            sql.Bit,           ativo !== undefined ? ativo : 1)
      .query(`
        UPDATE dbo.dieta_plano SET
          id_nutricionista = @id_nutricionista,
          nome = @nome, objetivo = @objetivo, calorias_meta = @calorias_meta,
          proteina_meta = @proteina_meta, observacoes = @observacoes,
          data_inicio = @data_inicio, data_fim = @data_fim, ativo = @ativo,
          data_atualizacao = SYSUTCDATETIME()
        WHERE id_dieta_plano = @id
      `)

    if (refeicoes) {
      const idsRef = await tx.request()
        .input('id', sql.Int, idPlano)
        .query(`SELECT id_dieta_refeicao FROM dbo.dieta_refeicao WHERE id_dieta_plano = @id`)

      const ids = idsRef.recordset.map(r => r.id_dieta_refeicao)
      if (ids.length) {
        await tx.request().query(`DELETE FROM dbo.dieta_refeicao_item WHERE id_dieta_refeicao IN (${ids.join(',')})`)
        await tx.request().input('id', sql.Int, idPlano).query(`DELETE FROM dbo.dieta_refeicao WHERE id_dieta_plano = @id`)
      }
      await _inserirRefeicoes(tx, idPlano, refeicoes)
    }

    await tx.commit()
  } catch (err) { await tx.rollback(); throw err }
}

async function _inserirRefeicoes(tx, idPlano, refeicoes) {
  for (let i = 0; i < refeicoes.length; i++) {
    const r = refeicoes[i]
    const ref = await tx.request()
      .input('id_dieta_plano', sql.Int,        idPlano)
      .input('nome',           sql.VarChar(80), r.nome || '')
      .input('horario',        sql.VarChar(5),  r.horario || null)
      .input('ordem',          sql.TinyInt,    i + 1)
      .query(`
        INSERT INTO dbo.dieta_refeicao (id_dieta_plano, nome, horario, ordem)
        OUTPUT INSERTED.id_dieta_refeicao
        VALUES (@id_dieta_plano, @nome, @horario, @ordem)
      `)

    const idRefeicao = ref.recordset[0].id_dieta_refeicao
    for (let j = 0; j < (r.itens || []).length; j++) {
      const it = r.itens[j]
      await tx.request()
        .input('id_dieta_refeicao', sql.Int,           idRefeicao)
        .input('descricao',         sql.VarChar(200),   it.descricao || '')
        .input('quantidade',        sql.Decimal(8, 1),  it.quantidade ? Number(it.quantidade) : null)
        .input('unidade',           sql.VarChar(20),    it.unidade || 'g')
        .input('calorias',          sql.Int,            it.calorias    ? Number(it.calorias)    : null)
        .input('proteina',          sql.Int,            it.proteina    ? Number(it.proteina)    : null)
        .input('carboidrato',       sql.Int,            it.carboidrato ? Number(it.carboidrato) : null)
        .input('gordura',           sql.Int,            it.gordura     ? Number(it.gordura)     : null)
        .input('ordem',             sql.TinyInt,       j + 1)
        .query(`
          INSERT INTO dbo.dieta_refeicao_item
            (id_dieta_refeicao, descricao, quantidade, unidade, calorias, proteina, carboidrato, gordura, ordem)
          VALUES
            (@id_dieta_refeicao, @descricao, @quantidade, @unidade, @calorias, @proteina, @carboidrato, @gordura, @ordem)
        `)
    }
  }
}

async function clonar(idPlano, idUsuarioDestino, idPersonal) {
  const pool = await getPool()
  const original = await buscarCompleto(idPlano)
  if (!original) throw Object.assign(new Error('Plano não encontrado'), { status: 404 })

  const tx = pool.transaction()
  await tx.begin()
  try {
    const r1 = await tx.request()
      .input('id_usuario',    sql.Int,          idUsuarioDestino)
      .input('id_personal',   sql.Int,          idPersonal)
      .input('nome',          sql.VarChar(120),  original.nome)
      .input('objetivo',      sql.VarChar(200),  original.objetivo || null)
      .input('calorias_meta', sql.Int,           original.calorias_meta || null)
      .input('proteina_meta', sql.Int,           original.proteina_meta || null)
      .input('observacoes',   sql.VarChar(500),  original.observacoes || null)
      .query(`
        INSERT INTO dbo.dieta_plano
          (id_usuario, id_personal, nome, objetivo, calorias_meta, proteina_meta, observacoes)
        OUTPUT INSERTED.id_dieta_plano
        VALUES (@id_usuario, @id_personal, @nome, @objetivo, @calorias_meta, @proteina_meta, @observacoes)
      `)

    const idNovoPlano = r1.recordset[0].id_dieta_plano
    await _inserirRefeicoes(tx, idNovoPlano, original.refeicoes || [])
    await tx.commit()
    return { id_dieta_plano: idNovoPlano }
  } catch (err) { await tx.rollback(); throw err }
}

async function dadosAlunoParaDieta(idUsuario) {
  const pool = await getPool()

  const aval = await pool.request()
    .input('id', sql.Int, idUsuario)
    .query(`
      SELECT TOP 1
        af.objetivo, af.nivel, af.sexo, af.idade,
        peso_r.resposta_numero  AS peso,
        alt_r.resposta_numero   AS altura,
        lesao_r.resposta_bit    AS tem_lesao,
        lesao_r.resposta_texto  AS lesao_detalhe
      FROM dbo.avaliacao_fitness af
      LEFT JOIN dbo.avaliacao_fitness_resposta peso_r
        ON peso_r.id_avaliacao_fitness = af.id_avaliacao_fitness
       AND peso_r.id_avaliacao_fitness_pergunta =
           (SELECT id_avaliacao_fitness_pergunta FROM dbo.avaliacao_fitness_pergunta WHERE codigo = 'peso')
      LEFT JOIN dbo.avaliacao_fitness_resposta alt_r
        ON alt_r.id_avaliacao_fitness = af.id_avaliacao_fitness
       AND alt_r.id_avaliacao_fitness_pergunta =
           (SELECT id_avaliacao_fitness_pergunta FROM dbo.avaliacao_fitness_pergunta WHERE codigo = 'altura')
      LEFT JOIN dbo.avaliacao_fitness_resposta lesao_r
        ON lesao_r.id_avaliacao_fitness = af.id_avaliacao_fitness
       AND lesao_r.id_avaliacao_fitness_pergunta =
           (SELECT id_avaliacao_fitness_pergunta FROM dbo.avaliacao_fitness_pergunta WHERE codigo = 'lesao')
      WHERE af.id_usuario = @id AND af.ativo = 1
      ORDER BY af.data_inicio DESC
    `)

  return aval.recordset[0] || null
}

module.exports = { listarPlanos, buscarCompleto, buscarPlanoAtivo, criar, atualizar, clonar, dadosAlunoParaDieta }
