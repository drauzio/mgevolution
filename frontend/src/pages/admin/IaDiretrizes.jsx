import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useSWR, { mutate } from 'swr'
import { Sparkles, Home, Trash2, BotMessageSquare } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { BtnIncluir, BtnEditar } from '../../components/ui/Botoes'
import { DataTable } from '../../components/ui/DataTable'
import * as svc from '../../services/ia-diretrizes'
import * as nutricionistasService from '../../services/nutricionistas'

const CRITERIO_LABEL = { objetivo: 'Objetivo', sexo: 'Sexo', nivel: 'Nível' }

export default function IaDiretrizes() {
  const { token } = useAuthContext()
  const navigate  = useNavigate()
  const location  = useLocation()
  const base = location.pathname.startsWith('/nutri') ? '/nutri/ia-diretrizes' : '/admin/ia-diretrizes'
  const home = location.pathname.startsWith('/nutri') ? '/nutri' : '/admin'

  const [confirmDelete, setConfirmDelete] = useState(null)
  const [filtraNutri, setFiltraNutri]     = useState('')

  const { data: lista = [], isLoading } = useSWR(
    token ? ['ia-diretrizes', filtraNutri] : null,
    () => svc.listar(filtraNutri ? { id_nutricionista: filtraNutri } : {})
  )

  const { data: nutricionistas = [] } = useSWR(
    token ? 'nutricionistas-lista' : null,
    () => nutricionistasService.listar({ status: 'ativos' })
  )

  async function handleDelete(id) {
    await svc.deletar(id)
    setConfirmDelete(null)
    mutate(['ia-diretrizes', filtraNutri])
  }

  const colunas = [
    {
      accessorKey: 'usuario_nome',
      header: 'Responsável',
      cell: ({ row: { original: d } }) => (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{d.usuario_nome}</p>
          <p style={{ fontSize: 11, color: '#B0A89E' }}>{d.tipo === 'treino' ? 'Personal' : 'Nutricionista'}</p>
        </div>
      ),
    },
    {
      accessorKey: 'nome',
      header: 'Diretriz',
      cell: ({ row: { original: d } }) => (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 4 }}>{d.nome}</p>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {d.criterios?.map((c, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 7px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: '#F0EBE4', color: '#6B6560' }}>
                {CRITERIO_LABEL[c.criterio] || c.criterio}: {c.valor}
              </span>
            ))}
            {!d.criterios?.length && (
              <span style={{ fontSize: 11, color: '#C4B9A8', fontStyle: 'italic' }}>Genérica (qualquer perfil)</span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'conteudo',
      header: 'Conteúdo',
      cell: ({ getValue }) => (
        <p style={{ fontSize: 12, color: '#6B6560', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {getValue()}
        </p>
      ),
    },
    {
      accessorKey: 'ativo',
      header: 'Status',
      size: 90,
      enableSorting: false,
      cell: ({ getValue }) => (
        <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: getValue() ? 'rgba(34,197,94,0.1)' : '#F0EBE4', color: getValue() ? '#15803d' : '#8A7F76' }}>
          {getValue() ? 'ATIVA' : 'INATIVA'}
        </span>
      ),
    },
    {
      id: 'acoes', header: '', size: 90, enableSorting: false,
      cell: ({ row: { original: d } }) => {
        const confirmando = confirmDelete === d.id_diretriz
        return confirmando ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#CC1A1A', fontWeight: 600 }}>Excluir?</span>
            <button onClick={() => handleDelete(d.id_diretriz)} style={{ height: 28, paddingInline: 10, borderRadius: 7, border: 'none', background: '#CC1A1A', color: '#FFF', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Sim</button>
            <button onClick={() => setConfirmDelete(null)} style={{ height: 28, paddingInline: 10, borderRadius: 7, border: '1px solid #E0D6CA', background: '#FFF', color: '#6B6560', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Não</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 5 }}>
            <BtnEditar iconOnly onClick={() => navigate(`${base}/${d.id_diretriz}`)} />
            <button
              onClick={() => setConfirmDelete(d.id_diretriz)}
              style={{ width: 30, height: 30, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#CC1A1A'; e.currentTarget.style.background = 'rgba(204,26,26,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.background = '#FFF' }}
            >
              <Trash2 size={12} color="#CC1A1A" />
            </button>
          </div>
        )
      },
    },
  ]

  function renderCard(d) {
    return (
      <div key={d.id_diretriz} style={{ padding: '14px 20px', borderTop: '1px solid #F0EBE4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>{d.nome}</p>
            <p style={{ fontSize: 12, color: '#8A7F76', marginBottom: 6 }}>{d.usuario_nome}</p>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {d.criterios?.map((c, i) => (
                <span key={i} style={{ padding: '1px 7px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: '#F0EBE4', color: '#6B6560' }}>
                  {CRITERIO_LABEL[c.criterio] || c.criterio}: {c.valor}
                </span>
              ))}
            </div>
          </div>
          <BtnEditar iconOnly onClick={() => navigate(`${base}/${d.id_diretriz}`)} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Diretrizes de IA</h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>
            {lista.length} diretriz{lista.length !== 1 ? 'es' : ''} — guiam a geração de dietas por nutricionista
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(home)}
            style={{ height: 36, paddingInline: 14, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6B6560' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B9A8'; e.currentTarget.style.color = '#1A1A1A' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#6B6560' }}
          >
            <Home size={14} /> Home
          </button>
          <BtnIncluir onClick={() => navigate(`${base}/nova`)} label="Nova diretriz" />
        </div>
      </div>

      {/* Filtro por nutricionista */}
      {nutricionistas.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setFiltraNutri('')}
            style={{ height: 32, paddingInline: 14, borderRadius: 8, border: `1px solid ${!filtraNutri ? '#CC1A1A' : '#E0D6CA'}`, background: !filtraNutri ? 'rgba(204,26,26,0.08)' : '#FFF', color: !filtraNutri ? '#CC1A1A' : '#6B6560', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Todas
          </button>
          {nutricionistas.map(n => (
            <button
              key={n.id_usuario}
              onClick={() => setFiltraNutri(String(n.id_usuario))}
              style={{ height: 32, paddingInline: 14, borderRadius: 8, border: `1px solid ${filtraNutri === String(n.id_usuario) ? '#CC1A1A' : '#E0D6CA'}`, background: filtraNutri === String(n.id_usuario) ? 'rgba(204,26,26,0.08)' : '#FFF', color: filtraNutri === String(n.id_usuario) ? '#CC1A1A' : '#6B6560', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              {n.nome}
            </button>
          ))}
        </div>
      )}

      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <DataTable
          data={lista}
          columns={colunas}
          loading={isLoading}
          emptyIcon={<BotMessageSquare size={32} color="#C4B9A8" />}
          emptyText="Nenhuma diretriz cadastrada"
          pageSize={20}
          renderCard={renderCard}
        />
      </div>

    </div>
  )
}
