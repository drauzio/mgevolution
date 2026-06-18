const svc = require('../services/pagamento.service')

async function resumo(req, res, next) {
  try { res.json(await svc.resumo()) } catch (e) { next(e) }
}

async function pendentes(req, res, next) {
  try { res.json(await svc.listarPendentes()) } catch (e) { next(e) }
}

async function historico(req, res, next) {
  try { res.json(await svc.historico(req.query)) } catch (e) { next(e) }
}

async function pagar(req, res, next) {
  try {
    await svc.registrarPagamento(Number(req.params.id), { ...req.body, registrado_por: req.usuario.id })
    res.json({ ok: true })
  } catch (e) { next(e) }
}

async function cancelar(req, res, next) {
  try { await svc.cancelar(Number(req.params.id)); res.json({ ok: true }) } catch (e) { next(e) }
}

async function gerarCobranca(req, res, next) {
  try { await svc.gerarCobranca(Number(req.params.id)); res.json({ ok: true }) } catch (e) { next(e) }
}

module.exports = { resumo, pendentes, historico, pagar, cancelar, gerarCobranca }
