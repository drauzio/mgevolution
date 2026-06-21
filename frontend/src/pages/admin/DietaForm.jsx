import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom'
import useSWR from 'swr'
import { Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle, ClipboardList, Sparkles } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { BtnSalvar, BtnCancelar } from '../../components/ui/Botoes'
import * as alunosService from '../../services/alunos'
import * as dietaService from '../../services/dieta'
import * as nutricionistasService from '../../services/nutricionistas'

function Campo({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  height: 42, padding: '0 14px',
  border: '1px solid #E0D6CA', borderRadius: 10,
  fontSize: 14, color: '#1A1A1A', outline: 'none', background: '#FFFFFF',
  width: '100%', boxSizing: 'border-box',
}

const UNIDADES = ['g', 'ml', 'unid', 'colher', 'xícara', 'fatia', 'porção']

function ItemRow({ item, onChange, onRemove }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 72px 62px 62px 62px 62px 32px', gap: 6, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F7F3EE' }}>
      <input
        value={item.descricao}
        onChange={e => onChange('descricao', e.target.value)}
        placeholder="Alimento / descrição"
        style={{ height: 34, padding: '0 10px', border: '1px solid #E0D6CA', borderRadius: 8, fontSize: 13, color: '#1A1A1A', outline: 'none', background: '#FFFFFF' }}
      />
      <input
        value={item.quantidade}
        onChange={e => onChange('quantidade', e.target.value)}
        placeholder="Qtd"
        type="number"
        style={{ height: 34, padding: '0 6px', border: '1px solid #E0D6CA', borderRadius: 8, fontSize: 12, color: '#1A1A1A', outline: 'none', textAlign: 'center', background: '#FFFFFF' }}
      />
      <select
        value={item.unidade}
        onChange={e => onChange('unidade', e.target.value)}
        style={{ height: 34, padding: '0 4px', border: '1px solid #E0D6CA', borderRadius: 8, fontSize: 12, color: '#1A1A1A', outline: 'none', background: '#FFFFFF', cursor: 'pointer' }}
      >
        {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
      </select>
      <input
        value={item.calorias}
        onChange={e => onChange('calorias', e.target.value)}
        placeholder="kcal"
        type="number"
        style={{ height: 34, padding: '0 6px', border: '1px solid #E0D6CA', borderRadius: 8, fontSize: 12, color: '#1A1A1A', outline: 'none', textAlign: 'center', background: '#FFFFFF' }}
      />
      <input
        value={item.proteina}
        onChange={e => onChange('proteina', e.target.value)}
        placeholder="prot g"
        type="number"
        style={{ height: 34, padding: '0 6px', border: '1px solid #E0D6CA', borderRadius: 8, fontSize: 12, color: '#1A1A1A', outline: 'none', textAlign: 'center', background: '#FFFFFF' }}
      />
      <input
        value={item.carboidrato}
        onChange={e => onChange('carboidrato', e.target.value)}
        placeholder="carb g"
        type="number"
        style={{ height: 34, padding: '0 6px', border: '1px solid #E0D6CA', borderRadius: 8, fontSize: 12, color: '#1A1A1A', outline: 'none', textAlign: 'center', background: '#FFFFFF' }}
      />
      <input
        value={item.gordura}
        onChange={e => onChange('gordura', e.target.value)}
        placeholder="gord g"
        type="number"
        style={{ height: 34, padding: '0 6px', border: '1px solid #E0D6CA', borderRadius: 8, fontSize: 12, color: '#1A1A1A', outline: 'none', textAlign: 'center', background: '#FFFFFF' }}
      />
      <button
        onClick={onRemove}
        style={{ width: 32, height: 32, border: '1px solid #F0EBE4', borderRadius: 8, background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#CC1A1A'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#F0EBE4'}
      >
        <Trash2 size={13} color="#CC1A1A" />
      </button>
    </div>
  )
}

function normalizarHorario(h) {
  if (!h) return ''
  const s = String(h).trim()
  // já está no formato HH:mm ou HH:mm:ss
  if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5)
  // formato "0730" → "07:30"
  if (/^\d{4}$/.test(s)) return `${s.slice(0, 2)}:${s.slice(2)}`
  return s
}

function novaRefeicao(ordem) {
  return { _uid: Date.now() + Math.random(), nome: '', horario: '', ordem, itens: [] }
}

function novoItem() {
  return { _uid: Date.now() + Math.random(), descricao: '', quantidade: '', unidade: 'g', calorias: '', proteina: '', carboidrato: '', gordura: '', substituicoes: [] }
}

function novaSubstituicao() {
  return { _uid: Date.now() + Math.random(), descricao: '', quantidade: '', unidade: 'g', calorias: '', proteina: '', carboidrato: '', gordura: '' }
}

export default function DietaForm() {
  const { id } = useParams()
  const isEdicao = !!id
  const navigate = useNavigate()
  const location = useLocation()
  const voltarDieta = location.pathname.startsWith('/nutri') ? '/nutri/dietas' : '/admin/dieta'
  const { token } = useAuthContext()
  const [searchParams] = useSearchParams()
  const idUsuarioSolicitacao  = searchParams.get('id_usuario')
  const idSolicitacao         = searchParams.get('id_solicitacao')
  const alunoNomeSolicitacao  = location.state?.aluno_nome || null

  const { data: alunos = [] } = useSWR(token ? 'alunos-lista' : null, () => alunosService.listar())
  const { data: nutricionistas = [] } = useSWR(token ? 'nutricionistas-lista' : null, () => nutricionistasService.listar({ status: 'ativos' }))

  const [form, setForm] = useState({ id_usuario: idUsuarioSolicitacao || '', id_nutricionista: '', nome: '', objetivo: '', calorias_meta: '', proteina_meta: '', data_inicio: '', data_fim: '', observacoes: '', ativo: 1, status_plano: 'rascunho' })

  const { data: dadosAluno } = useSWR(
    token && form.id_usuario ? ['dieta-dados-aluno', form.id_usuario] : null,
    () => dietaService.dadosAluno(form.id_usuario)
  )
  const [refeicoes, setRefeicoes] = useState([novaRefeicao(1)])
  const [abertas, setAbertas] = useState({ 0: true })
  const [salvando, setSalvando]         = useState(false)
  const [gerandoSub, setGerandoSub]     = useState(false)
  const [msgSucesso, setMsgSucesso]     = useState(null)
  const [erro, setErro]                 = useState(null)
  const [carregando, setCarregando]     = useState(isEdicao)

  function aplicarDados(data) {
    setForm({
      id_usuario:       data.id_usuario ?? '',
      id_nutricionista: data.id_nutricionista ?? '',
      nome:             data.nome || '',
      objetivo:         data.objetivo || '',
      calorias_meta:    data.calorias_meta ?? '',
      proteina_meta:    data.proteina_meta ?? '',
      data_inicio:      data.data_inicio?.slice(0, 10) || '',
      data_fim:         data.data_fim?.slice(0, 10) || '',
      observacoes:      data.observacoes || '',
      ativo:            data.ativo       ?? 1,
      status_plano:     data.status_plano || 'liberado',
    })
    setRefeicoes((data.refeicoes || []).map(r => ({
      _uid: r.id_dieta_refeicao,
      nome: r.nome,
      horario: normalizarHorario(r.horario),
      ordem: r.ordem,
      itens: (r.itens || []).map(it => ({
        _uid: it.id_dieta_refeicao_item,
        descricao:   it.descricao,
        quantidade:  it.quantidade  ?? '',
        unidade:     it.unidade     || 'g',
        calorias:    it.calorias    ?? '',
        proteina:    it.proteina    ?? '',
        carboidrato: it.carboidrato ?? '',
        gordura:     it.gordura     ?? '',
        substituicoes: (it.substituicoes || []).map(s => ({
          _uid: s.id_substituicao,
          descricao:   s.descricao,
          quantidade:  s.quantidade  ?? '',
          unidade:     s.unidade     || 'g',
          calorias:    s.calorias    ?? '',
          proteina:    s.proteina    ?? '',
          carboidrato: s.carboidrato ?? '',
          gordura:     s.gordura     ?? '',
        })),
      })),
    })))
    setAbertas({ 0: true })
  }

  useEffect(() => {
    if (!isEdicao) return
    dietaService.buscarPorId(id).then(aplicarDados).finally(() => setCarregando(false))
  }, [id])

  async function handleGerarSubstituicoes() {
    setGerandoSub(true); setErro(null); setMsgSucesso(null)
    try {
      const result = await dietaService.gerarSubstituicoes(id)
      const data = await dietaService.buscarPorId(id)
      aplicarDados(data)
      setMsgSucesso(result.adicionadas > 0
        ? `${result.adicionadas} substituições geradas com sucesso!`
        : 'Todos os itens já possuem substituições.')
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao gerar substituições')
    } finally {
      setGerandoSub(false)
    }
  }

  function setF(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  function toggleRefeicao(i) { setAbertas(a => ({ ...a, [i]: !a[i] })) }

  function adicionarRefeicao() {
    const nova = novaRefeicao(refeicoes.length + 1)
    setRefeicoes(r => [...r, nova])
    setAbertas(a => ({ ...a, [refeicoes.length]: true }))
  }

  function removerRefeicao(i) {
    setRefeicoes(r => r.filter((_, idx) => idx !== i))
    setAbertas(a => { const n = { ...a }; delete n[i]; return n })
  }

  function setRefeicaoField(i, key, val) {
    setRefeicoes(r => r.map((ref, idx) => idx === i ? { ...ref, [key]: val } : ref))
  }

  function adicionarItem(i) {
    setRefeicoes(r => r.map((ref, idx) => idx === i ? { ...ref, itens: [...ref.itens, novoItem()] } : ref))
  }

  function atualizarItem(refIdx, itemIdx, key, val) {
    setRefeicoes(r => r.map((ref, i) => {
      if (i !== refIdx) return ref
      const itens = [...ref.itens]
      itens[itemIdx] = { ...itens[itemIdx], [key]: val }
      return { ...ref, itens }
    }))
  }

  function removerItem(refIdx, itemIdx) {
    setRefeicoes(r => r.map((ref, i) => i !== refIdx ? ref : { ...ref, itens: ref.itens.filter((_, j) => j !== itemIdx) }))
  }

  function adicionarSubstituicao(refIdx, itemIdx) {
    setRefeicoes(r => r.map((ref, i) => {
      if (i !== refIdx) return ref
      const itens = ref.itens.map((it, j) => j !== itemIdx ? it : { ...it, substituicoes: [...(it.substituicoes || []), novaSubstituicao()] })
      return { ...ref, itens }
    }))
  }

  function atualizarSubstituicao(refIdx, itemIdx, subIdx, key, val) {
    setRefeicoes(r => r.map((ref, i) => {
      if (i !== refIdx) return ref
      const itens = ref.itens.map((it, j) => {
        if (j !== itemIdx) return it
        const subs = [...(it.substituicoes || [])]
        subs[subIdx] = { ...subs[subIdx], [key]: val }
        return { ...it, substituicoes: subs }
      })
      return { ...ref, itens }
    }))
  }

  function removerSubstituicao(refIdx, itemIdx, subIdx) {
    setRefeicoes(r => r.map((ref, i) => {
      if (i !== refIdx) return ref
      const itens = ref.itens.map((it, j) => j !== itemIdx ? it : { ...it, substituicoes: (it.substituicoes || []).filter((_, k) => k !== subIdx) })
      return { ...ref, itens }
    }))
  }

  async function salvar() {
    if (!form.nome)       { setErro('Nome do plano é obrigatório'); return }
    if (!form.id_usuario) { setErro('Selecione o aluno'); return }
    setSalvando(true); setErro(null)
    try {
      const payload = { ...form, refeicoes }
      if (isEdicao) {
        await dietaService.atualizar(id, payload)
      } else {
        await dietaService.criar(payload)
        if (idSolicitacao) {
          await dietaService.atualizarStatusSolicitacao(Number(idSolicitacao), 'concluida').catch(() => {})
        }
      }
      navigate(voltarDieta)
    } catch (e) {
      setErro(e.response?.data?.erro || e.message || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const totalCal  = refeicoes.flatMap(r => r.itens).reduce((a, it) => a + (Number(it.calorias) || 0), 0)
  const totalProt = refeicoes.flatMap(r => r.itens).reduce((a, it) => a + (Number(it.proteina) || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>
            {isEdicao ? 'Editar Plano de Dieta' : 'Novo Plano de Dieta'}
          </h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>Monte as refeições e macros do aluno.</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <BtnCancelar onClick={() => navigate(voltarDieta)} />
          <BtnSalvar onClick={salvar} loading={salvando} />
        </div>
      </div>

      {/* Feedback de geração de substituições */}
      {msgSucesso && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', color: '#15803D', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={14} /> {msgSucesso}
        </div>
      )}

      {/* Banner de solicitação */}
      {idSolicitacao && !isEdicao && (
        <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 14, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <ClipboardList size={16} color="#B45309" />
          <p style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>
            Criando dieta a partir de uma solicitação — aluno pré-selecionado. A solicitação será marcada como concluída ao salvar.
          </p>
        </div>
      )}

      {/* Dados básicos */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Informações do Plano</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Campo label="Aluno">
            {idSolicitacao ? (
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', background: '#F7F3EE', color: '#1A1A1A', cursor: 'not-allowed' }}>
                {alunoNomeSolicitacao || alunos.find(a => String(a.id_usuario) === String(form.id_usuario))?.nome || '—'}
              </div>
            ) : (
              <select value={form.id_usuario} onChange={setF('id_usuario')} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Selecione o aluno</option>
                {alunos.map(a => <option key={a.id_usuario} value={a.id_usuario}>{a.nome}</option>)}
              </select>
            )}
          </Campo>

          <Campo label="Nutricionista responsável">
            <select value={form.id_nutricionista} onChange={setF('id_nutricionista')} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Sem nutricionista</option>
              {nutricionistas.map(n => <option key={n.id_usuario} value={n.id_usuario}>{n.nome}</option>)}
            </select>
          </Campo>

          <Campo label="Nome do plano">
            <input style={inputStyle} placeholder="Ex: Dieta de Cutting" value={form.nome} onChange={setF('nome')} />
          </Campo>

          <Campo label="Objetivo">
            <input style={inputStyle} placeholder="Ex: Perda de gordura" value={form.objetivo} onChange={setF('objetivo')} />
          </Campo>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Campo label="Meta kcal/dia">
              <input style={inputStyle} type="number" placeholder="Ex: 2000" value={form.calorias_meta} onChange={setF('calorias_meta')} />
            </Campo>
            <Campo label="Meta proteína (g)">
              <input style={inputStyle} type="number" placeholder="Ex: 150" value={form.proteina_meta} onChange={setF('proteina_meta')} />
            </Campo>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Campo label="Início">
              <input style={inputStyle} type="date" value={form.data_inicio} onChange={setF('data_inicio')} />
            </Campo>
            <Campo label="Fim">
              <input style={inputStyle} type="date" value={form.data_fim} onChange={setF('data_fim')} />
            </Campo>
          </div>

          <Campo label="Observações">
            <input style={inputStyle} placeholder="Orientações gerais..." value={form.observacoes} onChange={setF('observacoes')} />
          </Campo>
        </div>

        {/* Status de publicação */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Status do plano</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { value: 'rascunho', label: 'Rascunho',   desc: 'Ainda em elaboração, aluno não vê',  color: '#8A7F76', bg: '#F0EBE4' },
              { value: 'revisao',  label: 'Em revisão', desc: 'Pronto, aguardando revisão final',    color: '#B45309', bg: 'rgba(234,179,8,0.12)' },
              { value: 'liberado', label: 'Liberado',   desc: 'Plano revisado, visível para o aluno', color: '#15803D', bg: 'rgba(34,197,94,0.1)' },
            ].map(opt => {
              const ativo = form.status_plano === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, status_plano: opt.value }))}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 12, border: `2px solid ${ativo ? opt.color : '#E0D6CA'}`, background: ativo ? opt.bg : '#FFFFFF', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                >
                  <p style={{ fontSize: 13, fontWeight: 700, color: ativo ? opt.color : '#6B6560', marginBottom: 2 }}>{opt.label}</p>
                  <p style={{ fontSize: 11, color: ativo ? opt.color : '#B0A89E' }}>{opt.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Dados da avaliação do aluno */}
        {dadosAluno && (
          <div style={{ padding: '14px 18px', borderRadius: 12, background: '#F7F3EE', border: '1px solid #E0D6CA', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Dados da avaliação</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {dadosAluno.objetivo && (
                <div style={{ padding: '6px 12px', borderRadius: 8, background: '#FFFFFF', border: '1px solid #E0D6CA' }}>
                  <p style={{ fontSize: 10, color: '#8A7F76', fontWeight: 700, marginBottom: 2 }}>OBJETIVO</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{dadosAluno.objetivo}</p>
                </div>
              )}
              {dadosAluno.nivel && (
                <div style={{ padding: '6px 12px', borderRadius: 8, background: '#FFFFFF', border: '1px solid #E0D6CA' }}>
                  <p style={{ fontSize: 10, color: '#8A7F76', fontWeight: 700, marginBottom: 2 }}>NÍVEL</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{dadosAluno.nivel}</p>
                </div>
              )}
              {dadosAluno.sexo && (
                <div style={{ padding: '6px 12px', borderRadius: 8, background: '#FFFFFF', border: '1px solid #E0D6CA' }}>
                  <p style={{ fontSize: 10, color: '#8A7F76', fontWeight: 700, marginBottom: 2 }}>SEXO</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{dadosAluno.sexo === 'M' ? 'Masculino' : 'Feminino'}</p>
                </div>
              )}
              {dadosAluno.idade && (
                <div style={{ padding: '6px 12px', borderRadius: 8, background: '#FFFFFF', border: '1px solid #E0D6CA' }}>
                  <p style={{ fontSize: 10, color: '#8A7F76', fontWeight: 700, marginBottom: 2 }}>IDADE</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{dadosAluno.idade} anos</p>
                </div>
              )}
              {dadosAluno.peso && (
                <div style={{ padding: '6px 12px', borderRadius: 8, background: '#FFFFFF', border: '1px solid #E0D6CA' }}>
                  <p style={{ fontSize: 10, color: '#8A7F76', fontWeight: 700, marginBottom: 2 }}>PESO</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{dadosAluno.peso} kg</p>
                </div>
              )}
              {dadosAluno.altura && (
                <div style={{ padding: '6px 12px', borderRadius: 8, background: '#FFFFFF', border: '1px solid #E0D6CA' }}>
                  <p style={{ fontSize: 10, color: '#8A7F76', fontWeight: 700, marginBottom: 2 }}>ALTURA</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{dadosAluno.altura} cm</p>
                </div>
              )}
              {dadosAluno.peso && dadosAluno.altura && (
                <div style={{ padding: '6px 12px', borderRadius: 8, background: '#FFFFFF', border: '1px solid #E0D6CA' }}>
                  <p style={{ fontSize: 10, color: '#8A7F76', fontWeight: 700, marginBottom: 2 }}>IMC</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>
                    {(dadosAluno.peso / Math.pow(dadosAluno.altura / 100, 2)).toFixed(1)}
                  </p>
                </div>
              )}
            </div>
            {dadosAluno.tem_lesao && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)' }}>
                <AlertTriangle size={14} color="#CA8A04" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#CA8A04', marginBottom: 2 }}>LESÃO / LIMITAÇÃO</p>
                  <p style={{ fontSize: 12, color: '#6B6560' }}>{dadosAluno.lesao_detalhe || 'Possui lesão (sem descrição)'}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Totais calculados */}
        {(totalCal > 0 || totalProt > 0) && (
          <div style={{ display: 'flex', gap: 16, paddingTop: 4 }}>
            <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(204,26,26,0.06)', border: '1px solid rgba(204,26,26,0.15)' }}>
              <p style={{ fontSize: 11, color: '#CC1A1A', fontWeight: 700 }}>TOTAL CALCULADO</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A', marginTop: 2 }}>{totalCal} kcal · {totalProt}g prot</p>
            </div>
            {form.calorias_meta && (
              <div style={{ padding: '8px 16px', borderRadius: 10, background: '#F7F3EE', border: '1px solid #E0D6CA' }}>
                <p style={{ fontSize: 11, color: '#8A7F76', fontWeight: 700 }}>DIFERENÇA DA META</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: totalCal > Number(form.calorias_meta) ? '#CC1A1A' : '#15803D', marginTop: 2 }}>
                  {totalCal > Number(form.calorias_meta) ? '+' : ''}{totalCal - Number(form.calorias_meta)} kcal
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Refeições */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Refeições ({refeicoes.length})
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {isEdicao && (
              <button
                onClick={handleGerarSubstituicoes}
                disabled={gerandoSub}
                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, paddingInline: 14, borderRadius: 8, border: '1px dashed #CC1A1A', background: gerandoSub ? '#F7F3EE' : 'rgba(204,26,26,0.04)', color: gerandoSub ? '#B0A89E' : '#CC1A1A', fontSize: 12, fontWeight: 700, cursor: gerandoSub ? 'not-allowed' : 'pointer' }}
              >
                <Sparkles size={13} />
                {gerandoSub ? 'Gerando...' : 'Gerar substituições'}
              </button>
            )}
            <button
              onClick={adicionarRefeicao}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, paddingInline: 14, borderRadius: 8, border: '1px dashed #CC1A1A', background: 'rgba(204,26,26,0.04)', color: '#CC1A1A', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              <Plus size={13} /> Adicionar refeição
            </button>
          </div>
        </div>

        {refeicoes.map((ref, i) => {
          const aberta = !!abertas[i]
          const calRef = ref.itens.reduce((a, it) => a + (Number(it.calorias) || 0), 0)
          const protRef = ref.itens.reduce((a, it) => a + (Number(it.proteina) || 0), 0)

          return (
            <div key={ref._uid} style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
              {/* Header da refeição */}
              <div
                onClick={() => toggleRefeicao(i)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', cursor: 'pointer', background: aberta ? '#FDFAF7' : '#FFFFFF' }}
              >
                <div style={{ width: 24, height: 24, borderRadius: 8, background: '#CC1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 900, color: '#FFFFFF' }}>{i + 1}</p>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{ref.nome || `Refeição ${i + 1}`}</p>
                  {ref.horario && <p style={{ fontSize: 11, color: '#8A7F76' }}>{ref.horario}</p>}
                </div>
                {calRef > 0 && (
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#CC1A1A', flexShrink: 0 }}>{calRef} kcal</p>
                )}
                {protRef > 0 && (
                  <p style={{ fontSize: 12, color: '#8A7F76', flexShrink: 0 }}>{protRef}g prot</p>
                )}
                <button
                  onClick={e => { e.stopPropagation(); removerRefeicao(i) }}
                  style={{ width: 28, height: 28, border: '1px solid #F0EBE4', borderRadius: 6, background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#CC1A1A'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#F0EBE4'}
                >
                  <Trash2 size={12} color="#CC1A1A" />
                </button>
                {aberta ? <ChevronUp size={16} color="#8A7F76" /> : <ChevronDown size={16} color="#8A7F76" />}
              </div>

              {aberta && (
                <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Nome e horário */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10, paddingTop: 4 }}>
                    <input
                      value={ref.nome}
                      onChange={e => setRefeicaoField(i, 'nome', e.target.value)}
                      placeholder="Nome da refeição (ex: Café da manhã)"
                      style={{ height: 38, padding: '0 12px', border: '1px solid #E0D6CA', borderRadius: 10, fontSize: 14, color: '#1A1A1A', outline: 'none', background: '#FFFFFF' }}
                    />
                    <input
                      type="time"
                      value={ref.horario}
                      onChange={e => setRefeicaoField(i, 'horario', e.target.value)}
                      style={{ height: 38, padding: '0 12px', border: '1px solid #E0D6CA', borderRadius: 10, fontSize: 14, color: '#1A1A1A', outline: 'none', background: '#FFFFFF', textAlign: 'center' }}
                    />
                  </div>

                  {/* Cabeçalho itens */}
                  {ref.itens.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 72px 62px 62px 62px 62px 32px', gap: 6 }}>
                      {['Alimento', 'Qtd', 'Unid', 'kcal', 'Prot g', 'Carb g', 'Gord g', ''].map((h, j) => (
                        <p key={j} style={{ fontSize: 10, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</p>
                      ))}
                    </div>
                  )}

                  {/* Itens */}
                  {ref.itens.map((it, j) => (
                    <div key={it._uid} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <ItemRow
                        item={it}
                        onChange={(key, val) => atualizarItem(i, j, key, val)}
                        onRemove={() => removerItem(i, j)}
                      />

                      {/* Substituições deste item */}
                      {(it.substituicoes || []).map((sub, k) => (
                        <div key={sub._uid} style={{ display: 'grid', gridTemplateColumns: '16px 1fr 72px 72px 62px 62px 62px 62px 32px', gap: 6, alignItems: 'center', paddingLeft: 4, paddingBottom: 6 }}>
                          <p style={{ fontSize: 9, fontWeight: 900, color: '#CC1A1A', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>ou</p>
                          <input
                            value={sub.descricao}
                            onChange={e => atualizarSubstituicao(i, j, k, 'descricao', e.target.value)}
                            placeholder="Substituição"
                            style={{ height: 32, padding: '0 10px', border: '1px dashed #E0D6CA', borderRadius: 8, fontSize: 13, color: '#6B6560', outline: 'none', background: '#FDFAF7' }}
                          />
                          <input
                            value={sub.quantidade}
                            onChange={e => atualizarSubstituicao(i, j, k, 'quantidade', e.target.value)}
                            type="number" placeholder="Qtd"
                            style={{ height: 32, padding: '0 6px', border: '1px dashed #E0D6CA', borderRadius: 8, fontSize: 12, color: '#6B6560', outline: 'none', textAlign: 'center', background: '#FDFAF7' }}
                          />
                          <select
                            value={sub.unidade}
                            onChange={e => atualizarSubstituicao(i, j, k, 'unidade', e.target.value)}
                            style={{ height: 32, padding: '0 4px', border: '1px dashed #E0D6CA', borderRadius: 8, fontSize: 12, color: '#6B6560', outline: 'none', background: '#FDFAF7', cursor: 'pointer' }}
                          >
                            {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                          <input
                            value={sub.calorias}
                            onChange={e => atualizarSubstituicao(i, j, k, 'calorias', e.target.value)}
                            type="number" placeholder="kcal"
                            style={{ height: 32, padding: '0 6px', border: '1px dashed #E0D6CA', borderRadius: 8, fontSize: 12, color: '#6B6560', outline: 'none', textAlign: 'center', background: '#FDFAF7' }}
                          />
                          <input
                            value={sub.proteina}
                            onChange={e => atualizarSubstituicao(i, j, k, 'proteina', e.target.value)}
                            type="number" placeholder="prot g"
                            style={{ height: 32, padding: '0 6px', border: '1px dashed #E0D6CA', borderRadius: 8, fontSize: 12, color: '#6B6560', outline: 'none', textAlign: 'center', background: '#FDFAF7' }}
                          />
                          <input
                            value={sub.carboidrato}
                            onChange={e => atualizarSubstituicao(i, j, k, 'carboidrato', e.target.value)}
                            type="number" placeholder="carb g"
                            style={{ height: 32, padding: '0 6px', border: '1px dashed #E0D6CA', borderRadius: 8, fontSize: 12, color: '#6B6560', outline: 'none', textAlign: 'center', background: '#FDFAF7' }}
                          />
                          <input
                            value={sub.gordura}
                            onChange={e => atualizarSubstituicao(i, j, k, 'gordura', e.target.value)}
                            type="number" placeholder="gord g"
                            style={{ height: 32, padding: '0 6px', border: '1px dashed #E0D6CA', borderRadius: 8, fontSize: 12, color: '#6B6560', outline: 'none', textAlign: 'center', background: '#FDFAF7' }}
                          />
                          <button
                            onClick={() => removerSubstituicao(i, j, k)}
                            style={{ width: 32, height: 32, border: '1px solid #F0EBE4', borderRadius: 8, background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#CC1A1A'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#F0EBE4'}
                          >
                            <Trash2 size={12} color="#CC1A1A" />
                          </button>
                        </div>
                      ))}

                      {/* Botão adicionar substituição */}
                      <button
                        onClick={() => adicionarSubstituicao(i, j)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, height: 24, paddingInline: 10, marginLeft: 20, marginBottom: 6, borderRadius: 6, border: 'none', background: 'transparent', color: '#C4B9A8', fontSize: 11, fontWeight: 600, cursor: 'pointer', width: 'fit-content' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#CC1A1A'}
                        onMouseLeave={e => e.currentTarget.style.color = '#C4B9A8'}
                      >
                        <Plus size={10} /> Adicionar substituição
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => adicionarItem(i)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, paddingInline: 12, borderRadius: 8, border: '1px dashed #E0D6CA', background: 'transparent', color: '#8A7F76', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: 'fit-content' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#CC1A1A'; e.currentTarget.style.color = '#CC1A1A' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#8A7F76' }}
                  >
                    <Plus size={12} /> Adicionar alimento
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {erro && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A', fontSize: 13 }}>
          {erro}
        </div>
      )}
    </div>
  )
}
