export function validarCPF(valor) {
  const n = (valor || '').replace(/\D/g, '')
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false
  let s = 0
  for (let i = 0; i < 9; i++) s += Number(n[i]) * (10 - i)
  let d1 = (s * 10) % 11; if (d1 >= 10) d1 = 0
  if (d1 !== Number(n[9])) return false
  s = 0
  for (let i = 0; i < 10; i++) s += Number(n[i]) * (11 - i)
  let d2 = (s * 10) % 11; if (d2 >= 10) d2 = 0
  return d2 === Number(n[10])
}
