import useSWR from 'swr'
import { useAuthContext } from '../context/AuthContext'
import * as svc from '../services/social'

export default function Conquistas() {
  const { token } = useAuthContext()
  const { data: conquistas = [] } = useSWR(token ? 'conquistas' : null, svc.listarConquistas, { revalidateOnFocus: false })

  const desbloqueadas = conquistas.filter(c => c.desbloqueada)
  const bloqueadas    = conquistas.filter(c => !c.desbloqueada)

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', marginBottom: 4 }}>Conquistas</h1>
      <p style={{ fontSize: 12, color: '#8A7F76', marginBottom: 20 }}>{desbloqueadas.length} de {conquistas.length} desbloqueadas</p>

      {desbloqueadas.length > 0 && (
        <>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Desbloqueadas</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 24 }}>
            {desbloqueadas.map(c => (
              <div key={c.codigo} style={{ background: '#FFFFFF', border: '1px solid #F0EBE4', borderRadius: 14, padding: '16px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 32 }}>{c.icone}</span>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>{c.nome}</p>
                <p style={{ fontSize: 11, color: '#8A7F76', lineHeight: 1.4 }}>{c.descricao}</p>
                {c.data_desbloqueio && <p style={{ fontSize: 10, color: '#C4B9A8' }}>{c.data_desbloqueio?.slice(0, 10)}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {bloqueadas.length > 0 && (
        <>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Em progresso</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {bloqueadas.map(c => (
              <div key={c.codigo} style={{ background: '#F9F6F2', border: '1px solid #F0EBE4', borderRadius: 14, padding: '16px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.6 }}>
                <span style={{ fontSize: 32, filter: 'grayscale(1)' }}>{c.icone}</span>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#6B6560' }}>{c.nome}</p>
                <p style={{ fontSize: 11, color: '#A09890', lineHeight: 1.4 }}>{c.descricao}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
