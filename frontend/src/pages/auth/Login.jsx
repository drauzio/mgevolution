import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { APP } from '../../config/app'
import { Mail, Lock, UsersRound, Eye, EyeOff } from 'lucide-react'

const STORAGE_KEY = 'mg_lembrar_email'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Informe a senha'),
})

function LogoMG({ size = 96, onBeige = false }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: onBeige ? 0 : 20,
        overflow: 'hidden',
        background: '#C4B9A8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <img
        src="/logo-mg.jpg"
        alt="MG Logo"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  )
}

const inputClass = 'flex-1 h-12 bg-white border-y border-r border-gray-200 focus:border-red-500 rounded-r-lg px-4 text-gray-900 text-sm placeholder:text-gray-400 outline-none transition-colors'
const inputClassSenha = 'flex-1 h-12 bg-white border-y border-gray-200 focus:border-red-500 px-4 text-gray-900 text-sm placeholder:text-gray-400 outline-none transition-colors'
const labelClass = 'text-[11px] font-semibold text-gray-500 uppercase tracking-widest'

export default function Login() {
  const { login } = useAuthContext()
  const navigate = useNavigate()
  const [erro, setErro] = useState(null)
  const [lembrar, setLembrar] = useState(() => !!localStorage.getItem(STORAGE_KEY))
  const [verSenha, setVerSenha] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: localStorage.getItem(STORAGE_KEY) || '' },
  })

  async function onSubmit(data) {
    setErro(null)
    if (lembrar) localStorage.setItem(STORAGE_KEY, data.email)
    else localStorage.removeItem(STORAGE_KEY)
    try {
      const resultado = await login(data.email, data.senha)
      const perfil = resultado?.usuario?.perfil
      navigate(perfil === 'admin' ? '/admin' : perfil === 'personal' ? '/personal' : '/dashboard')
    } catch (e) {
      setErro(e.response?.data?.erro || 'E-mail ou senha inválidos')
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F0EBE4' }}>

      {/* ── Painel esquerdo – branding (desktop) ── */}
      <div
        className="hidden lg:flex w-105 shrink-0 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: '#C4B9A8' }}
      >
        {/* Textura sutil */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg,#000 0,#000 1px,transparent 0,transparent 40px),repeating-linear-gradient(90deg,#000 0,#000 1px,transparent 0,transparent 40px)',
          }}
        />
        <div className="absolute right-0 inset-y-12 w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(160,30,30,0.35), transparent)' }} />

        <div className="relative z-10 flex flex-col items-center text-center px-10">
          <LogoMG size={200} onBeige />

          <div className="mt-9">
            <h1 className="text-[40px] font-black uppercase leading-[1.05] tracking-tight" style={{ color: '#1A1A1A' }}>
              Márcio<br />Gonçalves
            </h1>
          </div>

          <div className="w-10 h-px my-8" style={{ background: 'rgba(160,30,30,0.35)' }} />

          <div className="space-y-2">
            {APP.slogan.map((w, i) => (
              <p
                key={w}
                className="text-[13px] font-bold uppercase tracking-[0.25em]"
                style={{ color: i === APP.slogan.length - 1 ? '#AA1515' : 'rgba(26,26,26,0.28)' }}
              >
                {w}.
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* ── Painel direito – formulário ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div
          className="w-full max-w-95 rounded-2xl"
          style={{ background: '#FFFFFF', boxShadow: '0 8px 48px rgba(0,0,0,0.10)', padding: '44px 40px' }}
        >

          {/* Logo mobile */}
          <div className="flex flex-col items-center gap-4 mb-10 lg:hidden">
            <LogoMG size={80} />
            <div className="text-center">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: '#AA1515' }}>Centro de Treinamento</p>
              <h1 className="text-lg font-black uppercase tracking-tight mt-1" style={{ color: '#1A1A1A' }}>Márcio Gonçalves</h1>
            </div>
          </div>

          {/* Título */}
          <div style={{ marginBottom: 28 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
              <div className="h-px w-4" style={{ background: '#CC1A1A' }} />
              <span className="text-[15px] font-bold uppercase tracking-[0.2em]" style={{ color: '#CC1A1A' }}>{APP.nome}</span>
            </div>
            <div className="flex items-center gap-3" style={{ marginBottom: 28 }}>
              <UsersRound size={40} strokeWidth={1.5} style={{ color: '#CC1A1A', flexShrink: 0 }} />
              <div>
                <h2 className="text-[22px] font-black uppercase tracking-tight leading-none" style={{ color: '#1A1A1A' }}>Entrar</h2>
                <p className="text-sm" style={{ marginTop: 6, color: '#8A7F76' }}>Acesse com suas credenciais</p>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

            {/* E-mail */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>E-mail</label>
              <div className="flex">
                <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-l-lg" style={{ background: '#F7F3EE', border: '1px solid #E0D6CA', borderRight: 'none' }}>
                  <Mail size={16} strokeWidth={1.8} style={{ color: '#8A7F76' }} />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className={inputClass}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Senha</label>
              <div className="flex flex-1">
                <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-l-lg" style={{ background: '#F7F3EE', border: '1px solid #E0D6CA', borderRight: 'none' }}>
                  <Lock size={16} strokeWidth={1.8} style={{ color: '#8A7F76' }} />
                </div>
                <input
                  {...register('senha')}
                  type={verSenha ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={inputClassSenha}
                />
                <button
                  type="button"
                  onClick={() => setVerSenha(v => !v)}
                  className="h-12 w-11 shrink-0 flex items-center justify-center rounded-r-lg transition-colors"
                  style={{ background: '#F7F3EE', border: '1px solid #E0D6CA', borderLeft: 'none', color: '#8A7F76' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#1A1A1A' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#8A7F76' }}
                >
                  {verSenha ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
                </button>
              </div>
              {errors.senha && <p className="text-red-500 text-xs">{errors.senha.message}</p>}

              {/* Lembrar e-mail + Esqueci senha */}
              <div className="flex items-center justify-between mt-1">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lembrar}
                    onChange={e => setLembrar(e.target.checked)}
                    className="accent-red-600 w-3.5 h-3.5"
                  />
                  <span style={{ fontSize: 12, color: '#8A7F76' }}>Lembrar e-mail</span>
                </label>
                <a href="#" style={{ fontSize: 12, color: '#8A7F76' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#CC1A1A'}
                  onMouseLeave={e => e.currentTarget.style.color = '#8A7F76'}
                >
                  Esqueci minha senha
                </a>
              </div>
            </div>

            {/* Erro geral */}
            {erro && (
              <div className="rounded-lg px-4 py-3 text-sm text-center" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A' }}>
                {erro}
              </div>
            )}

            {/* Botão entrar */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-lg font-black text-[13px] text-white uppercase tracking-widest transition-all disabled:opacity-50 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', boxShadow: '0 4px 16px rgba(180,26,26,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm" style={{ marginTop: 24, color: '#8A7F76' }}>
            Não tem conta?{' '}
            <Link to="/cadastro" className="font-semibold transition-colors" style={{ color: '#CC1A1A' }}>
              Criar conta
            </Link>
          </p>

          <p className="text-center text-[11px] uppercase tracking-widest" style={{ marginTop: 20, color: '#B0A89E' }}>
            {APP.nome} · {APP.tagline}
          </p>
        </div>
      </div>
    </div>
  )
}
