import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Sparkles, RefreshCw, Activity, AlertTriangle, Target, Zap, Home } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { buscarShapeFuture, gerarShapeFuture } from '../../services/evolucao'

function fmt(n, casas = 1) {
  if (n == null) return '—'
  return typeof n === 'number' ? n.toFixed(casas) : n
}

function sinal(n) {
  if (n == null || n === 0) return ''
  return n > 0 ? `+${fmt(n)}` : fmt(n)
}

function corTaxa(n) {
  if (n == null) return '#B0A89E'
  return n < 0 ? '#16A34A' : n > 0 ? '#CC1A1A' : '#B0A89E'
}

function alturaFigura(gordura_pct) {
  if (gordura_pct == null) return 90
  return Math.max(56, Math.min(132, 56 + (30 - gordura_pct) * 4))
}

function formatarAnalise(texto) {
  if (!texto) return null
  return texto.split('\n').map((linha, i) => {
    const partes = linha.split(/\*\*(.*?)\*\*/g)
    return (
      <span key={i} style={{ display: 'block', marginBottom: linha.trim() === '' ? 8 : 0 }}>
        {partes.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
      </span>
    )
  })
}

function CardProjecao({ label, dados, atual, destaque }) {
  const delta_bf   = dados?.gordura_pct != null && atual?.gordura_pct != null ? dados.gordura_pct - atual.gordura_pct : null
  const delta_peso = dados?.peso        != null && atual?.peso        != null ? dados.peso        - atual.peso        : null
  const delta_mm   = dados?.massa_magra != null && atual?.massa_magra != null ? dados.massa_magra - atual.massa_magra : null

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14, background: destaque ? 'rgba(204,26,26,0.05)' : 'transparent' }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: destaque ? '#CC1A1A' : '#B0A89E' }}>{label}</p>

      {dados?.gordura_pct != null && (
        <div>
          <p style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', lineHeight: 1, marginBottom: 3 }}>{fmt(dados.gordura_pct)}%</p>
          <p style={{ fontSize: 9, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: delta_bf != null ? 4 : 0 }}>gordura</p>
          {delta_bf != null && label !== 'Hoje' && (
            <span style={{ fontSize: 11, fontWeight: 700, color: delta_bf < 0 ? '#16A34A' : '#CC1A1A' }}>{sinal(delta_bf)}%</span>
          )}
        </div>
      )}

      {dados?.peso != null && (
        <div>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A', lineHeight: 1, marginBottom: 3 }}>{fmt(dados.peso)} kg</p>
          <p style={{ fontSize: 9, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: delta_peso != null ? 4 : 0 }}>peso</p>
          {delta_peso != null && label !== 'Hoje' && (
            <span style={{ fontSize: 11, fontWeight: 700, color: delta_peso < 0 ? '#16A34A' : '#CC1A1A' }}>{sinal(delta_peso)} kg</span>
          )}
        </div>
      )}

      {dados?.massa_magra != null && (
        <div>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A', lineHeight: 1, marginBottom: 3 }}>{fmt(dados.massa_magra)} kg</p>
          <p style={{ fontSize: 9, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: delta_mm != null ? 4 : 0 }}>massa magra</p>
          {delta_mm != null && label !== 'Hoje' && (
            <span style={{ fontSize: 11, fontWeight: 700, color: delta_mm > 0 ? '#16A34A' : '#CC1A1A' }}>{sinal(delta_mm)} kg</span>
          )}
        </div>
      )}
    </div>
  )
}

export default function ShapeFuture() {
  const { token }  = useAuthContext()
  const navigate   = useNavigate()
  const [gerando, setGerando] = useState(false)

  const { data, isLoading } = useSWR(
    token ? 'shape-future' : null,
    buscarShapeFuture
  )

  async function gerarAnalise() {
    setGerando(true)
    try {
      const resultado = await gerarShapeFuture()
      mutate('shape-future', resultado, false)
    } finally {
      setGerando(false)
    }
  }

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>Shape Future IA</h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>Projeção baseada no seu histórico real de medidas</p>
        </div>
        <button onClick={() => navigate('/dashboard')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, paddingInline: 14, borderRadius: 10, border: '1px solid #E0D6CA', background: '#FFFFFF', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6B6560', flexShrink: 0 }}>
          <Home size={14} />Home
        </button>
      </div>

      {/* Sem dados suficientes */}
      {(!data || data.semDados) && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 28, boxShadow: '0 2px 16px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: '#F7F3EE', border: '1px solid #E0D6CA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={24} color="#B0A89E" />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>Dados insuficientes</p>
            <p style={{ fontSize: 13, color: '#8A7F76', lineHeight: 1.6 }}>
              São necessárias pelo menos 2 medições cadastradas para gerar a projeção.
              {data?.total_medicoes === 1 && ' Você tem 1 medição — adicione outra na tela de Evolução.'}
              {(!data || data.total_medicoes === 0) && ' Cadastre suas medidas na tela de Evolução.'}
            </p>
          </div>
        </div>
      )}

      {data && !data.semDados && (
        <>
          {/* Info base */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(204,26,26,0.08)', border: '1px solid rgba(204,26,26,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={16} color="#CC1A1A" />
            </div>
            <p style={{ fontSize: 13, color: '#6B6560', lineHeight: 1.5 }}>
              Projeção calculada com base em{' '}
              <span style={{ color: '#1A1A1A', fontWeight: 700 }}>{data.total_medicoes} medições</span>
              {' '}ao longo de{' '}
              <span style={{ color: '#1A1A1A', fontWeight: 700 }}>{data.dias_historico} dias</span>
            </p>
          </div>

          {/* Cards projeção */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
              {[
                { label: 'Hoje',     dados: data.atual,        destaque: false },
                { label: '90 dias',  dados: data.projecao_90,  destaque: false },
                { label: '180 dias', dados: data.projecao_180, destaque: true  },
              ].map((col, i) => (
                <div key={col.label} style={{ borderLeft: i > 0 ? '1px solid #E0D6CA' : 'none' }}>
                  <CardProjecao {...col} atual={data.atual} />
                </div>
              ))}
            </div>
          </div>

          {/* Projeção visual */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '20px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 20 }}>Tendência visual</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { label: 'Hoje',     bf: data.atual?.gordura_pct,        destaque: false },
                { label: '90 dias',  bf: data.projecao_90?.gordura_pct,  destaque: false },
                { label: '180 dias', bf: data.projecao_180?.gordura_pct, destaque: true  },
              ].map((col) => (
                <div key={col.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: '100%', aspectRatio: '3/5', background: '#F7F3EE', border: '1px solid #E0D6CA', borderRadius: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 14px' }}>
                    <div style={{
                      width: 34,
                      height: alturaFigura(col.bf),
                      borderRadius: 99,
                      background: col.destaque
                        ? 'linear-gradient(to top, #CC1A1A, rgba(204,26,26,0.2))'
                        : 'linear-gradient(to top, #C4B9A8, rgba(196,185,168,0.2))',
                      transition: 'height 0.3s',
                    }} />
                  </div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: col.destaque ? '#CC1A1A' : '#B0A89E' }}>{col.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Taxas mensais */}
          {(data.taxas.peso_mes != null || data.taxas.gordura_mes != null || data.taxas.massa_magra_mes != null) && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 18, padding: '18px 22px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Ritmo mensal atual</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.taxas.gordura_mes != null && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: 13, color: '#6B6560' }}>Gordura corporal</p>
                    <span style={{ fontSize: 13, fontWeight: 700, color: corTaxa(data.taxas.gordura_mes) }}>{sinal(data.taxas.gordura_mes)} pp/mês</span>
                  </div>
                )}
                {data.taxas.peso_mes != null && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: 13, color: '#6B6560' }}>Peso total</p>
                    <span style={{ fontSize: 13, fontWeight: 700, color: corTaxa(data.taxas.peso_mes) }}>{sinal(data.taxas.peso_mes)} kg/mês</span>
                  </div>
                )}
                {data.taxas.massa_magra_mes != null && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: 13, color: '#6B6560' }}>Massa magra</p>
                    <span style={{ fontSize: 13, fontWeight: 700, color: corTaxa(-data.taxas.massa_magra_mes) }}>{sinal(data.taxas.massa_magra_mes)} kg/mês</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Análise IA */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #F0EBE4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(204,26,26,0.08)', border: '1px solid rgba(204,26,26,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={14} color="#CC1A1A" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>Análise IA</p>
              </div>
              {data.analise_ia && (
                <button
                  onClick={gerarAnalise}
                  disabled={gerando}
                  title="Atualizar análise"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, paddingInline: 12, borderRadius: 8, border: '1px solid #E0D6CA', background: '#FFFFFF', color: '#8A7F76', fontSize: 12, fontWeight: 600, cursor: gerando ? 'not-allowed' : 'pointer', opacity: gerando ? 0.6 : 1 }}
                >
                  <RefreshCw size={11} style={{ animation: gerando ? 'spin 1s linear infinite' : 'none' }} />
                  Atualizar
                </button>
              )}
            </div>

            <div style={{ padding: '20px 22px' }}>
              {!data.analise_ia && !gerando && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingBlock: 12 }}>
                  <div style={{ display: 'flex', gap: 14 }}>
                    {[Target, Zap, AlertTriangle].map((Icon, i) => (
                      <div key={i} style={{ width: 40, height: 40, borderRadius: 12, background: '#F7F3EE', border: '1px solid #E0D6CA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} color="#C4B9A8" />
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>Análise não gerada ainda</p>
                    <p style={{ fontSize: 13, color: '#8A7F76', marginBottom: 16, lineHeight: 1.5 }}>A IA vai interpretar sua trajetória e apontar marcos, riscos e quando você atingirá seus objetivos.</p>
                    <button
                      onClick={gerarAnalise}
                      style={{ height: 42, paddingInline: 24, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', color: '#FFFFFF', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 10px rgba(180,26,26,0.25)' }}
                    >
                      <Sparkles size={15} />
                      Gerar análise IA
                    </button>
                  </div>
                </div>
              )}

              {gerando && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBlock: 16 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: '#8A7F76' }}>Analisando sua trajetória...</p>
                </div>
              )}

              {data.analise_ia && !gerando && (
                <div style={{ fontSize: 14, lineHeight: 1.7, color: '#3A3A3A' }}>
                  {formatarAnalise(data.analise_ia)}
                </div>
              )}
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 10, color: '#C4B9A8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Projeção matemática linear · Powered by IA MG Evolution
          </p>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
