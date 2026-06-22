import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useSWR from 'swr'
import { Search, Home, LayoutTemplate, Users } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { BtnIncluir, BtnEditar } from '../../components/ui/Botoes'
import { DataTable } from '../../components/ui/DataTable'
import * as treinosService from '../../services/treinos'
import * as templatesService from '../../services/templates'
import { data } from '../../utils/formatters'

export default function TreinoList() {
  const { token }  = useAuthContext()
  const navigate   = useNavigate()
  const location   = useLocation()
  const [busca, setBusca] = useState('')
  const [query, setQuery] = useState('')

  const isProtocolos = location.pathname.startsWith('/conteudo/protocolos') || location.pathname.startsWith('/admin/protocolos')
  const base = location.pathname.startsWith('/conteudo/protocolos') ? '/conteudo/protocolos'
             : location.pathname.startsWith('/admin/protocolos')    ? '/admin/protocolos'
             : location.pathname.startsWith('/conteudo/treinos')    ? '/conteudo/treinos'
             : '/admin/treinos'
  const home = location.pathname.startsWith('/conteudo') ? '/admin'
             : location.pathname.startsWith('/gestao')   ? '/gestao'
             : '/admin'

  const { data: itens = [], isLoading } = useSWR(
    token ? ['lista', isProtocolos] : null,
    () => isProtocolos ? templatesService.listar() : treinosService.listar()
  )

  const filtrados = useMemo(() => {
    if (!query) return itens
    const q = query.toLowerCase()
    return itens.filter(p =>
      p.nome.toLowerCase().includes(q) ||
      p.aluno_nome?.toLowerCase().includes(q) ||
      p.criterio_objetivo?.toLowerCase().includes(q)
    )
  }, [itens, query])

  const idKey = isProtocolos ? 'id_protocolo_template' : 'id_protocolo'

  const colProtocolos = useMemo(() => [
    {
      accessorKey: 'nome',
      header: 'Protocolo',
      cell: ({ row: { original: p } }) => (
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>{p.nome}</p>
          {p.objetivo && <p style={{ fontSize: 11, color: '#8A7F76' }}>{p.objetivo}</p>}
        </div>
      ),
    },
    {
      accessorKey: 'criterio_objetivo',
      header: 'Objetivo',
      cell: ({ getValue }) => getValue()
        ? <p style={{ fontSize: 13, color: '#1A1A1A' }}>{getValue()}</p>
        : <span style={{ fontSize: 12, color: '#C4B9A8' }}>Qualquer</span>,
    },
    {
      accessorKey: 'criterio_nivel',
      header: 'Nível',
      cell: ({ getValue }) => getValue()
        ? <p style={{ fontSize: 12, color: '#6B6560' }}>{getValue()}</p>
        : <span style={{ fontSize: 12, color: '#C4B9A8' }}>Qualquer</span>,
    },
    {
      accessorKey: 'criterio_sexo',
      header: 'Sexo / Idade',
      size: 140,
      cell: ({ row: { original: p } }) => {
        const sexo  = p.criterio_sexo === 'M' ? 'Masculino' : p.criterio_sexo === 'F' ? 'Feminino' : null
        const idade = (p.criterio_idade_min || p.criterio_idade_max)
          ? `${p.criterio_idade_min ?? '?'}–${p.criterio_idade_max ?? '?'} anos` : null
        if (!sexo && !idade) return <span style={{ fontSize: 12, color: '#C4B9A8' }}>Qualquer</span>
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sexo  && <span style={{ fontSize: 12, fontWeight: 600, color: '#6B6560' }}>{sexo}</span>}
            {idade && <span style={{ fontSize: 11, color: '#8A7F76' }}>{idade}</span>}
          </div>
        )
      },
    },
    {
      accessorKey: 'dias_treino',
      header: 'Dias',
      size: 70,
      cell: ({ getValue }) => <span style={{ fontSize: 13, fontWeight: 700, color: '#CC1A1A' }}>{getValue()}x</span>,
    },
    {
      accessorKey: 'ativo',
      header: 'Status',
      size: 100,
      enableSorting: false,
      cell: ({ getValue }) => (
        <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: getValue() ? 'rgba(34,197,94,0.1)' : '#F0EBE4', color: getValue() ? '#15803d' : '#8A7F76' }}>
          {getValue() ? 'ATIVO' : 'INATIVO'}
        </span>
      ),
    },
    {
      id: 'acoes', header: '', size: 48, enableSorting: false,
      cell: ({ row: { original: p } }) => <BtnEditar iconOnly onClick={() => navigate(`${base}/${p.id_protocolo_template}`)} />,
    },
  ], [base])

  const colTreinos = useMemo(() => [
    {
      accessorKey: 'aluno_nome',
      header: 'Aluno',
      cell: ({ row: { original: p } }) => (
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>{p.aluno_nome}</p>
          <p style={{ fontSize: 11, color: '#8A7F76' }}>{p.aluno_email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'nome',
      header: 'Treino',
      cell: ({ row: { original: p } }) => (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>{p.nome}</p>
          {p.template_nome && <p style={{ fontSize: 11, color: '#8A7F76' }}>Base: {p.template_nome}</p>}
        </div>
      ),
    },
    {
      accessorKey: 'dias_treino',
      header: 'Dias',
      size: 70,
      cell: ({ getValue }) => <span style={{ fontSize: 13, fontWeight: 700, color: '#CC1A1A' }}>{getValue()}x</span>,
    },
    {
      accessorKey: 'data_inicio',
      header: 'Início',
      size: 110,
      cell: ({ row: { original: p } }) => <span style={{ fontSize: 12, color: '#6B6560' }}>{data(p.data_inicio)}</span>,
    },
    {
      accessorKey: 'ativo',
      header: 'Status',
      size: 100,
      enableSorting: false,
      cell: ({ getValue }) => (
        <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: getValue() ? 'rgba(34,197,94,0.1)' : '#F0EBE4', color: getValue() ? '#15803d' : '#8A7F76' }}>
          {getValue() ? 'ATIVO' : 'INATIVO'}
        </span>
      ),
    },
    {
      id: 'acoes', header: '', size: 48, enableSorting: false,
      cell: ({ row: { original: p } }) => <BtnEditar iconOnly onClick={() => navigate(`${base}/${p.id_protocolo}`)} />,
    },
  ], [base])

  function renderCard(p) {
    const id = p[idKey]
    return (
      <div key={id} style={{ padding: '14px 20px', borderTop: '1px solid #F0EBE4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {!isProtocolos && <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>{p.aluno_nome}</p>}
            <p style={{ fontSize: 13, color: '#6B6560', marginBottom: 4 }}>{p.nome}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#CC1A1A' }}>{p.dias_treino}x/sem</span>
              {isProtocolos && p.criterio_objetivo && <span style={{ fontSize: 11, color: '#8A7F76' }}>{p.criterio_objetivo}</span>}
              <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: p.ativo ? 'rgba(34,197,94,0.1)' : '#F0EBE4', color: p.ativo ? '#15803d' : '#8A7F76' }}>
                {p.ativo ? 'ATIVO' : 'INATIVO'}
              </span>
            </div>
          </div>
          <BtnEditar iconOnly onClick={() => navigate(`${base}/${id}`)} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>
            {isProtocolos ? 'Protocolos' : 'Treinos'}
          </h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>
            {isProtocolos
              ? `${itens.length} template${itens.length !== 1 ? 's' : ''} — atribuídos automaticamente pelo perfil do aluno`
              : `${itens.filter(p => p.ativo).length} treinos ativos`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => navigate(home)}
            style={{ height: 36, paddingInline: 14, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6B6560' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B9A8'; e.currentTarget.style.color = '#1A1A1A' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#6B6560' }}
          >
            <Home size={14} /> Home
          </button>
          <BtnIncluir
            onClick={() => navigate(`${base}/novo`)}
            label={isProtocolos ? 'Novo protocolo' : 'Novo treino'}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 12, overflow: 'hidden', height: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', flex: 1 }}>
          <Search size={15} color="#8A7F76" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setQuery(busca)}
            placeholder={isProtocolos ? 'Buscar por nome ou objetivo...' : 'Buscar por aluno ou treino...'}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#1A1A1A', background: 'transparent' }}
          />
        </div>
        <button
          onClick={() => setQuery(busca)}
          style={{ height: '100%', paddingInline: 16, border: 'none', borderLeft: '1px solid #E0D6CA', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#6B6560', background: '#F7F3EE', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#EEE8E0'; e.currentTarget.style.color = '#1A1A1A' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#F7F3EE'; e.currentTarget.style.color = '#6B6560' }}
        >
          Consultar
        </button>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <DataTable
          data={filtrados}
          columns={isProtocolos ? colProtocolos : colTreinos}
          loading={isLoading}
          emptyIcon={isProtocolos ? <LayoutTemplate size={32} color="#C4B9A8" /> : <Users size={32} color="#C4B9A8" />}
          emptyText={isProtocolos ? 'Nenhum protocolo cadastrado' : 'Nenhum treino individual cadastrado'}
          pageSize={20}
          renderCard={renderCard}
        />
      </div>

    </div>
  )
}
