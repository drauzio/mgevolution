import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import { Search, Home, Receipt, AlertCircle } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { BtnIncluir, BtnEditar } from '../../components/ui/Botoes'
import { DataTable } from '../../components/ui/DataTable'
import * as assinaturasService from '../../services/assinaturas'
import * as planosService from '../../services/planos'
import { data } from '../../utils/formatters'

const STATUS_CONFIG = {
  ativa:     { bg: 'rgba(34,197,94,0.1)',    color: '#15803d', label: 'ATIVA' },
  suspensa:  { bg: 'rgba(251,191,36,0.12)',  color: '#92400e', label: 'SUSPENSA' },
  cancelada: { bg: 'rgba(204,26,26,0.1)',    color: '#CC1A1A', label: 'CANCELADA' },
  expirada:  { bg: '#F0EBE4',               color: '#8A7F76', label: 'EXPIRADA' },
}

function BadgeStatus({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.expirada
  return (
    <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: c.bg, color: c.color }}>
      {c.label}
    </span>
  )
}

function moeda(v) {
  if (v == null) return '—'
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const STATUS_OPCOES = ['todos', 'ativa', 'suspensa', 'cancelada', 'expirada']

export default function AdminAssinaturas() {
  const { token }  = useAuthContext()
  const navigate   = useNavigate()
  const [busca, setBusca]     = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroPlano, setFiltroPlano]   = useState('')
  const [query, setQuery]     = useState({ busca: '', status: 'todos', id_plano: '' })

  function consultar() {
    setQuery({ busca, status: filtroStatus, id_plano: filtroPlano })
  }

  const { data: assinaturas = [], isLoading } = useSWR(
    token ? ['admin-assinaturas', query] : null,
    () => assinaturasService.listar(query)
  )

  const { data: planos = [] } = useSWR(
    token ? 'admin-planos' : null,
    () => planosService.listar()
  )

  const ativas = assinaturas.filter(a => a.status === 'ativa').length

  const colunas = useMemo(() => [
    {
      accessorKey: 'aluno_nome',
      header: 'Aluno',
      cell: ({ row: { original: a } }) => (
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 1 }}>{a.aluno_nome}</p>
          <p style={{ fontSize: 11, color: '#8A7F76' }}>{a.aluno_email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'plano_nome',
      header: 'Plano',
      cell: ({ row: { original: a } }) => (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 1 }}>{a.plano_nome}</p>
          <p style={{ fontSize: 11, color: '#8A7F76' }}>{moeda(a.valor_pago)}</p>
        </div>
      ),
    },
    {
      accessorKey: 'data_inicio',
      header: 'Período',
      size: 160,
      cell: ({ row: { original: a } }) => (
        <div>
          <p style={{ fontSize: 12, color: '#1A1A1A' }}>{data(a.data_inicio)} → {data(a.data_fim)}</p>
          {a.status === 'ativa' && a.dias_restantes >= 0 && (
            <p style={{ fontSize: 11, color: a.dias_restantes <= 7 ? '#CC1A1A' : '#8A7F76', fontWeight: a.dias_restantes <= 7 ? 700 : 400 }}>
              {a.dias_restantes === 0 ? 'Vence hoje' : `${a.dias_restantes}d restantes`}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 110,
      cell: ({ getValue }) => <BadgeStatus status={getValue()} />,
    },
    {
      id: 'acoes',
      header: '',
      size: 48,
      enableSorting: false,
      cell: ({ row: { original: a } }) => (
        <BtnEditar iconOnly onClick={() => navigate(`/admin/assinaturas/${a.id_assinatura}`)} />
      ),
    },
  ], [navigate])

  function renderCard(a) {
    return (
      <div key={a.id_assinatura} style={{ padding: '14px 20px', borderTop: '1px solid #F0EBE4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>{a.aluno_nome}</p>
            <p style={{ fontSize: 12, color: '#6B6560', marginBottom: 4 }}>{a.plano_nome} · {moeda(a.valor_pago)}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BadgeStatus status={a.status} />
              <span style={{ fontSize: 11, color: '#8A7F76' }}>{data(a.data_inicio)} → {data(a.data_fim)}</span>
            </div>
          </div>
          <BtnEditar iconOnly onClick={() => navigate(`/admin/assinaturas/${a.id_assinatura}`)} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Assinaturas</h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>{ativas} assinaturas ativas</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => navigate('/admin')}
            style={{ height: 36, paddingInline: 14, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6B6560' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B9A8'; e.currentTarget.style.color = '#1A1A1A' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#6B6560' }}
          >
            <Home size={14} /> Home
          </button>
          <BtnIncluir onClick={() => navigate('/admin/assinaturas/nova')} label="Nova assinatura" />
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 12, overflow: 'hidden', height: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', flex: 1 }}>
            <Search size={15} color="#8A7F76" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && consultar()}
              placeholder="Buscar por aluno ou e-mail..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#1A1A1A', background: 'transparent' }}
            />
          </div>
          <button
            onClick={consultar}
            style={{ height: '100%', paddingInline: 14, border: 'none', borderLeft: '1px solid #E0D6CA', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6B6560', background: '#F7F3EE', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#EEE8E0' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F7F3EE' }}
          >
            Buscar
          </button>
        </div>

        <select
          value={filtroPlano}
          onChange={e => { setFiltroPlano(e.target.value); setQuery(q => ({ ...q, id_plano: e.target.value })) }}
          style={{ height: 40, paddingInline: 12, borderRadius: 10, border: '1px solid #E0D6CA', background: '#FFFFFF', fontSize: 13, color: '#6B6560', cursor: 'pointer', outline: 'none' }}
        >
          <option value="">Todos os planos</option>
          {planos.map(p => <option key={p.id_plano} value={p.id_plano}>{p.nome}</option>)}
        </select>

        {STATUS_OPCOES.map(s => (
          <button
            key={s}
            onClick={() => { setFiltroStatus(s); setQuery(q => ({ ...q, status: s })) }}
            style={{ height: 40, paddingInline: 14, borderRadius: 10, border: `1px solid ${filtroStatus === s ? '#CC1A1A' : '#E0D6CA'}`, background: filtroStatus === s ? 'rgba(204,26,26,0.06)' : '#FFFFFF', fontSize: 12, fontWeight: 700, color: filtroStatus === s ? '#CC1A1A' : '#6B6560', cursor: 'pointer', flexShrink: 0 }}
          >
            {s === 'todos' ? 'Todas' : STATUS_CONFIG[s]?.label || s}
          </button>
        ))}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <DataTable
          data={assinaturas}
          columns={colunas}
          loading={isLoading}
          emptyIcon={<Receipt size={32} color="#C4B9A8" />}
          emptyText="Nenhuma assinatura encontrada"
          pageSize={20}
          renderCard={renderCard}
        />
      </div>

    </div>
  )
}
