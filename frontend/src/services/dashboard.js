import api from './api'

export const buscarResumoDashboard = () => api.get('/dashboard/resumo').then(r => r.data)
