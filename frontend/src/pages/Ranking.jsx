import useSWR from 'swr'
import { Medal } from 'lucide-react'
import { useAuthContext } from '../context/AuthContext'
import * as svc from '../services/social'

const MEDALHA = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function Ranking() {
  const { token } = useAuthContext()
  const { data: lista = [] } = useSWR(token ? 'ranking' : null, svc.ranking, { revalidateOnFocus: false })

  const mesAtual = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', marginBottom: 2 }}>Ranking</h1>
      <p style={{ fontSize: 12, color: '#8A7F76', marginBottom: 20, textTransform: 'capitalize' }}>{mesAtual} · treinos concluídos</p>

      {lista.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#8A7F76' }}>Nenhum treino registrado este mês ainda.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lista.map((u, i) => (
            <div
              key={u.id_usuario}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 16px', borderRadius: 14,
                background: u.sou_eu ? '#FFF5F5' : '#FFFFFF',
                border: u.sou_eu ? '1.5px solid #CC1A1A30' : '1px solid #F0EBE4',
              }}
            >
              <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                {MEDALHA[u.posicao]
                  ? <span style={{ fontSize: 20 }}>{MEDALHA[u.posicao]}</span>
                  : <span style={{ fontSize: 13, fontWeight: 800, color: '#A09890' }}>#{u.posicao}</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: u.sou_eu ? 800 : 600, color: u.sou_eu ? '#CC1A1A' : '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.nome}{u.sou_eu ? ' (você)' : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: u.sou_eu ? '#CC1A1A' : '#1A1A1A' }}>{u.treinos_mes}</p>
                <p style={{ fontSize: 10, color: '#A09890' }}>treinos</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
