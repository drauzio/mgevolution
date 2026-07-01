import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BtnSalvar, BtnCancelar, BtnExcluir } from '../../components/ui/Botoes'
import * as usuariosService from '../../services/usuarios'
import { mascaraFone, mascaraCPF } from '../../utils/formatters'
import { UserRound } from 'lucide-react'

function Campo({ label, erro, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: erro ? '#CC1A1A' : '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </label>
      {children}
      {erro && <p style={{ fontSize: 11, color: '#CC1A1A', fontWeight: 600 }}>{erro}</p>}
    </div>
  )
}

function inputBorder(erro) {
  return erro ? '1px solid #FCA5A5' : '1px solid #E0D6CA'
}

const inputBase = {
  height: 42, padding: '0 14px', borderRadius: 10,
  fontSize: 14, color: '#1A1A1A', outline: 'none', background: '#FFFFFF',
  width: '100%', boxSizing: 'border-box',
}

const PERFIS = [
  { value: 'aluno',         label: 'Aluno',         desc: 'Acessa treinos, dieta e evolução',        cor: '#B45309', bg: 'rgba(245,158,11,0.08)'  },
  { value: 'personal',      label: 'Personal',       desc: 'Gerencia alunos e treinos',               cor: '#1D4ED8', bg: 'rgba(37,99,235,0.08)'   },
  { value: 'nutricionista', label: 'Nutricionista',  desc: 'Elabora e gerencia planos alimentares',   cor: '#15803D', bg: 'rgba(22,163,74,0.08)'   },
  { value: 'admin',         label: 'Administrador',  desc: 'Acesso total ao sistema e configurações', cor: '#CC1A1A', bg: 'rgba(204,26,26,0.08)'   },
]

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validarTelefone(tel) {
  const s = tel.replace(/\D/g, '')
  return s.length === 0 || s.length === 10 || s.length === 11
}

export default function UsuarioForm() {
  const { id }   = useParams()
  const isEdicao = !!id
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', senha: '',
    cpf: '', data_nascimento: '', sexo: '', bio: '', data_fim_carencia: '',
  })
  const [perfis, setPerfis]         = useState([])
  const [fotoUrl, setFotoUrl]       = useState(null)
  const [erros, setErros]           = useState({})
  const [erroGeral, setErroGeral]   = useState(null)
  const [salvando, setSalvando]     = useState(false)
  const [inativando, setInativando] = useState(false)
  const [usuarioAtivo, setUsuarioAtivo] = useState(true)
  const [carregando, setCarregando] = useState(isEdicao)
  const [verificandoEmail, setVerificandoEmail] = useState(false)

  useEffect(() => {
    if (!isEdicao) return
    usuariosService.buscarPorId(id)
      .then(data => {
        setForm({
          nome:            data.nome || '',
          email:           data.email || '',
          telefone:        mascaraFone(data.telefone),
          senha:           '',
          cpf:             mascaraCPF(data.cpf),
          data_nascimento:  data.data_nascimento  ? data.data_nascimento.slice(0, 10)  : '',
          sexo:             data.sexo || '',
          bio:              data.bio || '',
          data_fim_carencia: data.data_fim_carencia ? data.data_fim_carencia.slice(0, 10) : '',
        })
        setPerfis(data.perfis || [])
        setFotoUrl(data.foto_url || null)
        setUsuarioAtivo(data.ativo)
      })
      .finally(() => setCarregando(false))
  }, [id])

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  function togglePerfil(p) {
    setPerfis(ps => ps.includes(p) ? ps.filter(x => x !== p) : [...ps, p])
  }

  async function onBlurEmail() {
    const email = form.email.trim()
    if (!email) return
    if (!validarEmail(email)) { setErros(e => ({ ...e, email: 'E-mail inválido' })); return }
    setVerificandoEmail(true)
    try {
      const { disponivel } = await usuariosService.verificarEmail(email, id)
      setErros(e => ({ ...e, email: disponivel ? null : 'E-mail já cadastrado no sistema' }))
    } catch {} finally { setVerificandoEmail(false) }
  }

  function onBlurTelefone() {
    const tel = form.telefone.trim()
    if (!validarTelefone(tel)) setErros(e => ({ ...e, telefone: 'Telefone inválido — informe (xx) xxxxx-xxxx' }))
    else setErros(e => ({ ...e, telefone: null }))
  }

  function validar() {
    const novos = {}
    if (!form.nome.trim())              novos.nome = 'Nome é obrigatório'
    if (!form.email.trim())             novos.email = 'E-mail é obrigatório'
    else if (!validarEmail(form.email)) novos.email = 'E-mail inválido'
    if (erros.email)                    novos.email = erros.email
    if (!isEdicao && !form.senha)       novos.senha = 'Senha é obrigatória'
    if (form.telefone && !validarTelefone(form.telefone)) novos.telefone = 'Telefone inválido'
    setErros(novos)
    return Object.keys(novos).length === 0
  }

  async function salvar() {
    if (!validar()) return
    setSalvando(true); setErroGeral(null)
    try {
      const payload = { ...form, perfis }
      if (isEdicao) await usuariosService.atualizar(id, payload)
      else          await usuariosService.criar(payload)
      navigate('/admin/usuarios')
    } catch (e) {
      setErroGeral(e.response?.data?.erro || e.message || 'Erro ao salvar')
    } finally { setSalvando(false) }
  }

  async function toggleAtivo() {
    const acao = usuarioAtivo ? 'inativar' : 'reativar'
    if (!confirm(`Tem certeza que deseja ${acao} este usuário?`)) return
    setInativando(true)
    try { await usuariosService.toggleAtivo(id); navigate('/admin/usuarios') }
    catch { setErroGeral('Erro ao alterar status') }
    finally { setInativando(false) }
  }

  if (carregando) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>
            {isEdicao ? 'Editar Usuário' : 'Novo Usuário'}
          </h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>
            {isEdicao ? 'Atualize os dados e perfis do usuário.' : 'Preencha os dados e defina os perfis de acesso.'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          {isEdicao && <BtnExcluir onClick={toggleAtivo} loading={inativando} label={usuarioAtivo ? 'Inativar' : 'Reativar'} />}
          <BtnCancelar onClick={() => navigate('/admin/usuarios')} />
          <BtnSalvar onClick={salvar} loading={salvando} />
        </div>
      </div>

      {/* Foto + Dados básicos */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Dados do usuário</p>

        {/* Foto */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#F0EBE4', border: '2px solid #E0D6CA', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {fotoUrl
              ? <img src={fotoUrl} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <UserRound size={36} color="#C4B9A8" />}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>Foto de perfil</p>
            <p style={{ fontSize: 12, color: '#8A7F76' }}>A foto é alterada pelo próprio usuário no app.</p>
          </div>
        </div>

        {/* Linha 1: Nome + Email */}
        <div className="uf-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Campo label="Nome completo" erro={erros.nome}>
            <input
              style={{ ...inputBase, border: inputBorder(erros.nome) }}
              placeholder="Ex: João Silva"
              value={form.nome}
              onChange={set('nome')}
              onBlur={() => { if (!form.nome.trim()) setErros(e => ({ ...e, nome: 'Nome é obrigatório' })); else setErros(e => ({ ...e, nome: null })) }}
            />
          </Campo>
          <Campo label={verificandoEmail ? 'E-mail — verificando...' : 'E-mail'} erro={erros.email}>
            <input
              style={{ ...inputBase, border: inputBorder(erros.email) }}
              type="email"
              placeholder="Ex: joao@email.com"
              value={form.email}
              onChange={e => { set('email')(e); setErros(ev => ({ ...ev, email: null })) }}
              onBlur={onBlurEmail}
            />
          </Campo>
        </div>

        {/* Linha 2: Telefone + CPF */}
        <div className="uf-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Campo label="Telefone" erro={erros.telefone}>
            <input
              style={{ ...inputBase, border: inputBorder(erros.telefone) }}
              placeholder="(62) 99999-9999"
              value={form.telefone}
              onChange={e => setForm(f => ({ ...f, telefone: mascaraFone(e.target.value) }))}
              onBlur={onBlurTelefone}
            />
          </Campo>
          <Campo label="CPF">
            <input
              style={{ ...inputBase, border: inputBorder(false) }}
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={e => setForm(f => ({ ...f, cpf: mascaraCPF(e.target.value) }))}
            />
          </Campo>
        </div>

        {/* Linha 3: Nascimento + Sexo + Senha */}
        <div className="uf-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <Campo label="Data de nascimento">
            <input
              type="date"
              style={{ ...inputBase, border: inputBorder(false) }}
              value={form.data_nascimento}
              onChange={set('data_nascimento')}
            />
          </Campo>
          <Campo label="Sexo">
            <select
              style={{ ...inputBase, border: inputBorder(false), cursor: 'pointer' }}
              value={form.sexo}
              onChange={set('sexo')}
            >
              <option value="">Não informado</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
          </Campo>
          <Campo label={isEdicao ? 'Nova senha (opcional)' : 'Senha provisória'} erro={erros.senha}>
            <input
              style={{ ...inputBase, border: inputBorder(erros.senha) }}
              type="password"
              placeholder="••••••••"
              value={form.senha}
              onChange={set('senha')}
              onBlur={() => { if (!isEdicao && !form.senha) setErros(e => ({ ...e, senha: 'Senha é obrigatória' })); else setErros(e => ({ ...e, senha: null })) }}
            />
          </Campo>
        </div>

        {/* Linha 4: Carência + Bio */}
        <div className="uf-grid-carencia" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
          <Campo label="Carência até">
            <input
              type="date"
              style={{ ...inputBase, border: inputBorder(false) }}
              value={form.data_fim_carencia}
              onChange={set('data_fim_carencia')}
            />
          </Campo>
          <Campo label="Bio / Observações">
            <textarea
              style={{ ...inputBase, height: 42, padding: '10px 14px', resize: 'none', fontFamily: 'inherit', border: inputBorder(false) }}
              placeholder="Informações adicionais sobre o usuário..."
              value={form.bio}
              onChange={set('bio')}
            />
          </Campo>
        </div>
      </div>

      {/* Perfis de acesso */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Perfis de acesso</p>
          <p style={{ fontSize: 13, color: '#B0A89E' }}>Um usuário pode ter mais de um perfil simultaneamente.</p>
        </div>
        <div className="uf-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {PERFIS.map(p => {
            const ativo = perfis.includes(p.value)
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => togglePerfil(p.value)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', borderRadius: 12, border: `2px solid ${ativo ? p.cor : '#E0D6CA'}`, background: ativo ? p.bg : '#FFFFFF', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
              >
                <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${ativo ? p.cor : '#C4B9A8'}`, background: ativo ? p.cor : '#FFFFFF', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {ativo && <div style={{ width: 8, height: 8, borderRadius: 2, background: '#FFFFFF' }} />}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: ativo ? p.cor : '#1A1A1A', marginBottom: 2 }}>{p.label}</p>
                  <p style={{ fontSize: 12, color: ativo ? p.cor : '#8A7F76' }}>{p.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
        {perfis.length === 0 && (
          <p style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>Nenhum perfil selecionado — o usuário poderá fazer login mas não verá nenhum menu.</p>
        )}
      </div>

      {erroGeral && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A', fontSize: 13 }}>
          {erroGeral}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 640px) {
          .uf-grid-2 { grid-template-columns: 1fr !important; }
          .uf-grid-3 { grid-template-columns: 1fr !important; }
          .uf-grid-carencia { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
