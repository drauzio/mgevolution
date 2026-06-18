const { getPool, sql } = require('../database/connection')
const wa = require('../integrations/whatsapp')

async function gravarLog({ tipo, id_usuario, telefone, status, message_id, motivo_erro }) {
  try {
    const pool = await getPool()
    await pool.request()
      .input('tipo',        sql.VarChar(50),  tipo)
      .input('id_usuario',  sql.Int,          id_usuario || null)
      .input('telefone',    sql.VarChar(20),  telefone   || null)
      .input('status',      sql.VarChar(10),  status)
      .input('message_id',  sql.VarChar(100), message_id || null)
      .input('motivo_erro', sql.VarChar(500), motivo_erro || null)
      .query(`
        INSERT INTO dbo.whatsapp_log (tipo, id_usuario, telefone, status, message_id, motivo_erro)
        VALUES (@tipo, @id_usuario, @telefone, @status, @message_id, @motivo_erro)
      `)
  } catch (e) {
    console.error('[WhatsApp Log] Erro ao gravar:', e.message)
  }
}

async function enviarELogar(tipo, id_usuario, resultadoEnvio) {
  await gravarLog({
    tipo,
    id_usuario,
    telefone:    resultadoEnvio.telefone,
    status:      resultadoEnvio.ok ? 'enviado' : 'erro',
    message_id:  resultadoEnvio.messageId,
    motivo_erro: resultadoEnvio.ok ? null : resultadoEnvio.motivo,
  })
  return resultadoEnvio
}

// ─── Envios específicos ────────────────────────────────────────────────────────

async function boasVindasAluno(aluno) {
  if (!aluno.telefone || !wa.isConfigurado()) return
  const r = await wa.enviarBoasVindas({ phone: aluno.telefone, nomeAluno: aluno.nome })
  await enviarELogar('boasvindas_aluno', aluno.id_usuario, r)
}

async function assinaturaNova({ id_usuario, nomeAluno, telefone, nomePlano, dataFim }) {
  if (!telefone || !wa.isConfigurado()) return
  const fimFmt = new Date(dataFim + 'T12:00:00').toLocaleDateString('pt-BR')
  const r = await wa.enviarAssinaturaNova({ phone: telefone, nomeAluno, nomePlano, dataFim: fimFmt })
  await enviarELogar('assinatura_nova', id_usuario, r)
}

// ─── Cron: assinaturas vencendo em 7 dias ─────────────────────────────────────
async function cronAssinaturaVencendo() {
  if (!wa.isConfigurado()) return
  const pool = await getPool()
  const result = await pool.request().query(`
    SELECT
      u.id_usuario, u.nome, u.telefone,
      p.nome AS nome_plano,
      CAST(a.data_fim AS DATE) AS data_fim,
      DATEDIFF(day, CAST(GETDATE() AS DATE), a.data_fim) AS dias_restantes
    FROM dbo.assinatura a
    INNER JOIN dbo.usuario u ON u.id_usuario = a.id_usuario
    INNER JOIN dbo.plano   p ON p.id_plano   = a.id_plano
    WHERE a.status = 'ativa'
      AND DATEDIFF(day, CAST(GETDATE() AS DATE), a.data_fim) = 7
      AND u.telefone IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM dbo.whatsapp_log wl
        WHERE wl.tipo = 'assinatura_vencendo'
          AND wl.id_usuario = u.id_usuario
          AND CAST(wl.data_envio AS DATE) = CAST(GETDATE() AS DATE)
      )
  `)

  const telefoneAcademia = process.env.TELEFONE_ACADEMIA || ''
  for (const row of result.recordset) {
    if (!row.telefone) continue
    const fimFmt = new Date(row.data_fim + 'T12:00:00').toLocaleDateString('pt-BR')
    const r = await wa.enviarAssinaturaVencendo({
      phone:            row.telefone,
      nomeAluno:        row.nome,
      nomePlano:        row.nome_plano,
      diasRestantes:    row.dias_restantes,
      dataFim:          fimFmt,
      telefoneAcademia,
    })
    await enviarELogar('assinatura_vencendo', row.id_usuario, r)
  }
}

// ─── Cron: alunos inativos ─────────────────────────────────────────────────────
async function cronAlunoInativo() {
  if (!wa.isConfigurado()) return
  const pool = await getPool()
  const diasInativo = Number(process.env.WHATSAPP_DIAS_INATIVO) || 7
  const result = await pool.request()
    .input('dias', sql.Int, diasInativo)
    .query(`
      SELECT
        u.id_usuario, u.nome, u.telefone,
        DATEDIFF(day,
          (SELECT TOP 1 CAST(ts.data_sessao AS DATE) FROM dbo.treino_sessao ts WHERE ts.id_usuario = u.id_usuario AND ts.concluida = 1 ORDER BY ts.data_sessao DESC),
          CAST(GETDATE() AS DATE)
        ) AS dias_sem_treino
      FROM dbo.usuario u
      INNER JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
        AND up.id_perfil = (SELECT id_perfil FROM dbo.perfil WHERE nome = 'aluno')
      WHERE u.ativo = 1
        AND u.telefone IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM dbo.treino_sessao ts WHERE ts.id_usuario = u.id_usuario AND ts.concluida = 1
        )
        AND DATEDIFF(day,
          (SELECT TOP 1 CAST(ts.data_sessao AS DATE) FROM dbo.treino_sessao ts WHERE ts.id_usuario = u.id_usuario AND ts.concluida = 1 ORDER BY ts.data_sessao DESC),
          CAST(GETDATE() AS DATE)
        ) = @dias
        AND NOT EXISTS (
          SELECT 1 FROM dbo.whatsapp_log wl
          WHERE wl.tipo = 'aluno_inativo'
            AND wl.id_usuario = u.id_usuario
            AND CAST(wl.data_envio AS DATE) = CAST(GETDATE() AS DATE)
        )
    `)

  const nomeAcademia = process.env.NOME_ACADEMIA || 'MG Evolution'
  for (const row of result.recordset) {
    if (!row.telefone) continue
    const r = await wa.enviarAlunoInativo({
      phone:          row.telefone,
      nomeAluno:      row.nome,
      diasSemTreinar: row.dias_sem_treino,
      nomeAcademia,
    })
    await enviarELogar('aluno_inativo', row.id_usuario, r)
  }
}

// ─── Listar logs para admin ────────────────────────────────────────────────────
async function listarLogs({ pagina = 1, tipo, status } = {}) {
  const pool = await getPool()
  const rq = pool.request()
    .input('offset', sql.Int, (pagina - 1) * 50)

  let where = 'WHERE 1=1'
  if (tipo)   { rq.input('tipo',   sql.VarChar(50), tipo);   where += ' AND wl.tipo = @tipo' }
  if (status) { rq.input('status', sql.VarChar(10), status); where += ' AND wl.status = @status' }

  const result = await rq.query(`
    SELECT
      wl.id_log, wl.tipo, wl.telefone, wl.status, wl.message_id, wl.motivo_erro,
      CONVERT(VARCHAR(16), wl.data_envio, 120) AS data_envio,
      u.nome AS nome_usuario
    FROM dbo.whatsapp_log wl
    LEFT JOIN dbo.usuario u ON u.id_usuario = wl.id_usuario
    ${where}
    ORDER BY wl.id_log DESC
    OFFSET @offset ROWS FETCH NEXT 50 ROWS ONLY
  `)
  return result.recordset
}

module.exports = { boasVindasAluno, assinaturaNova, cronAssinaturaVencendo, cronAlunoInativo, listarLogs }
