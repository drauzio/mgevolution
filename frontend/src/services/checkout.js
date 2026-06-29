import api from './api'

export const buscarStatus    = ()          => api.get('/checkout/status').then(r => r.data)
export const buscarPlanos    = ()          => api.get('/admin/planos').then(r => r.data)
export const criarPreferencia = (id_plano) => api.post('/checkout/preferencia', { id_plano }).then(r => r.data)
