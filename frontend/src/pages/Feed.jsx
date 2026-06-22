import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Heart, Trophy, Target, Activity } from 'lucide-react'
import { useAuthContext } from '../context/AuthContext'
import * as svc from '../services/social'

const TIPO_CONFIG = {
  treino:    { icone: <Activity size={14} />, cor: '#1d4ed8', bg: '#EFF6FF' },
  conquista: { icone: <Trophy   size={14} />, cor: '#B45309', bg: '#FFFBEB' },
  desafio:   { icone: <Target   size={14} />, cor: '#7C3AED', bg: '#F5F3FF' },
  medida:    { icone: <Activity size={14} />, cor: '#15803d', bg: '#F0FDF4' },
}


function Avatar({ nome, fotoUrl }) {
  const inicial = (nome || '?')[0].toUpperCase()
  if (fotoUrl) return (
    <img src={fotoUrl} alt={nome} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #F0EBE4' }} />
  )
  return (
    <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#F0EBE4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15, fontWeight: 800, color: '#8A7F76' }}>
      {inicial}
    </div>
  )
}

function CardFeed({ item, onReagir }) {
  const [loading, setLoading] = useState(false)
  const cfg = TIPO_CONFIG[item.tipo] || { icone: null, cor: '#6B6560', bg: '#F9F6F2' }

  async function curtir() {
    if (loading) return
    setLoading(true)
    try { await onReagir(item.id_feed_item) } finally { setLoading(false) }
  }

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #F0EBE4', padding: '14px 16px', display: 'flex', gap: 12 }}>
      <Avatar nome={item.nome_usuario} fotoUrl={item.foto_url} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1A1A1A' }}>{item.nome_usuario}</span>
          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: cfg.bg, color: cfg.cor, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
            {cfg.icone}{item.tipo}
          </span>
        </div>
        <p style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.4, marginBottom: 2 }}>{item.titulo}</p>
        {item.subtitulo && <p style={{ fontSize: 11, color: '#8A7F76', marginBottom: 6 }}>{item.subtitulo}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 10, color: '#C4B9A8' }}>{item.data_criacao}</span>
          <button onClick={curtir} style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: item.eu_curti ? '#CC1A1A' : '#C4B9A8' }}>
            <Heart size={13} fill={item.eu_curti ? '#CC1A1A' : 'none'} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>{item.total_reacoes || ''}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Feed() {
  const { token } = useAuthContext()
  const [pagina, setPagina] = useState(1)

  const chave = token ? ['feed', pagina] : null
  const { data: itens = [], mutate: revalidar } = useSWR(chave, () => svc.listarFeed(pagina), { revalidateOnFocus: false })

  async function reagir(id) {
    await svc.reagir(id)
    revalidar()
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h1 style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', marginBottom: 4 }}>Feed</h1>

      {itens.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#8A7F76' }}>Nenhuma atividade ainda. Complete um treino para começar!</p>
        </div>
      ) : (
        itens.map(item => <CardFeed key={item.id_feed_item} item={item} onReagir={reagir} />)
      )}

      {(itens.length === 20 || pagina > 1) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
          <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} style={{ height: 34, paddingInline: 14, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: pagina === 1 ? 'not-allowed' : 'pointer', fontSize: 12, color: pagina === 1 ? '#C4B9A8' : '#6B6560' }}>Anterior</button>
          <button disabled={itens.length < 20} onClick={() => setPagina(p => p + 1)} style={{ height: 34, paddingInline: 14, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: itens.length < 20 ? 'not-allowed' : 'pointer', fontSize: 12, color: itens.length < 20 ? '#C4B9A8' : '#6B6560' }}>Próxima</button>
        </div>
      )}
    </div>
  )
}
