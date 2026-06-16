import api from './api'

export const listar = (params = {}) => api.get('/treinos', { params }).then(r => r.data)
export const buscarPorId = (id) => api.get(`/treinos/${id}`).then(r => r.data)
export const criar = (dados) => api.post('/treinos', dados).then(r => r.data)
export const atualizar = (id, dados) => api.put(`/treinos/${id}`, dados).then(r => r.data)
export const buscarExercicios   = (params = {}) => api.get('/treinos/exercicios', { params }).then(r => r.data)
export const buscarMeuProtocolo = () => api.get('/treinos/meu-protocolo').then(r => r.data)
