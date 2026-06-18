import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import { Search, Home, TrendingUp, AlertCircle } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { BtnEditar } from '../../components/ui/Botoes'
import { DataTable } from '../../components/ui/DataTable'
import * as svc from '../../services/adminEvolucao'

function diasDesde(dataStr) {
  if (!dataStr) return null
  const d = new Date(dataStr + 'T12:00:00')
  return Math.floor((Date.now() - d.getTime()) / 86400000)
}

function fmtData(dataStr) {
  if (!dataStr) return '—'
  return new Date(dataStr + 'T12:00:00').toLocaleDateString('pt-BR')
}

function Avatar({ nome }) {
  return (
    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(204,26,26,0.08)', border: '1px solid rgba(204,26,26,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 800, color: '#CC1A1A' }}>
      {nome?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

function BadgeAtividade({ dias }) {
  if (dias === null) return <span style={{ fontSize: 12, color: '#C4B9A8' }}>Sem treino</span>
  if (dias === 0)   return <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d' }}>Hoje</span>
  if (dias <= 3)    return <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d' }}>{dias}d atrás</span>
  if (dias <= 7)    return <span style={{ fontSize: 11, fontWeight: 700, color: '#B45309' }}>{dias}d atrás</span>
  if (dias <= 30)   return <span style={{ fontSize: 11, fontWeight: 700, color: '#CC1A1A' }}>{dias}d atrás</span>
  return <span style={{ fontSize: 11, fontWeight: 700, color: '#CC1A1A' }}>{dias}d sem treinar</span>
}

export default function AdminEvolucaoAlunos() {
  const { token } = useAuthContext()
  const navigate  = useNavigate()
  const [busca, setBusca] = useState('')

  const { data: alunos = [], isLoading } = useSWR(
    token ? 'admin-evolucao-alunos' : null,
    () => svc.listarAlunos()
  )

  const filtrados = useMemo(() => {
    if (!busca.trim()) return alunos
    const q = busca.toLowerCase()
    return alunos.filter(a => a.nome.toLowerCase().includes(q) || a.email.toLowerCase().includes(q))
  }, [alunos, busca])

  const colunas = useMemo(() => [
    {
      accessorKey: 'nome',
      header: 'Aluno',
      cell: ({ row: { original: a } }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar nome={a.nome} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 1 }}>{a.nome}</p>
            <p style={{ fontSize: 11, color: '#8A7F76' }}>{a.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'ultimo_peso',
      header: 'Último peso',
      size: 110,
      cell: ({ row: { original: a } }) => a.ultimo_peso ? (
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A' }}>{parseFloat(a.ultimo_peso).toLocaleString('pt-BR')} <span style={{ fontSize: 11, fontWeight: 400, color: '#8A7F76' }}>kg</span></p>
          {a.ultima_gordura && <p style={{ fontSize: 11, color: '#8A7F76' }}>{parseFloat(a.ultima_gordura).toLocaleString('pt-BR')}% gordura</p>}
        </div>
      ) : <span style={{ fontSize: 12, color: '#C4B9A8' }}>Sem medidas</span>,
    },
    {
      accessorKey: 'ultima_medida',
      header: 'Últ. medida',
      size: 110,
      cell: ({ row: { original: a } }) => (
        <div>
          <p style={{ fontSize: 12, color: '#6B6560' }}>{fmtData(a.ultima_medida)}</p>
          {a.total_medidas > 0 && <p style={{ fontSize: 10, color: '#A0978E' }}>{a.total_medidas} registro{a.total_medidas !== 1 ? 's' : ''}</p>}
        </div>
      ),
    },
    {
      accessorKey: 'treinos_mes',
      header: 'Treinos/mês',
      size: 110,
      cell: ({ row: { original: a } }) => (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: a.treinos_mes > 0 ? '#CC1A1A' : '#C4B9A8' }}>{a.treinos_mes}</span>
          {a.treinos_total > 0 && <span style={{ fontSize: 11, color: '#A0978E' }}>/ {a.treinos_total} total</span>}
        </div>
      ),
    },
    {
      accessorKey: 'ultimo_treino',
      header: 'Último treino',
      size: 130,
      cell: ({ row: { original: a } }) => <BadgeAtividade dias={diasDesde(a.ultimo_treino)} />,
    },
    {
      accessorKey: 'total_fotos',
      header: 'Fotos',
      size: 70,
      cell: ({ getValue }) => (
        <span style={{ fontSize: 13, color: getValue() > 0 ? '#6B6560' : '#C4B9A8' }}>{getValue() || '—'}</span>
      ),
    },
    {
      id: 'acoes',
      header: '',
      size: 48,
      enableSorting: false,
      cell: ({ row: { original: a } }) => (
        <BtnEditar iconOnly onClick={() => navigate(`/gestao/evolucao-alunos/${a.id_usuario}`)} />
      ),
    },
  ], [navigate])

  function renderCard(a) {
    const dias = diasDesde(a.ultimo_treino)
    return (
      <div key={a.id_usuario} style={{ padding: '14px 20px', borderTop: '1px solid #F0EBE4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>{a.nome}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {a.ultimo_peso && (
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>{parseFloat(a.ultimo_peso)}kg</span>
              )}
              <span style={{ fontSize: 12, color: '#CC1A1A', fontWeight: 700 }}>{a.treinos_mes} treinos/mês</span>
              <BadgeAtividade dias={dias} />
            </div>
          </div>
          <BtnEditar iconOnly onClick={() => navigate(`/gestao/evolucao-alunos/${a.id_usuario}`)} />
        </div>
      </div>
    )
  }

  const semTreino30 = alunos.filter(a => {
    const d = diasDesde(a.ultimo_treino)
    return d === null || d > 30
  }).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Evolução dos Alunos</h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>{alunos.length} alunos · {semTreino30 > 0 ? `${semTreino30} sem treinar há mais de 30 dias` : 'todos ativos'}</p>
        </div>
        <button
          onClick={() => navigate('/gestao')}
          style={{ height: 36, paddingInline: 14, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6B6560', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B9A8'; e.currentTarget.style.color = '#1A1A1A' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#6B6560' }}
        >
          <Home size={14} /> Home
        </button>
      </div>

      {semTreino30 > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'rgba(204,26,26,0.04)', border: '1px solid rgba(204,26,26,0.15)' }}>
          <AlertCircle size={16} color="#CC1A1A" />
          <p style={{ fontSize: 13, color: '#CC1A1A' }}>
            <strong>{semTreino30} aluno{semTreino30 > 1 ? 's' : ''}</strong> {semTreino30 > 1 ? 'estão' : 'está'} sem treinar há mais de 30 dias
          </p>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 12, overflow: 'hidden', height: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', flex: 1 }}>
          <Search size={15} color="#8A7F76" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#1A1A1A', background: 'transparent' }}
          />
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <DataTable
          data={filtrados}
          columns={colunas}
          loading={isLoading}
          emptyIcon={<TrendingUp size={32} color="#C4B9A8" />}
          emptyText="Nenhum aluno encontrado"
          pageSize={25}
          renderCard={renderCard}
        />
      </div>

    </div>
  )
}
