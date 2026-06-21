const { getPool, sql } = require('../database/connection')

async function resumo(id_usuario) {
  const pool = await getPool()

  // Dia da semana no esquema do sistema: 1=Seg...7=Dom
  // SQL Server DATEPART(WEEKDAY): 1=Dom, 2=Seg...7=Sab
  const diaSemanaSQL = `CASE WHEN DATEPART(WEEKDAY, GETDATE()) = 1 THEN 7 ELSE DATEPART(WEEKDAY, GETDATE()) - 1 END`

  const [scoreRes, treinoRes, evolucaoRes, dietaRes] = await Promise.all([

    // Shape Score de hoje
    pool.request()
      .input('id', sql.Int, id_usuario)
      .query(`
        SELECT treino, cardio, dieta, sono, agua, pontos
        FROM dbo.shape_score
        WHERE id_usuario = @id AND data = CAST(GETDATE() AS DATE)
      `),

    // Treino do dia de hoje
    pool.request()
      .input('id', sql.Int, id_usuario)
      .query(`
        SELECT TOP 1
          td.id_treino_dia,
          td.nome        AS treino_nome,
          td.descanso,
          tp.nome        AS protocolo_nome,
          (SELECT COUNT(*) FROM dbo.treino_dia_exercicio tde WHERE tde.id_treino_dia = td.id_treino_dia) AS qtd_exercicios
        FROM dbo.treino_protocolo tp
        JOIN dbo.treino_dia td ON td.id_protocolo = tp.id_protocolo
        WHERE tp.id_usuario = @id AND tp.ativo = 1
          AND td.dia_semana = ${diaSemanaSQL}
        ORDER BY tp.data_criacao DESC
      `),

    // Últimas 2 medições para mostrar tendência
    pool.request()
      .input('id', sql.Int, id_usuario)
      .query(`
        SELECT TOP 2 data, peso, gordura_pct, massa_magra
        FROM dbo.evolucao_medida
        WHERE id_usuario = @id AND (peso IS NOT NULL OR gordura_pct IS NOT NULL)
        ORDER BY data DESC
      `),

    // Plano de dieta ativo
    pool.request()
      .input('id', sql.Int, id_usuario)
      .query(`
        SELECT TOP 1 nome, status_plano
        FROM dbo.dieta_plano
        WHERE id_usuario = @id AND ativo = 1
        ORDER BY data_criacao DESC
      `),
  ])

  const scoreHoje = scoreRes.recordset[0] || null
  const treinoHoje = treinoRes.recordset[0] || null

  const medicoes = evolucaoRes.recordset
  const evolucao = medicoes.length > 0 ? {
    atual:    medicoes[0],
    anterior: medicoes[1] || null,
  } : null

  const dieta = dietaRes.recordset[0] || null

  return { scoreHoje, treinoHoje, evolucao, dieta }
}

module.exports = { resumo }
