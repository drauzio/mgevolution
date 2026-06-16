import api from './api'

export const listar      = (params = {}) => api.get('/admin/personais', { params }).then(r => r.data)
export const buscarPorId = (id)          => api.get(`/admin/personais/${id}`).then(r => r.data)
export const criar       = (dados)       => api.post('/admin/personais', dados).then(r => r.data)
export const atualizar   = (id, dados)   => api.put(`/admin/personais/${id}`, dados).then(r => r.data)
export const toggleAtivo = (id)          => api.patch(`/admin/personais/${id}/toggle-ativo`).then(r => r.data)
