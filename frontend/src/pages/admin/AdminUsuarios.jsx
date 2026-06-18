import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR, { mutate } from 'swr'
import { Search, Users, Home } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { BtnIncluir, BtnEditar } from '../../components/ui/Botoes'
import { DataTable } from '../../components/ui/DataTable'
import * as usuariosService from '../../services/usuarios'
import { fone, data } from '../../utils/formatters'

const PERFIL_COR = {
  admin:          { bg: 'rgba(204,26,26,0.1)',    color: '#CC1A1A'  },
  personal:       { bg: 'rgba(37,99,235,0.1)',    color: '#1D4ED8'  },
  nutricionista:  { bg: 'rgba(22,163,74,0.1)',    color: '#15803D'  },
  aluno:          { bg: 'rgba(245,158,11,0.12)',   color: '#B45309'  },
}

function BadgePerfil({ perfil }) {
  const c = PERFIL_COR[perfil] || { bg: '#F0EBE4', color: '#8A7F76' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: c.bg, color: c.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {perfil}
    </span>
  )
}

function Avatar({ nome }) {
  return (
    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(204,26,26,0.08)', border: '1px solid rgba(204,26,26,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 800, color: '#CC1A1A' }}>
      {nome?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

export default function AdminUsuarios() {
  const { token } = useAuthContext()
  const navigate  = useNavigate()
  const [busca, setBusca]   = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [query, setQuery]   = useState({ busca: '', status: 'todos' })

  function consultar() { setQuery({ busca, status: filtro }) }

  const { data: usuarios = [], isLoading } = useSWR(
    token ? ['admin-usuarios', query] : null,
    () => usuariosService.listar(query)
  )

  const colunas = useMemo(() => [
    {
      id: 'usuario',
      header: 'Usuário',
      cell: ({ row: { original: u } }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar nome={u.nome} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 1 }}>{u.nome}</p>
            <p style={{ fontSize: 11, color: '#8A7F76' }}>{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'telefone',
      header: 'Telefone',
      size: 140,
      cell: ({ getValue }) => (
        <span style={{ fontSize: 13, color: '#6B6560' }}>{fone(getValue()) || '—'}</span>
      ),
    },
    {
      accessorKey: 'perfis',
      header: 'Perfis',
      enableSorting: false,
      cell: ({ getValue }) => {
        const perfis = getValue() || []
        return perfis.length > 0
          ? <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{perfis.map(p => <BadgePerfil key={p} perfil={p} />)}</div>
          : <span style={{ fontSize: 12, color: '#B0A89E', fontStyle: 'italic' }}>Sem perfil</span>
      },
    },
    {
      id: 'status',
      header: 'Status',
      size: 90,
      enableSorting: false,
      cell: ({ row: { original: u } }) => (
        <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: u.ativo ? 'rgba(34,197,94,0.1)' : '#F0EBE4', color: u.ativo ? '#15803D' : '#8A7F76' }}>
          {u.ativo ? 'ATIVO' : 'INATIVO'}
        </span>
      ),
    },
    {
      accessorKey: 'data_criacao',
      header: 'Cadastro',
      size: 110,
      cell: ({ getValue }) => (
        <span style={{ fontSize: 12, color: '#8A7F76' }}>{getValue() || '—'}</span>
      ),
    },
    {
      id: 'acoes',
      header: '',
      size: 60,
      enableSorting: false,
      cell: ({ row: { original: u } }) => (
        <BtnEditar iconOnly onClick={() => navigate(`/admin/usuarios/${u.id_usuario}`)} />
      ),
    },
  ], [navigate])

  function renderCard(u) {
    return (
      <div key={u.id_usuario} style={{ padding: '14px 20px', borderTop: '1px solid #F0EBE4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>{u.nome}</p>
            <p style={{ fontSize: 12, color: '#8A7F76', marginBottom: 6 }}>{u.email}</p>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(u.perfis || []).map(p => <BadgePerfil key={p} perfil={p} />)}
              {(!u.perfis || u.perfis.length === 0) && <span style={{ fontSize: 11, color: '#B0A89E', fontStyle: 'italic' }}>Sem perfil</span>}
            </div>
          </div>
          <BtnEditar iconOnly onClick={() => navigate(`/admin/usuarios/${u.id_usuario}`)} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Usuários</h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>{usuarios.filter(u => u.ativo).length} usuários ativos</p>
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
          <BtnIncluir onClick={() => navigate('/admin/usuarios/novo')} label="Novo usuário" />
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 12, overflow: 'hidden', height: 40, flex: 1 }}>
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
            style={{ height: '100%', paddingInline: 16, border: 'none', borderLeft: '1px solid #E0D6CA', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#6B6560', background: '#F7F3EE', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#EEE8E0'; e.currentTarget.style.color = '#1A1A1A' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F7F3EE'; e.currentTarget.style.color = '#6B6560' }}
          >
            Consultar
          </button>
        </div>
        {['todos', 'ativos', 'inativos'].map(s => (
          <button
            key={s}
            onClick={() => { setFiltro(s); setQuery({ busca, status: s }) }}
            style={{ height: 40, paddingInline: 16, borderRadius: 10, border: `1px solid ${filtro === s ? '#CC1A1A' : '#E0D6CA'}`, background: filtro === s ? 'rgba(204,26,26,0.06)' : '#FFFFFF', fontSize: 13, fontWeight: 700, color: filtro === s ? '#CC1A1A' : '#6B6560', cursor: 'pointer', flexShrink: 0, textTransform: 'capitalize' }}
          >
            {s === 'todos' ? 'Todos' : s === 'ativos' ? 'Ativos' : 'Inativos'}
          </button>
        ))}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <DataTable
          data={usuarios}
          columns={colunas}
          loading={isLoading}
          emptyIcon={<Users size={32} color="#C4B9A8" />}
          emptyText="Nenhum usuário encontrado"
          pageSize={20}
          renderCard={renderCard}
        />
      </div>

    </div>
  )
}
