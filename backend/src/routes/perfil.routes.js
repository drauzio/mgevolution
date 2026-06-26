const router = require('express').Router()
const multer = require('multer')
const ctrl   = require('../controllers/perfil.controller')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true)
    else cb(new Error('Apenas imagens JPG, PNG ou WebP são aceitas'))
  },
})

router.get('/',          ctrl.buscar)
router.put('/',          ctrl.atualizar)
router.put('/senha',     ctrl.trocarSenha)
router.post('/foto',     upload.single('foto'), ctrl.uploadFoto)
router.delete('/',       ctrl.excluirConta)

module.exports = router
