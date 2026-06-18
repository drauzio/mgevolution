import api from './api'

export const buscarNotificacoes = () => api.get('/notificacoes').then(r => r.data)
