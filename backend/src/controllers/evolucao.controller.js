const multer = require('multer')
const svc = require('../services/evolucao.service')

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowed.includes(file.mimetype)) return cb(null, true)
    cb(Object.assign(new Error('Formato inválido. Use JPG, PNG ou WebP.'), { statusCode: 400 }))
  },
}).single('foto')

async function resumo(req, res, next) {
  try { res.json(await svc.resumo(req.usuario.id)) }
  catch (err) { next(err) }
}

async function sessoes(req, res, next) {
  try { res.json(await svc.sessoes(req.usuario.id)) }
  catch (err) { next(err) }
}

async function listarMedidas(req, res, next) {
  try { res.json(await svc.listarMedidas(req.usuario.id)) }
  catch (err) { next(err) }
}

async function adicionarMedida(req, res, next) {
  try {
    const medida = await svc.adicionarMedida(req.usuario.id, req.body)
    res.status(201).json(medida)
  } catch (err) { next(err) }
}

async function historicoExercicio(req, res, next) {
  try {
    const { idExercicio } = req.query
    if (!idExercicio) return res.status(400).json({ erro: 'idExercicio obrigatório' })
    res.json(await svc.historicoExercicio(req.usuario.id, Number(idExercicio)))
  } catch (err) { next(err) }
}

async function exercicios(req, res, next) {
  try { res.json(await svc.exerciciosDoProtocolo(req.usuario.id)) }
  catch (err) { next(err) }
}

async function buscarAnalise(req, res, next) {
  try { res.json(await svc.buscarAnaliseCache(req.usuario.id) || {}) }
  catch (err) { next(err) }
}

async function analiseIA(req, res, next) {
  try {
    res.json({ analise: await svc.analiseIA(req.usuario.id) })
  } catch (err) {
    if (err.code === 'SEM_DADOS') {
      return res.status(422).json({ erro: err.message, code: err.code, faltando: err.faltando })
    }
    next(err)
  }
}

async function listarFotos(req, res, next) {
  try { res.json(await svc.listarFotos(req.usuario.id)) }
  catch (err) { next(err) }
}

function uploadFoto(req, res) {
  uploadMiddleware(req, res, async (err) => {
    if (err) return res.status(err.statusCode || 400).json({ erro: err.message })
    if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado.' })
    try {
      const foto = await svc.uploadFoto(req.usuario.id, {
        buffer:   req.file.buffer,
        mimetype: req.file.mimetype,
        tipo:     req.body.tipo || 'progresso',
        data:     req.body.data || null,
      })
      res.status(201).json(foto)
    } catch (e) { next(e) }
  })
}

async function deletarFoto(req, res, next) {
  try {
    await svc.deletarFoto(Number(req.params.id), req.usuario.id)
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function shapeFutureGet(req, res, next) {
  try { res.json(await svc.shapeFuture(req.usuario.id, { gerarAnalise: false })) }
  catch (err) { next(err) }
}

async function shapeFuturePost(req, res, next) {
  try { res.json(await svc.shapeFuture(req.usuario.id, { gerarAnalise: true })) }
  catch (err) { next(err) }
}

module.exports = { resumo, sessoes, listarMedidas, adicionarMedida, historicoExercicio, exercicios, buscarAnalise, analiseIA, listarFotos, uploadFoto, deletarFoto, shapeFutureGet, shapeFuturePost }
