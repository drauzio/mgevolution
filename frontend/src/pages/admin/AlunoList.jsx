import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useSWR from 'swr'
import { Search, Users, CheckCircle, Clock, Home } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { BtnIncluir, BtnEditar } from '../../components/ui/Botoes'
import { DataTable } from '../../components/ui/DataTable'
import * as alunosService from '../../services/alunos'
import { fone, data } from '../../utils/formatters'

function Avatar({ nome }) {
  return (
    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(204,26,26,0.08)', border: '1px solid rgba(204,26,26,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 800, color: '#CC1A1A' }}>
      {nome[0].toUpperCase()}
    </div>
  )
}

export default function AlunoList() {
  const { token } = useAuthContext()
  const navigate = useNavigate()
  const location = useLocation()
  const base = location.pathname.startsWith('/nutri') ? '/nutri/alunos' : '/admin/alunos'
  const home = location.pathname.startsWith('/nutri') ? '/nutri/alunos' : '/admin'
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [query, setQuery] = useState({ busca: '', status: 'todos' })

  function consultar() { setQuery({ busca, status: filtro }) }

  const { data: alunos = [], isLoading, mutate } = useSWR(
    token ? ['alunos', query] : null,
    ([, params]) => alunosService.listar(params),
    { keepPreviousData: true }
  )

  const total  = alunos.length
  const ativos = alunos.filter(a => a.ativo).length

  async function handleToggle(e, id) {
    e.stopPropagation()
    await alunosService.toggleAtivo(id)
    mutate()
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'nome',
      header: 'Aluno',
      cell: ({ row: { original: a } }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <Avatar nome={a.nome} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nome}</p>
            <p style={{ fontSize: 11, color: '#8A7F76' }}>desde {data(a.data_criacao)}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Contato',
      cell: ({ row: { original: a } }) => (
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, color: '#1A1A1A', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.email}</p>
          <p style={{ fontSize: 11, color: '#8A7F76' }}>{fone(a.telefone)}</p>
        </div>
      ),
    },
    {
      accessorKey: 'personal',
      header: 'Personal',
      size: 160,
      cell: ({ getValue }) => (
        <p style={{ fontSize: 13, color: getValue() ? '#1A1A1A' : '#B0A89E', fontStyle: getValue() ? 'normal' : 'italic' }}>
          {getValue() || 'Sem personal'}
        </p>
      ),
    },
    {
      accessorKey: 'ativo',
      header: 'Status',
      size: 120,
      enableSorting: false,
      cell: ({ row: { original: a } }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            onClick={e => handleToggle(e, a.id_usuario)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, background: a.ativo ? 'rgba(34,197,94,0.1)' : '#F0EBE4', color: a.ativo ? '#15803d' : '#8A7F76' }}
          >
            {a.ativo ? 'ATIVO' : 'INATIVO'}
          </button>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: a.avaliacao_concluida ? '#8A7F76' : '#B0A89E' }}>
            {a.avaliacao_concluida
              ? <><CheckCircle size={10} color="#15803d" /> Avaliado</>
              : <><Clock size={10} /> Pendente</>}
          </span>
        </div>
      ),
    },
    {
      id: 'acoes',
      header: '',
      size: 48,
      enableSorting: false,
      cell: ({ row: { original: a } }) => (
        <BtnEditar iconOnly onClick={e => { e.stopPropagation(); navigate(`${base}/${a.id_usuario}`) }} />
      ),
    },
  ], [alunos])

  function renderCard(a) {
    return (
      <div key={a.id_usuario} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderTop: '1px solid #F0EBE4' }}>
        <Avatar nome={a.nome} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>{a.nome}</p>
          <p style={{ fontSize: 11, color: '#8A7F76', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.email}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <button
              onClick={e => handleToggle(e, a.id_usuario)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, background: a.ativo ? 'rgba(34,197,94,0.1)' : '#F0EBE4', color: a.ativo ? '#15803d' : '#8A7F76' }}
            >
              {a.ativo ? 'ATIVO' : 'INATIVO'}
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#B0A89E' }}>
              {a.avaliacao_concluida ? <><CheckCircle size={10} color="#15803d" /> Avaliado</> : <><Clock size={10} /> Pendente</>}
            </span>
          </div>
        </div>
        <BtnEditar iconOnly onClick={() => navigate(`${base}/${a.id_usuario}`)} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Alunos</h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>{ativos} ativos · {total} no total</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => navigate(home)}
            style={{ height: 36, paddingInline: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#6B6560' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B9A8'; e.currentTarget.style.color = '#1A1A1A' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#6B6560' }}
          >
            <Home size={14} color="currentColor" />
            Home
          </button>
          <BtnIncluir onClick={() => navigate(`${base}/novo`)} label="Novo aluno" />
        </div>
      </div>

      {/* Filtros + Busca */}
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
            style={{ height: '100%', paddingInline: 16, borderLeft: '1px solid #E0D6CA', border: 'none', borderLeft: '1px solid #E0D6CA', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#6B6560', background: '#F7F3EE', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#EEE8E0'; e.currentTarget.style.color = '#1A1A1A' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F7F3EE'; e.currentTarget.style.color = '#6B6560' }}
          >
            Consultar
          </button>
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 12, padding: 4 }}>
          {[['todos','Todos'],['ativos','Ativos'],['inativos','Inativos']].map(([val, label]) => (
            <button key={val} onClick={() => setFiltro(val)}
              style={{ height: 32, paddingInline: 14, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s', background: filtro === val ? '#CC1A1A' : 'transparent', color: filtro === val ? '#FFFFFF' : '#8A7F76' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <DataTable
          data={alunos}
          columns={columns}
          loading={isLoading}
          emptyIcon={<Users size={32} color="#C4B9A8" />}
          emptyText="Nenhum aluno encontrado"
          pageSize={20}
          renderCard={renderCard}
        />
      </div>

    </div>
  )
}
