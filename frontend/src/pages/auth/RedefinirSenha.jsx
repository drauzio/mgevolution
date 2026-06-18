import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import api from '../../services/api'
import { APP } from '../../config/app'

const labelClass = 'text-[11px] font-semibold text-gray-500 uppercase tracking-widest'

export default function RedefinirSenha() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')

  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(false)

  const senhasIguais = senha && confirmar && senha === confirmar
  const senhaValida = senha.length >= 6

  async function onSubmit(e) {
    e.preventDefault()
    if (!senhaValida) return setErro('A senha deve ter no mínimo 6 caracteres')
    if (!senhasIguais) return setErro('As senhas não coincidem')
    setErro(null)
    setCarregando(true)
    try {
      await api.post('/auth/redefinir-senha', { token, senha })
      setSucesso(true)
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao redefinir senha. O link pode ter expirado.')
    } finally {
      setCarregando(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#F0EBE4' }}>
        <div className="w-full max-w-md rounded-2xl text-center" style={{ background: '#FFFFFF', boxShadow: '0 8px 48px rgba(0,0,0,0.10)', padding: '44px 40px' }}>
          <XCircle size={48} color="#CC1A1A" strokeWidth={1.5} style={{ margin: '0 auto 20px', display: 'block' }} />
          <h2 className="text-xl font-black uppercase" style={{ color: '#1A1A1A', marginBottom: 12 }}>Link inválido</h2>
          <p className="text-sm" style={{ color: '#6B6560', marginBottom: 28 }}>
            Este link de redefinição é inválido ou já expirou.
          </p>
          <Link to="/esqueci-senha" className="font-semibold text-sm" style={{ color: '#CC1A1A' }}>
            Solicitar novo link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: '#F0EBE4' }}>
      <div
        className="w-full max-w-md rounded-2xl"
        style={{ background: '#FFFFFF', boxShadow: '0 8px 48px rgba(0,0,0,0.10)', padding: '44px 40px' }}
      >
        {sucesso ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={30} color="#16A34A" strokeWidth={1.8} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: '#1A1A1A', marginBottom: 12 }}>
              Senha redefinida!
            </h2>
            <p className="text-sm" style={{ color: '#6B6560', lineHeight: 1.6, marginBottom: 28 }}>
              Sua senha foi atualizada com sucesso. Agora você pode entrar com a nova senha.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full h-12 rounded-lg font-black text-[13px] text-white uppercase tracking-widest transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', boxShadow: '0 4px 16px rgba(180,26,26,0.3)', border: 'none', cursor: 'pointer' }}
            >
              Ir para o login
            </button>
          </div>
        ) : (
          <>
            {/* Título */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ marginBottom: 16 }}>
                <span className="text-[15px] font-bold uppercase tracking-[0.2em]" style={{ color: '#CC1A1A' }}>{APP.nome}</span>
              </div>
              <h2 className="text-[22px] font-black uppercase tracking-tight leading-none" style={{ color: '#1A1A1A', marginBottom: 8 }}>
                Nova senha
              </h2>
              <p className="text-sm" style={{ color: '#8A7F76' }}>
                Crie uma nova senha para sua conta.
              </p>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              {/* Nova senha */}
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Nova senha</label>
                <div className="flex">
                  <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-l-lg" style={{ background: '#F7F3EE', border: '1px solid #E0D6CA', borderRight: 'none' }}>
                    <Lock size={16} strokeWidth={1.8} style={{ color: '#8A7F76' }} />
                  </div>
                  <input
                    type={verSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className="flex-1 h-12 bg-white border-y border-gray-200 px-4 text-gray-900 text-sm placeholder:text-gray-400 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setVerSenha(v => !v)}
                    className="h-12 w-11 shrink-0 flex items-center justify-center rounded-r-lg transition-colors"
                    style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderLeft: 'none', color: '#8A7F76' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#1A1A1A' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#8A7F76' }}
                  >
                    {verSenha ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
                  </button>
                </div>
              </div>

              {/* Confirmar senha */}
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Confirmar senha</label>
                <div className="flex">
                  <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-l-lg" style={{ background: '#F7F3EE', border: '1px solid #E0D6CA', borderRight: 'none' }}>
                    <Lock size={16} strokeWidth={1.8} style={{ color: '#8A7F76' }} />
                  </div>
                  <input
                    type={verConfirmar ? 'text' : 'password'}
                    value={confirmar}
                    onChange={e => setConfirmar(e.target.value)}
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    className="flex-1 h-12 bg-white border-y border-gray-200 px-4 text-gray-900 text-sm placeholder:text-gray-400 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setVerConfirmar(v => !v)}
                    className="h-12 w-11 shrink-0 flex items-center justify-center rounded-r-lg transition-colors"
                    style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderLeft: 'none', color: '#8A7F76' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#1A1A1A' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#8A7F76' }}
                  >
                    {verConfirmar ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
                  </button>
                </div>
                {confirmar && !senhasIguais && (
                  <p className="text-xs" style={{ color: '#CC1A1A' }}>As senhas não coincidem</p>
                )}
                {senhasIguais && (
                  <p className="text-xs flex items-center gap-1" style={{ color: '#16A34A' }}>
                    <CheckCircle size={12} /> Senhas coincidem
                  </p>
                )}
              </div>

              {erro && (
                <div className="rounded-lg px-4 py-3 text-sm text-center" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A' }}>
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={carregando || !senhaValida || !senhasIguais}
                className="w-full h-12 rounded-lg font-black text-[13px] text-white uppercase tracking-widest transition-all disabled:opacity-50 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', boxShadow: '0 4px 16px rgba(180,26,26,0.3)' }}
                onMouseEnter={e => { if (!carregando) e.currentTarget.style.filter = 'brightness(1.08)' }}
                onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
              >
                {carregando ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-[11px] uppercase tracking-widest" style={{ marginTop: 32, color: '#B0A89E' }}>
          {APP.nome} · {APP.tagline}
        </p>
      </div>
    </div>
  )
}
