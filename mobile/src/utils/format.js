export function formatarTelefone(v = '') {
  const n = v.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 2)  return n.length ? '(' + n : '';
  if (n.length <= 7)  return '(' + n.slice(0,2) + ') ' + n.slice(2);
  if (n.length <= 10) return '(' + n.slice(0,2) + ') ' + n.slice(2,6) + '-' + n.slice(6);
  return '(' + n.slice(0,2) + ') ' + n.slice(2,7) + '-' + n.slice(7);
}

// DD/MM/AAAA enquanto digita
export function formatarData(v = '') {
  const n = v.replace(/\D/g, '').slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return n.slice(0,2) + '/' + n.slice(2);
  return n.slice(0,2) + '/' + n.slice(2,4) + '/' + n.slice(4);
}

// DD/MM/AAAA → AAAA-MM-DD para enviar ao backend
export function dataParaISO(v = '') {
  const parts = v.split('/');
  if (parts.length === 3 && parts[2].length === 4)
    return parts[2] + '-' + parts[1] + '-' + parts[0];
  return v;
}

// AAAA-MM-DD → DD/MM/AAAA para exibir
export function dataParaDisplay(iso = '') {
  if (!iso) return '';
  const parts = iso.slice(0, 10).split('-');
  if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
  return iso;
}

export function formatarCPF(v = '') {
  const n = v.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 3) return n;
  if (n.length <= 6) return n.slice(0,3) + '.' + n.slice(3);
  if (n.length <= 9) return n.slice(0,3) + '.' + n.slice(3,6) + '.' + n.slice(6);
  return n.slice(0,3) + '.' + n.slice(3,6) + '.' + n.slice(6,9) + '-' + n.slice(9);
}
