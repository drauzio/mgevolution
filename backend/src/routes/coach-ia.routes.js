const router = require('express').Router()
const ctrl = require('../controllers/coach-ia.controller')

router.get('/iniciar',   ctrl.iniciar)
router.post('/chat',     ctrl.chat)
router.delete('/sessao', ctrl.limpar)

module.exports = router
