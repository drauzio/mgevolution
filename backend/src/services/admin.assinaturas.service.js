const { getPool, sql } = require('../database/connection')

async function listar({ busca, status, id_plano } = {}) {
  const pool = await getPool()
  const req  = pool.request()

  let where = 'WHERE 1=1'
  if (status && status !== 'todos') {
    req.input('status', sql.VarChar(20), status)
    where += ' AND a.status = @status'
  }
  if (id_plano) {
    req.input('id_plano', sql.Int, Number(id_plano))
    where += ' AND a.id_plano = @id_plano'
  }
  if (busca) {
    req.input('busca', sql.VarChar(100), `%${busca}%`)
    where += ' AND (u.nome LIKE @busca OR u.email LIKE @busca)'
  }

  const result = await req.query(`
    SELECT
      a.id_assinatura,
      a.id_usuario,
      a.id_plano,
      a.data_inicio,
      a.data_fim,
      a.status,
      a.valor_pago,
      a.observacao,
      a.data_criacao,
      u.nome   AS aluno_nome,
      u.email  AS aluno_email,
      p.nome   AS plano_nome,
      p.preco  AS plano_preco,
      p.duracao_dias,
      DATEDIFF(day, CAST(GETDATE() AS DATE), a.data_fim) AS dias_restantes
    FROM dbo.assinatura a
    INNER JOIN dbo.usuario u ON u.id_usuario = a.id_usuario
    INNER JOIN dbo.plano   p ON p.id_plano   = a.id_plano
    ${where}
    ORDER BY a.status ASC, a.data_fim DESC
  `)
  return result.recordset
}

async function buscarPorId(id) {
  const pool = await getPool()
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        a.id_assinatura, a.id_usuario, a.id_plano, a.data_inicio, a.data_fim,
        a.status, a.valor_pago, a.observacao, a.data_criacao, a.data_atualizacao,
        u.nome AS aluno_nome, u.email AS aluno_email, u.telefone AS aluno_telefone,
        p.nome AS plano_nome, p.preco AS plano_preco, p.duracao_dias,
        DATEDIFF(day, CAST(GETDATE() AS DATE), a.data_fim) AS dias_restantes,
        CAST(CASE WHEN EXISTS (
          SELECT 1 FROM dbo.pagamento pg
          WHERE pg.id_assinatura = a.id_assinatura AND pg.gateway_id IS NOT NULL AND pg.status = 'pago'
        ) THEN 1 ELSE 0 END AS BIT) AS pago_via_gateway
      FROM dbo.assinatura a
      INNER JOIN dbo.usuario u ON u.id_usuario = a.id_usuario
      INNER JOIN dbo.plano   p ON p.id_plano   = a.id_plano
      WHERE a.id_assinatura = @id
    `)
  return result.recordset[0] || null
}

async function criar({ id_usuario, id_plano, data_inicio, data_fim, status, valor_pago, observacao }) {
  const pool = await getPool()
  const result = await pool.request()
    .input('id_usuario',  sql.Int, Number(id_usuario))
    .input('id_plano',    sql.Int, Number(id_plano))
    .input('data_inicio', sql.Date, new Date(data_inicio))
    .input('data_fim',    sql.Date, new Date(data_fim))
    .input('status',      sql.VarChar(20), status || 'ativa')
    .input('valor_pago',  sql.Decimal(10,2), valor_pago != null ? Number(valor_pago) : null)
    .input('observacao',  sql.VarChar(500), observacao || null)
    .query(`
      INSERT INTO dbo.assinatura (id_usuario, id_plano, data_inicio, data_fim, status, valor_pago, observacao)
      OUTPUT INSERTED.id_assinatura
      VALUES (@id_usuario, @id_plano, @data_inicio, @data_fim, @status, @valor_pago, @observacao)
    `)
  return { id_assinatura: result.recordset[0].id_assinatura }
}

async function atualizar(id, { data_inicio, data_fim, status, valor_pago, observacao }) {
  const pool = await getPool()

  // Assinatura com pagamento real confirmado por gateway (Pix/cartão) não pode
  // ter o valor pago alterado pelo admin — só protege quem criou/editou manualmente.
  const gatewayRes = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT 1 FROM dbo.pagamento
      WHERE id_assinatura = @id AND gateway_id IS NOT NULL AND status = 'pago'
    `)
  const pagoViaGateway = gatewayRes.recordset.length > 0

  const req = pool.request()
    .input('id',          sql.Int, id)
    .input('data_inicio', sql.Date, new Date(data_inicio))
    .input('data_fim',    sql.Date, new Date(data_fim))
    .input('status',      sql.VarChar(20), status)
    .input('observacao',  sql.VarChar(500), observacao || null)

  if (pagoViaGateway) {
    await req.query(`
      UPDATE dbo.assinatura
      SET data_inicio = @data_inicio, data_fim = @data_fim, status = @status,
          observacao = @observacao, data_atualizacao = SYSUTCDATETIME()
      WHERE id_assinatura = @id
    `)
  } else {
    req.input('valor_pago', sql.Decimal(10,2), valor_pago != null ? Number(valor_pago) : null)
    await req.query(`
      UPDATE dbo.assinatura
      SET data_inicio = @data_inicio, data_fim = @data_fim, status = @status,
          valor_pago = @valor_pago, observacao = @observacao,
          data_atualizacao = SYSUTCDATETIME()
      WHERE id_assinatura = @id
    `)
  }
}

async function cancelar(id) {
  const pool = await getPool()
  await pool.request()
    .input('id', sql.Int, id)
    .query(`
      UPDATE dbo.assinatura
      SET status = 'cancelada', data_atualizacao = SYSUTCDATETIME()
      WHERE id_assinatura = @id
    `)
}

module.exports = { listar, buscarPorId, criar, atualizar, cancelar }
