const multer = require('multer')
const svc = require('../services/exercicio.service')
const { uploadBuffer, gerarSasReadUrl, deleteBlob } = require('../utils/azureBlob')

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['video/mp4', 'video/quicktime', 'video/webm', 'video/avi', 'video/x-ms-wmv']
    if (allowed.includes(file.mimetype)) return cb(null, true)
    cb(Object.assign(new Error('Formato inválido. Use MP4, MOV, WebM ou AVI.'), { statusCode: 400 }))
  },
}).single('video')

async function listar(req, res, next) {
  try {
    const { busca, grupo, ativo } = req.query
    const dados = await svc.listar({
      busca,
      grupo,
      ativo: ativo === undefined ? undefined : ativo === 'true',
    })
    res.json(dados)
  } catch (err) { next(err) }
}

async function buscar(req, res, next) {
  try {
    const ex = await svc.buscarPorId(Number(req.params.id))
    if (!ex) return res.status(404).json({ erro: 'Exercício não encontrado' })
    res.json(ex)
  } catch (err) { next(err) }
}

async function criar(req, res, next) {
  try {
    const result = await svc.criar(req.body)
    res.status(201).json(result)
  } catch (err) { next(err) }
}

async function atualizar(req, res, next) {
  try {
    await svc.atualizar(Number(req.params.id), req.body)
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function toggleAtivo(req, res, next) {
  try {
    await svc.toggleAtivo(Number(req.params.id))
    res.json({ ok: true })
  } catch (err) { next(err) }
}

function uploadVideo(req, res) {
  uploadMiddleware(req, res, async (err) => {
    if (err) return res.status(err.statusCode || 400).json({ erro: err.message })
    if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado.' })

    try {
      const id = Number(req.params.id)
      const ex = await svc.buscarPorId(id)
      if (!ex) return res.status(404).json({ erro: 'Exercício não encontrado' })

      // remove vídeo anterior do blob se for um filekey (não uma URL externa)
      if (ex.video_url && !ex.video_url.startsWith('http')) {
        try { await deleteBlob(ex.video_url) } catch (_) {}
      }

      const ext = req.file.mimetype === 'video/quicktime' ? 'mov'
                : req.file.mimetype === 'video/webm'      ? 'webm'
                : req.file.mimetype === 'video/avi'       ? 'avi'
                : 'mp4'

      const blobName = `mgevolution/exercicios/${id}/video.${ext}`
      await uploadBuffer({ buffer: req.file.buffer, blobName, contentType: req.file.mimetype })
      await svc.salvarVideoFilekey(id, blobName)

      res.json({ ok: true, filekey: blobName })
    } catch (e) {
      console.error('UPLOAD VIDEO EXERCICIO ERRO:', e)
      res.status(500).json({ erro: 'Erro ao fazer upload do vídeo.' })
    }
  })
}

async function videoUrl(req, res, next) {
  try {
    const id = Number(req.params.id)
    const ex = await svc.buscarPorId(id)
    if (!ex) return res.status(404).json({ erro: 'Exercício não encontrado' })
    if (!ex.video_url) return res.json({ url: null })

    // se for URL externa (YouTube etc.), retorna direto
    if (ex.video_url.startsWith('http')) return res.json({ url: ex.video_url })

    const url = await gerarSasReadUrl(ex.video_url, { minutes: 120 })
    res.json({ url })
  } catch (err) { next(err) }
}

async function removerVideo(req, res, next) {
  try {
    const id = Number(req.params.id)
    const ex = await svc.buscarPorId(id)
    if (!ex) return res.status(404).json({ erro: 'Exercício não encontrado' })

    if (ex.video_url && !ex.video_url.startsWith('http')) {
      try { await deleteBlob(ex.video_url) } catch (_) {}
    }

    await svc.removerVideoFilekey(id)
    res.json({ ok: true })
  } catch (err) { next(err) }
}

module.exports = { listar, buscar, criar, atualizar, toggleAtivo, uploadVideo, videoUrl, removerVideo }
