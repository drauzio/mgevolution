import { Users, Calendar, Dumbbell, Salad, TrendingUp, ArrowUpRight } from 'lucide-react'

const stats = [
  { icon: Users,    label: 'Alunos ativos',     valor: 48,  sub: '+3 este mês',   cor: { icon: '#2563EB', bg: 'rgba(37,99,235,0.08)',   border: 'rgba(37,99,235,0.18)' } },
  { icon: Calendar, label: 'Sessões hoje',       valor: 12,  sub: '3 pendentes',   cor: { icon: '#CC1A1A', bg: 'rgba(204,26,26,0.08)',  border: 'rgba(204,26,26,0.18)' } },
  { icon: Dumbbell, label: 'Protocolos ativos',  valor: 31,  sub: '5 atualizados', cor: { icon: '#16A34A', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.18)' } },
  { icon: Salad,    label: 'Planos alimentares', valor: 29,  sub: '2 novos',       cor: { icon: '#7C3AED', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.18)' } },
]

const alunosRecentes = [
  { nome: 'Carlos Souza',    email: 'carlos@email.com', personal: 'Márcio G.', score: 88, ativo: true },
  { nome: 'Ana Paula',       email: 'ana@email.com',    personal: 'Márcio G.', score: 92, ativo: true },
  { nome: 'Bruno Lima',      email: 'bruno@email.com',  personal: 'Márcio G.', score: 74, ativo: true },
  { nome: 'Fernanda Costa',  email: 'fer@email.com',    personal: 'Márcio G.', score: 65, ativo: false },
  { nome: 'Rafael Mendes',   email: 'rafa@email.com',   personal: 'Márcio G.', score: 95, ativo: true },
]

export default function AdminDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Cabeçalho */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>
          Painel Administrativo
        </h1>
        <p style={{ fontSize: 14, color: '#8A7F76' }}>Visão geral do Centro de Treinamento MG</p>
      </div>

      {/* Cards de stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {stats.map(({ icon: Icon, label, valor, sub, cor }) => (
          <div key={label} style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 16, padding: '20px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: cor.bg, border: `1px solid ${cor.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={cor.icon} strokeWidth={1.8} />
              </div>
              <ArrowUpRight size={14} color="#C4B9A8" />
            </div>
            <p style={{ fontSize: 30, fontWeight: 900, color: '#1A1A1A', lineHeight: 1, marginBottom: 6 }}>{valor}</p>
            <p style={{ fontSize: 12, color: '#8A7F76', marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: 11, color: cor.icon, fontWeight: 600 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Alunos recentes */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #F0EBE4' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Alunos recentes</p>
          <a href="/admin/alunos" style={{ fontSize: 12, color: '#CC1A1A', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            Ver todos <ArrowUpRight size={13} />
          </a>
        </div>

        {alunosRecentes.map(({ nome, email, personal, score, ativo }, i) => (
          <div
            key={email}
            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderTop: i > 0 ? '1px solid #F0EBE4' : 'none', transition: 'background 0.15s', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#FDFAF7'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Avatar */}
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(204,26,26,0.08)', border: '1px solid rgba(204,26,26,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 800, color: '#CC1A1A' }}>
              {nome[0]}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>{nome}</p>
              <p style={{ fontSize: 12, color: '#8A7F76' }}>{email}</p>
            </div>

            {/* Personal */}
            <div style={{ display: 'none' }} className="sm:block">
              <p style={{ fontSize: 12, color: '#8A7F76', textAlign: 'right' }}>Personal</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A' }}>{personal}</p>
            </div>

            {/* Score */}
            <div style={{ textAlign: 'center', minWidth: 52 }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: score >= 80 ? '#CC1A1A' : '#B0A89E', lineHeight: 1 }}>{score}</p>
              <p style={{ fontSize: 10, color: '#8A7F76' }}>score</p>
            </div>

            {/* Status */}
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ativo ? '#16A34A' : '#E0D6CA', flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {/* Próximas sessões */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '20px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <TrendingUp size={16} color="#CC1A1A" />
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Próximas sessões hoje</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { hora: '08:00', aluno: 'Carlos Souza',   tipo: 'Musculação' },
            { hora: '09:30', aluno: 'Ana Paula',       tipo: 'Funcional' },
            { hora: '11:00', aluno: 'Rafael Mendes',   tipo: 'Musculação' },
            { hora: '14:00', aluno: 'Fernanda Costa',  tipo: 'Cardio + Core' },
          ].map(({ hora, aluno, tipo }) => (
            <div key={hora} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: '#F7F3EE', borderRadius: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#CC1A1A', minWidth: 42 }}>{hora}</p>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{aluno}</p>
                <p style={{ fontSize: 11, color: '#8A7F76' }}>{tipo}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
