const OpenAI   = require('openai')
const { getPool, sql } = require('../database/connection')

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const sessoes = new Map() // id_usuario → { historico, contexto }

const DIAS_SEMANA = { 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado', 7: 'Domingo' }

function fmtData(d) {
  if (!d) return ''
  const s = typeof d === 'string' ? d : d.toISOString()
  return new Date(s.includes('T') ? s : s + 'T12:00:00').toLocaleDateString('pt-BR')
}

async function construirContexto(idUsuario) {
  const pool = await getPool()

  const [usuarioR, medidasR, statsR, exerciciosR, sessoesRecentesR] = await Promise.all([
    pool.request()
      .input('id', sql.Int, idUsuario)
      .query(`SELECT nome FROM dbo.usuario WHERE id_usuario = @id`),

    pool.request()
      .input('id', sql.Int, idUsuario)
      .query(`
        SELECT TOP 1 peso, gordura_pct, massa_magra, data
        FROM dbo.evolucao_medida
        WHERE id_usuario = @id ORDER BY data DESC
      `),

    pool.request()
      .input('id', sql.Int, idUsuario)
      .query(`
        SELECT
          COUNT(*) AS total_sessoes,
          SUM(CASE WHEN MONTH(data_sessao) = MONTH(SYSUTCDATETIME())
                    AND YEAR(data_sessao)  = YEAR(SYSUTCDATETIME())
               THEN 1 ELSE 0 END) AS sessoes_mes
        FROM dbo.treino_sessao
        WHERE id_usuario = @id AND concluida = 1
      `),

    // Protocolo completo: todos os dias e exercícios com última carga usada
    pool.request()
      .input('id', sql.Int, idUsuario)
      .query(`
        SELECT
          p.nome          AS protocolo_nome,
          p.objetivo,
          td.dia_semana,
          td.nome         AS dia_nome,
          td.id_treino_dia,
          e.nome          AS exercicio,
          e.grupo_muscular,
          tde.series,
          tde.repeticoes,
          tde.carga_sugerida,
          tde.observacao,
          tde.ordem,
          (
            SELECT TOP 1 tse2.carga_usada
            FROM dbo.treino_sessao_exercicio tse2
            JOIN dbo.treino_sessao s2 ON s2.id_treino_sessao = tse2.id_treino_sessao
            WHERE tse2.id_treino_dia_exercicio = tde.id_treino_dia_exercicio
              AND s2.id_usuario = @id AND tse2.feito = 1
            ORDER BY s2.data_sessao DESC
          ) AS ultima_carga
        FROM dbo.treino_protocolo p
        JOIN dbo.treino_dia td
          ON td.id_protocolo = p.id_protocolo AND td.descanso = 0
        JOIN dbo.treino_dia_exercicio tde
          ON tde.id_treino_dia = td.id_treino_dia
        JOIN dbo.exercicio e
          ON e.id_exercicio = tde.id_exercicio
        WHERE p.id_usuario = @id AND p.ativo = 1 AND p.is_template = 0
        ORDER BY td.dia_semana, tde.ordem
      `),

    // Últimas 5 sessões concluídas
    pool.request()
      .input('id', sql.Int, idUsuario)
      .query(`
        SELECT TOP 5
          s.data_sessao,
          td.nome AS dia_nome,
          COUNT(tse.id_treino_sessao_exercicio)                   AS total_ex,
          SUM(CASE WHEN tse.feito = 1 THEN 1 ELSE 0 END)         AS feitos
        FROM dbo.treino_sessao s
        JOIN dbo.treino_dia td ON td.id_treino_dia = s.id_treino_dia
        LEFT JOIN dbo.treino_sessao_exercicio tse
          ON tse.id_treino_sessao = s.id_treino_sessao
        WHERE s.id_usuario = @id AND s.concluida = 1
        GROUP BY s.id_treino_sessao, s.data_sessao, td.nome
        ORDER BY s.data_sessao DESC
      `),
  ])

  const nome    = usuarioR.recordset[0]?.nome || 'Aluno'
  const medida  = medidasR.recordset[0]
  const stats   = statsR.recordset[0]
  const exs     = exerciciosR.recordset
  const sessRec = sessoesRecentesR.recordset

  // ── Monta contexto ────────────────────────────────────────────
  let ctx = `Você é o Coach IA MG, assistente pessoal de transformação física baseado no método do Márcio Gonçalves.
Você está conversando com ${nome}.

═══ PERFIL DO ALUNO ═══
Nome: ${nome}`

  // Medidas
  if (medida) {
    ctx += `\nÚltima medição (${fmtData(medida.data)}):`
    if (medida.peso)        ctx += ` peso ${parseFloat(medida.peso)}kg`
    if (medida.gordura_pct) ctx += `, gordura ${parseFloat(medida.gordura_pct)}%`
    if (medida.massa_magra) ctx += `, massa magra ${parseFloat(medida.massa_magra)}kg`
  }

  // Stats
  if (stats) {
    ctx += `\nTreinos concluídos: ${stats.total_sessoes} no total, ${stats.sessoes_mes} este mês`
  }

  // Protocolo + exercícios
  if (exs.length > 0) {
    const protNome = exs[0].protocolo_nome
    const objetivo = exs[0].objetivo
    ctx += `\n\n═══ PROTOCOLO ATIVO: ${protNome}${objetivo ? ` — ${objetivo}` : ''} ═══`

    // Agrupa por dia
    const dias = {}
    exs.forEach(ex => {
      const key = ex.id_treino_dia
      if (!dias[key]) dias[key] = { nome: ex.dia_nome, dia_semana: ex.dia_semana, exercicios: [] }
      dias[key].exercicios.push(ex)
    })

    Object.values(dias).sort((a, b) => a.dia_semana - b.dia_semana).forEach(dia => {
      ctx += `\n\n${DIAS_SEMANA[dia.dia_semana] || `Dia ${dia.dia_semana}`} — ${dia.nome}:`
      dia.exercicios.forEach(ex => {
        ctx += `\n  • ${ex.exercicio} (${ex.grupo_muscular}): ${ex.series}x${ex.repeticoes}`
        if (ex.carga_sugerida) ctx += ` | sugerido: ${ex.carga_sugerida}`
        if (ex.ultima_carga)   ctx += ` | última carga usada: ${ex.ultima_carga}`
        else                   ctx += ` | ainda sem carga registrada`
        if (ex.observacao)     ctx += ` | obs: ${ex.observacao}`
      })
    })
  } else {
    ctx += `\n\nSem protocolo de treino ativo.`
  }

  // Sessões recentes
  if (sessRec.length > 0) {
    ctx += `\n\n═══ ÚLTIMAS SESSÕES ═══`
    sessRec.forEach(s => {
      ctx += `\n  ${fmtData(s.data_sessao)} — ${s.dia_nome}: ${s.feitos}/${s.total_ex} exercícios realizados`
    })
  }

  ctx += `

═══ DIRETRIZES ═══
- Responda em português brasileiro, de forma direta, prática e motivadora
- Use os dados acima para personalizar TODAS as respostas — cite exercícios, cargas e números reais do aluno
- Ao opinar sobre o treino, compare carga sugerida vs carga usada e dê recomendações de progressão
- Se perceber exercícios sem carga registrada, incentive o aluno a registrar para acompanhar evolução
- Base suas respostas no método MG: sobrecarga progressiva, déficit calórico controlado, sono e consistência
- Seja específico — nunca dê respostas genéricas que valeriam para qualquer pessoa
- Respostas entre 3 e 6 parágrafos curtos
- Nunca substitua orientação médica; para questões de saúde, indique um profissional`

  return { nome, ctx }
}

async function chat(idUsuario, mensagem) {
  if (!sessoes.has(idUsuario)) {
    const { nome, ctx } = await construirContexto(idUsuario)
    sessoes.set(idUsuario, { historico: [], system: ctx, nome })
  }

  const sessao = sessoes.get(idUsuario)
  sessao.historico.push({ role: 'user', content: mensagem })

  if (sessao.historico.length > 20) sessao.historico.splice(0, 2)

  const response = await openai.chat.completions.create({
    model:      process.env.OPENAI_VISION_MODEL || 'gpt-4o',
    max_tokens: 600,
    messages: [
      { role: 'system', content: sessao.system },
      ...sessao.historico,
    ],
  })

  const resposta = response.choices[0].message.content
  sessao.historico.push({ role: 'assistant', content: resposta })

  return { resposta, nome: sessao.nome }
}

async function iniciarSessao(idUsuario) {
  const { nome, ctx } = await construirContexto(idUsuario)
  sessoes.set(idUsuario, { historico: [], system: ctx, nome })
  return { nome }
}

function limparSessao(idUsuario) {
  sessoes.delete(idUsuario)
}

module.exports = { chat, iniciarSessao, limparSessao }
