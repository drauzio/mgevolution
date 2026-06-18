const { getPool, sql } = require('../database/connection')
const OpenAI = require('openai')
const { uploadBuffer, gerarSasReadUrl, deleteBlob } = require('../utils/azureBlob')
const blobPaths = require('../utils/blobPaths')

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_ANALISE = `Você é o Coach IA MG, especialista em transformação física baseado no método do Márcio Gonçalves.
Analise os dados de evolução do aluno e forneça uma análise estruturada, direta e motivadora.
Responda sempre em português brasileiro. Seja específico — cite os números reais dos dados fornecidos.
Evite generalidades. Foque no que os dados mostram de concreto.`

async function resumo(idUsuario) {
  const pool = await getPool()

  const [sessoesR, medidaR, mesR] = await Promise.all([
    pool.request()
      .input('id', sql.Int, idUsuario)
      .query(`SELECT COUNT(*) AS total FROM dbo.treino_sessao WHERE id_usuario = @id AND concluida = 1`),

    pool.request()
      .input('id', sql.Int, idUsuario)
      .query(`SELECT TOP 1 * FROM dbo.evolucao_medida WHERE id_usuario = @id ORDER BY data DESC`),

    pool.request()
      .input('id', sql.Int, idUsuario)
      .query(`
        SELECT COUNT(*) AS total_mes
        FROM dbo.treino_sessao
        WHERE id_usuario = @id AND concluida = 1
          AND YEAR(data_sessao)  = YEAR(SYSUTCDATETIME())
          AND MONTH(data_sessao) = MONTH(SYSUTCDATETIME())
      `),
  ])

  return {
    total_sessoes: sessoesR.recordset[0].total,
    total_mes:     mesR.recordset[0].total_mes,
    ultima_medida: medidaR.recordset[0] || null,
  }
}

async function sessoes(idUsuario, dias = 42) {
  const pool = await getPool()
  const result = await pool.request()
    .input('id',   sql.Int, idUsuario)
    .input('dias', sql.Int, dias)
    .query(`
      SELECT
        CAST(data_sessao AS DATE)                              AS data,
        COUNT(*)                                               AS total,
        SUM(CASE WHEN concluida = 1 THEN 1 ELSE 0 END)        AS concluidas
      FROM dbo.treino_sessao
      WHERE id_usuario = @id
        AND data_sessao >= CAST(DATEADD(DAY, -@dias, SYSUTCDATETIME()) AS DATE)
      GROUP BY CAST(data_sessao AS DATE)
      ORDER BY data DESC
    `)
  return result.recordset
}

async function listarMedidas(idUsuario) {
  const pool = await getPool()
  const result = await pool.request()
    .input('id', sql.Int, idUsuario)
    .query(`SELECT TOP 20 * FROM dbo.evolucao_medida WHERE id_usuario = @id ORDER BY data DESC`)
  return result.recordset
}

async function adicionarMedida(idUsuario, dados) {
  const pool = await getPool()
  const { data, peso, gordura_pct, massa_magra, cintura_cm, quadril_cm, peito_cm, braco_cm, coxa_cm, observacao } = dados
  const r = await pool.request()
    .input('id',          sql.Int,           idUsuario)
    .input('data',        sql.Date,          data)
    .input('peso',        sql.Decimal(5, 2), peso        || null)
    .input('gordura',     sql.Decimal(4, 1), gordura_pct || null)
    .input('massa_magra', sql.Decimal(5, 2), massa_magra || null)
    .input('cintura',     sql.Decimal(5, 1), cintura_cm  || null)
    .input('quadril',     sql.Decimal(5, 1), quadril_cm  || null)
    .input('peito',       sql.Decimal(5, 1), peito_cm    || null)
    .input('braco',       sql.Decimal(5, 1), braco_cm    || null)
    .input('coxa',        sql.Decimal(5, 1), coxa_cm     || null)
    .input('obs',         sql.VarChar(300),  observacao  || null)
    .query(`
      INSERT INTO dbo.evolucao_medida
        (id_usuario, data, peso, gordura_pct, massa_magra, cintura_cm, quadril_cm, peito_cm, braco_cm, coxa_cm, observacao)
      OUTPUT INSERTED.*
      VALUES (@id, @data, @peso, @gordura, @massa_magra, @cintura, @quadril, @peito, @braco, @coxa, @obs)
    `)
  return r.recordset[0]
}

async function historicoExercicio(idUsuario, idExercicio) {
  const pool = await getPool()
  const result = await pool.request()
    .input('id',   sql.Int, idUsuario)
    .input('idEx', sql.Int, idExercicio)
    .query(`
      SELECT TOP 12
        CAST(s.data_sessao AS DATE) AS data,
        tse.carga_usada
      FROM dbo.treino_sessao_exercicio tse
      JOIN dbo.treino_sessao         s   ON s.id_treino_sessao        = tse.id_treino_sessao
      JOIN dbo.treino_dia_exercicio  tde ON tde.id_treino_dia_exercicio = tse.id_treino_dia_exercicio
      WHERE s.id_usuario      = @id
        AND tde.id_exercicio  = @idEx
        AND tse.feito         = 1
        AND tse.carga_usada   IS NOT NULL
      ORDER BY s.data_sessao DESC
    `)
  return result.recordset.reverse()
}

async function exerciciosDoProtocolo(idUsuario) {
  const pool = await getPool()
  const result = await pool.request()
    .input('id', sql.Int, idUsuario)
    .query(`
      SELECT DISTINCT e.id_exercicio, e.nome, e.grupo_muscular
      FROM dbo.treino_protocolo  p
      JOIN dbo.treino_dia        td  ON td.id_protocolo  = p.id_protocolo
      JOIN dbo.treino_dia_exercicio tde ON tde.id_treino_dia = td.id_treino_dia
      JOIN dbo.exercicio         e   ON e.id_exercicio   = tde.id_exercicio
      WHERE p.id_usuario = @id AND p.ativo = 1 AND p.is_template = 0
      ORDER BY e.grupo_muscular, e.nome
    `)
  return result.recordset
}

async function analiseIA(idUsuario) {
  const [resumoData, sessoesData, medidasData, fotosData] = await Promise.all([
    resumo(idUsuario),
    sessoes(idUsuario, 60),
    listarMedidas(idUsuario),
    listarFotos(idUsuario),
  ])

  // Verifica se há dados suficientes para uma análise útil
  const temTreinos = resumoData.total_sessoes >= 3
  const temMedidas = medidasData.length >= 1
  const temFotosCheck = fotosData.length >= 1

  if (!temTreinos && !temMedidas && !temFotosCheck) {
    const err = new Error('Dados insuficientes')
    err.status = 422
    err.code   = 'SEM_DADOS'
    err.faltando = {
      treinos: !temTreinos,
      medidas: !temMedidas,
      fotos:   !temFotosCheck,
    }
    throw err
  }

  const fmtData = (d) => {
    if (!d) return ''
    const s = typeof d === 'string' ? d : d.toISOString()
    return new Date(s.includes('T') ? s : s + 'T12:00:00').toLocaleDateString('pt-BR')
  }

  let ctx = `=== DADOS DE EVOLUÇÃO DO ALUNO ===\n\n`

  ctx += `CONSISTÊNCIA DE TREINOS:\n`
  ctx += `- Total de treinos concluídos (histórico): ${resumoData.total_sessoes}\n`
  ctx += `- Treinos concluídos este mês: ${resumoData.total_mes}\n`
  if (sessoesData.length) {
    const concluidos = sessoesData.filter(s => s.concluidas > 0).length
    ctx += `- Nos últimos 60 dias: ${sessoesData.length} dias com sessão registrada, ${concluidos} com treino concluído\n`
  }

  if (medidasData.length) {
    ctx += `\nMEDIDAS REGISTRADAS (${medidasData.length} medições):\n`
    medidasData.slice(0, 6).forEach(m => {
      const linha = []
      if (m.peso)        linha.push(`peso ${parseFloat(m.peso)}kg`)
      if (m.gordura_pct) linha.push(`gordura ${parseFloat(m.gordura_pct)}%`)
      if (m.massa_magra) linha.push(`massa magra ${parseFloat(m.massa_magra)}kg`)
      if (m.cintura_cm)  linha.push(`cintura ${parseFloat(m.cintura_cm)}cm`)
      if (m.quadril_cm)  linha.push(`quadril ${parseFloat(m.quadril_cm)}cm`)
      if (m.peito_cm)    linha.push(`peito ${parseFloat(m.peito_cm)}cm`)
      if (m.braco_cm)    linha.push(`braço ${parseFloat(m.braco_cm)}cm`)
      if (m.coxa_cm)     linha.push(`coxa ${parseFloat(m.coxa_cm)}cm`)
      if (linha.length) ctx += `  ${fmtData(m.data)}: ${linha.join(', ')}\n`
    })

    if (medidasData.length >= 2) {
      const atual  = medidasData[0]
      const inicio = medidasData[medidasData.length - 1]
      ctx += `\nEVOLUÇÃO TOTAL (${fmtData(inicio.data)} → ${fmtData(atual.data)}):\n`
      if (atual.peso        != null && inicio.peso        != null) ctx += `  Peso: ${parseFloat(inicio.peso)}kg → ${parseFloat(atual.peso)}kg (${(parseFloat(atual.peso) - parseFloat(inicio.peso)).toFixed(1)}kg)\n`
      if (atual.gordura_pct != null && inicio.gordura_pct != null) ctx += `  Gordura: ${parseFloat(inicio.gordura_pct)}% → ${parseFloat(atual.gordura_pct)}% (${(parseFloat(atual.gordura_pct) - parseFloat(inicio.gordura_pct)).toFixed(1)}%)\n`
      if (atual.massa_magra != null && inicio.massa_magra != null) ctx += `  Massa magra: ${parseFloat(inicio.massa_magra)}kg → ${parseFloat(atual.massa_magra)}kg (${(parseFloat(atual.massa_magra) - parseFloat(inicio.massa_magra)).toFixed(1)}kg)\n`
      if (atual.cintura_cm  != null && inicio.cintura_cm  != null) ctx += `  Cintura: ${parseFloat(inicio.cintura_cm)}cm → ${parseFloat(atual.cintura_cm)}cm (${(parseFloat(atual.cintura_cm) - parseFloat(inicio.cintura_cm)).toFixed(1)}cm)\n`
    }
  } else {
    ctx += `\nMEDIDAS CORPORAIS: nenhuma medida registrada ainda.\n`
  }

  // Seleciona fotos para análise visual: antes, depois e progresso mais recente
  const fotoAntes    = fotosData.find(f => f.tipo === 'antes')
  const fotoDepois   = fotosData.find(f => f.tipo === 'depois')
  const fotoRecente  = fotosData.find(f => f.tipo === 'progresso')
  const fotosParaIA  = [fotoAntes, fotoDepois, fotoRecente].filter(Boolean)

  const temFotos = fotosParaIA.length > 0
  if (temFotos) {
    ctx += `\nFOTOS: foram enviadas ${fotosParaIA.length} foto(s) para análise visual`
    if (fotoAntes)  ctx += ` (antes: ${fmtData(fotoAntes.data)})`
    if (fotoDepois) ctx += ` (depois: ${fmtData(fotoDepois.data)})`
    if (fotoRecente && !fotoAntes && !fotoDepois) ctx += ` (progresso: ${fmtData(fotoRecente.data)})`
    ctx += `.\n`
  } else {
    ctx += `\nFOTOS: nenhuma foto enviada.\n`
  }

  const textoPrompt = `${ctx}
Com base nos dados${temFotos ? ' e nas imagens' : ''} acima, forneça uma análise dividida em 4 seções curtas:

**📊 Progresso atual**
Avalie o que os números${temFotos ? ' e as fotos' : ''} mostram objetivamente.

**✅ Pontos positivos**
O que está indo bem, com base nos dados${temFotos ? ' e na composição corporal visível' : ''}.

**⚠️ Pontos de atenção**
O que precisa melhorar, citando números quando relevante.

**🎯 Recomendações práticas**
2 a 3 ações concretas para as próximas semanas.

Seja direto. Cada seção em 2-3 frases no máximo.`

  // Monta content como array para suportar imagens (vision)
  const content = [{ type: 'text', text: textoPrompt }]
  for (const foto of fotosParaIA) {
    content.push({
      type: 'image_url',
      image_url: {
        url:    foto.url,
        detail: 'low', // suficiente para análise corporal, menor custo
      },
    })
  }

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_VISION_MODEL || 'gpt-4o',
    max_tokens: 1000,
    messages: [
      { role: 'system', content: SYSTEM_ANALISE },
      { role: 'user',   content },
    ],
  })

  const texto = response.choices[0].message.content
  await salvarAnaliseCache(idUsuario, texto)
  return texto
}

async function buscarAnaliseCache(idUsuario) {
  const pool = await getPool()
  const r = await pool.request()
    .input('id', sql.Int, idUsuario)
    .query(`SELECT analise, data_geracao FROM dbo.evolucao_analise_cache WHERE id_usuario = @id`)
  return r.recordset[0] || null
}

async function salvarAnaliseCache(idUsuario, analise) {
  const pool = await getPool()
  await pool.request()
    .input('id',      sql.Int,          idUsuario)
    .input('analise', sql.NVarChar(sql.MAX), analise)
    .query(`
      MERGE dbo.evolucao_analise_cache AS t
      USING (SELECT @id AS id_usuario) AS s ON t.id_usuario = s.id_usuario
      WHEN MATCHED     THEN UPDATE SET analise = @analise, data_geracao = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN INSERT (id_usuario, analise) VALUES (@id, @analise);
    `)
}

async function listarFotos(idUsuario) {
  const pool = await getPool()
  const result = await pool.request()
    .input('id', sql.Int, idUsuario)
    .query(`SELECT * FROM dbo.evolucao_foto WHERE id_usuario = @id ORDER BY data DESC, data_registro DESC`)

  // gera SAS URL para cada foto (60 min)
  return Promise.all(result.recordset.map(async f => ({
    ...f,
    url: await gerarSasReadUrl(f.filekey, { minutes: 60 }),
  })))
}

async function uploadFoto(idUsuario, { buffer, mimetype, tipo, data }) {
  const pool = await getPool()
  const blobName = blobPaths.fotoEvolucao({ id_usuario: idUsuario, tipo, mimeType: mimetype })

  await uploadBuffer({ buffer, blobName, contentType: mimetype })

  const r = await pool.request()
    .input('id',      sql.Int,         idUsuario)
    .input('tipo',    sql.VarChar(20),  tipo || 'progresso')
    .input('filekey', sql.VarChar(300), blobName)
    .input('data',    sql.Date,         data || new Date().toISOString().slice(0, 10))
    .query(`
      INSERT INTO dbo.evolucao_foto (id_usuario, tipo, filekey, data)
      OUTPUT INSERTED.*
      VALUES (@id, @tipo, @filekey, @data)
    `)

  return r.recordset[0]
}

async function deletarFoto(idFoto, idUsuario) {
  const pool = await getPool()
  const r = await pool.request()
    .input('id',        sql.Int, idFoto)
    .input('idUsuario', sql.Int, idUsuario)
    .query(`SELECT filekey FROM dbo.evolucao_foto WHERE id_evolucao_foto = @id AND id_usuario = @idUsuario`)

  if (!r.recordset[0]) return
  await deleteBlob(r.recordset[0].filekey)
  await pool.request()
    .input('id',        sql.Int, idFoto)
    .input('idUsuario', sql.Int, idUsuario)
    .query(`DELETE FROM dbo.evolucao_foto WHERE id_evolucao_foto = @id AND id_usuario = @idUsuario`)
}

// ── Shape Future ─────────────────────────────────────────────
const _shapeCache = new Map()
const SHAPE_TTL   = 6 * 60 * 60 * 1000

async function shapeFuture(idUsuario, { gerarAnalise = false } = {}) {
  const cached = _shapeCache.get(idUsuario)
  if (cached && Date.now() - cached.ts < SHAPE_TTL && !gerarAnalise) return cached.data

  const [medidasData, resumoData] = await Promise.all([
    listarMedidas(idUsuario),
    resumo(idUsuario),
  ])

  if (medidasData.length < 2) return { semDados: true, total_medicoes: medidasData.length }

  const recente = medidasData[0]
  const antigo  = medidasData[medidasData.length - 1]

  const dR = new Date(typeof recente.data === 'string' ? recente.data + 'T12:00:00' : recente.data)
  const dA = new Date(typeof antigo.data  === 'string' ? antigo.data  + 'T12:00:00' : antigo.data)
  const diasDecorridos = Math.max(1, (dR - dA) / 86400000)

  const campos = ['peso', 'gordura_pct', 'massa_magra', 'cintura_cm', 'quadril_cm', 'braco_cm', 'coxa_cm']
  const taxaDiaria = {}
  for (const c of campos) {
    if (recente[c] != null && antigo[c] != null) {
      taxaDiaria[c] = (parseFloat(recente[c]) - parseFloat(antigo[c])) / diasDecorridos
    }
  }

  function projetar(dias) {
    const p = {}
    for (const c of campos) {
      if (recente[c] != null && taxaDiaria[c] != null) {
        p[c] = Math.max(0, parseFloat((parseFloat(recente[c]) + taxaDiaria[c] * dias).toFixed(1)))
      }
    }
    return p
  }

  const projecao_90  = projetar(90)
  const projecao_180 = projetar(180)

  const fmt = d => {
    if (!d) return ''
    const s = typeof d === 'string' ? d : d.toISOString()
    return new Date(s.includes('T') ? s : s + 'T12:00:00').toLocaleDateString('pt-BR')
  }

  let analise_ia = cached?.data?.analise_ia || null

  if (gerarAnalise || (!analise_ia && !cached)) {
    let ctx = `SHAPE FUTURE — PROJEÇÃO MATEMÁTICA REAL\n\n`
    ctx += `HOJE (${fmt(recente.data)}):\n`
    if (recente.peso)        ctx += `  Peso: ${parseFloat(recente.peso)}kg\n`
    if (recente.gordura_pct) ctx += `  Gordura: ${parseFloat(recente.gordura_pct)}%\n`
    if (recente.massa_magra) ctx += `  Massa magra: ${parseFloat(recente.massa_magra)}kg\n`
    if (recente.cintura_cm)  ctx += `  Cintura: ${parseFloat(recente.cintura_cm)}cm\n`
    if (recente.braco_cm)    ctx += `  Braço: ${parseFloat(recente.braco_cm)}cm\n`
    ctx += `\nRITMO MENSAL (últimos ${Math.round(diasDecorridos)} dias):\n`
    if (taxaDiaria.peso        != null) ctx += `  Peso: ${(taxaDiaria.peso * 30).toFixed(2)}kg/mês\n`
    if (taxaDiaria.gordura_pct != null) ctx += `  Gordura: ${(taxaDiaria.gordura_pct * 30).toFixed(2)}pp/mês\n`
    if (taxaDiaria.massa_magra != null) ctx += `  Massa magra: ${(taxaDiaria.massa_magra * 30).toFixed(2)}kg/mês\n`
    ctx += `\nPROJEÇÃO 90 DIAS:\n`
    if (projecao_90.peso)        ctx += `  Peso: ${projecao_90.peso}kg\n`
    if (projecao_90.gordura_pct) ctx += `  Gordura: ${projecao_90.gordura_pct}%\n`
    if (projecao_90.massa_magra) ctx += `  Massa magra: ${projecao_90.massa_magra}kg\n`
    ctx += `\nPROJEÇÃO 180 DIAS:\n`
    if (projecao_180.peso)        ctx += `  Peso: ${projecao_180.peso}kg\n`
    if (projecao_180.gordura_pct) ctx += `  Gordura: ${projecao_180.gordura_pct}%\n`
    if (projecao_180.massa_magra) ctx += `  Massa magra: ${projecao_180.massa_magra}kg\n`
    ctx += `\nCONSISTÊNCIA: ${resumoData.total_mes} treinos este mês, ${resumoData.total_sessoes} no total.\n`

    const resp = await openai.chat.completions.create({
      model: process.env.OPENAI_VISION_MODEL || 'gpt-4o',
      max_tokens: 500,
      messages: [
        { role: 'system', content: 'Você é o Coach IA MG. Analise projeções de composição corporal e forneça insights objetivos. Responda em português brasileiro.' },
        { role: 'user', content: `${ctx}\nResponda em exatamente 3 blocos curtos (máx 2-3 frases cada):\n\n**🎯 Onde você chega**\nShape provável em 90 e 180 dias com base nos números.\n\n**⚡ Marcos esperados**\nQual milestone físico específico e quando (abdominal, cintura, etc.).\n\n**⚠️ Atenção**\nRisco na trajetória ou incentivo final se estiver bem encaminhado.` },
      ],
    })
    analise_ia = resp.choices[0].message.content
  }

  const result = {
    semDados: false,
    atual: {
      data:        recente.data,
      peso:        recente.peso        ? parseFloat(recente.peso)        : null,
      gordura_pct: recente.gordura_pct ? parseFloat(recente.gordura_pct) : null,
      massa_magra: recente.massa_magra ? parseFloat(recente.massa_magra) : null,
      cintura_cm:  recente.cintura_cm  ? parseFloat(recente.cintura_cm)  : null,
      braco_cm:    recente.braco_cm    ? parseFloat(recente.braco_cm)    : null,
    },
    projecao_90,
    projecao_180,
    taxas: {
      peso_mes:        taxaDiaria.peso        != null ? parseFloat((taxaDiaria.peso        * 30).toFixed(2)) : null,
      gordura_mes:     taxaDiaria.gordura_pct != null ? parseFloat((taxaDiaria.gordura_pct * 30).toFixed(2)) : null,
      massa_magra_mes: taxaDiaria.massa_magra != null ? parseFloat((taxaDiaria.massa_magra * 30).toFixed(2)) : null,
    },
    total_medicoes:  medidasData.length,
    dias_historico:  Math.round(diasDecorridos),
    analise_ia,
  }

  _shapeCache.set(idUsuario, { data: result, ts: Date.now() })
  return result
}

module.exports = { resumo, sessoes, listarMedidas, adicionarMedida, historicoExercicio, exerciciosDoProtocolo, analiseIA, buscarAnaliseCache, listarFotos, uploadFoto, deletarFoto, shapeFuture }
