import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR, { mutate } from 'swr'
import { CreditCard, Home, Users } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { BtnIncluir, BtnEditar } from '../../components/ui/Botoes'
import { DataTable } from '../../components/ui/DataTable'
import * as planosService from '../../services/planos'

const DURACAO_LABEL = { 30: 'Mensal', 60: 'Bimestral', 90: 'Trimestral', 180: 'Semestral', 365: 'Anual' }

function duracaoLabel(dias) {
  return DURACAO_LABEL[dias] || `${dias} dias`
}

function moeda(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function AdminPlanos() {
  const { token } = useAuthContext()
  const navigate  = useNavigate()

  const { data: planos = [], isLoading } = useSWR(
    token ? 'admin-planos' : null,
    () => planosService.listar()
  )

  async function handleToggle(plano) {
    await planosService.toggleAtivo(plano.id_plano)
    mutate('admin-planos')
  }

  const colunas = useMemo(() => [
    {
      accessorKey: 'nome',
      header: 'Plano',
      cell: ({ row: { original: p } }) => (
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>{p.nome}</p>
          {p.descricao && <p style={{ fontSize: 11, color: '#8A7F76' }}>{p.descricao}</p>}
        </div>
      ),
    },
    {
      accessorKey: 'preco',
      header: 'Preço',
      size: 120,
      cell: ({ getValue }) => (
        <span style={{ fontSize: 15, fontWeight: 800, color: '#CC1A1A' }}>{moeda(getValue())}</span>
      ),
    },
    {
      accessorKey: 'duracao_dias',
      header: 'Duração',
      size: 120,
      cell: ({ getValue }) => (
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{duracaoLabel(getValue())}</span>
      ),
    },
    {
      accessorKey: 'assinaturas_ativas',
      header: 'Assinantes',
      size: 110,
      enableSorting: false,
      cell: ({ getValue }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={13} color="#8A7F76" />
          <span style={{ fontSize: 13, color: '#6B6560' }}>{getValue()}</span>
        </div>
      ),
    },
    {
      accessorKey: 'ativo',
      header: 'Status',
      size: 100,
      enableSorting: false,
      cell: ({ row: { original: p } }) => (
        <button
          onClick={() => handleToggle(p)}
          style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: p.ativo ? 'rgba(34,197,94,0.1)' : '#F0EBE4', color: p.ativo ? '#15803d' : '#8A7F76', border: 'none', cursor: 'pointer' }}
        >
          {p.ativo ? 'ATIVO' : 'INATIVO'}
        </button>
      ),
    },
    {
      id: 'acoes',
      header: '',
      size: 48,
      enableSorting: false,
      cell: ({ row: { original: p } }) => (
        <BtnEditar iconOnly onClick={() => navigate(`/admin/planos/${p.id_plano}`)} />
      ),
    },
  ], [navigate])

  function renderCard(p) {
    return (
      <div key={p.id_plano} style={{ padding: '14px 20px', borderTop: '1px solid #F0EBE4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>{p.nome}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#CC1A1A' }}>{moeda(p.preco)}</span>
              <span style={{ fontSize: 12, color: '#8A7F76' }}>/ {duracaoLabel(p.duracao_dias).toLowerCase()}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: p.ativo ? 'rgba(34,197,94,0.1)' : '#F0EBE4', color: p.ativo ? '#15803d' : '#8A7F76' }}>
                {p.ativo ? 'ATIVO' : 'INATIVO'}
              </span>
              <span style={{ fontSize: 11, color: '#8A7F76' }}>{p.assinaturas_ativas} assinantes</span>
            </div>
          </div>
          <BtnEditar iconOnly onClick={() => navigate(`/admin/planos/${p.id_plano}`)} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Planos</h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>{planos.filter(p => p.ativo).length} planos ativos</p>
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
          <BtnIncluir onClick={() => navigate('/admin/planos/novo')} label="Novo plano" />
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <DataTable
          data={planos}
          columns={colunas}
          loading={isLoading}
          emptyIcon={<CreditCard size={32} color="#C4B9A8" />}
          emptyText="Nenhum plano cadastrado"
          pageSize={20}
          renderCard={renderCard}
        />
      </div>

    </div>
  )
}
