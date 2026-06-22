const { getPool, sql } = require('../database/connection')

async function buscarParaAluno(id_usuario) {
  const pool = await getPool()

  const [checkinRes, protocoloRes, dietaRes] = await Promise.all([
    pool.request()
      .input('id', sql.Int, id_usuario)
      .query(`SELECT COUNT(*) AS total FROM dbo.shape_score WHERE id_usuario = @id AND data = CAST(GETDATE() AS DATE)`),

    pool.request()
      .input('id', sql.Int, id_usuario)
      .query(`SELECT COUNT(*) AS total FROM dbo.treino_protocolo WHERE id_usuario = @id AND ativo = 1`),

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

  const [sysRes, naoLidasRes] = await Promise.all([
    pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM dbo.dieta_solicitacao WHERE status = 'pendente') AS solicitacoes,
        (SELECT COUNT(*) FROM dbo.usuario u
         JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
         JOIN dbo.perfil p          ON p.id_perfil  = up.id_perfil  AND p.nome = 'aluno'
         WHERE u.ativo = 1
           AND NOT EXISTS (SELECT 1 FROM dbo.treino_protocolo tp WHERE tp.id_usuario = u.id_usuario AND tp.ativo = 1)
        ) AS sem_treino,
        (SELECT COUNT(*) FROM dbo.avaliacao_fitness WHERE status = 'em_andamento' AND ativo = 1) AS avaliacoes_pendentes,
        (SELECT COUNT(*) FROM dbo.dieta_plano WHERE ativo = 1 AND status_plano = 'rascunho') AS dietas_rascunho
    `),
    pool.request().query(`
      SELECT n.id_notificacao_aluno, n.titulo, n.descricao, n.urgente, u.nome AS nome_aluno
      FROM dbo.notificacao_aluno n
      JOIN dbo.usuario u ON u.id_usuario = n.id_usuario
      WHERE n.lida = 0
      ORDER BY n.data_criacao DESC
    `).catch(() => ({ recordset: [] })),
  ])

  const d = sysRes.recordset[0]
  const naoLidas = naoLidasRes.recordset
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

  // Notificações enviadas ainda não lidas pelos alunos
  for (const n of naoLidas) {
    itens.push({
      tipo: 'admin',
      id_notificacao_aluno: n.id_notificacao_aluno,
      titulo: n.titulo,
      descricao: `Enviada para ${n.nome_aluno} · não lida`,
      link: '/admin/notificacoes',
      urgente: n.urgente,
      lida: false,
    })
  }

  return { total: itens.length, itens }
}

async function enviarParaAluno({ id_admin, id_usuario, titulo, descricao, urgente }) {
  const pool = await getPool()
  await pool.request()
    .input('id_admin',   sql.Int,          id_admin)
    .input('id_usuario', sql.Int,          id_usuario)
    .input('titulo',     sql.NVarChar(200), titulo)
    .input('descricao',  sql.NVarChar(1000), descricao ?? null)
    .input('urgente',    sql.Bit,           urgente ? 1 : 0)
    .query(`
      INSERT INTO dbo.notificacao_aluno (id_admin, id_usuario, titulo, descricao, urgente)
      VALUES (@id_admin, @id_usuario, @titulo, @descricao, @urgente)
    `)
}

async function listarEnviadas(id_admin) {
  const pool = await getPool()
  const res = await pool.request()
    .input('id_admin', sql.Int, id_admin)
    .query(`
      SELECT n.id_notificacao_aluno, n.titulo, n.descricao, n.urgente, n.lida,
             n.data_criacao, u.nome AS nome_aluno
      FROM dbo.notificacao_aluno n
      JOIN dbo.usuario u ON u.id_usuario = n.id_usuario
      WHERE n.id_admin = @id_admin
      ORDER BY n.data_criacao DESC
    `)
  return res.recordset
}

async function listarTodas() {
  const pool = await getPool()
  const res = await pool.request().query(`
    SELECT n.id_notificacao_aluno, n.titulo, n.descricao, n.urgente, n.lida,
           n.data_criacao, u.nome AS nome_aluno, a.nome AS nome_admin
    FROM dbo.notificacao_aluno n
    JOIN dbo.usuario u ON u.id_usuario = n.id_usuario
    JOIN dbo.usuario a ON a.id_usuario = n.id_admin
    ORDER BY n.data_criacao DESC
  `)
  return res.recordset
}

async function deletarNotificacao(id) {
  const pool = await getPool()
  await pool.request()
    .input('id', sql.Int, id)
    .query(`DELETE FROM dbo.notificacao_aluno WHERE id_notificacao_aluno = @id`)
}

async function marcarLida(id_notificacao_aluno, id_usuario) {
  const pool = await getPool()
  await pool.request()
    .input('id',  sql.Int, id_notificacao_aluno)
    .input('uid', sql.Int, id_usuario)
    .query(`UPDATE dbo.notificacao_aluno SET lida=1 WHERE id_notificacao_aluno=@id AND id_usuario=@uid`)
}

async function buscarParaAlunoComAdmin(id_usuario) {
  const pool = await getPool()
  const res = await pool.request()
    .input('id', sql.Int, id_usuario)
    .query(`
      SELECT id_notificacao_aluno, titulo, descricao, urgente, lida, data_criacao
      FROM dbo.notificacao_aluno
      WHERE id_usuario = @id
      ORDER BY data_criacao DESC
    `)
  return res.recordset
}

async function listarAlunos() {
  const pool = await getPool()
  const res = await pool.request().query(`
    SELECT u.id_usuario, u.nome
    FROM dbo.usuario u
    JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
    JOIN dbo.perfil p          ON p.id_perfil   = up.id_perfil AND p.nome = 'aluno'
    WHERE u.ativo = 1
    ORDER BY u.nome
  `)
  return res.recordset
}

module.exports = {
  buscarParaAluno, buscarParaAdmin,
  enviarParaAluno, listarEnviadas, listarTodas, deletarNotificacao, marcarLida,
  buscarParaAlunoComAdmin, listarAlunos,
}
