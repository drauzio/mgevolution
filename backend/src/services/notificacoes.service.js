const { getPool, sql } = require('../database/connection')

async function buscarParaAluno(id_usuario) {
  const pool = await getPool()

  const [checkinRes, protocoloRes, dietaRes] = await Promise.all([
    pool.request()
      .input('id', sql.Int, id_usuario)
      .query(`SELECT COUNT(*) AS total FROM dbo.shape_score WHERE id_usuario = @id AND data = CAST(GETDATE() AS DATE)`),

    pool.request()
      .input('id', sql.Int, id_usuario)
      .query(`SELECT COUNT(*) AS total FROM dbo.treino_protocolo WHERE id_usuario = @id AND ativo = 1 AND is_template = 0`),

    pool.request()
      .input('id', sql.Int, id_usuario)
      .query(`SELECT TOP 1 status_plano FROM dbo.dieta_plano WHERE id_usuario = @id AND ativo = 1 ORDER BY data_criacao DESC`),
  ])

  const itens = []

  if (checkinRes.recordset[0].total === 0) {
    itens.push({
      tipo: 'checkin',
      titulo: 'Check-in pendente',
      descricao: 'Registre seu dia para ganhar pontos',
      link: '/shape-score',
      urgente: true,
    })
  }

  if (protocoloRes.recordset[0].total === 0) {
    itens.push({
      tipo: 'treino',
      titulo: 'Sem protocolo de treino',
      descricao: 'Nenhum treino atribuído ainda',
      link: '/treinos',
      urgente: false,
    })
  }

  const dieta = dietaRes.recordset[0]
  if (dieta?.status_plano === 'rascunho') {
    itens.push({
      tipo: 'dieta',
      titulo: 'Plano de dieta em elaboração',
      descricao: 'Seu nutricionista está preparando seu plano',
      link: '/dieta',
      urgente: false,
    })
  }

  return { total: itens.length, itens }
}

async function buscarParaAdmin() {
  const pool = await getPool()

  const result = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM dbo.dieta_solicitacao WHERE status = 'pendente') AS solicitacoes,

      (SELECT COUNT(*) FROM dbo.usuario u
       JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
       JOIN dbo.perfil p          ON p.id_perfil  = up.id_perfil  AND p.nome = 'aluno'
       WHERE u.ativo = 1
         AND NOT EXISTS (
           SELECT 1 FROM dbo.treino_protocolo tp
           WHERE tp.id_usuario = u.id_usuario AND tp.ativo = 1 AND tp.is_template = 0
         )
      ) AS sem_treino,

      (SELECT COUNT(*) FROM dbo.avaliacao_fitness WHERE status = 'em_andamento' AND ativo = 1) AS avaliacoes_pendentes,
      (SELECT COUNT(*) FROM dbo.dieta_plano WHERE ativo = 1 AND status_plano = 'rascunho') AS dietas_rascunho
  `)

  const d = result.recordset[0]
  const itens = []

  if (d.solicitacoes > 0) itens.push({
    tipo: 'solicitacao',
    titulo: `${d.solicitacoes} solicitaç${d.solicitacoes > 1 ? 'ões' : 'ão'} de dieta`,
    descricao: 'Aguardando atribuição de nutricionista',
    link: '/admin/alunos',
    urgente: true,
  })

  if (d.sem_treino > 0) itens.push({
    tipo: 'treino',
    titulo: `${d.sem_treino} aluno${d.sem_treino > 1 ? 's' : ''} sem treino`,
    descricao: 'Nenhum protocolo atribuído',
    link: '/admin/alunos',
    urgente: d.sem_treino > 5,
  })

  if (d.avaliacoes_pendentes > 0) itens.push({
    tipo: 'avaliacao',
    titulo: `${d.avaliacoes_pendentes} avaliação${d.avaliacoes_pendentes > 1 ? 'ões' : ''} pendente${d.avaliacoes_pendentes > 1 ? 's' : ''}`,
    descricao: 'Em andamento, aguardando conclusão',
    link: '/admin/alunos',
    urgente: false,
  })

  if (d.dietas_rascunho > 0) itens.push({
    tipo: 'dieta',
    titulo: `${d.dietas_rascunho} dieta${d.dietas_rascunho > 1 ? 's' : ''} em rascunho`,
    descricao: 'Aguardando liberação pelo nutricionista',
    link: '/admin/alunos',
    urgente: false,
  })

  return { total: itens.length, itens }
}

module.exports = { buscarParaAluno, buscarParaAdmin }
