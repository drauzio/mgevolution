const { MercadoPagoConfig, Preference, Payment } = require('mercadopago')
const { getPool, sql } = require('../database/connection')

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 5000 }
})

async function criarPreferencia({ id_usuario, id_plano, nome_usuario, email_usuario }) {
  const pool = await getPool()

  const planoRes = await pool.request()
    .input('id', sql.Int, id_plano)
    .query('SELECT nome, preco, duracao_dias FROM dbo.plano WHERE id_plano = @id AND ativo = 1')

  if (!planoRes.recordset.length) throw new Error('Plano não encontrado')
  const plano = planoRes.recordset[0]

  const backUrl = process.env.MP_BACK_URL || process.env.FRONTEND_URL || 'https://seusite.com.br'

  const preference = new Preference(mp)
  const result = await preference.create({
    body: {
      items: [{
        id:          String(id_plano),
        title:       `MG Evolution — ${plano.nome}`,
        quantity:    1,
        currency_id: 'BRL',
        unit_price:  Number(plano.preco),
      }],
      payer: {
        name:  nome_usuario,
        email: email_usuario,
      },
      back_urls: {
        success: `${backUrl}/pagamento/sucesso?plano=${id_plano}&usuario=${id_usuario}`,
        failure: `${backUrl}/pagamento/falhou`,
        pending: `${backUrl}/pagamento/pendente`,
      },
      payment_methods: {
        excluded_payment_types: [],
        installments: 1,
      },
      auto_return:      'approved',
      notification_url: `${process.env.BACKEND_URL}/webhook/mercadopago`,
      metadata: { id_usuario, id_plano },
      statement_descriptor: 'MG EVOLUTION',
    }
  })

  return { init_point: result.init_point, preferencia_id: result.id }
}

async function processarWebhook(paymentId) {
  const pool = await getPool()

  const paymentClient = new Payment(mp)
  const pagamento = await paymentClient.get({ id: paymentId })

  if (pagamento.status !== 'approved') return { ignorado: true, status: pagamento.status }

  const id_usuario = pagamento.metadata?.id_usuario
  const id_plano   = pagamento.metadata?.id_plano

  if (!id_usuario || !id_plano) return { ignorado: true, motivo: 'metadata ausente' }

  // Evita duplicata
  const existe = await pool.request()
    .input('gateway_id', sql.VarChar, String(paymentId))
    .query('SELECT 1 FROM dbo.pagamento WHERE gateway_id = @gateway_id')
  if (existe.recordset.length) return { ignorado: true, motivo: 'já processado' }

  const planoRes = await pool.request()
    .input('id', sql.Int, id_plano)
    .query('SELECT preco, duracao_dias FROM dbo.plano WHERE id_plano = @id')
  if (!planoRes.recordset.length) return { ignorado: true, motivo: 'plano não encontrado' }

  const plano       = planoRes.recordset[0]
  const dataInicio  = new Date().toISOString().slice(0, 10)
  const dataFim     = new Date(Date.now() + plano.duracao_dias * 86400000).toISOString().slice(0, 10)

  const assinaturaRes = await pool.request()
    .input('id_usuario',  sql.Int,          id_usuario)
    .input('id_plano',    sql.Int,          id_plano)
    .input('data_inicio', sql.Date,         dataInicio)
    .input('data_fim',    sql.Date,         dataFim)
    .input('valor_pago',  sql.Decimal(10,2), plano.preco)
    .query(`
      INSERT INTO dbo.assinatura (id_usuario, id_plano, data_inicio, data_fim, status, valor_pago)
      OUTPUT INSERTED.id_assinatura
      VALUES (@id_usuario, @id_plano, @data_inicio, @data_fim, 'ativa', @valor_pago)
    `)

  const id_assinatura = assinaturaRes.recordset[0].id_assinatura

  await pool.request()
    .input('id_assinatura',  sql.Int,          id_assinatura)
    .input('id_usuario',     sql.Int,          id_usuario)
    .input('valor',          sql.Decimal(10,2), plano.preco)
    .input('data_vencimento',sql.Date,         dataFim)
    .input('gateway_id',     sql.VarChar,      String(paymentId))
    .input('gateway_status', sql.VarChar,      pagamento.status)
    .query(`
      INSERT INTO dbo.pagamento
        (id_assinatura, id_usuario, valor, forma_pagamento, status, data_vencimento, data_pagamento, gateway_id, gateway_status)
      VALUES
        (@id_assinatura, @id_usuario, @valor, 'pix', 'pago', @data_vencimento, CAST(GETDATE() AS DATE), @gateway_id, @gateway_status)
    `)

  return { ok: true, id_assinatura }
}

async function buscarStatusAluno(id_usuario) {
  const pool = await getPool()

  // Verifica assinatura ativa
  const assinaturaRes = await pool.request()
    .input('id', sql.Int, id_usuario)
    .query(`
      SELECT TOP 1 a.id_assinatura, a.data_fim, p.nome AS plano,
        DATEDIFF(day, CAST(GETDATE() AS DATE), a.data_fim) AS dias_restantes
      FROM dbo.assinatura a
      JOIN dbo.plano p ON p.id_plano = a.id_plano
      WHERE a.id_usuario = @id AND a.status = 'ativa'
        AND a.data_fim >= CAST(GETDATE() AS DATE)
      ORDER BY a.data_fim DESC
    `)

  if (assinaturaRes.recordset.length) {
    const a = assinaturaRes.recordset[0]
    return { status: 'ativa', dias_restantes: a.dias_restantes, plano: a.plano, data_fim: a.data_fim }
  }

  // Verifica carência
  const carenciaRes = await pool.request()
    .input('id', sql.Int, id_usuario)
    .query(`
      SELECT data_fim_carencia,
        DATEDIFF(day, CAST(GETDATE() AS DATE), data_fim_carencia) AS dias_restantes
      FROM dbo.usuario WHERE id_usuario = @id
    `)

  const row = carenciaRes.recordset[0]
  if (row?.data_fim_carencia) {
    const dias = row.dias_restantes
    if (dias >= 0) return { status: 'carencia', dias_restantes: dias }
  }

  return { status: 'expirado', dias_restantes: 0 }
}

async function criarPagamento({ id_usuario, id_plano, formData, email_usuario }) {
  const pool = await getPool()

  const planoRes = await pool.request()
    .input('id', sql.Int, id_plano)
    .query('SELECT nome, preco FROM dbo.plano WHERE id_plano = @id AND ativo = 1')
  if (!planoRes.recordset.length) throw new Error('Plano não encontrado')
  const plano = planoRes.recordset[0]

  const paymentClient = new Payment(mp)
  const result = await paymentClient.create({
    body: {
      transaction_amount: Number(plano.preco),
      description:        `MG Evolution — ${plano.nome}`,
      payment_method_id:  formData.payment_method_id,
      token:              formData.token              || undefined,
      installments:       formData.installments       || 1,
      issuer_id:          formData.issuer_id          || undefined,
      payer: {
        email:           formData.payer?.email || email_usuario,
        identification:  formData.payer?.identification,
        first_name:      formData.payer?.first_name,
        last_name:       formData.payer?.last_name,
      },
      metadata:             { id_usuario, id_plano },
      notification_url:     `${process.env.BACKEND_URL}/webhook/mercadopago`,
      statement_descriptor: 'MG EVOLUTION',
    }
  })

  if (result.status === 'approved') {
    await processarWebhook(result.id).catch(() => {})
  }

  return {
    status:          result.status,
    payment_id:      result.id,
    qr_code:         result.point_of_interaction?.transaction_data?.qr_code,
    qr_code_base64:  result.point_of_interaction?.transaction_data?.qr_code_base64,
    ticket_url:      result.point_of_interaction?.transaction_data?.ticket_url,
  }
}

module.exports = { criarPreferencia, processarWebhook, buscarStatusAluno, criarPagamento }
