import api from './api'

export const listar      = (params = {}) => api.get('/admin/assinaturas', { params }).then(r => r.data)
export const buscarPorId = (id)          => api.get(`/admin/assinaturas/${id}`).then(r => r.data)
export const criar       = (dados)       => api.post('/admin/assinaturas', dados).then(r => r.data)
export const atualizar   = (id, dados)   => api.put(`/admin/assinaturas/${id}`, dados).then(r => r.data)
export const cancelar    = (id)          => api.patch(`/admin/assinaturas/${id}/cancelar`).then(r => r.data)
