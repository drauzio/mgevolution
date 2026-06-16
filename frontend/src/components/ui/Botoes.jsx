import { Plus, Pencil, Check, Trash2, X } from 'lucide-react'

const base = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  gap: 6, height: 36, paddingInline: 14, borderRadius: 8, fontSize: 12,
  fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
  flexShrink: 0, background: '#FFFFFF',
}

export function BtnIncluir({ onClick, label = 'Novo', disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, border: '1px solid #CC1A1A', color: '#CC1A1A', opacity: disabled ? 0.6 : 1 }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = 'rgba(204,26,26,0.05)' }}}
      onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF' }}
    >
      <Plus size={14} strokeWidth={2.5} />
      {label}
    </button>
  )
}

export function BtnEditar({ onClick, disabled = false, iconOnly = false }) {
  if (iconOnly) return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E0D6CA', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', flexShrink: 0, opacity: disabled ? 0.6 : 1, color: '#8A7F76' }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = '#CC1A1A'; e.currentTarget.style.color = '#CC1A1A' }}}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#8A7F76' }}
    >
      <Pencil size={13} strokeWidth={1.8} color="currentColor" />
    </button>
  )

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, border: '1px solid #E0D6CA', color: '#6B6560', opacity: disabled ? 0.6 : 1 }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = '#CC1A1A'; e.currentTarget.style.color = '#CC1A1A'; e.currentTarget.style.background = 'rgba(204,26,26,0.03)' }}}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#6B6560'; e.currentTarget.style.background = '#FFFFFF' }}
    >
      <Pencil size={13} strokeWidth={1.8} />
      Editar
    </button>
  )
}

export function BtnSalvar({ onClick, loading = false, disabled = false, label = 'Salvar' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{ ...base, border: '1px solid #CC1A1A', color: '#CC1A1A', opacity: disabled || loading ? 0.6 : 1 }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.background = 'rgba(204,26,26,0.05)' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF' }}
    >
      <Check size={14} strokeWidth={2.5} />
      {loading ? 'Salvando...' : label}
    </button>
  )
}

export function BtnExcluir({ onClick, loading = false, disabled = false, label = 'Excluir' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{ ...base, border: '1px solid rgba(204,26,26,0.35)', color: '#CC1A1A', opacity: disabled || loading ? 0.6 : 1 }}
      onMouseEnter={e => { if (!disabled && !loading) { e.currentTarget.style.borderColor = '#CC1A1A'; e.currentTarget.style.background = 'rgba(204,26,26,0.04)' }}}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(204,26,26,0.35)'; e.currentTarget.style.background = '#FFFFFF' }}
    >
      <Trash2 size={13} strokeWidth={1.8} />
      {loading ? '...' : label}
    </button>
  )
}

export function BtnCancelar({ onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, border: '1px solid #E0D6CA', color: '#6B6560', opacity: disabled ? 0.6 : 1 }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = '#C4B9A8'; e.currentTarget.style.color = '#1A1A1A' }}}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#6B6560' }}
    >
      <X size={13} strokeWidth={2} />
      Cancelar
    </button>
  )
}
