import api from './api'

export const listar    = (params = {}) => api.get('/ia-diretrizes', { params }).then(r => r.data)
export const buscarPorId = (id)        => api.get(`/ia-diretrizes/${id}`).then(r => r.data)
export const criar     = (dados)       => api.post('/ia-diretrizes', dados).then(r => r.data)
export const atualizar = (id, dados)   => api.put(`/ia-diretrizes/${id}`, dados).then(r => r.data)
export const deletar   = (id)          => api.delete(`/ia-diretrizes/${id}`).then(r => r.data)
