const { Router } = require('express')
const alunos       = require('../controllers/admin.alunos.controller')
const avaliacoes   = require('../controllers/admin.avaliacao.controller')
const questionario = require('../controllers/admin.questionario.controller')
const personais        = require('../controllers/admin.personais.controller')
const nutricionistas   = require('../controllers/admin.nutricionistas.controller')
const dashboard        = require('../controllers/admin.dashboard.controller')

const router = Router()

router.get('/dashboard', dashboard.resumo)

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

router.get('/personais',                    personais.listar)
router.post('/personais',                   personais.criar)
router.get('/personais/:id',                personais.buscar)
router.put('/personais/:id',                personais.atualizar)
router.patch('/personais/:id/toggle-ativo', personais.toggleAtivo)

router.get('/nutricionistas',                    nutricionistas.listar)
router.post('/nutricionistas',                   nutricionistas.criar)
router.get('/nutricionistas/:id',                nutricionistas.buscar)
router.put('/nutricionistas/:id',                nutricionistas.atualizar)
router.patch('/nutricionistas/:id/toggle-ativo', nutricionistas.toggleAtivo)

module.exports = router
