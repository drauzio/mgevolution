import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { APP } from '../config/app'

export default function Privacidade() {
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
            <ShieldCheck size={22} style={{ color: '#CC1A1A' }} strokeWidth={1.6} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#CC1A1A', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 2 }}>{APP.nome}</p>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>Política de Privacidade</h1>
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#8A7F76', marginBottom: 40 }}>Última atualização: janeiro de 2026</p>

        <div style={{ background: '#FFFFFF', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', padding: '40px 44px' }}>
          <Section title="1. Introdução">
            A sua privacidade é muito importante para nós. Esta Política de Privacidade descreve como o <strong>{APP.nome}</strong> coleta, utiliza, armazena e protege as informações pessoais dos usuários da plataforma, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
          </Section>

          <Section title="2. Dados Coletados">
            Podemos coletar os seguintes tipos de dados:
            <ul style={{ marginTop: 12, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong>Dados de cadastro:</strong> nome, e-mail, telefone e senha;</li>
              <li><strong>Dados de saúde:</strong> peso, altura, medidas corporais e composição física;</li>
              <li><strong>Dados de uso:</strong> treinos realizados, dietas seguidas e evolução física;</li>
              <li><strong>Dados técnicos:</strong> endereço IP, tipo de dispositivo e navegador utilizado.</li>
            </ul>
          </Section>

          <Section title="3. Finalidade do Uso">
            Os dados coletados são utilizados para:
            <ul style={{ marginTop: 12, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Fornecer e personalizar os serviços da plataforma;</li>
              <li>Permitir o acompanhamento de treinos e dietas pelos profissionais responsáveis;</li>
              <li>Enviar comunicações relacionadas à sua conta e progresso;</li>
              <li>Melhorar continuamente a experiência do usuário;</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
            </ul>
          </Section>

          <Section title="4. Compartilhamento de Dados">
            Seus dados pessoais não são vendidos ou cedidos a terceiros. Podemos compartilhá-los apenas com:
            <ul style={{ marginTop: 12, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Profissionais vinculados à sua conta (personal trainer, nutricionista);</li>
              <li>Prestadores de serviços tecnológicos que suportam a operação da plataforma, sob acordos de confidencialidade;</li>
              <li>Autoridades competentes, quando exigido por lei.</li>
            </ul>
          </Section>

          <Section title="5. Armazenamento e Segurança">
            Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acesso não autorizado, perda, alteração ou divulgação indevida. Os dados são armazenados em servidores seguros e o acesso é restrito a pessoal autorizado.
          </Section>

          <Section title="6. Dados de Saúde">
            Por se tratar de dados sensíveis, as informações de saúde e composição corporal são tratadas com nível adicional de proteção. Esses dados são acessados somente pelos profissionais diretamente responsáveis pelo seu acompanhamento.
          </Section>

          <Section title="7. Seus Direitos">
            Em conformidade com a LGPD, você possui os seguintes direitos:
            <ul style={{ marginTop: 12, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Confirmar a existência de tratamento dos seus dados;</li>
              <li>Acessar os dados que possuímos sobre você;</li>
              <li>Solicitar correção de dados incompletos ou desatualizados;</li>
              <li>Solicitar a exclusão dos seus dados, quando aplicável;</li>
              <li>Revogar o consentimento a qualquer momento.</li>
            </ul>
          </Section>

          <Section title="8. Cookies">
            Utilizamos cookies e tecnologias similares para manter sua sessão ativa e melhorar a experiência de uso. Você pode configurar seu navegador para recusar cookies, porém isso pode afetar o funcionamento de algumas funcionalidades.
          </Section>

          <Section title="9. Retenção de Dados">
            Mantemos seus dados pelo período necessário para a prestação dos serviços ou pelo prazo exigido por lei. Após o encerramento da conta, os dados poderão ser mantidos por até 5 anos para fins legais e fiscais.
          </Section>

          <Section title="10. Contato e DPO" last>
            Para exercer seus direitos ou esclarecer dúvidas sobre esta Política de Privacidade, entre em contato pelo e-mail de suporte disponível na plataforma. Estamos comprometidos em responder sua solicitação em até 15 dias úteis.
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
