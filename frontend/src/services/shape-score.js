import api from './api'

export const buscarResumo    = ()      => api.get('/shape-score/resumo').then(r => r.data)
export const registrarScore  = (dados) => api.post('/shape-score', dados).then(r => r.data)
