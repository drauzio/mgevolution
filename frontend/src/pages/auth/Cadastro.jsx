import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Mail, Lock, UserRound, UsersRound, Phone } from 'lucide-react'
import api from '../../services/api'
import { APP } from '../../config/app'

const schema = z.object({
  nome:      z.string().min(3, 'Nome obrigatório'),
  email:     z.string().email('E-mail inválido'),
  telefone:  z.string().min(10, 'Telefone inválido').max(20),
  senha:     z.string().min(6, 'Mínimo 6 caracteres'),
  confirmar: z.string(),
}).refine(d => d.senha === d.confirmar, {
  message: 'Senhas não coincidem',
  path: ['confirmar'],
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

const inputClass = 'flex-1 h-10 bg-white border-y border-r border-gray-200 focus:border-red-500 rounded-r-lg px-3 text-gray-900 text-sm placeholder:text-gray-400 outline-none transition-colors'

function Campo({ icon: Icon, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex">
        <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-l-lg" style={{ background: '#F7F3EE', border: '1px solid #E0D6CA', borderRight: 'none' }}>
          <Icon size={15} strokeWidth={1.8} style={{ color: '#8A7F76' }} />
        </div>
        {children}
      </div>
      {error && <p className="text-red-500 text-[11px] pl-1">{error}</p>}
    </div>
  )
}

export default function Cadastro() {
  const navigate = useNavigate()
  const [erro, setErro] = useState(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data) {
    setErro(null)
    try {
      await api.post('/auth/registro', {
        nome:     data.nome,
        email:    data.email,
        telefone: data.telefone,
        senha:    data.senha,
      })
      navigate('/login?cadastrado=1')
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao criar conta')
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F0EBE4' }}>

      {/* ── Painel esquerdo – branding (desktop) ── */}
      <div
        className="hidden lg:flex w-[420px] shrink-0 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: '#C4B9A8' }}
      >
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
            <p className="text-[10px] font-bold tracking-[0.35em] uppercase mb-2" style={{ color: '#AA1515' }}>
              Centro de Treinamento
            </p>
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
          className="w-full max-w-[380px] rounded-2xl"
          style={{ background: '#FFFFFF', boxShadow: '0 8px 48px rgba(0,0,0,0.10)', padding: '36px 36px' }}
        >

          {/* Logo mobile */}
          <div className="flex flex-col items-center gap-4 mb-8 lg:hidden">
            <LogoMG size={72} />
            <div className="text-center">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: '#AA1515' }}>Centro de Treinamento</p>
              <h1 className="text-lg font-black uppercase tracking-tight mt-1" style={{ color: '#1A1A1A' }}>Márcio Gonçalves</h1>
            </div>
          </div>

          {/* Título */}
          <div style={{ marginBottom: 22 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
              <div className="h-px w-4" style={{ background: '#CC1A1A' }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#CC1A1A' }}>{APP.nome}</span>
            </div>
            <div className="flex items-center gap-3">
              <UsersRound size={34} strokeWidth={1.5} style={{ color: '#CC1A1A', flexShrink: 0 }} />
              <div>
                <h2 className="text-[20px] font-black uppercase tracking-tight leading-none" style={{ color: '#1A1A1A' }}>Criar conta</h2>
                <p className="text-xs" style={{ marginTop: 5, color: '#8A7F76' }}>Comece sua transformação agora</p>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">

            <Campo icon={UserRound} error={errors.nome?.message}>
              <input {...register('nome')} type="text" placeholder="Nome completo" autoComplete="name" className={inputClass} />
            </Campo>

            <Campo icon={Mail} error={errors.email?.message}>
              <input {...register('email')} type="email" placeholder="E-mail" autoComplete="email" className={inputClass} />
            </Campo>

            <Campo icon={Phone} error={errors.telefone?.message}>
              <input {...register('telefone')} type="tel" placeholder="WhatsApp (62) 99999-9999" autoComplete="tel" className={inputClass} />
            </Campo>

            <Campo icon={Lock} error={errors.senha?.message}>
              <input {...register('senha')} type="password" placeholder="Senha (mín. 6 caracteres)" className={inputClass} />
            </Campo>

            <Campo icon={Lock} error={errors.confirmar?.message}>
              <input {...register('confirmar')} type="password" placeholder="Confirmar senha" className={inputClass} />
            </Campo>

            {erro && (
              <div className="rounded-lg px-3 py-2.5 text-xs text-center" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A' }}>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 rounded-lg font-black text-[12px] text-white uppercase tracking-widest transition-all disabled:opacity-50 active:scale-[0.98]"
              style={{ marginTop: 4, background: 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', boxShadow: '0 4px 16px rgba(180,26,26,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
            >
              {isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm" style={{ marginTop: 18, color: '#8A7F76' }}>
            Já tem conta?{' '}
            <Link to="/login" className="font-semibold" style={{ color: '#CC1A1A' }}>Entrar</Link>
          </p>

          <p className="text-center text-[11px] uppercase tracking-widest" style={{ marginTop: 16, color: '#B0A89E' }}>
            {APP.nome} · {APP.tagline}
          </p>
        </div>
      </div>
    </div>
  )
}
