import api from './api'

export const listar       = ()        => api.get('/admin/planos').then(r => r.data)
export const buscarPorId  = (id)      => api.get(`/admin/planos/${id}`).then(r => r.data)
export const criar        = (dados)   => api.post('/admin/planos', dados).then(r => r.data)
export const atualizar    = (id, d)   => api.put(`/admin/planos/${id}`, d).then(r => r.data)
export const toggleAtivo  = (id)      => api.patch(`/admin/planos/${id}/toggle-ativo`).then(r => r.data)
