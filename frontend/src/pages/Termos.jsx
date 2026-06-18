import { Link } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { APP } from '../config/app'

export default function Termos() {
  return (
    <div style={{ minHeight: '100vh', background: '#F0EBE4' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Voltar */}
        <Link
          to="/login"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#8A7F76', marginBottom: 40, textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = '#CC1A1A'}
          onMouseLeave={e => e.currentTarget.style.color = '#8A7F76'}
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Voltar ao login
        </Link>

        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(204,26,26,0.1)', border: '1px solid rgba(204,26,26,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={22} style={{ color: '#CC1A1A' }} strokeWidth={1.6} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#CC1A1A', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 2 }}>{APP.nome}</p>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>Termos de Uso</h1>
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#8A7F76', marginBottom: 40 }}>Última atualização: janeiro de 2026</p>

        <div style={{ background: '#FFFFFF', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', padding: '40px 44px' }}>
          <Section title="1. Aceitação dos Termos">
            Ao acessar ou utilizar a plataforma <strong>{APP.nome}</strong>, você concorda com estes Termos de Uso. Caso não concorde com qualquer disposição aqui prevista, não utilize nossos serviços.
          </Section>

          <Section title="2. Descrição do Serviço">
            A plataforma {APP.nome} é um sistema de gerenciamento de academia que oferece funcionalidades como acompanhamento de treinos, dietas, avaliações físicas e comunicação entre alunos, personal trainers e nutricionistas.
          </Section>

          <Section title="3. Cadastro e Conta">
            Para utilizar nossos serviços, você deverá criar uma conta fornecendo informações verdadeiras, precisas e atualizadas. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.
          </Section>

          <Section title="4. Uso Adequado">
            Você concorda em utilizar a plataforma somente para fins legais e de acordo com estes termos. É expressamente proibido:
            <ul style={{ marginTop: 12, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Compartilhar suas credenciais de acesso com terceiros;</li>
              <li>Utilizar a plataforma para fins ilícitos ou não autorizados;</li>
              <li>Tentar acessar dados de outros usuários sem autorização;</li>
              <li>Transmitir conteúdo ofensivo, difamatório ou prejudicial.</li>
            </ul>
          </Section>

          <Section title="5. Saúde e Responsabilidade">
            As informações de treino e nutrição fornecidas pela plataforma têm caráter informativo e de apoio ao trabalho de profissionais habilitados. Consulte sempre um médico ou profissional de saúde antes de iniciar qualquer programa de exercícios ou dieta. O {APP.nome} não se responsabiliza por danos decorrentes do uso inadequado dessas informações.
          </Section>

          <Section title="6. Propriedade Intelectual">
            Todo o conteúdo disponível na plataforma — incluindo textos, imagens, logos, softwares e interfaces — é de propriedade exclusiva do {APP.nome} ou de seus licenciadores, protegido pelas leis de propriedade intelectual vigentes.
          </Section>

          <Section title="7. Suspensão e Encerramento">
            Reservamo-nos o direito de suspender ou encerrar sua conta a qualquer momento, sem aviso prévio, caso identifiquemos violação destes termos ou comportamento prejudicial à plataforma ou a outros usuários.
          </Section>

          <Section title="8. Alterações nos Termos">
            Podemos modificar estes Termos de Uso a qualquer momento. As alterações entrarão em vigor após publicação na plataforma. O uso continuado dos serviços após a publicação das mudanças constitui aceite dos novos termos.
          </Section>

          <Section title="9. Contato" last>
            Em caso de dúvidas sobre estes Termos de Uso, entre em contato conosco pelo e-mail de suporte disponível na plataforma.
          </Section>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#B0A89E', marginTop: 32 }}>
          Copyright © {new Date().getFullYear()} {APP.nome}. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}

function Section({ title, children, last = false }) {
  return (
    <div style={{ marginBottom: last ? 0 : 32, paddingBottom: last ? 0 : 32, borderBottom: last ? 'none' : '1px solid #F0EBE4' }}>
      <h2 style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{title}</h2>
      <p style={{ fontSize: 14, color: '#6B6560', lineHeight: 1.75 }}>{children}</p>
    </div>
  )
}
