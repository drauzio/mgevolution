const router = require('express').Router()
const ctrl   = require('../controllers/notificacoes.controller')

router.get('/',              ctrl.listar)
router.get('/admin/enviadas', ctrl.listarEnviadas)
router.get('/admin/alunos',   ctrl.listarAlunos)
router.post('/admin/enviar',  ctrl.enviar)
router.delete('/:id',        ctrl.deletar)
router.put('/:id/lida',      ctrl.marcarLida)

module.exports = router
