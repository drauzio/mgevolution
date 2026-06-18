const router = require('express').Router()
const ctrl   = require('../controllers/menu-admin.controller')

router.get('/',             ctrl.listar)
router.post('/',            ctrl.criar)
router.patch('/ordem',      ctrl.reordenar)
router.put('/:id/perfis',   ctrl.atualizarPerfis)
router.put('/:id',          ctrl.atualizar)
router.delete('/:id',       ctrl.deletar)

module.exports = router
