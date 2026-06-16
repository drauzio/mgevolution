const router = require('express').Router()
const ctrl = require('../controllers/auth.controller')
const { authMiddleware, adminMiddleware } = require('../middleware/auth')

router.post('/login',    ctrl.login)
router.post('/registro', ctrl.registro)
router.post('/cadastrar', authMiddleware, adminMiddleware, ctrl.cadastrar)

module.exports = router
