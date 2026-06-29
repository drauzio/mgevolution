const router = require('express').Router()
const ctrl   = require('../controllers/template.controller')
const { verificarPerfil } = require('../middleware/auth')

router.get('/',              ctrl.listar)
router.post('/',             verificarPerfil('personal', 'admin'), ctrl.criar)
router.post('/gerar-ia',     verificarPerfil('personal', 'admin'), ctrl.gerarComIA)
router.get('/:id',           ctrl.buscar)
router.put('/:id',           verificarPerfil('personal', 'admin'), ctrl.atualizar)
router.post('/:id/clonar',   verificarPerfil('personal', 'admin'), ctrl.clonar)

module.exports = router
