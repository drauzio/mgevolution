const router = require('express').Router()
const ctrl = require('../controllers/exercicio.controller')
const { verificarPerfil } = require('../middleware/auth')

router.get('/',                    ctrl.listar)
router.post('/',                   verificarPerfil('personal', 'admin'), ctrl.criar)
router.get('/:id',                 ctrl.buscar)
router.put('/:id',                 verificarPerfil('personal', 'admin'), ctrl.atualizar)
router.patch('/:id/toggle-ativo',  verificarPerfil('personal', 'admin'), ctrl.toggleAtivo)
router.post('/:id/video',          verificarPerfil('personal', 'admin'), ctrl.uploadVideo)
router.get('/:id/video-url',       ctrl.videoUrl)
router.delete('/:id/video',        verificarPerfil('personal', 'admin'), ctrl.removerVideo)

module.exports = router
