const { getPool, sql } = require('../database/connection')

async function listar() {
  const pool = await getPool()
  const result = await pool.request().query(`
    SELECT
      t.id_protocolo_template,
      t.nome,
      t.objetivo,
      t.observacoes,
      t.criterio_objetivo,
      t.criterio_nivel,
      t.criterio_sexo,
      t.criterio_idade_min,
      t.criterio_idade_max,
      t.ativo,
      t.data_criacao,
      (SELECT COUNT(*) FROM dbo.template_dia ttd
       WHERE ttd.id_template = t.id_protocolo_template AND ttd.descanso = 0) AS dias_treino
    FROM dbo.protocolo_template t
    ORDER BY t.ativo DESC, t.data_criacao DESC
  `)
  return result.recordset
}

async function buscar(id) {
  const pool = await getPool()

  const tmpl = await pool.request()
    .input('id', sql.Int, id)
    .query(`SELECT * FROM dbo.protocolo_template WHERE id_protocolo_template = @id`)

  if (!tmpl.recordset.length) return null

  const dias = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT id_template_dia, dia_semana, nome, descanso, ordem
      FROM dbo.template_dia WHERE id_template = @id ORDER BY dia_semana
    `)

  const exercicios = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT ttde.*, e.nome AS exercicio_nome, e.grupo_muscular, e.equipamento, e.video_url
      FROM dbo.template_dia_exercicio ttde
      JOIN dbo.template_dia ttd ON ttd.id_template_dia = ttde.id_template_dia
      JOIN dbo.exercicio    e   ON e.id_exercicio      = ttde.id_exercicio
      WHERE ttd.id_template = @id
      ORDER BY ttde.id_template_dia, ttde.ordem
    `)

  return {
    ...tmpl.recordset[0],
    dias: dias.recordset.map(d => ({
      ...d,
      exercicios: exercicios.recordset.filter(e => e.id_template_dia === d.id_template_dia),
    })),
  }
}

async function criar(dados, idPersonal) {
  const pool = await getPool()
  const { nome, objetivo, observacoes, criterio_objetivo, criterio_nivel, criterio_sexo,
          criterio_idade_min, criterio_idade_max, dias } = dados

  const tx = pool.transaction()
  await tx.begin()
  try {
    const r1 = await tx.request()
      .input('id_personal',        sql.Int,         idPersonal || null)
      .input('nome',               sql.VarChar(120), nome)
      .input('objetivo',           sql.VarChar(200), objetivo || null)
      .input('observacoes',        sql.VarChar(500), observacoes || null)
      .input('criterio_objetivo',  sql.VarChar(100), criterio_objetivo || null)
      .input('criterio_nivel',     sql.VarChar(50),  criterio_nivel || null)
      .input('criterio_sexo',      sql.VarChar(1),   criterio_sexo || null)
      .input('criterio_idade_min', sql.Int,          criterio_idade_min != null ? Number(criterio_idade_min) : null)
      .input('criterio_idade_max', sql.Int,          criterio_idade_max != null ? Number(criterio_idade_max) : null)
      .query(`
        INSERT INTO dbo.protocolo_template
          (id_personal, nome, objetivo, observacoes,
           criterio_objetivo, criterio_nivel, criterio_sexo, criterio_idade_min, criterio_idade_max)
        OUTPUT INSERTED.id_protocolo_template
        VALUES
          (@id_personal, @nome, @objetivo, @observacoes,
           @criterio_objetivo, @criterio_nivel, @criterio_sexo, @criterio_idade_min, @criterio_idade_max)
      `)

    const id = r1.recordset[0].id_protocolo_template
    await _inserirDias(tx, id, dias || [])
    await tx.commit()
    return { id_protocolo_template: id }
  } catch (err) { await tx.rollback(); throw err }
}

async function atualizar(id, dados) {
  const pool = await getPool()
  const { nome, objetivo, observacoes, criterio_objetivo, criterio_nivel, criterio_sexo,
          criterio_idade_min, criterio_idade_max, ativo, dias } = dados

  const tx = pool.transaction()
  await tx.begin()
  try {
    await tx.request()
      .input('id',                 sql.Int,         id)
      .input('nome',               sql.VarChar(120), nome)
      .input('objetivo',           sql.VarChar(200), objetivo || null)
      .input('observacoes',        sql.VarChar(500), observacoes || null)
      .input('criterio_objetivo',  sql.VarChar(100), criterio_objetivo || null)
      .input('criterio_nivel',     sql.VarChar(50),  criterio_nivel || null)
      .input('criterio_sexo',      sql.VarChar(1),   criterio_sexo || null)
      .input('criterio_idade_min', sql.Int,          criterio_idade_min != null ? Number(criterio_idade_min) : null)
      .input('criterio_idade_max', sql.Int,          criterio_idade_max != null ? Number(criterio_idade_max) : null)
      .input('ativo',              sql.Bit,          ativo !== undefined ? ativo : 1)
      .query(`
        UPDATE dbo.protocolo_template SET
          nome = @nome, objetivo = @objetivo, observacoes = @observacoes,
          criterio_objetivo = @criterio_objetivo, criterio_nivel = @criterio_nivel,
          criterio_sexo = @criterio_sexo, criterio_idade_min = @criterio_idade_min,
          criterio_idade_max = @criterio_idade_max, ativo = @ativo,
          data_atualizacao = SYSUTCDATETIME()
        WHERE id_protocolo_template = @id
      `)

    if (dias) {
      const existing = await tx.request()
        .input('id', sql.Int, id)
        .query(`SELECT id_template_dia FROM dbo.template_dia WHERE id_template = @id`)

      const ids = existing.recordset.map(r => r.id_template_dia)
      if (ids.length) {
        await tx.request().query(`DELETE FROM dbo.template_dia_exercicio WHERE id_template_dia IN (${ids.join(',')})`)
        await tx.request().input('id', sql.Int, id).query(`DELETE FROM dbo.template_dia WHERE id_template = @id`)
      }
      await _inserirDias(tx, id, dias)
    }

    await tx.commit()
  } catch (err) { await tx.rollback(); throw err }
}

// Seleciona o template mais adequado e clona para o aluno (chamado pela avaliação)
async function clonarParaAluno(tx, idUsuario, idPersonal, objetivo, nivel, sexo, idade) {
  const req = tx.request()
    .input('obj',   sql.VarChar(100), objetivo || '')
    .input('niv',   sql.VarChar(50),  nivel    || '')
    .input('sexo',  sql.VarChar(1),   sexo     || null)
    .input('idade', sql.Int,          idade    || null)

  const tmpl = await req.query(`
    SELECT TOP 1 id_protocolo_template, nome, objetivo AS obj_template, observacoes
    FROM dbo.protocolo_template
    WHERE ativo = 1
      AND (criterio_objetivo  = @obj  OR criterio_objetivo  IS NULL)
      AND (criterio_nivel     = @niv  OR criterio_nivel     IS NULL)
      AND (criterio_sexo      = @sexo OR criterio_sexo      IS NULL OR @sexo IS NULL)
      AND (criterio_idade_min IS NULL OR @idade IS NULL OR @idade >= criterio_idade_min)
      AND (criterio_idade_max IS NULL OR @idade IS NULL OR @idade <= criterio_idade_max)
    ORDER BY
      CASE
        WHEN criterio_objetivo = @obj AND criterio_nivel = @niv AND criterio_sexo = @sexo AND criterio_idade_min IS NOT NULL THEN 0
        WHEN criterio_objetivo = @obj AND criterio_nivel = @niv AND criterio_sexo = @sexo THEN 1
        WHEN criterio_objetivo = @obj AND criterio_nivel = @niv THEN 2
        WHEN criterio_objetivo = @obj AND criterio_sexo  = @sexo THEN 3
        WHEN criterio_objetivo = @obj THEN 4
        ELSE 5
      END
  `)

  if (!tmpl.recordset[0]) return null

  const t = tmpl.recordset[0]
  return _clonarTemplate(tx, idUsuario, idPersonal || null, t.id_protocolo_template, t.nome, t.obj_template, t.observacoes)
}

// Clona um template específico para um aluno (chamado manualmente pelo personal)
async function clonarTemplateEspecifico(idTemplate, idUsuario, idPersonal) {
  const pool = await getPool()
  const tmpl = await pool.request()
    .input('id', sql.Int, idTemplate)
    .query(`SELECT id_protocolo_template, nome, objetivo, observacoes FROM dbo.protocolo_template WHERE id_protocolo_template = @id AND ativo = 1`)

  if (!tmpl.recordset[0]) {
    const err = new Error('Template não encontrado')
    err.status = 404
    throw err
  }

  const t = tmpl.recordset[0]
  const tx = pool.transaction()
  await tx.begin()
  try {
    const idProtocolo = await _clonarTemplate(tx, idUsuario, idPersonal || null, t.id_protocolo_template, t.nome, t.objetivo, t.observacoes)
    await tx.commit()
    return { id_protocolo: idProtocolo }
  } catch (err) { await tx.rollback(); throw err }
}

async function _clonarTemplate(tx, idUsuario, idPersonal, idTemplate, nome, objetivo, observacoes) {
  const hoje = new Date().toISOString().slice(0, 10)

  const novo = await tx.request()
    .input('id_usuario',         sql.Int,         idUsuario)
    .input('id_personal',        sql.Int,         idPersonal)
    .input('nome',               sql.VarChar(120), nome)
    .input('objetivo',           sql.VarChar(200), objetivo || null)
    .input('observacoes',        sql.VarChar(500), observacoes || null)
    .input('data_inicio',        sql.Date,         hoje)
    .input('id_template_origem', sql.Int,          idTemplate)
    .query(`
      INSERT INTO dbo.treino_protocolo
        (id_usuario, id_personal, nome, objetivo, observacoes, data_inicio, id_template_origem)
      OUTPUT INSERTED.id_treino_protocolo AS id_protocolo
      VALUES (@id_usuario, @id_personal, @nome, @objetivo, @observacoes, @data_inicio, @id_template_origem)
    `)

  const idProtocolo = novo.recordset[0].id_protocolo

  const dias = await tx.request()
    .input('id', sql.Int, idTemplate)
    .query(`SELECT * FROM dbo.template_dia WHERE id_template = @id ORDER BY dia_semana`)

  for (const dia of dias.recordset) {
    const novoDia = await tx.request()
      .input('id_treino_protocolo', sql.Int,        idProtocolo)
      .input('dia_semana',          sql.TinyInt,    dia.dia_semana)
      .input('nome',                sql.VarChar(80), dia.nome)
      .input('descanso',            sql.Bit,         dia.descanso)
      .input('ordem',               sql.TinyInt,    dia.ordem)
      .query(`
        INSERT INTO dbo.treino_dia (id_treino_protocolo, dia_semana, nome, descanso, ordem)
        OUTPUT INSERTED.id_treino_dia
        VALUES (@id_treino_protocolo, @dia_semana, @nome, @descanso, @ordem)
      `)

    const idDia = novoDia.recordset[0].id_treino_dia

    const exs = await tx.request()
      .input('id_dia', sql.Int, dia.id_template_dia)
      .query(`SELECT * FROM dbo.template_dia_exercicio WHERE id_template_dia = @id_dia ORDER BY ordem`)

    for (const ex of exs.recordset) {
      await tx.request()
        .input('id_treino_dia',  sql.Int,         idDia)
        .input('id_exercicio',   sql.Int,         ex.id_exercicio)
        .input('series',         sql.TinyInt,     ex.series)
        .input('repeticoes',     sql.VarChar(20),  ex.repeticoes)
        .input('carga_sugerida', sql.VarChar(30),  ex.carga_sugerida)
        .input('descanso_seg',   sql.SmallInt,    ex.descanso_seg)
        .input('observacao',     sql.VarChar(300), ex.observacao)
        .input('ordem',          sql.TinyInt,     ex.ordem)
        .query(`
          INSERT INTO dbo.treino_dia_exercicio
            (id_treino_dia, id_exercicio, series, repeticoes, carga_sugerida, descanso_seg, observacao, ordem)
          VALUES
            (@id_treino_dia, @id_exercicio, @series, @repeticoes, @carga_sugerida, @descanso_seg, @observacao, @ordem)
        `)
    }
  }

  return idProtocolo
}

async function _inserirDias(tx, idTemplate, dias) {
  for (const dia of dias) {
    const r = await tx.request()
      .input('id_template', sql.Int,        idTemplate)
      .input('dia_semana',  sql.TinyInt,    dia.dia_semana)
      .input('nome',        sql.VarChar(80), dia.nome || '')
      .input('descanso',    sql.Bit,         dia.descanso ? 1 : 0)
      .input('ordem',       sql.TinyInt,    dia.dia_semana)
      .query(`
        INSERT INTO dbo.template_dia (id_template, dia_semana, nome, descanso, ordem)
        OUTPUT INSERTED.id_template_dia
        VALUES (@id_template, @dia_semana, @nome, @descanso, @ordem)
      `)

    const idDia = r.recordset[0].id_template_dia

    for (let i = 0; i < (dia.exercicios || []).length; i++) {
      const ex = dia.exercicios[i]
      await tx.request()
        .input('id_template_dia', sql.Int,         idDia)
        .input('id_exercicio',    sql.Int,         ex.id_exercicio)
        .input('series',          sql.TinyInt,     ex.series || 3)
        .input('repeticoes',      sql.VarChar(20),  ex.repeticoes || '12')
        .input('carga_sugerida',  sql.VarChar(30),  ex.carga_sugerida || null)
        .input('descanso_seg',    sql.SmallInt,    ex.descanso_seg || null)
        .input('observacao',      sql.VarChar(300), ex.observacao || null)
        .input('ordem',           sql.TinyInt,     i + 1)
        .query(`
          INSERT INTO dbo.template_dia_exercicio
            (id_template_dia, id_exercicio, series, repeticoes, carga_sugerida, descanso_seg, observacao, ordem)
          VALUES
            (@id_template_dia, @id_exercicio, @series, @repeticoes, @carga_sugerida, @descanso_seg, @observacao, @ordem)
        `)
    }
  }
}

async function gerarComIA(dados, idPersonal) {
  const { criterio_objetivo, criterio_nivel, criterio_sexo, criterio_idade_min, criterio_idade_max, num_dias = 5 } = dados
  const { buscarParaGeracao: buscarDiretriz } = require('./ia-diretriz.service')

  const pool = await getPool()

  const exsResult = await pool.request().query(`
    SELECT id_exercicio, nome, grupo_muscular, equipamento
    FROM dbo.exercicio WHERE ativo = 1
    ORDER BY grupo_muscular, nome
  `)
  const exercicios = exsResult.recordset
  const exMap = {}
  exercicios.forEach(e => { exMap[e.id_exercicio] = e })

  const diretriz = idPersonal
    ? await buscarDiretriz(idPersonal, 'treino', criterio_objetivo, criterio_sexo, criterio_nivel)
    : null

  const OpenAI = require('openai')
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const listaEx = exercicios.map(e => ({ id: e.id_exercicio, nome: e.nome, grupo: e.grupo_muscular, equipamento: e.equipamento }))

  const linhas = [
    'Você é um personal trainer especialista. Monte um protocolo de treino semanal conforme o perfil abaixo.',
    '',
    'PERFIL DO PROTOCOLO:',
    criterio_objetivo ? `- Objetivo: ${criterio_objetivo}` : null,
    criterio_nivel    ? `- Nível: ${criterio_nivel}`       : null,
    criterio_sexo === 'M' ? '- Sexo: Masculino' : criterio_sexo === 'F' ? '- Sexo: Feminino' : null,
    (criterio_idade_min || criterio_idade_max) ? `- Faixa etária: ${criterio_idade_min || '?'} a ${criterio_idade_max || '?'} anos` : null,
    `- Dias de treino por semana: ${num_dias} (os outros dias são descanso, distribua bem)`,
    '',
    'EXERCÍCIOS DISPONÍVEIS (use APENAS estes IDs, não invente outros):',
    JSON.stringify(listaEx),
    '',
    diretriz ? `DIRETRIZES DO PERSONAL (seguir obrigatoriamente):\n${diretriz}\n` : null,
    '',
    'Retorne JSON com esta estrutura exata:',
    '{"nome":"...","objetivo":"...","dias":[{"dia_semana":1,"nome":"Peito e Tríceps","descanso":false,"exercicios":[{"id_exercicio":N,"series":4,"repeticoes":"8-12","descanso_seg":60,"observacao":""}]},{"dia_semana":7,"nome":"","descanso":true,"exercicios":[]}]}',
    '',
    'Regras:',
    '- Inclua TODOS os 7 dias (1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb, 7=Dom)',
    '- Dias de descanso: descanso=true, exercicios=[]',
    '- Use SOMENTE id_exercicio da lista fornecida',
    '- 4 a 6 exercícios por dia de treino',
    '- Varie grupos musculares entre os dias (ex: peito+tri, costas+bi, pernas, ombro)',
    '- series é número inteiro, repeticoes pode ser "8-12" ou "10" etc',
  ].filter(Boolean)

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: linhas.join('\n') }],
  })

  const raw = JSON.parse(completion.choices[0].message.content)

  const diasEnriquecidos = (raw.dias || []).map(dia => ({
    dia_semana: dia.dia_semana,
    nome:       dia.nome || '',
    descanso:   !!dia.descanso,
    exercicios: (dia.exercicios || []).map((ex, i) => {
      const info = exMap[ex.id_exercicio] || {}
      return {
        _uid:           `ai-${dia.dia_semana}-${i}`,
        id_exercicio:   ex.id_exercicio,
        nome:           info.nome           || '?',
        grupo_muscular: info.grupo_muscular || '',
        series:         String(ex.series    || 4),
        repeticoes:     String(ex.repeticoes || '12'),
        carga_sugerida: ex.carga_sugerida  || '',
        descanso_seg:   String(ex.descanso_seg || 60),
        observacao:     ex.observacao       || '',
      }
    }),
  }))

  const diasCompletos = [1,2,3,4,5,6,7].map(n => {
    const found = diasEnriquecidos.find(d => d.dia_semana === n)
    return found || { dia_semana: n, nome: '', descanso: true, exercicios: [] }
  })

  return { nome: raw.nome || '', objetivo: raw.objetivo || '', dias: diasCompletos }
}

module.exports = { listar, buscar, criar, atualizar, clonarParaAluno, clonarTemplateEspecifico, gerarComIA }
