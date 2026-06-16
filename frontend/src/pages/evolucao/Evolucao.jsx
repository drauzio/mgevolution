import { useState } from 'react'
import { Camera, TrendingDown, TrendingUp } from 'lucide-react'

const TABS = ['Fotos', 'Medidas', 'Gráficos']

const metricas = [
  { label: 'Peso',       antes: '80,6 kg', depois: '72,0 kg', delta: '-8,6 kg', icon: TrendingDown },
  { label: 'Gordura',    antes: '24%',     depois: '18%',     delta: '-6%',     icon: TrendingDown },
  { label: 'Massa Magra',antes: '61,3 kg', depois: '64,5 kg', delta: '+3,2 kg', icon: TrendingUp   },
]

const fotosDados = [
  { legenda: 'ANTES', data: '12/01/2024' },
  { legenda: 'DEPOIS', data: '12/05/2024' },
]

export default function Evolucao() {
  const [tab, setTab] = useState('Fotos')

  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Cabeçalho */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>
          Evolução
        </h1>
        <p style={{ fontSize: 14, color: '#8A7F76' }}>Acompanhe sua transformação</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 14, padding: 6, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, height: 38, borderRadius: 10, fontSize: 13, fontWeight: 700,
              border: 'none', cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
              background: tab === t ? '#CC1A1A' : 'transparent',
              color: tab === t ? '#FFFFFF' : '#8A7F76',
              boxShadow: tab === t ? '0 2px 8px rgba(180,26,26,0.25)' : 'none',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Fotos ── */}
      {tab === 'Fotos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '24px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>

            {/* Grade antes/depois */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
              {fotosDados.map(({ legenda, data }) => (
                <div key={legenda} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ aspectRatio: '3/4', background: '#F7F3EE', border: '1px solid #E0D6CA', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={32} color="#C4B9A8" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{legenda}</p>
                    <p style={{ fontSize: 11, color: '#8A7F76' }}>{data}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Métricas resumidas */}
            <div style={{ borderTop: '1px solid #F0EBE4', paddingTop: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>
                Evolução Corporal
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {metricas.map(({ label, delta }) => (
                  <div key={label} style={{ textAlign: 'center', background: '#F7F3EE', borderRadius: 12, padding: '12px 8px' }}>
                    <p style={{ fontSize: 20, fontWeight: 900, color: '#CC1A1A', lineHeight: 1, marginBottom: 4 }}>{delta}</p>
                    <p style={{ fontSize: 10, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Botão análise */}
          <button
            className="w-full font-black text-white uppercase tracking-widest transition-all active:scale-[0.98]"
            style={{ height: 50, borderRadius: 14, background: 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', fontSize: 13, boxShadow: '0 4px 16px rgba(180,26,26,0.25)', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
          >
            Ver Análise Completa
          </button>

          {/* Upload */}
          <button
            className="w-full flex items-center justify-center gap-2 font-semibold transition-all"
            style={{ height: 50, borderRadius: 14, border: '1.5px dashed #E0D6CA', background: 'transparent', fontSize: 14, color: '#8A7F76', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(204,26,26,0.4)'; e.currentTarget.style.color = '#CC1A1A'; e.currentTarget.style.background = 'rgba(204,26,26,0.03)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#8A7F76'; e.currentTarget.style.background = 'transparent' }}
          >
            <Camera size={18} />
            Adicionar foto de hoje
          </button>
        </div>
      )}

      {/* ── Medidas ── */}
      {tab === 'Medidas' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          {metricas.map(({ label, antes, depois, delta, icon: Icon }, i) => (
            <div
              key={label}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '18px 24px',
                borderTop: i > 0 ? '1px solid #F0EBE4' : 'none',
              }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(204,26,26,0.08)', border: '1px solid rgba(204,26,26,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color="#CC1A1A" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 12, color: '#8A7F76' }}>{antes} → {depois}</p>
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#CC1A1A' }}>{delta}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Gráficos ── */}
      {tab === 'Gráficos' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: 14, color: '#C4B9A8' }}>Gráficos em breve</p>
        </div>
      )}

    </div>
  )
}
