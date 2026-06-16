import api from './api'

export const listar       = (params = {}) => api.get('/dieta', { params }).then(r => r.data)
export const buscarPorId  = (id)          => api.get(`/dieta/${id}`).then(r => r.data)
export const criar        = (dados)       => api.post('/dieta', dados).then(r => r.data)
export const atualizar    = (id, dados)   => api.put(`/dieta/${id}`, dados).then(r => r.data)
export const buscarMeuPlano = ()          => api.get('/dieta/meu-plano').then(r => r.data)
