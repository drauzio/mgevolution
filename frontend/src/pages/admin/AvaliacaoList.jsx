import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useSWR from 'swr'
import { ClipboardList, Search, Home } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { BtnEditar } from '../../components/ui/Botoes'
import { DataTable } from '../../components/ui/DataTable'
import * as avaliacaoService from '../../services/avaliacao'
import { data, inicial } from '../../utils/formatters'

function BadgeStatus({ status }) {
  const ok = status === 'concluida'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: ok ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.12)', color: ok ? '#15803d' : '#92400e' }}>
      {ok ? 'CONCLUÍDA' : 'EM ANDAMENTO'}
    </span>
  )
}

function BadgeSexo({ sexo }) {
  if (!sexo) return <span style={{ color: '#C4B9A8', fontSize: 12 }}>—</span>
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: sexo === 'M' ? 'rgba(59,130,246,0.1)' : 'rgba(236,72,153,0.1)', color: sexo === 'M' ? '#1d4ed8' : '#9d174d' }}>
      {sexo === 'M' ? 'Masc.' : 'Fem.'}
    </span>
  )
}

export default function AvaliacaoList() {
  const { token } = useAuthContext()
  const navigate  = useNavigate()
  const location  = useLocation()
  const home = location.pathname.startsWith('/gestao') ? '/gestao' : '/admin'
  const [busca,  setBusca]  = useState('')
  const [query,  setQuery]  = useState({})
  const [status, setStatus] = useState('')

  const { data: avaliacoes = [], isLoading } = useSWR(
    token ? ['avaliacoes', query] : null,
    ([, p]) => avaliacaoService.listarAvaliacoes(p)
  )

  function consultar() {
    const p = {}
    if (busca)  p.busca  = busca
    if (status) p.status = status
    setQuery(p)
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'aluno_nome',
      header: 'Aluno',
      cell: ({ row: { original: av } }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(204,26,26,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#CC1A1A' }}>
            {inicial(av.aluno_nome)}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 1 }}>{av.aluno_nome}</p>
            <p style={{ fontSize: 11, color: '#8A7F76' }}>{av.aluno_email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 130,
      cell: ({ getValue }) => <BadgeStatus status={getValue()} />,
    },
    {
      accessorKey: 'objetivo',
      header: 'Objetivo / Nível',
      cell: ({ row: { original: av } }) => (
        <div>
          {av.objetivo
            ? <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 1 }}>{av.objetivo}</p>
            : <p style={{ fontSize: 12, color: '#C4B9A8' }}>—</p>}
          {av.nivel && <p style={{ fontSize: 11, color: '#8A7F76' }}>{av.nivel}</p>}
        </div>
      ),
    },
    {
      accessorKey: 'sexo',
      header: 'Perfil',
      size: 110,
      cell: ({ row: { original: av } }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <BadgeSexo sexo={av.sexo} />
          {av.idade && <p style={{ fontSize: 11, color: '#8A7F76' }}>{av.idade} anos</p>}
        </div>
      ),
    },
    {
      accessorKey: 'protocolo_nome',
      header: 'Template atribuído',
      cell: ({ getValue }) => getValue()
        ? <p style={{ fontSize: 13, color: '#1A1A1A' }}>{getValue()}</p>
        : <p style={{ fontSize: 12, color: '#C4B9A8' }}>Nenhum</p>,
    },
    {
      accessorKey: 'data_finalizacao',
      header: 'Data',
      size: 110,
      cell: ({ row: { original: av } }) => (
        <p style={{ fontSize: 12, color: '#6B6560' }}>{data(av.data_finalizacao || av.data_criacao)}</p>
      ),
    },
    {
      id: 'acoes',
      header: '',
      size: 48,
      enableSorting: false,
      cell: ({ row: { original: av } }) => (
        <BtnEditar iconOnly onClick={() => navigate(`/admin/avaliacoes/${av.id}`)} />
      ),
    },
  ], [])

  function renderCard(av) {
    return (
      <div key={av.id} style={{ padding: '14px 20px', borderTop: '1px solid #F0EBE4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>{av.aluno_nome}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <BadgeStatus status={av.status} />
              <BadgeSexo sexo={av.sexo} />
              {av.idade && <span style={{ fontSize: 11, color: '#8A7F76' }}>{av.idade} anos</span>}
            </div>
            {av.objetivo && <p style={{ fontSize: 12, color: '#6B6560' }}>{av.objetivo}</p>}
            {av.protocolo_nome && <p style={{ fontSize: 11, color: '#8A7F76', marginTop: 2 }}>Protocolo: {av.protocolo_nome}</p>}
          </div>
          <BtnEditar iconOnly onClick={() => navigate(`/admin/avaliacoes/${av.id}`)} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Avaliações</h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>{avaliacoes.filter(a => a.status === 'concluida').length} concluídas</p>
        </div>
        <button
          onClick={() => navigate(home)}
          style={{ height: 36, paddingInline: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#6B6560' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B9A8'; e.currentTarget.style.color = '#1A1A1A' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#6B6560' }}
        >
          <Home size={14} />
          Home
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 12, overflow: 'hidden', height: 40 }}>
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
          <select
            value={status}
            onChange={e => { setStatus(e.target.value) }}
            style={{ height: '100%', padding: '0 10px', border: 'none', borderLeft: '1px solid #E0D6CA', fontSize: 13, color: '#6B6560', background: '#F7F3EE', cursor: 'pointer', outline: 'none', flexShrink: 0 }}
          >
            <option value="">Todos os status</option>
            <option value="concluida">Concluídas</option>
            <option value="em_andamento">Em andamento</option>
          </select>
          <button
            onClick={consultar}
            style={{ height: '100%', paddingInline: 16, border: 'none', borderLeft: '1px solid #E0D6CA', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#6B6560', background: '#F7F3EE', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#EEE8E0'; e.currentTarget.style.color = '#1A1A1A' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F7F3EE'; e.currentTarget.style.color = '#6B6560' }}
          >
            Consultar
          </button>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <DataTable
          data={avaliacoes}
          columns={columns}
          loading={isLoading}
          emptyIcon={<ClipboardList size={32} color="#C4B9A8" />}
          emptyText="Nenhuma avaliação encontrada"
          pageSize={20}
          renderCard={renderCard}
        />
      </div>

    </div>
  )
}
