import api from './api'

export const listar = (params = {}) => api.get('/treinos', { params }).then(r => r.data)
export const buscarPorId = (id) => api.get(`/treinos/${id}`).then(r => r.data)
export const criar = (dados) => api.post('/treinos', dados).then(r => r.data)
export const atualizar = (id, dados) => api.put(`/treinos/${id}`, dados).then(r => r.data)
export const buscarExercicios   = (params = {}) => api.get('/treinos/exercicios', { params }).then(r => r.data)
export const buscarMeuProtocolo = () => api.get('/treinos/meu-protocolo').then(r => r.data)

export const buscarSessao      = (idTreinoDia, idProtocolo) => api.get('/treinos/sessao', { params: { idTreinoDia, idProtocolo } }).then(r => r.data)
export const iniciarSessao     = (idSessao) => api.patch(`/treinos/sessao/${idSessao}/iniciar`).then(r => r.data)
export const marcarExercicio   = (idSessao, idExercicio, feito, carga_usada) => api.patch(`/treinos/sessao/${idSessao}/exercicio/${idExercicio}`, { feito, carga_usada }).then(r => r.data)
export const concluirSessao    = (idSessao) => api.patch(`/treinos/sessao/${idSessao}/concluir`).then(r => r.data)
export const cancelarSessao    = (idSessao) => api.delete(`/treinos/sessao/${idSessao}`).then(r => r.data)
export const buscarHistorico   = () => api.get('/treinos/sessao/historico').then(r => r.data)
