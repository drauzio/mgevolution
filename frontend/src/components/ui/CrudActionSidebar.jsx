import { useState, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'

const VARIANTS = {
  primary:   { bg: 'linear-gradient(135deg,#A81515,#CC1A1A)', color: '#FFFFFF', border: 'none',                      shadow: '0 4px 14px rgba(180,26,26,0.3)' },
  secondary: { bg: '#FFFFFF',                                  color: '#6B6560', border: '1px solid #E0D6CA',          shadow: 'none' },
  danger:    { bg: 'rgba(204,26,26,0.06)',                     color: '#CC1A1A', border: '1px solid rgba(204,26,26,0.2)', shadow: 'none' },
  ghost:     { bg: '#F7F3EE',                                  color: '#6B6560', border: '1px solid #E0D6CA',          shadow: 'none' },
}

function ActionButton({ action, compact = false }) {
  const { label, icon: Icon, onClick, variant = 'secondary', disabled = false, loading = false } = action
  const v = VARIANTS[variant] || VARIANTS.secondary

  const style = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: compact ? 10 : 8,
    padding: compact ? '0 16px' : '0 14px',
    height: compact ? 44 : 40,
    borderRadius: 10,
    border: v.border,
    background: disabled || loading ? '#F0EBE4' : v.bg,
    color: disabled || loading ? '#B0A89E' : v.color,
    boxShadow: disabled ? 'none' : v.shadow,
    fontSize: 13,
    fontWeight: 700,
    cursor: disabled || loading ? 'default' : 'pointer',
    opacity: 1,
    transition: 'filter 0.15s',
    flexShrink: 0,
    textAlign: 'left',
    whiteSpace: 'nowrap',
  }

  return (
    <button
      onClick={!disabled && !loading ? onClick : undefined}
      disabled={disabled || loading}
      style={style}
      onMouseEnter={e => { if (!disabled && !loading && variant === 'primary') e.currentTarget.style.filter = 'brightness(1.08)' }}
      onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
    >
      {Icon && <Icon size={15} strokeWidth={2} />}
      {loading ? 'Aguarde...' : label}
    </button>
  )
}

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

export function CrudActionSidebar({ actions = [] }) {
  const isMobile = useIsMobile()
  const [expandido, setExpandido] = useState(false)

  const principal = actions.find(a => a.variant === 'primary')
  const resto = actions.filter(a => a !== principal)

  if (isMobile) {
    return (
      <>
        {/* Botão flutuante no mobile */}
        {!expandido && (
          <button
            onClick={() => setExpandido(true)}
            style={{ position: 'fixed', bottom: 80, right: 20, zIndex: 200, width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#A81515,#CC1A1A)', border: 'none', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(180,26,26,0.35)', cursor: 'pointer' }}
          >
            <ChevronUp size={22} />
          </button>
        )}

        {/* Barra inferior expandida */}
        {expandido && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 190, background: 'rgba(26,26,26,0.4)' }} onClick={() => setExpandido(false)} />
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: '#FFFFFF', borderRadius: '20px 20px 0 0', padding: '20px 20px 32px', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E0D6CA', margin: '0 auto 8px' }} />
              {principal && <ActionButton action={principal} compact />}
              {resto.map((a, i) => <ActionButton key={i} action={a} compact />)}
            </div>
          </>
        )}
      </>
    )
  }

  // Desktop — sidebar fixa à direita
  return (
    <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 8, width: 200, flexShrink: 0 }}>
      {principal && (
        <>
          <ActionButton action={principal} />
          {resto.length > 0 && <div style={{ height: 1, background: '#F0EBE4', margin: '4px 0' }} />}
        </>
      )}
      {resto.map((a, i) => <ActionButton key={i} action={a} />)}
    </div>
  )
}
