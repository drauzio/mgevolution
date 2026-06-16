const { getPool, sql } = require('../database/connection')

async function stats() {
  const pool = await getPool()

  const result = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM dbo.usuario u
       JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
       JOIN dbo.perfil p          ON p.id_perfil  = up.id_perfil  AND p.nome = 'aluno'
       WHERE u.ativo = 1) AS alunos_ativos,

      (SELECT COUNT(*) FROM dbo.usuario u
       JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
       JOIN dbo.perfil p          ON p.id_perfil  = up.id_perfil  AND p.nome = 'personal'
       WHERE u.ativo = 1) AS personais_ativos,

      (SELECT COUNT(*) FROM dbo.treino_protocolo WHERE ativo = 1) AS treinos_ativos,

      (SELECT COUNT(*) FROM dbo.dieta_plano WHERE ativo = 1) AS dietas_ativas,

      (SELECT COUNT(*) FROM dbo.usuario u
       JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
       JOIN dbo.perfil p          ON p.id_perfil  = up.id_perfil  AND p.nome = 'aluno'
       WHERE u.data_criacao >= DATEADD(day, -30, GETDATE())) AS alunos_novos_30d,

      (SELECT COUNT(*) FROM dbo.avaliacao_fitness WHERE status = 'concluida' AND ativo = 1) AS avaliacoes_concluidas
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
      CASE WHEN av.id_avaliacao_fitness IS NOT NULL THEN 1 ELSE 0 END AS avaliacao_concluida
    FROM dbo.usuario u
    JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
    JOIN dbo.perfil p          ON p.id_perfil  = up.id_perfil  AND p.nome = 'aluno'
    LEFT JOIN dbo.treino_protocolo tp ON tp.id_usuario = u.id_usuario AND tp.ativo = 1
    LEFT JOIN dbo.usuario per         ON per.id_usuario = tp.id_personal
    LEFT JOIN dbo.avaliacao_fitness av
           ON av.id_usuario = u.id_usuario AND av.status = 'concluida' AND av.ativo = 1
    ORDER BY u.data_criacao DESC
  `)

  return result.recordset
}

module.exports = { stats, alunosRecentes }
