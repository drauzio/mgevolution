import { useState } from 'react'
import useSWR from 'swr'
import { Target, Users, Clock } from 'lucide-react'
import { useAuthContext } from '../context/AuthContext'
import * as svc from '../services/social'

export default function Desafios() {
  const { token } = useAuthContext()
  const { data: desafios = [], mutate } = useSWR(token ? 'desafios' : null, svc.listarDesafios, { revalidateOnFocus: false })

  async function entrar(id) {
    await svc.entrarDesafio(id)
    mutate()
  }

  const ativos   = desafios.filter(d => d.participando)
  const abertos  = desafios.filter(d => !d.participando)

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A' }}>Desafios</h1>

      {ativos.length > 0 && (
        <section>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Participando</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ativos.map(d => <CardDesafio key={d.id_desafio} d={d} onEntrar={entrar} />)}
          </div>
        </section>
      )}

      {abertos.length > 0 && (
        <section>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Disponíveis</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {abertos.map(d => <CardDesafio key={d.id_desafio} d={d} onEntrar={entrar} />)}
          </div>
        </section>
      )}

      {desafios.length === 0 && (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#8A7F76' }}>Nenhum desafio ativo no momento.</p>
        </div>
      )}
    </div>
  )
}

function CardDesafio({ d, onEntrar }) {
  const [loading, setLoading] = useState(false)
  const pct = d.valor_meta > 0 ? Math.min(100, Math.round((d.progresso / d.valor_meta) * 100)) : 0

  async function handleEntrar() {
    setLoading(true)
    try { await onEntrar(d.id_desafio) } finally { setLoading(false) }
  }

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #F0EBE4', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>{d.icone || '🏆'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>{d.titulo}</p>
          {d.descricao && <p style={{ fontSize: 12, color: '#8A7F76', marginBottom: 8, lineHeight: 1.4 }}>{d.descricao}</p>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#8A7F76' }}>
              <Users size={11} /> {d.total_participantes} participante{d.total_participantes !== 1 ? 's' : ''}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: d.dias_restantes <= 3 ? '#CC1A1A' : '#8A7F76' }}>
              <Clock size={11} /> {d.dias_restantes > 0 ? `${d.dias_restantes} dias restantes` : 'Encerra hoje'}
            </span>
            <span style={{ fontSize: 11, color: '#8A7F76' }}>Meta: {d.valor_meta} {d.tipo_meta}</span>
          </div>

          {d.participando && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: '#6B6560' }}>Progresso</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: d.concluido ? '#15803d' : '#1A1A1A' }}>
                  {d.concluido ? '✓ Concluído!' : `${d.progresso} / ${d.valor_meta}`}
                </span>
              </div>
              <div style={{ height: 6, background: '#F0EBE4', borderRadius: 99 }}>
                <div style={{ height: 6, background: d.concluido ? '#15803d' : '#CC1A1A', borderRadius: 99, width: `${pct}%`, transition: 'width 0.4s' }} />
              </div>
            </div>
          )}

          {!d.participando && (
            <button
              onClick={handleEntrar}
              disabled={loading}
              style={{ height: 34, paddingInline: 16, background: '#CC1A1A', border: 'none', borderRadius: 8, color: '#FFFFFF', fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Entrando...' : 'Participar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
