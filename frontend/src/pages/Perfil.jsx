import { useState, useRef } from 'react'
import useSWR, { mutate } from 'swr'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, User, Lock, Save, Check, Eye, EyeOff, Trash2 } from 'lucide-react'
import { buscar, atualizar, trocarSenha, uploadFoto, excluirConta } from '../services/perfil'
import { mascaraFone, mascaraCPF } from '../utils/formatters'
import { validarCPF } from '../utils/validators'
import { useAuthContext } from '../context/AuthContext'

const inputStyle = {
  width: '100%', height: 42, padding: '0 12px', borderRadius: 9,
  border: '1px solid #E0D6CA', fontSize: 14, color: '#1A1A1A',
  background: '#FDFCFB', outline: 'none', boxSizing: 'border-box',
}

function Campo({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function SenhaInput({ placeholder, value, onChange }) {
  const [ver, setVer] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={ver ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputStyle, paddingRight: 40 }}
        onFocus={e => e.target.style.borderColor = '#CC1A1A'}
        onBlur={e => e.target.style.borderColor = '#E0D6CA'}
      />
      <button
        type="button"
        onClick={() => setVer(v => !v)}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        {ver ? <EyeOff size={15} color="#B0A89E" /> : <Eye size={15} color="#B0A89E" />}
      </button>
    </div>
  )
}

function BotaoSalvar({ salvando, salvo, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={salvando}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        width: '100%', height: 42, borderRadius: 10, border: 'none',
        background: salvo ? '#15803d' : '#CC1A1A',
        color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        transition: 'background 0.2s', opacity: salvando ? 0.7 : 1,
      }}
    >
      {salvo ? <><Check size={15} /> Salvo</> : salvando ? 'Salvando…' : <><Save size={15} /> Salvar</>}
    </button>
  )
}

export default function Perfil() {
  const navigate = useNavigate()
  const { usuario: usuarioCtx, logout } = useAuthContext()
  const { data: perfil, isLoading } = useSWR('perfil', buscar)
  const fotoRef = useRef()

  // form dados pessoais
  const [form, setForm]           = useState(null)
  const [erroCPF, setErroCPF]     = useState(null)
  const [salvandoDados, setSalvandoDados] = useState(false)
  const [salvoDados,    setSalvoDados]    = useState(false)

  // form senha
  const [senhaAtual,  setSenhaAtual]  = useState('')
  const [novaSenha,   setNovaSenha]   = useState('')
  const [confirmar,   setConfirmar]   = useState('')
  const [erroSenha,   setErroSenha]   = useState(null)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [salvoSenha,    setSalvoSenha]    = useState(false)

  // upload foto
  const [uploadando,  setUploadando]  = useState(false)

  // exclusão de conta
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [excluindo,     setExcluindo]     = useState(false)

  const dados = form ?? perfil
  const set   = (campo, val) => setForm(f => ({ ...(f ?? perfil), [campo]: val }))

  async function salvarDados() {
    if (!dados) return
    const cpfDigitos = (dados.cpf ?? '').replace(/\D/g, '')
    if (cpfDigitos && cpfDigitos !== '00000000000') {
      if (!validarCPF(cpfDigitos)) { setErroCPF('CPF inválido'); return }
    }
    setErroCPF(null)
    setSalvandoDados(true)
    try {
      await atualizar({
        nome:            dados.nome,
        telefone:        (dados.telefone ?? '').replace(/\D/g, ''),
        data_nascimento: dados.data_nascimento,
        sexo:            dados.sexo,
        bio:             dados.bio,
        cpf:             dados.cpf,
      })
      await mutate('perfil')
      setForm(null)
      setSalvoDados(true)
      setTimeout(() => setSalvoDados(false), 2000)
    } catch { /* silencia */ }
    setSalvandoDados(false)
  }

  async function salvarSenha() {
    setErroSenha(null)
    if (!senhaAtual || !novaSenha) { setErroSenha('Preencha todos os campos'); return }
    if (novaSenha !== confirmar)   { setErroSenha('As senhas não coincidem'); return }
    if (novaSenha.length < 6)      { setErroSenha('Mínimo 6 caracteres'); return }
    setSalvandoSenha(true)
    try {
      await trocarSenha({ senha_atual: senhaAtual, nova_senha: novaSenha })
      setSenhaAtual(''); setNovaSenha(''); setConfirmar('')
      setSalvoSenha(true)
      setTimeout(() => setSalvoSenha(false), 2000)
    } catch (e) {
      setErroSenha(e.response?.data?.erro || 'Erro ao alterar senha')
    }
    setSalvandoSenha(false)
  }

  async function onFotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadando(true)
    try {
      await uploadFoto(file)
      await mutate('perfil')
    } catch { /* silencia */ }
    setUploadando(false)
    e.target.value = ''
  }

  async function handleExcluirConta() {
    setExcluindo(true)
    try {
      await excluirConta()
      logout()
      navigate('/login')
    } catch {
      setExcluindo(false)
      setConfirmDelete(false)
    }
  }

  const inicial = (dados?.nome || usuarioCtx?.nome || 'A')[0].toUpperCase()
  const fotoUrl = perfil?.foto_url

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #E0D6CA', background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <ArrowLeft size={16} color="#6B6560" />
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A' }}>Meu Perfil</h1>
      </div>

      {/* Avatar + nome */}
      <div style={{ background: '#FFF', border: '1px solid #E8E2DC', borderRadius: 16, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: fotoUrl ? 'transparent' : 'rgba(204,26,26,0.1)',
            border: '3px solid rgba(204,26,26,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            {fotoUrl
              ? <img src={fotoUrl} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 30, fontWeight: 900, color: '#CC1A1A' }}>{inicial}</span>
            }
          </div>
          <button
            onClick={() => fotoRef.current?.click()}
            disabled={uploadando}
            style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: '#CC1A1A', border: '2px solid #FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Camera size={12} color="#FFF" />
          </button>
          <input ref={fotoRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={onFotoChange} />
        </div>
        <div>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A' }}>{dados?.nome || '—'}</p>
          <p style={{ fontSize: 13, color: '#8A7F76', marginTop: 2 }}>{dados?.email}</p>
          {uploadando && <p style={{ fontSize: 12, color: '#B0A89E', marginTop: 4 }}>Enviando foto…</p>}
          {!uploadando && <p style={{ fontSize: 11, color: '#C4B9A8', marginTop: 4 }}>JPG, PNG ou WebP · máx. 5 MB</p>}
        </div>
      </div>

      {/* Dois cards lado a lado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* Card: Dados Pessoais */}
        <div style={{ background: '#FFF', border: '1px solid #E8E2DC', borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid #F0EBE4' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(204,26,26,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={15} color="#CC1A1A" />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>Dados Pessoais</span>
          </div>
          <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Campo label="Nome completo">
              <input value={dados?.nome ?? ''} onChange={e => set('nome', e.target.value)} style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#CC1A1A'} onBlur={e => e.target.style.borderColor = '#E0D6CA'} />
            </Campo>
            <Campo label="E-mail">
              <input value={dados?.email ?? ''} disabled style={{ ...inputStyle, background: '#F7F3EE', color: '#8A7F76' }} />
            </Campo>
            <Campo label="CPF">
              <input
                value={mascaraCPF(dados?.cpf === '00000000000' ? '' : (dados?.cpf ?? ''))}
                onChange={e => { setErroCPF(null); set('cpf', mascaraCPF(e.target.value)) }}
                placeholder="000.000.000-00"
                maxLength={14}
                style={{ ...inputStyle, borderColor: erroCPF ? '#EF4444' : undefined }}
                onFocus={e => e.target.style.borderColor = erroCPF ? '#EF4444' : '#CC1A1A'}
                onBlur={e => e.target.style.borderColor = erroCPF ? '#EF4444' : '#E0D6CA'}
              />
              {erroCPF && <p style={{ fontSize: 11, color: '#EF4444', paddingLeft: 4 }}>{erroCPF}</p>}
            </Campo>
            <Campo label="Telefone / WhatsApp">
              <input value={mascaraFone(dados?.telefone ?? '')} onChange={e => set('telefone', mascaraFone(e.target.value))} type="tel" placeholder="(00) 00000-0000" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#CC1A1A'} onBlur={e => e.target.style.borderColor = '#E0D6CA'} />
            </Campo>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Campo label="Nascimento">
                <input type="date" value={dados?.data_nascimento ? dados.data_nascimento.slice(0, 10) : ''} onChange={e => set('data_nascimento', e.target.value)} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#CC1A1A'} onBlur={e => e.target.style.borderColor = '#E0D6CA'} />
              </Campo>
              <Campo label="Sexo">
                <select value={dados?.sexo ?? ''} onChange={e => set('sexo', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={e => e.target.style.borderColor = '#CC1A1A'} onBlur={e => e.target.style.borderColor = '#E0D6CA'}>
                  <option value="">—</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </Campo>
            </div>
            <Campo label="Bio (opcional)">
              <textarea value={dados?.bio ?? ''} onChange={e => set('bio', e.target.value)} placeholder="Conte um pouco sobre você..." rows={3}
                style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'none', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = '#CC1A1A'} onBlur={e => e.target.style.borderColor = '#E0D6CA'} />
            </Campo>
            <BotaoSalvar salvando={salvandoDados} salvo={salvoDados} onClick={salvarDados} />
          </div>
        </div>

        {/* Card: Segurança */}
        <div style={{ background: '#FFF', border: '1px solid #E8E2DC', borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid #F0EBE4' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(204,26,26,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={15} color="#CC1A1A" />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>Segurança</span>
          </div>
          <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Campo label="Senha atual">
              <SenhaInput placeholder="Digite sua senha atual" value={senhaAtual} onChange={setSenhaAtual} />
            </Campo>
            <Campo label="Nova senha">
              <SenhaInput placeholder="Mínimo 6 caracteres" value={novaSenha} onChange={setNovaSenha} />
            </Campo>
            <Campo label="Confirmar nova senha">
              <SenhaInput placeholder="Repita a nova senha" value={confirmar} onChange={setConfirmar} />
            </Campo>
            {erroSenha && (
              <div style={{ borderRadius: 8, padding: '10px 12px', fontSize: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A' }}>
                {erroSenha}
              </div>
            )}
            <BotaoSalvar salvando={salvandoSenha} salvo={salvoSenha} onClick={salvarSenha} />
          </div>
        </div>

      </div>

      {/* Card: Excluir conta */}
      <div style={{ background: '#FFF', border: '1px solid #FECACA', borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid #FEE2E2' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={15} color="#DC2626" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>Excluir Conta</span>
        </div>
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: '#6B6560' }}>
            A exclusão é permanente e irrecuperável. Todos os seus dados pessoais serão apagados e o acesso será encerrado.
          </p>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              style={{
                height: 42, borderRadius: 10, border: '1px solid #FECACA',
                background: '#FFF5F5', color: '#DC2626', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Trash2 size={14} /> Excluir minha conta
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 600 }}>
                Tem certeza? Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  style={{ flex: 1, height: 42, borderRadius: 10, border: '1px solid #E0D6CA', background: '#FFF', color: '#6B6560', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExcluirConta}
                  disabled={excluindo}
                  style={{
                    flex: 1, height: 42, borderRadius: 10, border: 'none',
                    background: '#DC2626', color: '#FFF', fontSize: 13, fontWeight: 700,
                    cursor: excluindo ? 'not-allowed' : 'pointer', opacity: excluindo ? 0.7 : 1,
                  }}
                >
                  {excluindo ? 'Excluindo…' : 'Sim, excluir'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
