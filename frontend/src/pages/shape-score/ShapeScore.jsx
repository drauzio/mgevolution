import { useState, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, Flame, Salad, Moon, Droplets, CheckCircle2, Home } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { buscarResumo, registrarScore } from '../../services/shape-score'

const DIAS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const CATEGORIAS = [
  { key: 'treino', tipo: 'toggle', icon: Dumbbell, label: 'Treino',  desc: 'Fez o treino hoje?',        pts: 25, max: null, step: null, sufixo: null, cor: { icon: '#2563EB', bg: 'rgba(37,99,235,0.08)',   border: 'rgba(37,99,235,0.2)' } },
  { key: 'cardio', tipo: 'toggle', icon: Flame,    label: 'Cardio',  desc: 'Fez cardio ou caminhada?',  pts: 20, max: null, step: null, sufixo: null, cor: { icon: '#CC1A1A', bg: 'rgba(204,26,26,0.08)',  border: 'rgba(204,26,26,0.2)' } },
  { key: 'dieta',  tipo: 'range',  icon: Salad,    label: 'Dieta',   desc: 'Aderência à dieta',          pts: 25, max: 100, step: 1,    sufixo: '%',  cor: { icon: '#16A34A', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.2)' } },
  { key: 'sono',   tipo: 'range',  icon: Moon,     label: 'Sono',    desc: 'Horas dormidas',             pts: 15, max: 12,  step: 0.5,  sufixo: 'h',  cor: { icon: '#7C3AED', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)' } },
  { key: 'agua',   tipo: 'range',  icon: Droplets, label: 'Água',    desc: 'Litros de água',             pts: 15, max: 6,   step: 0.5,  sufixo: 'L',  cor: { icon: '#0891B2', bg: 'rgba(8,145,178,0.08)',  border: 'rgba(8,145,178,0.2)' } },
]

const DEFAULTS = { treino: false, cardio: false, dieta: 80, sono: 7, agua: 3 }

function calcScore({ treino, cardio, dieta, sono, agua }) {
  return Math.round(
    (treino ? 25 : 0) +
    (cardio ? 20 : 0) +
    Math.min(dieta / 100, 1) * 25 +
    Math.min(sono / 8, 1)   * 15 +
    Math.min(agua / 3, 1)   * 15
  )
}

function corScore(s) {
  if (s >= 85) return '#16A34A'
  if (s >= 60) return '#CC8800'
  return '#CC1A1A'
}

function ultimos7dias(historico) {
  const hoje = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() - (6 - i))
    const iso = d.toISOString().slice(0, 10)
    const reg = historico.find(h => {
      const s = typeof h.data === 'string' ? h.data : h.data?.toISOString()
      return s?.slice(0, 10) === iso
    })
    return { dia: DIAS_PT[d.getDay()], iso, pontos: reg?.pontos ?? null }
  })
}

export default function ShapeScore() {
  const { token }  = useAuthContext()
  const navigate   = useNavigate()
  const [form, setForm]         = useState(DEFAULTS)
  const [salvando, setSalvando] = useState(false)
  const [scoreHoje, setScoreHoje] = useState(null)

  const { data, isLoading } = useSWR(token ? 'shape-score-resumo' : null, buscarResumo)

  // pré-preenche com o check-in de hoje se existir
  useEffect(() => {
    if (!data?.hoje) return
    const h = data.hoje
    setForm({
      treino: !!h.treino,
      cardio: !!h.cardio,
      dieta:  parseFloat(h.dieta) || 0,
      sono:   parseFloat(h.sono)  || 0,
      agua:   parseFloat(h.agua)  || 0,
    })
    setScoreHoje(h.pontos)
  }, [data?.hoje])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const preview = calcScore(form)

  async function enviar(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      const { pontos } = await registrarScore(form)
      setScoreHoje(pontos)
      mutate('shape-score-resumo')
    } finally {
      setSalvando(false)
    }
  }

  const semana = data ? ultimos7dias(data.historico || []) : []
  const jaRegistrouHoje = !!data?.hoje

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>Shape Score</h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>Check-in diário — pequenas ações geram grandes resultados</p>
        </div>
        <button onClick={() => navigate('/dashboard')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, paddingInline: 14, borderRadius: 10, border: '1px solid #E0D6CA', background: '#FFFFFF', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6B6560', flexShrink: 0 }}>
          <Home size={14} />Home
        </button>
      </div>

      {/* Confirmação de score salvo */}
      {scoreHoje !== null && (
        <div style={{ background: `${corScore(scoreHoje)}12`, border: `1px solid ${corScore(scoreHoje)}30`, borderRadius: 20, padding: '28px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <CheckCircle2 size={32} color={corScore(scoreHoje)} style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, color: '#8A7F76', marginBottom: 4 }}>Score de hoje</p>
            <p style={{ fontSize: 44, fontWeight: 900, color: '#1A1A1A', lineHeight: 1 }}>
              {scoreHoje}
              <span style={{ fontSize: 16, color: '#B0A89E', fontWeight: 400 }}>/100</span>
            </p>
          </div>
          {data?.media > 0 && (
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: '#B0A89E', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Média 7d</p>
              <p style={{ fontSize: 26, fontWeight: 900, color: '#8A7F76' }}>{Math.round(data.media)}</p>
            </div>
          )}
        </div>
      )}

      {/* Card formulário */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>

        {/* Preview score */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #E0D6CA', background: '#FDFAF7' }}>
          <div>
            <p style={{ fontSize: 11, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4, fontWeight: 600 }}>
              {jaRegistrouHoje ? 'Atualizar check-in' : 'Check-in de hoje'}
            </p>
            <p style={{ fontSize: 12, color: '#B0A89E' }}>{jaRegistrouHoje ? 'Registrado — você pode editar' : 'Preencha os campos abaixo'}</p>
          </div>
          <p style={{ fontSize: 44, fontWeight: 900, color: corScore(preview), lineHeight: 1 }}>
            {preview}
            <span style={{ fontSize: 15, color: '#C4B9A8', fontWeight: 400 }}>/100</span>
          </p>
        </div>

        {/* Itens */}
        <form onSubmit={enviar} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {CATEGORIAS.map(({ key, tipo, icon: Icon, label, desc, pts, max, step, sufixo, cor }, idx) => (
            <div
              key={key}
              style={{
                paddingTop: idx === 0 ? 0 : 18,
                paddingBottom: 18,
                borderBottom: idx < CATEGORIAS.length - 1 ? '1px solid #F0EBE4' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: cor.bg, border: `1px solid ${cor.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={cor.icon} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', lineHeight: 1, marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 12, color: '#8A7F76' }}>
                    {desc} · <span style={{ color: cor.icon, fontWeight: 600 }}>{pts} pts</span>
                  </p>
                </div>

                {tipo === 'range' && (
                  <span style={{ fontSize: 15, fontWeight: 800, color: cor.icon, minWidth: 44, textAlign: 'right' }}>
                    {form[key]}{sufixo}
                  </span>
                )}

                {tipo === 'toggle' && (
                  <div
                    onClick={() => set(key, !form[key])}
                    style={{ position: 'relative', width: 44, height: 24, borderRadius: 99, background: form[key] ? cor.icon : '#E0D6CA', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
                  >
                    <div style={{ position: 'absolute', top: 2, left: form[key] ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                  </div>
                )}
              </div>

              {tipo === 'range' && (
                <div style={{ paddingLeft: 56, marginTop: 10 }}>
                  <input
                    type="range"
                    min="0"
                    max={max}
                    step={step}
                    value={form[key]}
                    onChange={e => set(key, parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: cor.icon }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: '#C4B9A8' }}>0</span>
                    <span style={{ fontSize: 10, color: '#C4B9A8' }}>{max}{sufixo}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div style={{ marginTop: 20 }}>
            <button
              type="submit"
              disabled={salvando}
              style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', color: '#FFFFFF', fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1, boxShadow: '0 4px 16px rgba(180,26,26,0.25)' }}
            >
              {salvando ? 'Salvando...' : jaRegistrouHoje ? 'Atualizar check-in' : 'Registrar check-in'}
            </button>
          </div>
        </form>
      </div>

      {/* Histórico semanal */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '20px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Esta semana</p>
          {data?.media > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: corScore(data.media) }}>Média {Math.round(data.media)} pts</span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {semana.map(({ dia, iso, pontos }) => {
            const hoje = new Date().toISOString().slice(0, 10)
            const ehHoje = iso === hoje
            const cor = pontos === null ? '#F0EBE4' : pontos >= 85 ? '#16A34A' : pontos >= 60 ? '#CC8800' : '#CC1A1A'
            return (
              <div key={iso} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ position: 'relative', width: '100%', height: 64 }}>
                  <div style={{ position: 'absolute', inset: 0, background: '#F0EBE4', borderRadius: 8 }} />
                  {pontos !== null && pontos > 0 && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 8, height: `${pontos}%`, background: cor, transition: 'height 0.4s' }} />
                  )}
                  {ehHoje && (
                    <div style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: '#CC1A1A' }} />
                  )}
                </div>
                <span style={{ fontSize: 9, color: ehHoje ? '#CC1A1A' : '#8A7F76', fontWeight: ehHoje ? 700 : 600 }}>{dia}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: pontos !== null ? '#1A1A1A' : '#C4B9A8' }}>
                  {pontos !== null ? pontos : '–'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
