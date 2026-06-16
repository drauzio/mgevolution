import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import { Search, Activity, Home } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { BtnIncluir, BtnEditar } from '../../components/ui/Botoes'
import { DataTable } from '../../components/ui/DataTable'
import * as exerciciosService from '../../services/exercicios'

const GRUPOS = ['Peito','Costas','Pernas','Ombro','Bíceps','Tríceps','Abdômen','Cardio']

export default function ExercicioList() {
  const { token } = useAuthContext()
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [grupo, setGrupo] = useState('')
  const [query, setQuery] = useState({ busca: '', grupo: '' })

  const { data: exercicios = [], isLoading, mutate } = useSWR(
    token ? ['exercicios', query] : null,
    ([, params]) => exerciciosService.listar(params),
    { keepPreviousData: true }
  )

  const ativos = exercicios.filter(e => e.ativo).length

  const columns = useMemo(() => [
    {
      accessorKey: 'nome',
      header: 'Exercício',
      cell: ({ row: { original: e } }) => (
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>{e.nome}</p>
          {e.descricao && <p style={{ fontSize: 11, color: '#8A7F76' }}>{e.descricao}</p>}
        </div>
      ),
    },
    {
      accessorKey: 'grupo_muscular',
      header: 'Grupo',
      size: 130,
      cell: ({ getValue }) => (
        <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'rgba(204,26,26,0.07)', color: '#CC1A1A' }}>
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'equipamento',
      header: 'Equipamento',
      size: 140,
      cell: ({ getValue }) => (
        <p style={{ fontSize: 13, color: getValue() ? '#1A1A1A' : '#B0A89E', fontStyle: getValue() ? 'normal' : 'italic' }}>
          {getValue() || '—'}
        </p>
      ),
    },
    {
      accessorKey: 'ativo',
      header: 'Status',
      size: 90,
      enableSorting: false,
      cell: ({ getValue, row: { original: e } }) => (
        <button
          onClick={async () => {
            await exerciciosService.toggleAtivo(e.id_exercicio)
            mutate()
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, background: getValue() ? 'rgba(34,197,94,0.1)' : '#F0EBE4', color: getValue() ? '#15803d' : '#8A7F76' }}
        >
          {getValue() ? 'ATIVO' : 'INATIVO'}
        </button>
      ),
    },
    {
      id: 'acoes',
      header: '',
      size: 48,
      enableSorting: false,
      cell: ({ row: { original: e } }) => (
        <BtnEditar iconOnly onClick={() => navigate(`/admin/exercicios/${e.id_exercicio}`)} />
      ),
    },
  ], [mutate])

  function renderCard(e) {
    return (
      <div key={e.id_exercicio} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderTop: '1px solid #F0EBE4' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>{e.nome}</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(204,26,26,0.07)', color: '#CC1A1A', padding: '2px 8px', borderRadius: 6 }}>{e.grupo_muscular}</span>
            {e.equipamento && <span style={{ fontSize: 11, color: '#8A7F76' }}>{e.equipamento}</span>}
          </div>
        </div>
        <BtnEditar iconOnly onClick={() => navigate(`/admin/exercicios/${e.id_exercicio}`)} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Exercícios</h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>{ativos} ativos · {exercicios.length} no total</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => navigate('/admin')}
            style={{ height: 36, paddingInline: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#6B6560' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B9A8'; e.currentTarget.style.color = '#1A1A1A' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#6B6560' }}
          >
            <Home size={14} color="currentColor" />
            Home
          </button>
          <BtnIncluir onClick={() => navigate('/admin/exercicios/novo')} label="Novo exercício" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 12, overflow: 'hidden', height: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', flex: 1 }}>
            <Search size={15} color="#8A7F76" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setQuery({ busca, grupo })}
              placeholder="Buscar por nome ou equipamento..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#1A1A1A', background: 'transparent' }}
            />
          </div>
          <button
            onClick={() => setQuery({ busca, grupo })}
            style={{ height: '100%', paddingInline: 16, border: 'none', borderLeft: '1px solid #E0D6CA', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#6B6560', background: '#F7F3EE', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#EEE8E0'; e.currentTarget.style.color = '#1A1A1A' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F7F3EE'; e.currentTarget.style.color = '#6B6560' }}
          >
            Consultar
          </button>
        </div>
        <select
          value={grupo}
          onChange={e => setGrupo(e.target.value)}
          style={{ height: 40, padding: '0 14px', border: '1px solid #E0D6CA', borderRadius: 12, fontSize: 13, color: '#6B6560', background: '#FFFFFF', cursor: 'pointer', outline: 'none' }}
        >
          <option value="">Todos os grupos</option>
          {GRUPOS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <DataTable
          data={exercicios}
          columns={columns}
          loading={isLoading}
          emptyIcon={<Activity size={32} color="#C4B9A8" />}
          emptyText="Nenhum exercício encontrado"
          pageSize={25}
          renderCard={renderCard}
        />
      </div>

    </div>
  )
}
