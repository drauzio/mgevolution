const { getPool, sql } = require('../database/connection')

async function mensal(id_usuario_logado) {
  const pool = await getPool()
  const r = await pool.request().input('uid', sql.Int, id_usuario_logado).query(`
    SELECT
      ROW_NUMBER() OVER (ORDER BY COUNT(ts.id_sessao) DESC) AS posicao,
      u.id_usuario, u.nome,
      COUNT(ts.id_sessao) AS treinos_mes,
      CASE WHEN u.id_usuario = @uid THEN 1 ELSE 0 END AS sou_eu
    FROM dbo.usuario u
    INNER JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
      AND up.id_perfil = (SELECT id_perfil FROM dbo.perfil WHERE nome = 'aluno')
    LEFT JOIN dbo.treino_sessao ts ON ts.id_usuario = u.id_usuario AND ts.concluida = 1
      AND MONTH(ts.data_sessao) = MONTH(SYSUTCDATETIME())
      AND YEAR(ts.data_sessao)  = YEAR(SYSUTCDATETIME())
    WHERE u.ativo = 1
    GROUP BY u.id_usuario, u.nome
    ORDER BY treinos_mes DESC
  `)
  return r.recordset
}

module.exports = { mensal }
