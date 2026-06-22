import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useSWR, { mutate as globalMutate } from 'swr'
import { Bell, Home, Send, Trash2, AlertCircle, Info, X } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { BtnIncluir } from '../../components/ui/Botoes'
import { DataTable } from '../../components/ui/DataTable'
import * as svc from '../../services/notificacoes'

function fmt(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function ModalEnviar({ alunos, onClose, onSent }) {
  const [enviando, setEnviando] = useState(false)
  const [form, setForm]         = useState({ id_usuario: '', titulo: '', descricao: '', urgente: false })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleEnviar(e) {
    e.preventDefault()
    if (!form.id_usuario || !form.titulo.trim()) return
    setEnviando(true)
    try {
      await svc.enviar({ ...form, id_usuario: Number(form.id_usuario) })
      onSent()
      onClose()
    } finally { setEnviando(false) }
  }

  const inputStyle = {
    height: 42, padding: '0 14px', border: '1px solid #E0D6CA', borderRadius: 10,
    fontSize: 14, color: '#1A1A1A', outline: 'none', background: '#FFFFFF', width: '100%', boxSizing: 'border-box',
  }

  const label = (txt) => (
    <label style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{txt}</label>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 32, maxWidth: 460, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A' }}>Nova notificação</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} color="#8A7F76" />
          </button>
        </div>

        <form onSubmit={handleEnviar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {label('Aluno')}
            <select value={form.id_usuario} onChange={e => set('id_usuario', e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Selecione o aluno...</option>
              {alunos.map(a => <option key={a.id_usuario} value={a.id_usuario}>{a.nome}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {label('Título')}
            <input type="text" placeholder="Ex: Parabéns pela evolução!" value={form.titulo} onChange={e => set('titulo', e.target.value)} required maxLength={200} style={inputStyle} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {label('Mensagem (opcional)')}
            <textarea placeholder="Detalhes adicionais..." value={form.descricao} onChange={e => set('descricao', e.target.value)} maxLength={1000} rows={3} style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'vertical' }} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={form.urgente} onChange={e => set('urgente', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#CC1A1A' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>Marcar como urgente</span>
          </label>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 12, border: '1px solid #E0D6CA', background: '#FFFFFF', fontSize: 13, fontWeight: 700, color: '#6B6560', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || !form.id_usuario || !form.titulo.trim()}
              style={{ flex: 1, height: 42, borderRadius: 12, border: 'none', background: '#CC1A1A', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: enviando ? 'not-allowed' : 'pointer', opacity: (enviando || !form.id_usuario || !form.titulo.trim()) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Send size={14} />
              {enviando ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminNotificacoes() {
  const { token }  = useAuthContext()
  const navigate   = useNavigate()
  const location   = useLocation()
  const home       = location.pathname.startsWith('/nutri') ? '/nutri' : '/admin'

  const { data: enviadas = [], isLoading } = useSWR(token ? 'notif-enviadas' : null, svc.listarEnviadas)
  const { data: alunos   = [] }            = useSWR(token ? 'notif-alunos'   : null, svc.listarAlunos)

  const [modal, setModal]   = useState(false)
  const [deletando, setDel] = useState(null)

  async function handleDeletar(id) {
    setDel(id)
    try { await svc.deletar(id); globalMutate('notif-enviadas') }
    finally { setDel(null) }
  }

  const colunas = useMemo(() => [
    {
      accessorKey: 'nome_aluno',
      header: 'Aluno',
      cell: ({ getValue }) => (
        <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>{getValue()}</p>
      ),
    },
    {
      accessorKey: 'titulo',
      header: 'Notificação',
      cell: ({ row: { original: n } }) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            {n.urgente
              ? <AlertCircle size={13} color="#CC1A1A" />
              : <Info size={13} color="#8A7F76" />}
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{n.titulo}</p>
            {n.urgente && (
              <span style={{ fontSize: 10, fontWeight: 800, color: '#CC1A1A', background: 'rgba(204,26,26,0.08)', borderRadius: 6, padding: '1px 7px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Urgente
              </span>
            )}
          </div>
          {n.descricao && <p style={{ fontSize: 12, color: '#8A7F76' }}>{n.descricao}</p>}
        </div>
      ),
    },
    {
      accessorKey: 'lida',
      header: 'Status',
      size: 100,
      cell: ({ getValue }) => (
        <span style={{ display: 'inline-flex', padding: '2px 9px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: getValue() ? 'rgba(34,197,94,0.1)' : '#F0EBE4', color: getValue() ? '#15803d' : '#8A7F76' }}>
          {getValue() ? 'LIDA' : 'NÃO LIDA'}
        </span>
      ),
    },
    {
      accessorKey: 'data_criacao',
      header: 'Enviada em',
      size: 140,
      cell: ({ getValue }) => (
        <p style={{ fontSize: 12, color: '#8A7F76' }}>{fmt(getValue())}</p>
      ),
    },
    {
      id: 'acoes',
      header: '',
      size: 60,
      enableSorting: false,
      cell: ({ row: { original: n } }) => (
        <button
          onClick={() => handleDeletar(n.id_notificacao_aluno)}
          disabled={deletando === n.id_notificacao_aluno}
          style={{ width: 30, height: 30, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deletando === n.id_notificacao_aluno ? 0.5 : 1 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#CC1A1A'; e.currentTarget.style.background = 'rgba(204,26,26,0.05)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.background = '#FFF' }}
        >
          <Trash2 size={12} color="#CC1A1A" />
        </button>
      ),
    },
  ], [deletando])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Notificações</h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>{enviadas.filter(n => !n.lida).length} não lidas</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => navigate(home)}
            style={{ height: 36, paddingInline: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#6B6560' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B9A8'; e.currentTarget.style.color = '#1A1A1A' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#6B6560' }}
          >
            <Home size={14} /> Home
          </button>
          <BtnIncluir onClick={() => setModal(true)} label="Nova notificação" />
        </div>
      </div>

      {/* Tabela */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <DataTable
          data={enviadas}
          columns={colunas}
          loading={isLoading}
          emptyText="Nenhuma notificação enviada ainda"
          emptyIcon={<Bell size={28} color="#C4B9A8" />}
        />
      </div>

      {modal && (
        <ModalEnviar
          alunos={alunos}
          onClose={() => setModal(false)}
          onSent={() => globalMutate('notif-enviadas')}
        />
      )}
    </div>
  )
}
