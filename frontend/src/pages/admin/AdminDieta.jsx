import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useSWR, { mutate } from 'swr'
import { Salad, Search, Home, Copy, X, ClipboardList, ChevronDown, ChevronUp, UserRound, PowerOff, Trash2, Power, Send, FileEdit, Eye, Sparkles } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { BtnIncluir, BtnEditar } from '../../components/ui/Botoes'
import { DataTable } from '../../components/ui/DataTable'
import * as dietaService from '../../services/dieta'
import * as alunosService from '../../services/alunos'
import * as nutricionistasService from '../../services/nutricionistas'
import { data } from '../../utils/formatters'

function ModalReplicar({ plano, alunos, onClose }) {
  const [idDestino, setIdDestino] = useState('')
  const [salvando, setSalvando]   = useState(false)
  const [erro, setErro]           = useState(null)
  const [ok, setOk]               = useState(false)

  async function replicar() {
    if (!idDestino) { setErro('Selecione o aluno'); return }
    setSalvando(true); setErro(null)
    try {
      await dietaService.clonar(plano.id_dieta_plano, Number(idDestino))
      mutate('dieta-planos')
      mutate('dieta-solicitacoes')
      setOk(true)
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao replicar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A' }}>Replicar plano</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} color="#8A7F76" />
          </button>
        </div>

        {ok ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '16px 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Copy size={22} color="#15803D" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>Plano replicado com sucesso!</p>
            <button onClick={onClose} style={{ marginTop: 8, height: 40, paddingInline: 24, borderRadius: 10, border: 'none', background: '#CC1A1A', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Fechar
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: '#8A7F76', marginBottom: 20 }}>
              Copiar <strong style={{ color: '#1A1A1A' }}>{plano.nome}</strong> para outro aluno. O plano original não será alterado.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Aluno destino</label>
              <select
                value={idDestino}
                onChange={e => setIdDestino(e.target.value)}
                style={{ height: 42, padding: '0 14px', border: '1px solid #E0D6CA', borderRadius: 10, fontSize: 14, color: '#1A1A1A', outline: 'none', background: '#FFFFFF', cursor: 'pointer' }}
              >
                <option value="">Selecione o aluno</option>
                {alunos.filter(a => a.id_usuario !== plano.id_usuario).map(a => (
                  <option key={a.id_usuario} value={a.id_usuario}>{a.nome}</option>
                ))}
              </select>
            </div>

            {erro && (
              <p style={{ fontSize: 12, color: '#CC1A1A', marginBottom: 12 }}>{erro}</p>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onClose}
                style={{ flex: 1, height: 42, borderRadius: 12, border: '1px solid #E0D6CA', background: '#FFFFFF', fontSize: 13, fontWeight: 700, color: '#6B6560', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={replicar}
                disabled={salvando}
                style={{ flex: 1, height: 42, borderRadius: 12, border: 'none', background: '#CC1A1A', fontSize: 13, fontWeight: 700, color: '#FFFFFF', cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}
              >
                {salvando ? 'Replicando...' : 'Replicar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function fmtData(d) {
  if (!d) return ''
  const s = typeof d === 'string' ? d : d.toISOString()
  return new Date(s.includes('T') ? s : s + 'T12:00:00').toLocaleDateString('pt-BR')
}

function PainelSolicitacoes({ solicitacoes, nutricionistas, onCriarDieta, onMarcarAndamento, onGerarComIA }) {
  const [aberto, setAberto]           = useState(true)
  const [expandido, setExpandido]     = useState(null)
  const [gerando, setGerando]         = useState(null)
  const [idNutri, setIdNutri]         = useState('')

  if (!solicitacoes.length) return null

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #F59E0B', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(245,158,11,0.1)' }}>
      {/* Header */}
      <div
        onClick={() => setAberto(a => !a)}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 24px', cursor: 'pointer', background: 'rgba(245,158,11,0.06)', borderBottom: aberto ? '1px solid #FEF3C7' : 'none' }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ClipboardList size={17} color="#B45309" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>
            Solicitações de dieta
            <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: '#F59E0B', color: '#FFFFFF', fontSize: 11, fontWeight: 900 }}>
              {solicitacoes.length}
            </span>
          </p>
          <p style={{ fontSize: 12, color: '#B45309' }}>Alunos aguardando plano alimentar</p>
        </div>
        {aberto ? <ChevronUp size={16} color="#B45309" /> : <ChevronDown size={16} color="#B45309" />}
      </div>

      {aberto && nutricionistas.length > 0 && (
        <div style={{ padding: '10px 24px', background: 'rgba(245,158,11,0.04)', borderBottom: '1px solid #FEF3C7', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Nutricionista (IA)</span>
          <select
            value={idNutri}
            onChange={e => setIdNutri(e.target.value)}
            style={{ height: 32, padding: '0 10px', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 12, color: '#92400E', background: '#FFFBEB', cursor: 'pointer', outline: 'none', flex: 1, maxWidth: 260 }}
          >
            <option value="">Sem diretriz (padrão)</option>
            {nutricionistas.map(n => <option key={n.id_usuario} value={n.id_usuario}>{n.nome}</option>)}
          </select>
        </div>
      )}

      {aberto && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {solicitacoes.map((sol, i) => {
            const isExpandido = expandido === sol.id_dieta_solicitacao
            return (
              <div key={sol.id_dieta_solicitacao} style={{ borderTop: i > 0 ? '1px solid #FEF3C7' : 'none' }}>
                {/* Linha do aluno */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#F0EBE4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <UserRound size={16} color="#8A7F76" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 1 }}>{sol.aluno_nome}</p>
                    <p style={{ fontSize: 12, color: '#8A7F76' }}>
                      {sol.objetivo || 'Objetivo não informado'}
                      {sol.refeicoes_dia ? ` · ${sol.refeicoes_dia}x/dia` : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: '#B45309', background: 'rgba(245,158,11,0.12)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                      {fmtData(sol.data_solicitacao)}
                    </span>
                    <button
                      onClick={() => setExpandido(isExpandido ? null : sol.id_dieta_solicitacao)}
                      style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #E0D6CA', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {isExpandido ? <ChevronUp size={13} color="#8A7F76" /> : <ChevronDown size={13} color="#8A7F76" />}
                    </button>
                  </div>
                </div>

                {/* Detalhes expandidos */}
                {isExpandido && (
                  <div style={{ padding: '0 24px 16px', display: 'flex', flexDirection: 'column', gap: 12, background: '#FDFAF7' }}>
                    {sol.restricoes && (
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#B0A89E', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Restrições</p>
                        <p style={{ fontSize: 13, color: '#1A1A1A' }}>{sol.restricoes}</p>
                      </div>
                    )}
                    {sol.preferencias && (
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#B0A89E', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Preferências</p>
                        <p style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.5 }}>{sol.preferencias}</p>
                      </div>
                    )}
                    {sol.observacao && (
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#B0A89E', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Observações</p>
                        <p style={{ fontSize: 13, color: '#1A1A1A', lineHeight: 1.5 }}>{sol.observacao}</p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, paddingTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        onClick={async () => {
                          if (!idNutri) return
                          setGerando(sol.id_dieta_solicitacao)
                          try { await onGerarComIA(sol, idNutri) }
                          finally { setGerando(null) }
                        }}
                        disabled={gerando === sol.id_dieta_solicitacao || !idNutri}
                        title={!idNutri ? 'Selecione a nutricionista acima para gerar com IA' : ''}
                        style={{ height: 34, paddingInline: 14, borderRadius: 9, border: 'none', background: (!idNutri || gerando === sol.id_dieta_solicitacao) ? '#B0A89E' : '#CC1A1A', color: '#FFFFFF', fontSize: 12, fontWeight: 700, cursor: (!idNutri || gerando === sol.id_dieta_solicitacao) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Sparkles size={13} />
                        {gerando === sol.id_dieta_solicitacao ? 'Gerando...' : 'Gerar com IA'}
                      </button>
                      <button
                        onClick={() => onCriarDieta(sol)}
                        style={{ height: 34, paddingInline: 14, borderRadius: 9, border: '1px solid #E0D6CA', background: '#FFFFFF', color: '#6B6560', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Criar manualmente
                      </button>
                      {!idNutri && (
                        <span style={{ fontSize: 11, color: '#B45309', fontStyle: 'italic' }}>
                          Selecione a nutricionista acima para gerar com IA
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminDieta() {
  const { token } = useAuthContext()
  const navigate = useNavigate()
  const location = useLocation()
  const base = location.pathname.startsWith('/nutri') ? '/nutri/dietas' : '/admin/dieta'
  const home = location.pathname.startsWith('/nutri') ? '/nutri/dietas' : '/admin'
  const [busca, setBusca]               = useState('')
  const [query, setQuery]               = useState('')
  const [planoReplicar, setPlanoReplicar] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function handleToggle(p) {
    await dietaService.toggleAtivo(p.id_dieta_plano)
    mutate('dieta-planos')
  }

  async function handleStatusPlano(p, status) {
    await dietaService.atualizarStatusPlano(p.id_dieta_plano, status)
    mutate('dieta-planos')
  }

  async function handleDelete(id) {
    await dietaService.deletarPlano(id)
    setConfirmDelete(null)
    mutate('dieta-planos')
  }

  const { data: planos = [], isLoading } = useSWR(
    token ? 'dieta-planos' : null,
    () => dietaService.listar()
  )

  const { data: alunos = [] } = useSWR(
    token ? 'alunos-lista' : null,
    () => alunosService.listar()
  )

  const { data: nutricionistas = [] } = useSWR(
    token ? 'nutricionistas-lista' : null,
    () => nutricionistasService.listar({ status: 'ativos' })
  )

  const { data: solicitacoes = [] } = useSWR(
    token ? 'dieta-solicitacoes' : null,
    () => dietaService.listarSolicitacoes()
  )

  async function handleMarcarAndamento(sol) {
    await dietaService.atualizarStatusSolicitacao(sol.id_dieta_solicitacao, 'em_andamento')
    mutate('dieta-solicitacoes')
  }

  function handleCriarDieta(sol) {
    navigate(`${base}/novo?id_usuario=${sol.id_usuario}&id_solicitacao=${sol.id_dieta_solicitacao}`, { state: { aluno_nome: sol.aluno_nome } })
  }

  async function handleGerarComIA(sol, idNutricionista) {
    const result = await dietaService.gerarComIA(sol.id_dieta_solicitacao, idNutricionista)
    mutate('dieta-planos')
    mutate('dieta-solicitacoes')
    navigate(`${base}/${result.id_dieta_plano}`)
  }

  const filtrados = useMemo(() => {
    if (!query) return planos
    const q = query.toLowerCase()
    return planos.filter(p =>
      p.nome.toLowerCase().includes(q) ||
      p.aluno_nome?.toLowerCase().includes(q) ||
      p.objetivo?.toLowerCase().includes(q)
    )
  }, [planos, query])

  const colunas = useMemo(() => [
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
      header: 'Plano',
      cell: ({ row: { original: p } }) => (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>{p.nome}</p>
          {p.objetivo && <p style={{ fontSize: 11, color: '#8A7F76' }}>{p.objetivo}</p>}
        </div>
      ),
    },
    {
      accessorKey: 'calorias_meta',
      header: 'Meta',
      size: 130,
      cell: ({ row: { original: p } }) => (
        <div>
          {p.calorias_meta && <p style={{ fontSize: 13, fontWeight: 700, color: '#CC1A1A' }}>{p.calorias_meta} kcal</p>}
          {p.proteina_meta && <p style={{ fontSize: 11, color: '#8A7F76' }}>{p.proteina_meta}g prot</p>}
        </div>
      ),
    },
    {
      accessorKey: 'nutricionista_nome',
      header: 'Nutricionista',
      size: 150,
      cell: ({ getValue }) => (
        <p style={{ fontSize: 13, color: getValue() ? '#1A1A1A' : '#B0A89E', fontStyle: getValue() ? 'normal' : 'italic' }}>
          {getValue() || 'Não definida'}
        </p>
      ),
    },
    {
      accessorKey: 'qtd_refeicoes',
      header: 'Refeições',
      size: 90,
      cell: ({ getValue }) => (
        <span style={{ fontSize: 13, fontWeight: 700, color: '#CC1A1A' }}>{getValue()}x</span>
      ),
    },
    {
      accessorKey: 'data_inicio',
      header: 'Início',
      size: 110,
      cell: ({ row: { original: p } }) => (
        <span style={{ fontSize: 12, color: '#6B6560' }}>{data(p.data_inicio)}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      size: 130,
      enableSorting: false,
      cell: ({ row: { original: p } }) => {
        const sp = p.status_plano || 'rascunho'
        const cfg = {
          rascunho: { label: 'Rascunho',   bg: '#F0EBE4',                 color: '#8A7F76', Icon: FileEdit },
          revisao:  { label: 'Em revisão', bg: 'rgba(234,179,8,0.12)',    color: '#B45309', Icon: Eye },
          liberado: { label: 'Liberado',   bg: 'rgba(34,197,94,0.1)',     color: '#15803D', Icon: Send },
        }[sp] || { label: sp, bg: '#F0EBE4', color: '#8A7F76', Icon: FileEdit }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: cfg.bg, color: cfg.color }}>
              {cfg.Icon && <cfg.Icon size={9} />}
              {cfg.label}
            </span>
            {!p.ativo && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#B0A89E' }}>INATIVO</span>
            )}
            {sp === 'revisao' && p.ativo && (
              <button onClick={() => handleStatusPlano(p, 'liberado')} style={{ fontSize: 10, fontWeight: 700, color: '#15803D', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                → Liberar para aluno
              </button>
            )}
          </div>
        )
      },
    },
    {
      id: 'acoes',
      header: '',
      size: 130,
      enableSorting: false,
      cell: ({ row: { original: p } }) => {
        const confirmando = confirmDelete === p.id_dieta_plano
        return confirmando ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#CC1A1A', fontWeight: 600 }}>Excluir?</span>
            <button onClick={() => handleDelete(p.id_dieta_plano)} style={{ height: 28, paddingInline: 10, borderRadius: 7, border: 'none', background: '#CC1A1A', color: '#FFF', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Sim</button>
            <button onClick={() => setConfirmDelete(null)} style={{ height: 28, paddingInline: 10, borderRadius: 7, border: '1px solid #E0D6CA', background: '#FFF', color: '#6B6560', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Não</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 5 }}>
            <button
              onClick={() => setPlanoReplicar(p)}
              title="Replicar"
              style={{ width: 30, height: 30, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#CC1A1A'; e.currentTarget.style.background = 'rgba(204,26,26,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.background = '#FFF' }}
            >
              <Copy size={12} color="#CC1A1A" />
            </button>
            <button
              onClick={() => handleToggle(p)}
              title={p.ativo ? 'Desativar' : 'Reativar'}
              style={{ width: 30, height: 30, border: `1px solid ${p.ativo ? '#E0D6CA' : 'rgba(34,197,94,0.4)'}`, borderRadius: 8, background: p.ativo ? '#FFF' : 'rgba(34,197,94,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.7' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              {p.ativo ? <PowerOff size={12} color="#8A7F76" /> : <Power size={12} color="#15803D" />}
            </button>
            <BtnEditar iconOnly onClick={() => navigate(`${base}/${p.id_dieta_plano}`)} />
            <button
              onClick={() => setConfirmDelete(p.id_dieta_plano)}
              title="Excluir"
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
  ], [confirmDelete])

  function renderCard(p) {
    return (
      <div key={p.id_dieta_plano} style={{ padding: '14px 20px', borderTop: '1px solid #F0EBE4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>{p.aluno_nome}</p>
            <p style={{ fontSize: 13, color: '#6B6560', marginBottom: 4 }}>{p.nome}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {p.calorias_meta && <span style={{ fontSize: 12, fontWeight: 700, color: '#CC1A1A' }}>{p.calorias_meta} kcal</span>}
              <span style={{ fontSize: 12, color: '#8A7F76' }}>{p.qtd_refeicoes} refeições</span>
              <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: p.ativo ? 'rgba(34,197,94,0.1)' : '#F0EBE4', color: p.ativo ? '#15803d' : '#8A7F76' }}>
                {p.ativo ? 'ATIVO' : 'INATIVO'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={() => setPlanoReplicar(p)} style={{ width: 30, height: 30, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Copy size={12} color="#CC1A1A" />
            </button>
            <button onClick={() => handleToggle(p)} title={p.ativo ? 'Desativar' : 'Reativar'} style={{ width: 30, height: 30, border: `1px solid ${p.ativo ? '#E0D6CA' : 'rgba(34,197,94,0.4)'}`, borderRadius: 8, background: p.ativo ? '#FFF' : 'rgba(34,197,94,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {p.ativo ? <PowerOff size={12} color="#8A7F76" /> : <Power size={12} color="#15803D" />}
            </button>
            <BtnEditar iconOnly onClick={() => navigate(`${base}/${p.id_dieta_plano}`)} />
            <button onClick={() => setConfirmDelete(p.id_dieta_plano)} style={{ width: 30, height: 30, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={12} color="#CC1A1A" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Dieta</h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>{planos.filter(p => p.ativo).length} planos ativos</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => navigate(home)}
            style={{ height: 36, paddingInline: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#6B6560' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B9A8'; e.currentTarget.style.color = '#1A1A1A' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#6B6560' }}
          >
            <Home size={14} /> Home
          </button>
          <BtnIncluir onClick={() => navigate(`${base}/novo`)} label="Novo plano" />
        </div>
      </div>

      {/* Solicitações pendentes */}
      <PainelSolicitacoes
        solicitacoes={solicitacoes}
        nutricionistas={nutricionistas}
        onCriarDieta={handleCriarDieta}
        onMarcarAndamento={handleMarcarAndamento}
        onGerarComIA={handleGerarComIA}
      />

      {/* Busca */}
      <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 12, overflow: 'hidden', height: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', flex: 1 }}>
          <Search size={15} color="#8A7F76" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setQuery(busca)}
            placeholder="Buscar por aluno ou plano..."
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
          columns={colunas}
          loading={isLoading}
          emptyIcon={<Salad size={32} color="#C4B9A8" />}
          emptyText="Nenhum plano de dieta cadastrado"
          pageSize={20}
          renderCard={renderCard}
        />
      </div>

      {planoReplicar && (
        <ModalReplicar
          plano={planoReplicar}
          alunos={alunos}
          onClose={() => setPlanoReplicar(null)}
        />
      )}

    </div>
  )
}
