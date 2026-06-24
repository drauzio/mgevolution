import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import useSWR from 'swr'
import { Plus, Trash2 } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { BtnSalvar, BtnCancelar } from '../../components/ui/Botoes'
import * as svc from '../../services/ia-diretrizes'
import * as nutricionistasService from '../../services/nutricionistas'
import * as personaisService from '../../services/personais'

const CRITERIOS   = ['objetivo', 'sexo', 'nivel']
const LABEL_CRIT  = { objetivo: 'Objetivo', sexo: 'Sexo', nivel: 'Nível' }

const VALORES = {
  objetivo: ['Emagrecer', 'Ganhar massa muscular', 'Manutenção do peso', 'Saúde e qualidade de vida', 'Definição muscular'],
  sexo:     ['M', 'F'],
  nivel:    ['Iniciante', 'Intermediário', 'Avançado'],
}

const inputStyle = {
  height: 42, padding: '0 14px',
  border: '1px solid #E0D6CA', borderRadius: 10,
  fontSize: 14, color: '#1A1A1A', outline: 'none', background: '#FFFFFF',
  width: '100%', boxSizing: 'border-box',
}

function Campo({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</label>
      {children}
    </div>
  )
}

export default function IaDiretrizForm() {
  const { id } = useParams()
  const isEdicao = !!id
  const navigate = useNavigate()
  const location = useLocation()
  const voltarBase = location.pathname.startsWith('/nutri') ? '/nutri/ia-diretrizes' : '/admin/ia-diretrizes'
  const { token } = useAuthContext()

  const { data: nutricionistas = [] } = useSWR(
    token ? 'nutricionistas-lista' : null,
    () => nutricionistasService.listar({ status: 'ativos' })
  )

  const { data: personais = [] } = useSWR(
    token ? 'personais-lista' : null,
    () => personaisService.listar({ status: 'ativos' })
  )

  const [form, setForm] = useState({
    id_usuario: '',
    nome: '',
    tipo: 'dieta',
    conteudo: '',
    ativo: 1,
  })

  const responsaveis = form.tipo === 'treino' ? personais : nutricionistas
  const [criterios, setCriterios] = useState([])
  const [salvando, setSalvando]   = useState(false)
  const [erro, setErro]           = useState(null)
  const [carregando, setCarregando] = useState(isEdicao)

  useEffect(() => {
    if (!isEdicao) return
    svc.buscarPorId(id)
      .then(data => {
        setForm({
          id_usuario: data.id_usuario ?? '',
          nome:       data.nome       || '',
          tipo:       data.tipo       || 'dieta',
          conteudo:   data.conteudo   || '',
          ativo:      data.ativo      ?? 1,
        })
        setCriterios(data.criterios || [])
      })
      .finally(() => setCarregando(false))
  }, [id])

  function setF(k) {
    return e => {
      const val = e.target.value
      setForm(f => ({
        ...f,
        [k]: val,
        ...(k === 'tipo' ? { id_usuario: '' } : {}),
      }))
    }
  }

  function adicionarCriterio() {
    setCriterios(c => [...c, { criterio: 'objetivo', valor: '' }])
  }

  function setCriterioField(i, key, val) {
    setCriterios(c => c.map((item, idx) => idx === i ? { ...item, [key]: val, ...(key === 'criterio' ? { valor: '' } : {}) } : item))
  }

  function removerCriterio(i) {
    setCriterios(c => c.filter((_, idx) => idx !== i))
  }

  async function salvar() {
    if (!form.id_usuario) { setErro(form.tipo === 'treino' ? 'Selecione o personal' : 'Selecione a nutricionista'); return }
    if (!form.nome.trim())      { setErro('Nome é obrigatório'); return }
    if (!form.conteudo.trim())  { setErro('Conteúdo é obrigatório'); return }

    setSalvando(true); setErro(null)
    try {
      const payload = { ...form, criterios }
      if (isEdicao) {
        await svc.atualizar(id, payload)
      } else {
        await svc.criar(payload)
      }
      navigate(voltarBase)
    } catch (e) {
      setErro(e.response?.data?.erro || e.message || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 760 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>
            {isEdicao ? 'Editar Diretriz' : 'Nova Diretriz de IA'}
          </h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>Define como a IA gera dietas para este perfil de aluno.</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <BtnCancelar onClick={() => navigate(voltarBase)} />
          <BtnSalvar onClick={salvar} loading={salvando} />
        </div>
      </div>

      {/* Dados principais */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Identificação</p>

        <div className="ia-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Campo label="Tipo">
            <select value={form.tipo} onChange={setF('tipo')} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="dieta">Dieta</option>
              <option value="treino">Treino</option>
            </select>
          </Campo>

          <Campo label={form.tipo === 'treino' ? 'Personal' : 'Nutricionista'}>
            <select value={form.id_usuario} onChange={setF('id_usuario')} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">{form.tipo === 'treino' ? 'Selecione o personal' : 'Selecione a nutricionista'}</option>
              {responsaveis.map(r => <option key={r.id_usuario} value={r.id_usuario}>{r.nome}</option>)}
            </select>
          </Campo>

          <Campo label="Nome da diretriz">
            <input style={inputStyle} placeholder="Ex: Hipertrofia Masculino" value={form.nome} onChange={setF('nome')} />
          </Campo>

          {isEdicao && (
            <Campo label="Status">
              <select value={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: Number(e.target.value) }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value={1}>Ativa</option>
                <option value={0}>Inativa</option>
              </select>
            </Campo>
          )}
        </div>
      </div>

      {/* Critérios de perfil */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Critérios de perfil</p>
            <p style={{ fontSize: 12, color: '#C4B9A8' }}>Sem critérios = diretriz genérica aplicada a qualquer aluno</p>
          </div>
          <button
            onClick={adicionarCriterio}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, paddingInline: 14, borderRadius: 8, border: '1px dashed #CC1A1A', background: 'rgba(204,26,26,0.04)', color: '#CC1A1A', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
          >
            <Plus size={13} /> Adicionar critério
          </button>
        </div>

        {criterios.length === 0 && (
          <div style={{ padding: '16px 20px', borderRadius: 12, background: '#F7F3EE', border: '1px dashed #E0D6CA', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#B0A89E' }}>Nenhum critério — esta diretriz será usada para qualquer perfil de aluno {form.tipo === 'treino' ? 'deste personal' : 'desta nutricionista'}.</p>
          </div>
        )}

        {criterios.map((c, i) => (
          <div key={i} className="ia-criterio-row" style={{ display: 'grid', gridTemplateColumns: '160px 1fr 32px', gap: 10, alignItems: 'center' }}>
            <select
              value={c.criterio}
              onChange={e => setCriterioField(i, 'criterio', e.target.value)}
              style={{ height: 40, padding: '0 10px', border: '1px solid #E0D6CA', borderRadius: 10, fontSize: 13, color: '#1A1A1A', outline: 'none', background: '#FFFFFF', cursor: 'pointer' }}
            >
              {CRITERIOS.map(k => <option key={k} value={k}>{LABEL_CRIT[k]}</option>)}
            </select>

            <select
              value={c.valor}
              onChange={e => setCriterioField(i, 'valor', e.target.value)}
              style={{ height: 40, padding: '0 10px', border: '1px solid #E0D6CA', borderRadius: 10, fontSize: 13, color: '#1A1A1A', outline: 'none', background: '#FFFFFF', cursor: 'pointer' }}
            >
              <option value="">Selecione</option>
              {(VALORES[c.criterio] || []).map(v => <option key={v} value={v}>{v}</option>)}
            </select>

            <button
              onClick={() => removerCriterio(i)}
              style={{ width: 32, height: 32, border: '1px solid #F0EBE4', borderRadius: 8, background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#CC1A1A'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#F0EBE4'}
            >
              <Trash2 size={13} color="#CC1A1A" />
            </button>
          </div>
        ))}
      </div>

      {/* Conteúdo da diretriz */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Conteúdo das diretrizes</p>
          <p style={{ fontSize: 12, color: '#C4B9A8' }}>
            Escreva em texto livre. A IA vai seguir estas instruções ao montar {form.tipo === 'treino' ? 'o treino' : 'a dieta'}.
          </p>
        </div>

        <textarea
          value={form.conteudo}
          onChange={setF('conteudo')}
          rows={10}
          placeholder={form.tipo === 'treino'
            ? `Exemplo:\n- Priorizar exercícios compostos (agachamento, supino, terra)\n- Sempre incluir aquecimento de 10 min antes do treino\n- Tempo de descanso entre séries: 60-90 segundos\n- Progressão de carga semanal obrigatória\n- Treino de pernas 2x por semana para alunos de hipertrofia\n- Finalizador cardiovascular de 10 min ao fim de cada sessão`
            : `Exemplo:\n- Sempre incluir arroz integral + feijão no almoço e jantar\n- Pós-treino: whey protein + banana obrigatório\n- Evitar ultraprocessados mesmo como substituição\n- Café da manhã sempre com ovo (mínimo 2 unidades)\n- Preferir proteínas magras: frango, tilápia, atum\n- Carboidratos simples apenas no pré e pós-treino`
          }
          style={{ ...inputStyle, height: 'auto', padding: '14px', resize: 'vertical', lineHeight: 1.7, fontFamily: 'inherit' }}
        />
      </div>

      {erro && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A', fontSize: 13 }}>
          {erro}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 600px) {
          .ia-grid-2 { grid-template-columns: 1fr !important; }
          .ia-criterio-row { grid-template-columns: 1fr 1fr 32px !important; }
        }
      `}</style>
    </div>
  )
}
