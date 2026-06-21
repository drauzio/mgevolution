require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const { authMiddleware } = require('./middleware/auth')
const { iniciarCrons } = require('./jobs/whatsappCron')

const app = express()

app.use(cors())
app.use(express.json())

// Saúde
app.get('/api/health', (_, res) => res.json({ ok: true, ts: new Date() }))

// Rotas públicas
app.use('/api/auth',    require('./routes/auth.routes'))
app.use('/webhook',     require('./routes/webhook.routes'))

// Rotas protegidas
app.use('/api/menu',        authMiddleware, require('./routes/menu.routes'))
app.use('/api/avaliacao',   authMiddleware, require('./routes/avaliacao.routes'))
app.use('/api/admin',       authMiddleware, require('./routes/admin.routes'))
app.use('/api/treinos',     authMiddleware, require('./routes/treino.routes'))
app.use('/api/templates',   authMiddleware, require('./routes/template.routes'))
app.use('/api/exercicios',  authMiddleware, require('./routes/exercicio.routes'))
app.use('/api/shape-score', authMiddleware, require('./routes/shape-score.routes'))
app.use('/api/coach-ia',    authMiddleware, require('./routes/coach-ia.routes'))
app.use('/api/dieta',         authMiddleware, require('./routes/dieta.routes'))
app.use('/api/ia-diretrizes', authMiddleware, require('./routes/ia-diretriz.routes'))
app.use('/api/evolucao',    authMiddleware, require('./routes/evolucao.routes'))
app.use('/api/dashboard',      authMiddleware, require('./routes/dashboard.routes'))
app.use('/api/notificacoes',   authMiddleware, require('./routes/notificacoes.routes'))
app.use('/api/menu-admin',    authMiddleware, require('./routes/menu-admin.routes'))
app.use('/api/social',        authMiddleware, require('./routes/social.routes'))
app.use('/api/perfil',        authMiddleware, require('./routes/perfil.routes'))

// Error handler global
app.use((err, req, res, next) => {
  console.error(`[${req.method} ${req.path}]`, err.message || err)
  res.status(err.status || 500).json({ erro: err.mensagem || err.message || 'Erro interno' })
})

// Serve frontend em produção
const publicDir = path.join(__dirname, '..', 'public')
app.use(express.static(publicDir))
app.get('/{*splat}', (_, res) => res.sendFile(path.join(publicDir, 'index.html')))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server rodando na porta ${PORT}`)
  iniciarCrons()
})
