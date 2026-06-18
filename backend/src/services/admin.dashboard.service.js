const { getPool, sql } = require('../database/connection')

async function stats() {
  const pool = await getPool()

  const result = await pool.request().query(`
    SELECT
      -- Alunos
      (SELECT COUNT(*) FROM dbo.usuario u
       JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
       JOIN dbo.perfil p          ON p.id_perfil  = up.id_perfil  AND p.nome = 'aluno'
       WHERE u.ativo = 1) AS alunos_ativos,

      (SELECT COUNT(*) FROM dbo.usuario u
       JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
       JOIN dbo.perfil p          ON p.id_perfil  = up.id_perfil  AND p.nome = 'aluno'
       WHERE u.ativo = 1
         AND u.data_criacao >= DATEADD(day, -30, GETDATE())) AS alunos_novos_30d,

      -- Alunos sem protocolo de treino ativo (precisam de atenção)
      (SELECT COUNT(*) FROM dbo.usuario u
       JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
       JOIN dbo.perfil p          ON p.id_perfil  = up.id_perfil  AND p.nome = 'aluno'
       WHERE u.ativo = 1
         AND NOT EXISTS (
           SELECT 1 FROM dbo.treino_protocolo tp
           WHERE tp.id_usuario = u.id_usuario AND tp.ativo = 1 AND tp.is_template = 0
         )
      ) AS alunos_sem_treino,

      -- Avaliações
      (SELECT COUNT(*) FROM dbo.avaliacao_fitness WHERE status = 'concluida' AND ativo = 1) AS avaliacoes_concluidas,
      (SELECT COUNT(*) FROM dbo.avaliacao_fitness WHERE status = 'em_andamento' AND ativo = 1) AS avaliacoes_pendentes,

      -- Personais e nutricionistas
      (SELECT COUNT(*) FROM dbo.usuario u
       JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
       JOIN dbo.perfil p          ON p.id_perfil  = up.id_perfil  AND p.nome = 'personal'
       WHERE u.ativo = 1) AS personais_ativos,

      (SELECT COUNT(*) FROM dbo.usuario u
       JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
       JOIN dbo.perfil p          ON p.id_perfil  = up.id_perfil  AND p.nome = 'nutricionista'
       WHERE u.ativo = 1) AS nutricionistas_ativas,

      -- Treinos e dietas
      (SELECT COUNT(*) FROM dbo.treino_protocolo WHERE ativo = 1 AND is_template = 0) AS treinos_ativos,
      (SELECT COUNT(*) FROM dbo.treino_protocolo WHERE ativo = 1 AND is_template = 1) AS treinos_template,

      (SELECT COUNT(*) FROM dbo.dieta_plano WHERE ativo = 1 AND status_plano = 'liberado') AS dietas_liberadas,
      (SELECT COUNT(*) FROM dbo.dieta_plano WHERE ativo = 1 AND status_plano = 'rascunho') AS dietas_rascunho,

      -- Solicitações de dieta pendentes
      (SELECT COUNT(*) FROM dbo.dieta_solicitacao WHERE status = 'pendente') AS solicitacoes_dieta_pendentes,

      -- Check-ins hoje
      (SELECT COUNT(*) FROM dbo.shape_score WHERE data = CAST(GETDATE() AS DATE)) AS checkins_hoje
  `)

  return result.recordset[0]
}

async function alunosRecentes() {
  const pool = await getPool()

  const result = await pool.request().query(`
    SELECT TOP 8
      u.id_usuario,
      u.nome,
      u.email,
      u.ativo,
      CONVERT(VARCHAR(10), u.data_criacao, 103) AS data_criacao,
      per.nome AS personal,
      CASE WHEN av.id_avaliacao_fitness IS NOT NULL THEN 1 ELSE 0 END AS avaliacao_concluida,
      CASE WHEN tp.id_protocolo        IS NOT NULL THEN 1 ELSE 0 END AS tem_treino
    FROM dbo.usuario u
    JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
    JOIN dbo.perfil p          ON p.id_perfil  = up.id_perfil  AND p.nome = 'aluno'
    LEFT JOIN dbo.treino_protocolo tp
           ON tp.id_usuario = u.id_usuario AND tp.ativo = 1 AND tp.is_template = 0
    LEFT JOIN dbo.usuario per ON per.id_usuario = tp.id_personal
    LEFT JOIN dbo.avaliacao_fitness av
           ON av.id_usuario = u.id_usuario AND av.status = 'concluida' AND av.ativo = 1
    ORDER BY u.data_criacao DESC
  `)

  return result.recordset
}

async function cadastrosPorMes() {
  const pool = await getPool()

  const result = await pool.request().query(`
    SELECT
      FORMAT(u.data_criacao, 'yyyy-MM') AS mes,
      COUNT(*) AS total
    FROM dbo.usuario u
    JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
    JOIN dbo.perfil p          ON p.id_perfil  = up.id_perfil  AND p.nome = 'aluno'
    WHERE u.data_criacao >= DATEADD(month, -6, GETDATE())
    GROUP BY FORMAT(u.data_criacao, 'yyyy-MM')
    ORDER BY mes
  `)

  return result.recordset
}

module.exports = { stats, alunosRecentes, cadastrosPorMes }
