import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR, { mutate } from 'swr'
import { Salad, Search, Home, Copy, X } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { BtnIncluir, BtnEditar } from '../../components/ui/Botoes'
import { DataTable } from '../../components/ui/DataTable'
import * as dietaService from '../../services/dieta'
import * as alunosService from '../../services/alunos'
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

export default function AdminDieta() {
  const { token } = useAuthContext()
  const navigate = useNavigate()
  const [busca, setBusca]           = useState('')
  const [query, setQuery]           = useState('')
  const [planoReplicar, setPlanoReplicar] = useState(null)

  const { data: planos = [], isLoading } = useSWR(
    token ? 'dieta-planos' : null,
    () => dietaService.listar()
  )

  const { data: alunos = [] } = useSWR(
    token ? 'alunos-lista' : null,
    () => alunosService.listar()
  )

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
      accessorKey: 'ativo',
      header: 'Status',
      size: 90,
      enableSorting: false,
      cell: ({ getValue }) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: getValue() ? 'rgba(34,197,94,0.1)' : '#F0EBE4', color: getValue() ? '#15803d' : '#8A7F76' }}>
          {getValue() ? 'ATIVO' : 'INATIVO'}
        </span>
      ),
    },
    {
      id: 'acoes',
      header: '',
      size: 80,
      enableSorting: false,
      cell: ({ row: { original: p } }) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setPlanoReplicar(p)}
            title="Replicar para outro aluno"
            style={{ width: 32, height: 32, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#CC1A1A'; e.currentTarget.style.background = 'rgba(204,26,26,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.background = '#FFF' }}
          >
            <Copy size={13} color="#CC1A1A" />
          </button>
          <BtnEditar iconOnly onClick={() => navigate(`/admin/dieta/${p.id_dieta_plano}`)} />
        </div>
      ),
    },
  ], [])

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
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPlanoReplicar(p)}
              style={{ width: 32, height: 32, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Copy size={13} color="#CC1A1A" />
            </button>
            <BtnEditar iconOnly onClick={() => navigate(`/admin/dieta/${p.id_dieta_plano}`)} />
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
            onClick={() => navigate('/admin')}
            style={{ height: 36, paddingInline: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#6B6560' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B9A8'; e.currentTarget.style.color = '#1A1A1A' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#6B6560' }}
          >
            <Home size={14} /> Home
          </button>
          <BtnIncluir onClick={() => navigate('/admin/dieta/novo')} label="Novo plano" />
        </div>
      </div>

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
