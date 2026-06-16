import api from './api'

export const listar      = (params = {}) => api.get('/admin/nutricionistas', { params }).then(r => r.data)
export const buscarPorId = (id)          => api.get(`/admin/nutricionistas/${id}`).then(r => r.data)
export const criar       = (dados)       => api.post('/admin/nutricionistas', dados).then(r => r.data)
export const atualizar   = (id, dados)   => api.put(`/admin/nutricionistas/${id}`, dados).then(r => r.data)
export const toggleAtivo = (id)          => api.patch(`/admin/nutricionistas/${id}/toggle-ativo`).then(r => r.data)
