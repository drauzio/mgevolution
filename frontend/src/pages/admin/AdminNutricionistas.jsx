import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import { Search, Salad } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { BtnIncluir, BtnEditar } from '../../components/ui/Botoes'
import { DataTable } from '../../components/ui/DataTable'
import * as nutricionistasService from '../../services/nutricionistas'
import { fone } from '../../utils/formatters'

function Avatar({ nome }) {
  return (
    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 800, color: '#7C3AED' }}>
      {nome[0].toUpperCase()}
    </div>
  )
}

export default function AdminNutricionistas() {
  const { token } = useAuthContext()
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [query, setQuery] = useState({ busca: '', status: 'todos' })

  function consultar() { setQuery({ busca, status: filtro }) }

  const { data: nutricionistas = [], isLoading, mutate } = useSWR(
    token ? ['nutricionistas', query] : null,
    ([, params]) => nutricionistasService.listar(params),
    { keepPreviousData: true }
  )

  const total  = nutricionistas.length
  const ativos = nutricionistas.filter(n => n.ativo).length

  async function handleToggle(e, id) {
    e.stopPropagation()
    await nutricionistasService.toggleAtivo(id)
    mutate()
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'nome',
      header: 'Nutricionista',
      cell: ({ row: { original: n } }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <Avatar nome={n.nome} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.nome}</p>
            <p style={{ fontSize: 11, color: '#8A7F76' }}>desde {n.data_criacao}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Contato',
      cell: ({ row: { original: n } }) => (
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, color: '#1A1A1A', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.email}</p>
          <p style={{ fontSize: 11, color: '#8A7F76' }}>{fone(n.telefone)}{n.tipo_documento && n.numero_documento ? ` · ${n.tipo_documento} ${n.numero_documento}` : ''}</p>
        </div>
      ),
    },
    {
      accessorKey: 'qtd_planos',
      header: 'Planos ativos',
      size: 120,
      cell: ({ getValue }) => (
        <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>
          {getValue()} {getValue() === 1 ? 'plano' : 'planos'}
        </p>
      ),
    },
    {
      accessorKey: 'ativo',
      header: 'Status',
      size: 100,
      enableSorting: false,
      cell: ({ row: { original: n } }) => (
        <button
          onClick={e => handleToggle(e, n.id_usuario)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, background: n.ativo ? 'rgba(34,197,94,0.1)' : '#F0EBE4', color: n.ativo ? '#15803d' : '#8A7F76' }}
        >
          {n.ativo ? 'ATIVO' : 'INATIVO'}
        </button>
      ),
    },
    {
      id: 'acoes',
      header: '',
      size: 48,
      enableSorting: false,
      cell: ({ row: { original: n } }) => (
        <BtnEditar iconOnly onClick={e => { e.stopPropagation(); navigate(`/admin/nutricionistas/${n.id_usuario}`) }} />
      ),
    },
  ], [nutricionistas])

  function renderCard(n) {
    return (
      <div key={n.id_usuario} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderTop: '1px solid #F0EBE4' }}>
        <Avatar nome={n.nome} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>{n.nome}</p>
          <p style={{ fontSize: 11, color: '#8A7F76', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.email}{n.tipo_documento && n.numero_documento ? ` · ${n.tipo_documento} ${n.numero_documento}` : ''}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <button
              onClick={e => handleToggle(e, n.id_usuario)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, background: n.ativo ? 'rgba(34,197,94,0.1)' : '#F0EBE4', color: n.ativo ? '#15803d' : '#8A7F76' }}
            >
              {n.ativo ? 'ATIVO' : 'INATIVO'}
            </button>
            <span style={{ fontSize: 10, color: '#8A7F76' }}>{n.qtd_planos} planos</span>
          </div>
        </div>
        <BtnEditar iconOnly onClick={() => navigate(`/admin/nutricionistas/${n.id_usuario}`)} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Nutricionistas</h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>{ativos} ativas · {total} no total</p>
        </div>
        <BtnIncluir onClick={() => navigate('/admin/nutricionistas/novo')} label="Nova nutricionista" />
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 12, overflow: 'hidden', height: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', flex: 1 }}>
            <Search size={15} color="#8A7F76" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && consultar()}
              placeholder="Buscar por nome ou e-mail..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#1A1A1A', background: 'transparent' }}
            />
          </div>
          <button
            onClick={consultar}
            style={{ height: '100%', paddingInline: 16, borderLeft: '1px solid #E0D6CA', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#6B6560', background: '#F7F3EE', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#EEE8E0'; e.currentTarget.style.color = '#1A1A1A' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F7F3EE'; e.currentTarget.style.color = '#6B6560' }}
          >
            Consultar
          </button>
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 12, padding: 4 }}>
          {[['todos','Todos'],['ativos','Ativas'],['inativos','Inativas']].map(([val, label]) => (
            <button key={val} onClick={() => setFiltro(val)}
              style={{ height: 32, paddingInline: 14, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s', background: filtro === val ? '#CC1A1A' : 'transparent', color: filtro === val ? '#FFFFFF' : '#8A7F76' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <DataTable
          data={nutricionistas}
          columns={columns}
          loading={isLoading}
          emptyIcon={<Salad size={32} color="#C4B9A8" />}
          emptyText="Nenhuma nutricionista encontrada"
          pageSize={20}
          renderCard={renderCard}
        />
      </div>

    </div>
  )
}
