const svc       = require('../services/admin.assinaturas.service')
const waSvc     = require('../services/whatsapp.service')
const auditoria = require('../services/auditoria.service')

function audit(req, dados) { auditoria.registrar({ id_usuario: req.usuario.id, nome_usuario: req.usuario.nome, ip: req.ip, ...dados }).catch(() => {}) }

async function listar(req, res, next) {
  try { res.json(await svc.listar(req.query)) } catch (e) { next(e) }
}

async function buscar(req, res, next) {
  try {
    const a = await svc.buscarPorId(Number(req.params.id))
    if (!a) return res.status(404).json({ erro: 'Assinatura não encontrada' })
    res.json(a)
  } catch (e) { next(e) }
}

async function criar(req, res, next) {
  try {
    const { id_usuario, id_plano, data_inicio, data_fim } = req.body
    if (!id_usuario || !id_plano || !data_inicio || !data_fim)
      return res.status(400).json({ erro: 'Aluno, plano e datas são obrigatórios' })
    const nova = await svc.criar(req.body)
    if (nova) {
      svc.buscarPorId(nova.id_assinatura).then(a => {
        if (a) {
          audit(req, {
            acao: 'criar', entidade: 'assinatura', id_entidade: nova.id_assinatura,
            descricao: `${a.aluno_nome} · plano ${a.plano_nome} · até ${a.data_fim?.slice(0,10)}`,
            dados_depois: a,
          })
          if (a.aluno_telefone) {
            waSvc.assinaturaNova({ id_usuario: a.id_usuario, nomeAluno: a.aluno_nome, telefone: a.aluno_telefone, nomePlano: a.plano_nome, dataFim: a.data_fim }).catch(() => {})
          }
        }
      }).catch(() => {})
    }
    res.status(201).json(nova)
  } catch (e) { next(e) }
}

async function atualizar(req, res, next) {
  try {
    const { data_inicio, data_fim, status } = req.body
    if (!data_inicio || !data_fim || !status)
      return res.status(400).json({ erro: 'Datas e status são obrigatórios' })
    const idAss    = Number(req.params.id)
    const anterior = await svc.buscarPorId(idAss)
    await svc.atualizar(idAss, req.body)
    const mudancas = []
    if (anterior?.data_inicio?.slice(0,10) !== data_inicio) mudancas.push(`início: ${anterior?.data_inicio?.slice(0,10)} → ${data_inicio}`)
    if (anterior?.data_fim?.slice(0,10)    !== data_fim)    mudancas.push(`fim: ${anterior?.data_fim?.slice(0,10)} → ${data_fim}`)
    if (anterior?.status                   !== status)      mudancas.push(`status: ${anterior?.status} → ${status}`)
    if (mudancas.length) {
      audit(req, {
        acao: 'atualizar', entidade: 'assinatura', id_entidade: idAss,
        descricao: mudancas.join(' · '),
        dados_antes:  anterior,
        dados_depois: { ...anterior, data_inicio, data_fim, status },
      })
    }
    res.json({ ok: true })
  } catch (e) { next(e) }
}

async function cancelar(req, res, next) {
  try {
    const idAss = Number(req.params.id)
    const a     = await svc.buscarPorId(idAss)
    await svc.cancelar(idAss)
    audit(req, {
      acao: 'cancelar', entidade: 'assinatura', id_entidade: idAss,
      descricao: `${a?.aluno_nome || idAss} · plano ${a?.plano_nome || ''}`,
      dados_antes:  a,
      dados_depois: { ...a, status: 'cancelada' },
    })
    res.json({ ok: true })
  } catch (e) { next(e) }
}

module.exports = { listar, buscar, criar, atualizar, cancelar }
