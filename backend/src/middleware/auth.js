const jwt = require('jsonwebtoken')

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não informado' })
  }
  try {
    req.usuario = jwt.verify(header.slice(7), process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado' })
  }
}

function adminMiddleware(req, res, next) {
  if (!req.usuario?.administrador) {
    return res.status(403).json({ erro: 'Acesso restrito a administradores' })
  }
  next()
}

function verificarPerfil(...perfis) {
  return (req, res, next) => {
    const raw = req.usuario?.perfis
    const perfisUsuario = Array.isArray(raw)
      ? raw
      : typeof raw === 'string'
        ? raw.split(',')
        : [req.usuario?.perfil].filter(Boolean)
    const temAcesso = perfis.some(p => perfisUsuario.includes(p))
    if (!temAcesso) return res.status(403).json({ erro: 'Acesso não autorizado para este perfil' })
    next()
  }
}

module.exports = { authMiddleware, adminMiddleware, verificarPerfil }
