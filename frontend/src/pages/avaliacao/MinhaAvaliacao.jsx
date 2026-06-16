import useSWR from 'swr'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Dumbbell, ChevronLeft, User, Target, Layers, Calendar } from 'lucide-react'
import { buscarMinhaAvaliacao } from '../../services/avaliacao'

const SEXO_LABEL = { M: 'Masculino', F: 'Feminino' }

function respostaTexto(r) {
  if (r.opcao_valor)      return r.opcao_valor
  if (r.resposta_texto)   return r.resposta_texto
  if (r.resposta_numero != null) return String(r.resposta_numero)
  if (r.resposta_bit != null)    return r.resposta_bit ? 'Sim' : 'Não'
  return '—'
}

function formatarData(val) {
  if (!val) return '—'
  const d = new Date(val)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function InfoChip({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#F7F3EE', borderRadius: 14, flex: 1, minWidth: 140 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(204,26,26,0.1)', border: '1px solid rgba(204,26,26,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color="#CC1A1A" strokeWidth={2} />
      </div>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#A09890', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{value || '—'}</p>
      </div>
    </div>
  )
}

export default function MinhaAvaliacao() {
  const navigate = useNavigate()

  const { data: avaliacao, isLoading } = useSWR('minha-avaliacao', buscarMinhaAvaliacao, {
    revalidateOnFocus: false,
  })

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!avaliacao) return (
    <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <button
        onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#8A7F76', fontSize: 13, fontWeight: 600, padding: 0, width: 'fit-content' }}
      >
        <ChevronLeft size={16} /> Voltar
      </button>
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '40px 24px', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <ClipboardList size={40} color="#C4B9A8" style={{ marginBottom: 16 }} />
        <p style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>Avaliação não encontrada</p>
        <p style={{ fontSize: 13, color: '#8A7F76', marginBottom: 24 }}>Você ainda não realizou sua avaliação física.</p>
        <button
          onClick={() => navigate('/onboarding')}
          style={{ height: 42, paddingInline: 24, borderRadius: 12, background: '#CC1A1A', border: 'none', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          Fazer avaliação agora
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 540, display: 'flex', flexDirection: 'column', gap: 20 }}>

      <button
        onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#8A7F76', fontSize: 13, fontWeight: 600, padding: 0, width: 'fit-content' }}
      >
        <ChevronLeft size={16} /> Voltar
      </button>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>
          Minha Avaliação
        </h1>
        <p style={{ fontSize: 13, color: '#8A7F76' }}>Concluída em {formatarData(avaliacao.data_finalizacao)}</p>
      </div>

      {/* Chips de perfil */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <InfoChip icon={User}    label="Sexo"      value={SEXO_LABEL[avaliacao.sexo] || avaliacao.sexo} />
        <InfoChip icon={Calendar} label="Idade"    value={avaliacao.idade ? `${avaliacao.idade} anos` : null} />
        <InfoChip icon={Target}  label="Objetivo"  value={avaliacao.objetivo} />
        <InfoChip icon={Layers}  label="Nível"     value={avaliacao.nivel} />
      </div>

      {/* Treino atribuído */}
      {avaliacao.protocolo_nome && (
        <div style={{ background: '#FFFFFF', border: '1.5px solid rgba(204,26,26,0.22)', borderRadius: 20, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 16px rgba(204,26,26,0.06)' }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(204,26,26,0.1)', border: '1px solid rgba(204,26,26,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Dumbbell size={18} color="#CC1A1A" strokeWidth={1.8} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#CC1A1A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Treino atribuído</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A' }}>{avaliacao.protocolo_nome}</p>
          </div>
        </div>
      )}

      {/* Respostas */}
      {avaliacao.respostas?.length > 0 && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0EBE4' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Respostas ({avaliacao.respostas.length})
            </p>
          </div>
          <div>
            {avaliacao.respostas.map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
                  padding: '14px 20px',
                  borderTop: i > 0 ? '1px solid #F0EBE4' : 'none',
                }}
              >
                <p style={{ fontSize: 13, color: '#6B6560', flex: 1 }}>{r.pergunta}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', textAlign: 'right', maxWidth: '55%' }}>
                  {respostaTexto(r)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
