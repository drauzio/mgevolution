const router = require('express').Router()
const ctrl = require('../controllers/auth.controller')
const { authMiddleware, adminMiddleware } = require('../middleware/auth')

router.post('/login',              ctrl.login)
router.post('/registro',           ctrl.registro)
router.post('/cadastrar',          authMiddleware, adminMiddleware, ctrl.cadastrar)
router.post('/esqueci-senha',      ctrl.esqueciSenha)
router.post('/redefinir-senha',    ctrl.redefinirSenha)
router.post('/otp/enviar',         ctrl.otpEnviar)
router.post('/otp/verificar',      ctrl.otpVerificar)

module.exports = router
