import api from './api'

export const listar         = (params = {}) => api.get('/admin/usuarios', { params }).then(r => r.data)
export const buscarPorId    = (id)           => api.get(`/admin/usuarios/${id}`).then(r => r.data)
export const criar          = (dados)        => api.post('/admin/usuarios', dados).then(r => r.data)
export const atualizar      = (id, dados)    => api.put(`/admin/usuarios/${id}`, dados).then(r => r.data)
export const toggleAtivo    = (id)           => api.patch(`/admin/usuarios/${id}/toggle-ativo`).then(r => r.data)
export const verificarEmail = (email, id)    => api.get('/admin/usuarios/verificar-email', { params: { email, id } }).then(r => r.data)
