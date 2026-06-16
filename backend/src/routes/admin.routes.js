const { Router } = require('express')
const alunos       = require('../controllers/admin.alunos.controller')
const avaliacoes   = require('../controllers/admin.avaliacao.controller')
const questionario = require('../controllers/admin.questionario.controller')

const router = Router()

router.get('/questionario',      questionario.listar)
router.get('/questionario/:id',  questionario.buscar)
router.post('/questionario',     questionario.criar)
router.put('/questionario/:id',  questionario.atualizar)

router.get('/alunos',                    alunos.listar)
router.post('/alunos',                   alunos.criar)
router.get('/alunos/:id',                alunos.buscar)
router.put('/alunos/:id',                alunos.atualizar)
router.patch('/alunos/:id/toggle-ativo', alunos.toggleAtivo)

router.get('/avaliacoes',                  avaliacoes.listar)
router.get('/avaliacoes/:id',              avaliacoes.buscar)
router.post('/avaliacoes/:id/reatribuir',  avaliacoes.reatribuir)

module.exports = router
