import { useState } from 'react'
import useSWR from 'swr'
import { Salad, Flame, ChevronRight, ChevronDown } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { buscarMeuPlano } from '../../services/dieta'

export default function Dieta() {
  const { token } = useAuthContext()
  const [abertas, setAbertas] = useState({})

  const { data: plano, isLoading } = useSWR(
    token ? 'minha-dieta' : null,
    buscarMeuPlano
  )

  function toggleRefeicao(id) {
    setAbertas(a => ({ ...a, [id]: !a[id] }))
  }

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!plano) return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>Dieta</h1>
        <p style={{ fontSize: 14, color: '#8A7F76' }}>Plano alimentar do método MG</p>
      </div>
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <Salad size={36} color="#C4B9A8" />
        <p style={{ fontSize: 15, fontWeight: 600, color: '#8A7F76' }}>Nenhum plano ativo</p>
        <p style={{ fontSize: 13, color: '#C4B9A8', textAlign: 'center' }}>Seu personal ainda não criou seu plano alimentar.</p>
      </div>
    </div>
  )

  const totalCal  = (plano.refeicoes || []).flatMap(r => r.itens || []).reduce((a, it) => a + (it.calorias || 0), 0)
  const totalProt = (plano.refeicoes || []).flatMap(r => r.itens || []).reduce((a, it) => a + (it.proteina || 0), 0)
  const metaCal   = plano.calorias_meta  || totalCal  || 1
  const metaProt  = plano.proteina_meta  || totalProt || 1
  const pctCal    = Math.min(100, Math.round((totalCal  / metaCal)  * 100))
  const pctProt   = Math.min(100, Math.round((totalProt / metaProt) * 100))

  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Cabeçalho */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Dieta</h1>
        <p style={{ fontSize: 14, color: '#8A7F76' }}>{plano.nome}</p>
        {plano.objetivo && <p style={{ fontSize: 12, color: '#C4B9A8', marginTop: 2 }}>{plano.objetivo}</p>}
      </div>

      {/* Resumo macros */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(204,26,26,0.08)', border: '1px solid rgba(204,26,26,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={15} color="#CC1A1A" />
            </div>
            <p style={{ fontSize: 11, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Calorias</p>
          </div>
          <p style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', lineHeight: 1, marginBottom: 12 }}>
            {totalCal}
            <span style={{ fontSize: 13, color: '#B0A89E', fontWeight: 400 }}>/{plano.calorias_meta || totalCal} kcal</span>
          </p>
          <div style={{ height: 6, background: '#F0EBE4', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pctCal}%`, background: 'linear-gradient(90deg, #A81515, #CC1A1A)', borderRadius: 99 }} />
          </div>
          <p style={{ fontSize: 11, color: '#B0A89E', marginTop: 8 }}>{pctCal}% do objetivo</p>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Salad size={15} color="#16A34A" />
            </div>
            <p style={{ fontSize: 11, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Proteína</p>
          </div>
          <p style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', lineHeight: 1, marginBottom: 12 }}>
            {totalProt}g
            <span style={{ fontSize: 13, color: '#B0A89E', fontWeight: 400 }}>/{plano.proteina_meta || totalProt}g</span>
          </p>
          <div style={{ height: 6, background: '#F0EBE4', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pctProt}%`, background: 'linear-gradient(90deg, #15803D, #16A34A)', borderRadius: 99 }} />
          </div>
          <p style={{ fontSize: 11, color: '#B0A89E', marginTop: 8 }}>{pctProt}% da meta diária</p>
        </div>
      </div>

      {/* Lista de refeições */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        {(plano.refeicoes || []).map((r, i) => {
          const calRef  = (r.itens || []).reduce((a, it) => a + (it.calorias || 0), 0)
          const protRef = (r.itens || []).reduce((a, it) => a + (it.proteina || 0), 0)
          const aberta  = !!abertas[r.id_refeicao]

          return (
            <div key={r.id_refeicao} style={{ borderTop: i > 0 ? '1px solid #F0EBE4' : 'none' }}>
              <div
                onClick={() => r.itens?.length && toggleRefeicao(r.id_refeicao)}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', cursor: r.itens?.length ? 'pointer' : 'default', transition: 'background 0.15s' }}
                onMouseEnter={e => { if (r.itens?.length) e.currentTarget.style.background = '#FDFAF7' }}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: calRef > 0 ? '#CC1A1A' : '#E0D6CA', boxShadow: calRef > 0 ? '0 0 6px rgba(204,26,26,0.4)' : 'none' }} />

                {r.horario && (
                  <div style={{ width: 44, flexShrink: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#8A7F76' }}>{r.horario}</p>
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 3 }}>{r.nome}</p>
                  {(calRef > 0 || protRef > 0) && (
                    <p style={{ fontSize: 12, color: '#B0A89E' }}>
                      {calRef > 0 && `${calRef} kcal`}
                      {calRef > 0 && protRef > 0 && ' · '}
                      {protRef > 0 && `${protRef}g prot`}
                    </p>
                  )}
                </div>

                {r.itens?.length > 0
                  ? aberta ? <ChevronDown size={15} color="#C4B9A8" /> : <ChevronRight size={15} color="#C4B9A8" />
                  : null
                }
              </div>

              {aberta && r.itens?.length > 0 && (
                <div style={{ background: '#FDFAF7', padding: '0 24px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {r.itens.map(it => (
                    <div key={it.id_item} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#FFFFFF', borderRadius: 10, border: '1px solid #F0EBE4' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{it.descricao}</p>
                        {it.quantidade && <p style={{ fontSize: 11, color: '#8A7F76', marginTop: 2 }}>{it.quantidade} {it.unidade}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                        {it.calorias > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#CC1A1A' }}>{it.calorias} kcal</span>}
                        {it.proteina > 0 && <span style={{ fontSize: 12, color: '#8A7F76' }}>{it.proteina}g</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {plano.observacoes && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 16, padding: '16px 20px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Observações</p>
          <p style={{ fontSize: 13, color: '#6B6560', lineHeight: 1.6 }}>{plano.observacoes}</p>
        </div>
      )}

    </div>
  )
}
