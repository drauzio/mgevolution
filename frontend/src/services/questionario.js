import api from './api'

export const listar   = ()        => api.get('/admin/questionario').then(r => r.data)
export const buscar   = (id)      => api.get(`/admin/questionario/${id}`).then(r => r.data)
export const criar    = (data)    => api.post('/admin/questionario', data).then(r => r.data)
export const atualizar = (id, data) => api.put(`/admin/questionario/${id}`, data).then(r => r.data)
