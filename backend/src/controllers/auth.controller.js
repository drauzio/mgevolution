const authService = require('../services/auth.service')

async function registro(req, res) {
  try {
    const { nome, email, senha, telefone } = req.body
    if (!nome || !email || !senha) return res.status(400).json({ erro: 'Preencha todos os campos' })
    const id = await authService.registro({ nome, email, senha, telefone })
    res.status(201).json({ id_usuario: id })
  } catch (e) {
    console.error('[registro]', e)
    if (e.number === 2627) return res.status(409).json({ erro: 'E-mail já cadastrado' })
    res.status(500).json({ erro: 'Erro ao criar conta', detalhe: e.message })
  }
}

async function login(req, res) {
  try {
    const { email, senha } = req.body
    if (!email || !senha) return res.status(400).json({ erro: 'E-mail e senha obrigatórios' })
    const data = await authService.login(email, senha)
    res.json(data)
  } catch (e) {
    res.status(e.status || 500).json({ erro: e.mensagem || 'Erro interno' })
  }
}

async function cadastrar(req, res) {
  try {
    const id = await authService.criarUsuario(req.body)
    res.status(201).json({ id_usuario: id })
  } catch (e) {
    if (e.number === 2627) return res.status(409).json({ erro: 'E-mail já cadastrado' })
    res.status(e.status || 500).json({ erro: e.mensagem || 'Erro interno' })
  }
}

module.exports = { login, registro, cadastrar }
