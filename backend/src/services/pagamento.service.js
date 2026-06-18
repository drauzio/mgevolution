const { getPool, sql } = require('../database/connection')

async function resumo() {
  const pool = await getPool()
  const r = await pool.request().query(`
    SELECT
      SUM(CASE WHEN status = 'pago'     AND MONTH(data_pagamento) = MONTH(GETDATE()) AND YEAR(data_pagamento) = YEAR(GETDATE()) THEN valor ELSE 0 END) AS recebido_mes,
      SUM(CASE WHEN status = 'pendente' AND data_vencimento >= CAST(GETDATE() AS DATE) THEN valor ELSE 0 END) AS pendente,
      SUM(CASE WHEN status = 'pendente' AND data_vencimento <  CAST(GETDATE() AS DATE) THEN valor ELSE 0 END) AS vencido,
      COUNT(CASE WHEN status = 'pendente' AND data_vencimento >= CAST(GETDATE() AS DATE) THEN 1 END) AS qtd_pendente,
      COUNT(CASE WHEN status = 'pendente' AND data_vencimento <  CAST(GETDATE() AS DATE) THEN 1 END) AS qtd_vencido
    FROM dbo.pagamento
  `)
  return r.recordset[0]
}

async function listarPendentes() {
  const pool = await getPool()
  const r = await pool.request().query(`
    SELECT p.id_pagamento, p.valor, p.data_vencimento, p.observacao,
           u.id_usuario, u.nome AS nome_aluno, u.telefone,
           pl.nome AS nome_plano,
           a.id_assinatura, a.data_inicio, a.data_fim,
           DATEDIFF(DAY, CAST(GETDATE() AS DATE), p.data_vencimento) AS dias_para_vencer
    FROM dbo.pagamento p
    JOIN dbo.usuario   u  ON u.id_usuario   = p.id_usuario
    JOIN dbo.assinatura a ON a.id_assinatura = p.id_assinatura
    JOIN dbo.plano     pl ON pl.id_plano     = a.id_plano
    WHERE p.status = 'pendente'
    ORDER BY p.data_vencimento ASC
  `)
  return r.recordset
}

async function historico({ busca, mes, ano, status } = {}) {
  const pool = await getPool()
  const req  = pool.request()

  let where = '1=1'
  if (busca)  { req.input('busca', sql.VarChar(100), `%${busca}%`); where += ' AND u.nome LIKE @busca' }
  if (status) { req.input('status', sql.VarChar(20), status);       where += ' AND p.status = @status' }
  if (mes)    { req.input('mes',  sql.Int, Number(mes));  where += ' AND MONTH(ISNULL(p.data_pagamento, p.data_vencimento)) = @mes' }
  if (ano)    { req.input('ano',  sql.Int, Number(ano));  where += ' AND YEAR(ISNULL(p.data_pagamento, p.data_vencimento)) = @ano' }

  const r = await req.query(`
    SELECT p.id_pagamento, p.valor, p.forma_pagamento, p.status,
           p.data_vencimento, p.data_pagamento, p.observacao,
           u.id_usuario, u.nome AS nome_aluno,
           pl.nome AS nome_plano
    FROM dbo.pagamento p
    JOIN dbo.usuario   u  ON u.id_usuario   = p.id_usuario
    JOIN dbo.assinatura a ON a.id_assinatura = p.id_assinatura
    JOIN dbo.plano     pl ON pl.id_plano     = a.id_plano
    WHERE ${where}
    ORDER BY ISNULL(p.data_pagamento, p.data_vencimento) DESC
  `)
  return r.recordset
}

async function registrarPagamento(id_pagamento, { forma_pagamento, data_pagamento, observacao, registrado_por }) {
  const pool = await getPool()
  await pool.request()
    .input('id',              sql.Int,          id_pagamento)
    .input('forma',           sql.VarChar(30),  forma_pagamento)
    .input('data_pagamento',  sql.Date,         data_pagamento || new Date())
    .input('obs',             sql.VarChar(500), observacao || null)
    .input('registrado_por',  sql.Int,          registrado_por || null)
    .query(`
      UPDATE dbo.pagamento
      SET status = 'pago', forma_pagamento = @forma, data_pagamento = @data_pagamento,
          observacao = @obs, registrado_por = @registrado_por
      WHERE id_pagamento = @id AND status = 'pendente'
    `)
}

async function cancelar(id_pagamento) {
  const pool = await getPool()
  await pool.request()
    .input('id', sql.Int, id_pagamento)
    .query(`UPDATE dbo.pagamento SET status = 'cancelado' WHERE id_pagamento = @id`)
}

async function gerarCobranca(id_assinatura) {
  const pool = await getPool()

  const r = await pool.request()
    .input('id', sql.Int, id_assinatura)
    .query(`
      SELECT a.id_assinatura, a.id_usuario, a.data_fim, pl.preco
      FROM dbo.assinatura a
      JOIN dbo.plano pl ON pl.id_plano = a.id_plano
      WHERE a.id_assinatura = @id
    `)

  const ass = r.recordset[0]
  if (!ass) throw Object.assign(new Error('Assinatura não encontrada'), { status: 404 })

  await pool.request()
    .input('id_assinatura',   sql.Int,           ass.id_assinatura)
    .input('id_usuario',      sql.Int,           ass.id_usuario)
    .input('valor',           sql.Decimal(10,2), ass.preco)
    .input('data_vencimento', sql.Date,          ass.data_fim)
    .query(`
      INSERT INTO dbo.pagamento (id_assinatura, id_usuario, valor, data_vencimento)
      VALUES (@id_assinatura, @id_usuario, @valor, @data_vencimento)
    `)
}

module.exports = { resumo, listarPendentes, historico, registrarPagamento, cancelar, gerarCobranca }
