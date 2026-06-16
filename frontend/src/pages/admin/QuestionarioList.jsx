import { useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import { ClipboardList, Home } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { BtnIncluir, BtnEditar } from '../../components/ui/Botoes'
import { DataTable } from '../../components/ui/DataTable'
import * as svc from '../../services/questionario'

const TIPO_LABEL = { opcao: 'Opção', bool: 'Sim/Não', numero: 'Número', texto: 'Texto' }
const TIPO_COLOR = { opcao: '#6366F1', bool: '#F59E0B', numero: '#10B981', texto: '#8A7F76' }

export default function QuestionarioList() {
  const { token } = useAuthContext()
  const navigate  = useNavigate()

  const { data: perguntas = [], isLoading } = useSWR(
    token ? 'admin-questionario' : null,
    svc.listar
  )

  const columns = [
    {
      accessorKey: 'ordem',
      header: '#',
      size: 48,
      cell: ({ getValue }) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: '#F0EBE4', fontSize: 12, fontWeight: 800, color: '#8A7F76' }}>
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'pergunta',
      header: 'Pergunta',
      cell: ({ row: { original: p } }) => (
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>{p.pergunta}</p>
          <p style={{ fontSize: 11, color: '#A09890' }}>código: {p.codigo}</p>
        </div>
      ),
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      size: 100,
      cell: ({ getValue }) => {
        const t = getValue()
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: `${TIPO_COLOR[t]}18`, color: TIPO_COLOR[t] }}>
            {TIPO_LABEL[t] || t}
          </span>
        )
      },
    },
    {
      accessorKey: 'opcoes',
      header: 'Opções',
      size: 180,
      enableSorting: false,
      cell: ({ row: { original: p } }) => {
        if (p.tipo !== 'opcao' || !p.opcoes?.length) return <span style={{ fontSize: 12, color: '#C4B9A8' }}>—</span>
        return (
          <p style={{ fontSize: 12, color: '#6B6560' }}>{p.opcoes.map(o => o.valor).join(' · ')}</p>
        )
      },
    },
    {
      accessorKey: 'obrigatorio',
      header: 'Obrig.',
      size: 72,
      cell: ({ getValue }) => (
        <span style={{ fontSize: 12, color: getValue() ? '#15803d' : '#C4B9A8', fontWeight: 700 }}>
          {getValue() ? 'Sim' : 'Não'}
        </span>
      ),
    },
    {
      accessorKey: 'ativo',
      header: 'Status',
      size: 90,
      cell: ({ getValue }) => (
        <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: getValue() ? 'rgba(34,197,94,0.1)' : '#F0EBE4', color: getValue() ? '#15803d' : '#8A7F76' }}>
          {getValue() ? 'ATIVO' : 'INATIVO'}
        </span>
      ),
    },
    {
      id: 'acoes',
      header: '',
      size: 48,
      enableSorting: false,
      cell: ({ row: { original: p } }) => (
        <BtnEditar iconOnly onClick={() => navigate(`/admin/questionario/${p.id}`)} />
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Questionário</h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>{perguntas.filter(p => p.ativo).length} perguntas ativas</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/admin')}
            style={{ height: 36, paddingInline: 14, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6B6560' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B9A8'; e.currentTarget.style.color = '#1A1A1A' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#6B6560' }}
          >
            <Home size={14} /> Home
          </button>
          <BtnIncluir label="Nova pergunta" onClick={() => navigate('/admin/questionario/novo')} />
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <DataTable
          data={perguntas}
          columns={columns}
          loading={isLoading}
          emptyIcon={<ClipboardList size={32} color="#C4B9A8" />}
          emptyText="Nenhuma pergunta cadastrada"
          pageSize={30}
        />
      </div>

    </div>
  )
}
