import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { BtnSalvar, BtnCancelar, BtnExcluir } from '../../components/ui/Botoes'
import * as alunosService from '../../services/alunos'
import { mascaraFone } from '../../utils/formatters'

function Campo({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </label>
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

export default function AlunoForm() {
  const { id } = useParams()
  const isEdicao = !!id
  const navigate = useNavigate()
  const location = useLocation()
  const voltarAlunos = location.pathname.startsWith('/nutri') ? '/nutri/alunos' : '/admin/alunos'
  const { token } = useAuthContext()

  const [form, setForm] = useState({ nome: '', email: '', telefone: '', senha: '' })
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [inativando, setInativando] = useState(false)
  const [carregando, setCarregando] = useState(isEdicao)
  const [alunoAtivo, setAlunoAtivo] = useState(true)

  useEffect(() => {
    if (!isEdicao) return
    alunosService.buscarPorId(id)
      .then(data => {
        setForm({ nome: data.nome, email: data.email, telefone: mascaraFone(data.telefone), senha: '' })
        setAlunoAtivo(data.ativo)
      })
      .finally(() => setCarregando(false))
  }, [id])

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function salvar() {
    if (!form.nome || !form.email) { setErro('Nome e e-mail são obrigatórios'); return }
    if (!isEdicao && !form.senha) { setErro('Senha é obrigatória para novo aluno'); return }
    setSalvando(true); setErro(null)
    try {
      if (isEdicao) {
        await alunosService.atualizar(id, form)
      } else {
        await alunosService.criar(form)
      }
      navigate(voltarAlunos)
    } catch (e) {
      setErro(e.response?.data?.erro || e.message || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function toggleAtivo() {
    const acao = alunoAtivo ? 'inativar' : 'reativar'
    if (!confirm(`Tem certeza que deseja ${acao} este aluno?`)) return
    setInativando(true)
    try {
      await alunosService.toggleAtivo(id)
      navigate(voltarAlunos)
    } catch { setErro('Erro ao alterar status') }
    finally { setInativando(false) }
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
            {isEdicao ? 'Editar Aluno' : 'Novo Aluno'}
          </h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>
            {isEdicao ? 'Atualize os dados do aluno abaixo.' : 'Preencha os dados para criar a conta do aluno.'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {isEdicao && (
            <BtnExcluir onClick={toggleAtivo} loading={inativando} label={alunoAtivo ? 'Inativar' : 'Reativar'} />
          )}
          <BtnCancelar onClick={() => navigate(voltarAlunos)} />
          <BtnSalvar onClick={salvar} loading={salvando} />
        </div>
      </div>

      {/* Formulário */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Campo label="Nome completo">
            <input style={inputStyle} placeholder="Ex: Carlos Souza" value={form.nome} onChange={set('nome')} />
          </Campo>

          <Campo label="E-mail">
            <input style={inputStyle} type="email" placeholder="Ex: carlos@email.com" value={form.email} onChange={set('email')} />
          </Campo>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Campo label="Telefone">
            <input
              style={inputStyle}
              placeholder="(62) 99999-9999"
              value={form.telefone}
              onChange={e => setForm(f => ({ ...f, telefone: mascaraFone(e.target.value) }))}
            />
          </Campo>

          <Campo label={isEdicao ? 'Nova senha (deixe em branco para não alterar)' : 'Senha provisória'}>
            <input style={inputStyle} type="password" placeholder="••••••••" value={form.senha} onChange={set('senha')} />
          </Campo>
        </div>

        {erro && (
          <div style={{ padding: '10px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A', fontSize: 13 }}>
            {erro}
          </div>
        )}
      </div>

    </div>
  )
}
