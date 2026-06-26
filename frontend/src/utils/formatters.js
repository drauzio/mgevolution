export function fone(valor) {
  if (!valor) return '—'
  const n = valor.replace(/\D/g, '')
  if (n.length === 11) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`
  if (n.length === 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`
  return valor
}

export function mascaraFone(valor) {
  const n = (valor || '').replace(/\D/g, '').slice(0, 11)
  if (n.length <= 2)  return n.length ? `(${n}` : ''
  if (n.length <= 6)  return `(${n.slice(0,2)}) ${n.slice(2)}`
  if (n.length <= 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`
  return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`
}

export function cpf(valor) {
  if (!valor) return '—'
  const n = valor.replace(/\D/g, '')
  if (n.length !== 11) return valor
  return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6,9)}-${n.slice(9)}`
}

export function mascaraCPF(valor) {
  const n = (valor || '').replace(/\D/g, '').slice(0, 11)
  if (n.length <= 3) return n
  if (n.length <= 6) return `${n.slice(0,3)}.${n.slice(3)}`
  if (n.length <= 9) return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6)}`
  return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6,9)}-${n.slice(9)}`
}


export function cep(valor) {
  if (!valor) return '—'
  const n = valor.replace(/\D/g, '')
  if (n.length !== 8) return valor
  return `${n.slice(0,5)}-${n.slice(5)}`
}

export function data(valor) {
  if (!valor) return '—'
  const d = new Date(valor)
  if (isNaN(d)) return valor
  return d.toLocaleDateString('pt-BR')
}

export function dataHora(valor) {
  if (!valor) return '—'
  const d = new Date(valor)
  if (isNaN(d)) return valor
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function moeda(valor) {
  if (valor == null || valor === '') return '—'
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function inicial(nome) {
  if (!nome) return '?'
  return nome.trim()[0].toUpperCase()
}
