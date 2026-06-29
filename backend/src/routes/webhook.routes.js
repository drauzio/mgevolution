const router  = require('express').Router()
const crypto  = require('crypto')

function validarAssinaturaMeta(req, res, next) {
  const segredo = process.env.WHATSAPP_APP_SECRET
  if (!segredo) return next()

  const assinatura = req.headers['x-hub-signature-256']
  if (!assinatura) return res.sendStatus(403)

  const esperado = 'sha256=' + crypto
    .createHmac('sha256', segredo)
    .update(req.rawBody || '')
    .digest('hex')

  try {
    if (!crypto.timingSafeEqual(Buffer.from(assinatura), Buffer.from(esperado)))
      return res.sendStatus(403)
  } catch {
    return res.sendStatus(403)
  }

  next()
}

// ── Verificação do webhook (Meta chama GET para confirmar) ────────────────────
router.get('/whatsapp', (req, res) => {
  const mode      = req.query['hub.mode']
  const token     = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[Webhook] WhatsApp verificado com sucesso')
    return res.status(200).send(challenge)
  }

  console.warn('[Webhook] Token de verificação inválido:', token)
  res.sendStatus(403)
})

// ── Recebimento de mensagens (Meta chama POST) ────────────────────────────────
router.post('/whatsapp', validarAssinaturaMeta, (req, res) => {
  // Responde 200 imediatamente — Meta exige resposta rápida
  res.sendStatus(200)

  try {
    const entry   = req.body?.entry?.[0]
    const changes = entry?.changes?.[0]?.value
    const msgs    = changes?.messages

    if (!msgs?.length) return

    for (const msg of msgs) {
      const de   = msg.from
      const tipo = msg.type
      const texto = msg.text?.body

      console.log(`[Webhook WA] De: ${de} | Tipo: ${tipo} | Texto: ${texto || '—'}`)
      // aqui pode processar respostas, confirmar leitura, etc.
    }
  } catch (e) {
    console.error('[Webhook WA] Erro ao processar:', e.message)
  }
})

// ── Webhook Mercado Pago ──────────────────────────────────────────────────────
router.post('/mercadopago', async (req, res) => {
  res.sendStatus(200) // MP exige resposta imediata

  try {
    const { type, data } = req.body
    if (type !== 'payment' || !data?.id) return

    const mpSvc = require('../services/mp.service')
    await mpSvc.processarWebhook(data.id)
  } catch (e) {
    console.error('[Webhook MP] Erro:', e.message)
  }
})

module.exports = router
