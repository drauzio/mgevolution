import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR, { mutate } from 'swr'
import { DollarSign, Clock, AlertTriangle, Check, X, ChevronDown, ChevronUp, Home } from 'lucide-react'
import { BtnIncluir } from '../../components/ui/Botoes'
import { resumo, pendentes, historico, pagar, cancelar } from '../../services/pagamento'

const FORMAS = [
  { value: 'pix',          label: 'PIX' },
  { value: 'dinheiro',     label: 'Dinheiro' },
  { value: 'cartao',       label: 'Cartão' },
  { value: 'boleto',       label: 'Boleto' },
  { value: 'transferencia',label: 'Transferência' },
]

function fmtValor(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtData(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function CardResumo({ icon: Icon, label, valor, cor, sub }) {
  return (
    <div style={{ background: '#FFF', border: '1px solid #E8E2DC', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${cor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={cor} strokeWidth={1.8} />
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 900, color: '#1A1A1A', lineHeight: 1 }}>{fmtValor(valor)}</p>
        {sub != null && <p style={{ fontSize: 11, color: '#B0A89E', marginTop: 3 }}>{sub} cobranças</p>}
      </div>
    </div>
  )
}

function ModalPagar({ pagamento, onClose, onSalvo }) {
  const [forma, setForma]   = useState('pix')
  const [data,  setData]    = useState(new Date().toISOString().slice(0, 10))
  const [obs,   setObs]     = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    await pagar(pagamento.id_pagamento, { forma_pagamento: forma, data_pagamento: data, observacao: obs })
    onSalvo()
  }

  const inputStyle = { width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #E0D6CA', fontSize: 14, color: '#1A1A1A', background: '#FDFCFB', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
      <div style={{ background: '#FFF', borderRadius: 16, width: '100%', maxWidth: 420, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A' }}>Registrar Pagamento</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="#8A7F76" /></button>
        </div>

        <div style={{ background: '#F7F3EE', borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{pagamento.nome_aluno}</p>
          <p style={{ fontSize: 12, color: '#8A7F76', marginTop: 2 }}>{pagamento.nome_plano} · Venc. {fmtData(pagamento.data_vencimento)}</p>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#CC1A1A', marginTop: 6 }}>{fmtValor(pagamento.valor)}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>Forma de pagamento</label>
            <select value={forma} onChange={e => setForma(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={e => e.target.style.borderColor = '#CC1A1A'} onBlur={e => e.target.style.borderColor = '#E0D6CA'}>
              {FORMAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>Data do pagamento</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#CC1A1A'} onBlur={e => e.target.style.borderColor = '#E0D6CA'} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>Observação</label>
            <input value={obs} onChange={e => setObs(e.target.value)} placeholder="Opcional" style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#CC1A1A'} onBlur={e => e.target.style.borderColor = '#E0D6CA'} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={onClose} style={{ flex: 1, height: 40, borderRadius: 9, border: '1px solid #E0D6CA', background: '#FFF', fontSize: 13, fontWeight: 700, color: '#6B6560', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={salvar} disabled={salvando} style={{ flex: 1, height: 40, borderRadius: 9, border: 'none', background: '#CC1A1A', fontSize: 13, fontWeight: 700, color: '#FFF', cursor: 'pointer', opacity: salvando ? 0.7 : 1 }}>
            {salvando ? 'Salvando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BadgeStatus({ status, diasParaVencer }) {
  if (status === 'pago')      return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#F0FDF4', color: '#15803d', border: '1px solid #86EFAC' }}>Pago</span>
  if (status === 'cancelado') return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#F5F5F5', color: '#6B6560', border: '1px solid #E0D6CA' }}>Cancelado</span>
  if (diasParaVencer < 0)     return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#FEF2F2', color: '#CC1A1A', border: '1px solid #FCA5A5' }}>Vencido {Math.abs(diasParaVencer)}d</span>
  if (diasParaVencer <= 5)    return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#FFFBEB', color: '#B45309', border: '1px solid #FCD34D' }}>Vence em {diasParaVencer}d</span>
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#EFF6FF', color: '#1d4ed8', border: '1px solid #BFDBFE' }}>Pendente</span>
}

export default function AdminPagamentos() {
  const navigate = useNavigate()
  const [aba, setAba]         = useState('pendentes')
  const [modal, setModal]     = useState(null)
  const [filtroMes, setFiltroMes]   = useState(new Date().getMonth() + 1)
  const [filtroAno, setFiltroAno]   = useState(new Date().getFullYear())
  const [filtroStatus, setFiltroStatus] = useState('')

  const { data: res }  = useSWR('pag-resumo', resumo)
  const { data: pends } = useSWR(aba === 'pendentes' ? 'pag-pendentes' : null, pendentes)
  const { data: hist }  = useSWR(
    aba === 'historico' ? ['pag-hist', filtroMes, filtroAno, filtroStatus] : null,
    () => historico({ mes: filtroMes, ano: filtroAno, status: filtroStatus || undefined })
  )

  function recarregar() {
    setModal(null)
    mutate('pag-resumo')
    mutate('pag-pendentes')
    mutate(['pag-hist', filtroMes, filtroAno, filtroStatus])
  }

  async function handleCancelar(id) {
    await cancelar(id)
    recarregar()
  }

  const anos = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i)
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Pagamentos</h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>{res?.qtd_pendente ?? 0} pendentes · {res?.qtd_vencido ?? 0} vencidos</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/admin')}
            style={{ height: 36, paddingInline: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6B6560' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B9A8'; e.currentTarget.style.color = '#1A1A1A' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#6B6560' }}
          >
            <Home size={14} color="currentColor" />
            Home
          </button>
          <BtnIncluir onClick={() => navigate('/admin/pagamentos/novo')} label="Novo pagamento" />
        </div>
      </div>

      {/* Resumo */}
      <div className="pag-resumo-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <CardResumo icon={DollarSign} label="Recebido este mês" valor={res?.recebido_mes}  cor="#15803d" />
        <CardResumo icon={Clock}      label="Pendentes"          valor={res?.pendente}      cor="#1d4ed8" sub={res?.qtd_pendente} />
        <CardResumo icon={AlertTriangle} label="Vencidos"        valor={res?.vencido}       cor="#CC1A1A" sub={res?.qtd_vencido} />
      </div>

      {/* Abas */}
      <div style={{ background: '#FFF', border: '1px solid #E8E2DC', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #F0EBE4' }}>
          {[{ key: 'pendentes', label: 'Pendentes' }, { key: 'historico', label: 'Histórico' }].map(({ key, label }) => (
            <button key={key} onClick={() => setAba(key)} style={{
              flex: 1, height: 46, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              background: aba === key ? '#FFF' : '#FDFCFB',
              color: aba === key ? '#CC1A1A' : '#8A7F76',
              borderBottom: aba === key ? '2px solid #CC1A1A' : '2px solid transparent',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Filtros histórico */}
        {aba === 'historico' && (
          <div style={{ display: 'flex', gap: 12, padding: '14px 20px', borderBottom: '1px solid #F0EBE4', flexWrap: 'wrap' }}>
            <select value={filtroMes} onChange={e => setFiltroMes(Number(e.target.value))} style={{ height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #E0D6CA', fontSize: 13, background: '#FDFCFB', outline: 'none' }}>
              {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={filtroAno} onChange={e => setFiltroAno(Number(e.target.value))} style={{ height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #E0D6CA', fontSize: 13, background: '#FDFCFB', outline: 'none' }}>
              {anos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #E0D6CA', fontSize: 13, background: '#FDFCFB', outline: 'none' }}>
              <option value="">Todos</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        )}

        {/* Lista pendentes */}
        {aba === 'pendentes' && (
          <div>
            {!pends?.length && (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: '#8A7F76', fontSize: 14 }}>
                Nenhuma cobrança pendente
              </div>
            )}
            {pends?.map((p, i) => (
              <div key={p.id_pagamento} className="pag-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderTop: i > 0 ? '1px solid #F0EBE4' : 'none', flexWrap: 'wrap' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FDFAF7'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>{p.nome_aluno}</p>
                  <p style={{ fontSize: 12, color: '#8A7F76' }}>{p.nome_plano} · Venc. {fmtData(p.data_vencimento)}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <BadgeStatus status="pendente" diasParaVencer={p.dias_para_vencer} />
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A' }}>{fmtValor(p.valor)}</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setModal(p)} style={{ height: 32, paddingInline: 12, borderRadius: 8, border: 'none', background: '#CC1A1A', color: '#FFF', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Check size={13} /> Pago
                    </button>
                    <button onClick={() => handleCancelar(p.id_pagamento)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E0D6CA', background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#FCA5A5'; e.currentTarget.style.background = '#FEF2F2' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.background = '#FFF' }}>
                      <X size={13} color="#CC1A1A" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Histórico */}
        {aba === 'historico' && (
          <div>
            {!hist?.length && (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: '#8A7F76', fontSize: 14 }}>
                Nenhum registro encontrado
              </div>
            )}
            {hist?.map((p, i) => (
              <div key={p.id_pagamento} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderTop: i > 0 ? '1px solid #F0EBE4' : 'none', flexWrap: 'wrap' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FDFAF7'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>{p.nome_aluno}</p>
                  <p style={{ fontSize: 12, color: '#8A7F76' }}>
                    {p.nome_plano}
                    {p.forma_pagamento && ` · ${FORMAS.find(f => f.value === p.forma_pagamento)?.label || p.forma_pagamento}`}
                    {p.data_pagamento && ` · Pago em ${fmtData(p.data_pagamento)}`}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <BadgeStatus status={p.status} diasParaVencer={0} />
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A' }}>{fmtValor(p.valor)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && <ModalPagar pagamento={modal} onClose={() => setModal(null)} onSalvo={recarregar} />}

      <style>{`
        @media (max-width: 640px) {
          .pag-resumo-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .pag-resumo-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
        }
      `}</style>
    </div>
  )
}
