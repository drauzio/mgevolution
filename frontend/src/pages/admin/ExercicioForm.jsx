import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BtnSalvar, BtnCancelar, BtnExcluir } from '../../components/ui/Botoes'
import * as exerciciosService from '../../services/exercicios'

const GRUPOS = ['Peito','Costas','Pernas','Ombro','Bíceps','Tríceps','Abdômen','Cardio']
const EQUIPAMENTOS = ['Barra','Halteres','Cabo','Máquina','Peso corporal','Elástico','Kettlebell']

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

export default function ExercicioForm() {
  const { id } = useParams()
  const isEdicao = !!id
  const navigate = useNavigate()

  const [form, setForm] = useState({ nome: '', grupo_muscular: '', equipamento: '', descricao: '', video_url: '' })
  const [ativo, setAtivo] = useState(true)
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [toggleando, setToggleando] = useState(false)
  const [carregando, setCarregando] = useState(isEdicao)

  useEffect(() => {
    if (!isEdicao) return
    exerciciosService.buscarPorId(id)
      .then(data => {
        setForm({ nome: data.nome, grupo_muscular: data.grupo_muscular, equipamento: data.equipamento || '', descricao: data.descricao || '', video_url: data.video_url || '' })
        setAtivo(!!data.ativo)
      })
      .finally(() => setCarregando(false))
  }, [id])

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function salvar() {
    if (!form.nome || !form.grupo_muscular) { setErro('Nome e grupo muscular são obrigatórios'); return }
    setSalvando(true); setErro(null)
    try {
      if (isEdicao) {
        await exerciciosService.atualizar(id, form)
      } else {
        await exerciciosService.criar(form)
      }
      navigate('/admin/exercicios')
    } catch (e) {
      setErro(e.response?.data?.erro || e.message || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function toggle() {
    if (!confirm(`Deseja ${ativo ? 'inativar' : 'reativar'} este exercício?`)) return
    setToggleando(true)
    try {
      await exerciciosService.toggleAtivo(id)
      navigate('/admin/exercicios')
    } finally {
      setToggleando(false)
    }
  }

  if (carregando) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>
            {isEdicao ? 'Editar Exercício' : 'Novo Exercício'}
          </h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>
            {isEdicao ? 'Atualize os dados do exercício.' : 'Preencha os dados para adicionar ao catálogo.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {isEdicao && <BtnExcluir onClick={toggle} loading={toggleando} label={ativo ? 'Inativar' : 'Reativar'} />}
          <BtnCancelar onClick={() => navigate('/admin/exercicios')} />
          <BtnSalvar onClick={salvar} loading={salvando} />
        </div>
      </div>

      {/* Formulário */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>

        <Campo label="Nome do exercício">
          <input style={inputStyle} placeholder="Ex: Supino Reto com Barra" value={form.nome} onChange={set('nome')} />
        </Campo>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Campo label="Grupo muscular">
            <select value={form.grupo_muscular} onChange={set('grupo_muscular')} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Selecione</option>
              {GRUPOS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Campo>

          <Campo label="Equipamento">
            <select value={form.equipamento} onChange={set('equipamento')} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Nenhum / Livre</option>
              {EQUIPAMENTOS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </Campo>
        </div>

        <Campo label="Descrição / Dica de execução">
          <textarea
            value={form.descricao}
            onChange={set('descricao')}
            placeholder="Ex: Deite no banco, segure a barra na largura dos ombros..."
            rows={3}
            style={{ padding: '10px 14px', border: '1px solid #E0D6CA', borderRadius: 10, fontSize: 14, color: '#1A1A1A', outline: 'none', background: '#FFFFFF', resize: 'vertical', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}
          />
        </Campo>

        <Campo label="URL do vídeo (opcional)">
          <input style={inputStyle} placeholder="https://youtube.com/..." value={form.video_url} onChange={set('video_url')} />
        </Campo>

        {erro && (
          <div style={{ padding: '10px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A', fontSize: 13 }}>
            {erro}
          </div>
        )}
      </div>
    </div>
  )
}
