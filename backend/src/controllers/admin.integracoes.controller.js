const wa     = require('../integrations/whatsapp')
const svc    = require('../services/whatsapp.service')
const config = require('../services/configuracao.service')

async function status(req, res, next) {
  try {
    const configurado = wa.isConfigurado()
    const cfg = await config.getCategoria('notificacoes')
    res.json({
      configurado,
      phone_number_id:   configurado ? process.env.WHATSAPP_PHONE_NUMBER_ID : null,
      dias_inativo:      cfg.dias_inativo   || 7,
      dias_vencimento:   cfg.dias_vencimento || 7,
      telefone_academia: process.env.TELEFONE_ACADEMIA || '',
    })
  } catch (err) { next(err) }
}

async function listarLogs(req, res, next) {
  try {
    const { pagina = 1, tipo, status: st } = req.query
    res.json(await svc.listarLogs({ pagina: Number(pagina), tipo, status: st }))
  } catch (err) { next(err) }
}

async function enviarTeste(req, res, next) {
  try {
    const { telefone, nomeAluno = 'Aluno Teste' } = req.body
    if (!telefone) return res.status(400).json({ erro: 'telefone obrigatório' })
    if (!wa.isConfigurado()) return res.status(422).json({ erro: 'WhatsApp não configurado. Defina WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID no .env' })

    const r = await wa.enviarBoasVindas({ phone: telefone, nomeAluno })
    res.json({ ok: r.ok, messageId: r.messageId, motivo: r.motivo, telefone: r.telefone })
  } catch (err) { next(err) }
}

async function executarCronManual(req, res, next) {
  try {
    const { tipo } = req.params
    if (tipo === 'assinatura-vencendo') {
      await svc.cronAssinaturaVencendo()
      return res.json({ ok: true, mensagem: 'Cron assinatura vencendo executado' })
    }
    if (tipo === 'aluno-inativo') {
      await svc.cronAlunoInativo()
      return res.json({ ok: true, mensagem: 'Cron aluno inativo executado' })
    }
    res.status(400).json({ erro: 'Tipo inválido. Use: assinatura-vencendo ou aluno-inativo' })
  } catch (err) { next(err) }
}

module.exports = { status, listarLogs, enviarTeste, executarCronManual }
