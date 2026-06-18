import api from './api'

const base = (id) => `/admin/evolucao-alunos/${id}`

export const listarAlunos        = ()              => api.get('/admin/evolucao-alunos').then(r => r.data)
export const buscarResumo        = (id)            => api.get(`${base(id)}/resumo`).then(r => r.data)
export const buscarSessoes       = (id)            => api.get(`${base(id)}/sessoes`).then(r => r.data)
export const buscarMedidas       = (id)            => api.get(`${base(id)}/medidas`).then(r => r.data)
export const buscarHistoricoCarga = (id, idEx)    => api.get(`${base(id)}/carga`, { params: { idExercicio: idEx } }).then(r => r.data)
export const buscarExercicios    = (id)            => api.get(`${base(id)}/exercicios`).then(r => r.data)
export const buscarFotos         = (id)            => api.get(`${base(id)}/fotos`).then(r => r.data)
export const buscarAnaliseIA     = (id)            => api.get(`${base(id)}/analise-ia`).then(r => r.data)
export const gerarAnaliseIA      = (id)            => api.post(`${base(id)}/analise-ia`).then(r => r.data)
