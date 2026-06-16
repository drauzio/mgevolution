import { Dumbbell, Flame, Salad, Droplets, Moon, ChevronRight } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'

const checks = [
  { icon: Dumbbell, label: 'TREINO',   feito: true },
  { icon: Flame,    label: 'CARDIO',   feito: true },
  { icon: Salad,    label: 'NUTRIÇÃO', feito: false },
  { icon: Droplets, label: 'ÁGUA',     feito: true },
  { icon: Moon,     label: 'SONO',     feito: true },
]

const SCORE    = 92
const MAX      = 100
const PCT      = (SCORE / MAX) * 100
const CIRCUNF  = 2 * Math.PI * 54
const DASH_SCORE = (PCT / 100) * CIRCUNF

export default function Dashboard() {
  const { usuario } = useAuthContext()
  const nome = usuario?.nome?.split(' ')[0] || 'Campeão'

  return (
    <div style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Shape Score */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '32px 36px', display: 'flex', alignItems: 'center', gap: 40, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width="148" height="148" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="54" fill="none" stroke="#E0D6CA" strokeWidth="10" />
            <circle
              cx="64" cy="64" r="54" fill="none"
              stroke="#CC1A1A" strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${DASH_SCORE} ${CIRCUNF}`}
              transform="rotate(-90 64 64)"
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 9, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 2 }}>Shape Score</p>
            <p style={{ fontSize: 40, fontWeight: 900, color: '#1A1A1A', lineHeight: 1 }}>{SCORE}</p>
            <p style={{ fontSize: 11, color: '#8A7F76', marginTop: 2 }}>DE {MAX}</p>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, color: '#1A1A1A', fontSize: 20, marginBottom: 6 }}>Ótimo Trabalho!</p>
          <p style={{ fontSize: 14, color: '#8A7F76', marginBottom: 24 }}>Você está no caminho certo. Continue assim.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {checks.map(({ icon: Icon, label, feito }) => (
              <div
                key={label}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '10px 14px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.08em', border: '1px solid',
                  background: feito ? 'rgba(204,26,26,0.07)' : '#F7F3EE',
                  borderColor: feito ? 'rgba(204,26,26,0.22)' : '#E0D6CA',
                  color: feito ? '#CC1A1A' : '#B0A89E',
                }}
              >
                <Icon size={15} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Próximo treino */}
      <a
        href="/treinos"
        style={{ display: 'flex', alignItems: 'center', gap: 20, background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '24px 28px', textDecoration: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(204,26,26,0.35)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(204,26,26,0.1)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)' }}
      >
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(204,26,26,0.08)', border: '1px solid rgba(204,26,26,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Dumbbell size={24} color="#CC1A1A" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Próximo Treino</p>
          <p style={{ fontWeight: 700, color: '#1A1A1A', fontSize: 16, marginBottom: 4 }}>Peito e Tríceps</p>
          <p style={{ fontSize: 13, color: '#8A7F76' }}>Hoje · 18:00</p>
        </div>
        <ChevronRight size={20} color="#C4B9A8" />
      </a>

      {/* Cards de acesso rápido */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { href: '/shape-future', titulo: 'Shape Future IA', desc: 'Veja seu potencial resultado', sub: 'Projeção em 90 e 180 dias' },
          { href: '/coach-ia',     titulo: 'IA Coach',         desc: 'Tire dúvidas agora',           sub: 'Método Márcio Gonçalves' },
          { href: '/evolucao',     titulo: 'Evolução',         desc: 'Fotos e medidas',               sub: 'Antes e depois' },
          { href: '/shape-score',  titulo: 'Check-in Diário',  desc: 'Registrar o dia',               sub: 'Treino, dieta, sono, água' },
        ].map(({ href, titulo, desc, sub }) => (
          <a
            key={href}
            href={href}
            style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '24px 24px', textDecoration: 'none', display: 'block', transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(204,26,26,0.35)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(204,26,26,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)' }}
          >
            <p style={{ fontSize: 10, color: '#CC1A1A', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 10 }}>{titulo}</p>
            <p style={{ fontSize: 15, color: '#1A1A1A', fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>{desc}</p>
            <p style={{ fontSize: 13, color: '#8A7F76' }}>{sub}</p>
          </a>
        ))}
      </div>

    </div>
  )
}
