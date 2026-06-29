import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR, { mutate } from 'swr'
import { Building2, Bell, Dumbbell, BarChart2, Bot, Users2, Save, Check, Home, ShieldCheck } from 'lucide-react'
import { getAll, salvarCategoria } from '../../services/configuracao'

const META = {
  academia:     { label: 'Academia',       icon: Building2, cor: '#1d4ed8' },
  notificacoes: { label: 'Notificações',   icon: Bell,      cor: '#B45309' },
  treino:       { label: 'Treino',         icon: Dumbbell,  cor: '#15803d' },
  shape_score:  { label: 'Shape Score',    icon: BarChart2, cor: '#7C3AED' },
  coach_ia:     { label: 'Coach IA',       icon: Bot,       cor: '#0e7490' },
  social:       { label: 'Social',            icon: Users2,      cor: '#CC1A1A' },
  acesso:       { label: 'Acesso e Carência', icon: ShieldCheck, cor: '#0f766e' },
}

const ORDEM = ['academia', 'notificacoes', 'treino', 'shape_score', 'coach_ia', 'social', 'acesso']

export default function AdminConfiguracoes() {
  const navigate = useNavigate()
  const { data: config, isLoading } = useSWR('admin-config', getAll)
  const [form,     setForm]     = useState({})
  const [salvando, setSalvando] = useState(null)
  const [salvo,    setSalvo]    = useState(null)

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const getValor = (cat, chave, tipo) => {
    const key = `${cat}.${chave}`
    if (key in form) return form[key]
    const item = config?.[cat]?.find(i => i.chave === chave)
    if (!item) return tipo === 'booleano' ? false : ''
    if (tipo === 'booleano') return item.valor === '1'
    return item.valor ?? ''
  }

  const setValor = (cat, chave, val) => setForm(f => ({ ...f, [`${cat}.${chave}`]: val }))

  const salvar = async (cat) => {
    setSalvando(cat)
    const items = config?.[cat] || []
    const dados = {}
    for (const item of items) {
      const val = getValor(cat, item.chave, item.tipo)
      dados[item.chave] = item.tipo === 'booleano' ? (val ? '1' : '0') : String(val ?? '')
    }
    await salvarCategoria(cat, dados)
    await mutate('admin-config')
    setForm(f => {
      const next = { ...f }
      for (const k of Object.keys(next)) { if (k.startsWith(`${cat}.`)) delete next[k] }
      return next
    })
    setSalvando(null)
    setSalvo(cat)
    setTimeout(() => setSalvo(v => v === cat ? null : v), 2000)
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Configurações</h1>
        <button
          onClick={() => navigate('/admin')}
          style={{ height: 36, paddingInline: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#6B6560' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B9A8'; e.currentTarget.style.color = '#1A1A1A' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#6B6560' }}
        >
          <Home size={14} color="currentColor" />
          Home
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {ORDEM.filter(cat => config?.[cat]).map(cat => {
          const meta  = META[cat] || { label: cat, icon: Building2, cor: '#8A7F76' }
          const Icon  = meta.icon
          const items = config[cat]
          const emSalvando = salvando === cat

          return (
            <div key={cat} style={{ background: '#FFFFFF', border: '1px solid #E8E2DC', borderRadius: 14, overflow: 'hidden' }}>
              {/* Header do card */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F0EBE4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `${meta.cor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color={meta.cor} strokeWidth={1.8} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>{meta.label}</span>
                </div>
                <button
                  onClick={() => salvar(cat)}
                  disabled={emSalvando}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    height: 34, paddingInline: 14, borderRadius: 8, border: 'none',
                    background: salvo === cat ? '#15803d' : '#CC1A1A',
                    color: '#FFF', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    transition: 'background 0.2s',
                    opacity: emSalvando ? 0.7 : 1,
                  }}
                >
                  {salvo === cat
                    ? <><Check size={13} /> Salvo</>
                    : emSalvando
                      ? 'Salvando…'
                      : <><Save size={13} /> Salvar</>
                  }
                </button>
              </div>

              {/* Campos */}
              <div style={{ padding: '4px 0 8px' }}>
                {items.map(item => (
                  <Campo
                    key={item.chave}
                    item={item}
                    value={getValor(cat, item.chave, item.tipo)}
                    onChange={val => setValor(cat, item.chave, val)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Campo({ item, value, onChange }) {
  if (item.tipo === 'booleano') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #F7F3EE' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>{item.label}</p>
          {item.descricao && <p style={{ fontSize: 11, color: '#B0A89E' }}>{item.descricao}</p>}
        </div>
        <Toggle checked={!!value} onChange={onChange} />
      </div>
    )
  }

  if (item.tipo === 'textarea') {
    return (
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #F7F3EE' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 4 }}>{item.label}</p>
        {item.descricao && <p style={{ fontSize: 11, color: '#B0A89E', marginBottom: 8 }}>{item.descricao}</p>}
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={4}
          placeholder="Deixe vazio para usar o padrão"
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 8,
            border: '1px solid #E0D6CA', fontSize: 13, color: '#1A1A1A',
            background: '#FDFCFB', resize: 'vertical', fontFamily: 'inherit',
            outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = '#CC1A1A'}
          onBlur={e => e.target.style.borderColor = '#E0D6CA'}
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '12px 20px', borderBottom: '1px solid #F7F3EE' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>{item.label}</p>
          {item.descricao && <p style={{ fontSize: 11, color: '#B0A89E' }}>{item.descricao}</p>}
        </div>
        <input
          type={item.tipo === 'numero' ? 'number' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: item.tipo === 'numero' ? 80 : 240, height: 36,
            padding: '0 10px', borderRadius: 8,
            border: '1px solid #E0D6CA', fontSize: 13, color: '#1A1A1A',
            background: '#FDFCFB', textAlign: item.tipo === 'numero' ? 'center' : 'left',
            outline: 'none', flexShrink: 0,
          }}
          onFocus={e => e.target.style.borderColor = '#CC1A1A'}
          onBlur={e => e.target.style.borderColor = '#E0D6CA'}
        />
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
        background: checked ? '#CC1A1A' : '#D1C9BF',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#FFF',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  )
}
