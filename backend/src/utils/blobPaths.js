// Fonte única de verdade para todos os caminhos do Azure Blob Storage.
// Container definido em AZURE_BLOB_CONTAINER (= mgevolution).
// Use AZURE_BLOB_ROOT no .env apenas se quiser adicionar um prefixo dentro do container.

function prefix() {
  const r = (process.env.AZURE_BLOB_ROOT || '').trim().replace(/\/+$/, '')
  return r ? `${r}/` : ''
}

function ext(mimeType) {
  const map = {
    'image/png':       'png',
    'image/webp':      'webp',
    'image/jpeg':      'jpg',
    'image/jpg':       'jpg',
    'video/mp4':       'mp4',
    'video/quicktime': 'mov',
    'video/webm':      'webm',
    'video/avi':       'avi',
    'video/x-ms-wmv':  'wmv',
  }
  return map[mimeType] || 'bin'
}

module.exports = {

  // ─── Usuário ──────────────────────────────────────────────
  fotoUsuario({ id_usuario, mimeType }) {
    return `${prefix()}usuarios/${id_usuario}/foto.${ext(mimeType)}`
  },

  // ─── Exercício ────────────────────────────────────────────
  videoExercicio({ id_exercicio, mimeType }) {
    return `${prefix()}exercicios/${id_exercicio}/video.${ext(mimeType)}`
  },

  // ─── Evolução do aluno ────────────────────────────────────
  fotoEvolucao({ id_usuario, tipo, mimeType }) {
    return `${prefix()}alunos/${id_usuario}/evolucao/${tipo}_${Date.now()}.${ext(mimeType)}`
  },
}
