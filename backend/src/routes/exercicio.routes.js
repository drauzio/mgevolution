const router = require('express').Router()
const ctrl = require('../controllers/exercicio.controller')

router.get('/',                    ctrl.listar)
router.post('/',                   ctrl.criar)
router.get('/:id',                 ctrl.buscar)
router.put('/:id',                 ctrl.atualizar)
router.patch('/:id/toggle-ativo',  ctrl.toggleAtivo)
router.post('/:id/video',          ctrl.uploadVideo)
router.get('/:id/video-url',       ctrl.videoUrl)
router.delete('/:id/video',        ctrl.removerVideo)

module.exports = router
