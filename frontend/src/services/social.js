import api from './api'

export const listarFeed       = (pagina = 1)   => api.get('/social/feed', { params: { pagina } }).then(r => r.data)
export const reagir           = (id)           => api.post(`/social/feed/${id}/reagir`).then(r => r.data)
export const listarConquistas = ()             => api.get('/social/conquistas').then(r => r.data)
export const listarDesafios   = ()             => api.get('/social/desafios').then(r => r.data)
export const entrarDesafio    = (id)           => api.post(`/social/desafios/${id}/entrar`).then(r => r.data)
export const ranking          = ()             => api.get('/social/ranking').then(r => r.data)

// Admin
export const adminListarDesafios  = ()      => api.get('/admin/desafios').then(r => r.data)
export const adminCriarDesafio    = (dados) => api.post('/admin/desafios', dados).then(r => r.data)
export const adminToggleDesafio   = (id)    => api.patch(`/admin/desafios/${id}/toggle-ativo`).then(r => r.data)
