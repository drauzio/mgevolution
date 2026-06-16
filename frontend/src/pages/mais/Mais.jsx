import { Flame, Sparkles, Bot, Users, Trophy, BookOpen, ChevronRight, LogOut, Settings, Calendar, ClipboardList } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

const atalhos = [
  { icon: ClipboardList, label: 'Minha Avaliação',  desc: 'Veja suas respostas e treino atribuído', to: '/minha-avaliacao' },
  { icon: Flame,    label: 'Shape Score',    desc: 'Check-in diário',              to: '/shape-score' },
  { icon: Sparkles, label: 'Shape Future IA', desc: 'Sua projeção em 90 e 180 dias', to: '/shape-future' },
  { icon: Bot,      label: 'IA Coach',        desc: 'Tire dúvidas com a IA do Márcio', to: '/coach-ia' },
  { icon: Calendar, label: 'Agendamento',     desc: 'Sessões com seu personal',      to: '#' },
]

const extras = [
  { icon: Users,    label: 'Comunidade',  desc: 'Você nunca estará sozinho',       to: '#' },
  { icon: Trophy,   label: 'Desafios',    desc: 'Participe e conquiste recompensas', to: '#' },
  { icon: BookOpen, label: 'Cursos',      desc: 'Conteúdo exclusivo MG',           to: '#' },
  { icon: Settings, label: 'Configurações', desc: 'Conta e preferências',          to: '#' },
]

function MenuItem({ icon: Icon, label, desc, to, iconColor = '#CC1A1A', iconBg = 'rgba(204,26,26,0.08)', iconBorder = 'rgba(204,26,26,0.18)' }) {
  return (
    <Link
      to={to}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', textDecoration: 'none', transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = '#FDFAF7'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: 38, height: 38, borderRadius: 11, background: iconBg, border: `1px solid ${iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={17} color={iconColor} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 12, color: '#8A7F76' }}>{desc}</p>
      </div>
      <ChevronRight size={15} color="#C4B9A8" style={{ flexShrink: 0 }} />
    </Link>
  )
}

export default function Mais() {
  const { usuario, logout } = useAuthContext()
  const navigate = useNavigate()
  const inicial = usuario?.nome?.[0]?.toUpperCase() || 'A'

  return (
    <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Card de perfil */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '20px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(204,26,26,0.1)', border: '1px solid rgba(204,26,26,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22, fontWeight: 900, color: '#CC1A1A' }}>
          {inicial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', marginBottom: 3 }}>{usuario?.nome || 'Atleta'}</p>
          <p style={{ fontSize: 13, color: '#8A7F76' }}>{usuario?.email}</p>
        </div>
        <Link
          to="#"
          style={{ width: 36, height: 36, borderRadius: 10, background: '#F7F3EE', border: '1px solid #E0D6CA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(204,26,26,0.3)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E0D6CA'}
        >
          <Settings size={15} color="#8A7F76" />
        </Link>
      </div>

      {/* Atalhos principais */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10, paddingLeft: 4 }}>
          Funcionalidades
        </p>
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          {atalhos.map(({ icon, label, desc, to }, i) => (
            <div key={label} style={{ borderTop: i > 0 ? '1px solid #F0EBE4' : 'none' }}>
              <MenuItem icon={icon} label={label} desc={desc} to={to} />
            </div>
          ))}
        </div>
      </div>

      {/* Extras */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10, paddingLeft: 4 }}>
          Em breve
        </p>
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          {extras.map(({ icon, label, desc, to }, i) => (
            <div key={label} style={{ borderTop: i > 0 ? '1px solid #F0EBE4' : 'none', opacity: label === 'Configurações' ? 1 : 0.5 }}>
              <MenuItem
                icon={icon} label={label} desc={desc} to={to}
                iconColor="#8A7F76"
                iconBg="#F7F3EE"
                iconBorder="#E0D6CA"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Sair */}
      <button
        onClick={() => { logout(); navigate('/login') }}
        className="w-full flex items-center justify-center gap-2 font-semibold transition-all"
        style={{ height: 46, borderRadius: 14, border: '1px solid #E0D6CA', background: 'transparent', fontSize: 14, color: '#8A7F76', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(204,26,26,0.3)'; e.currentTarget.style.color = '#CC1A1A'; e.currentTarget.style.background = 'rgba(204,26,26,0.04)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#8A7F76'; e.currentTarget.style.background = 'transparent' }}
      >
        <LogOut size={16} />
        Sair da conta
      </button>

    </div>
  )
}
