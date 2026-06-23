import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useSWR from 'swr'
import { ArrowLeft, RefreshCw, CheckCircle2, Clock } from 'lucide-react'
import { BtnCancelar } from '../../components/ui/Botoes'
import * as avaliacaoService from '../../services/avaliacao'
import { data } from '../../utils/formatters'

function Linha({ label, valor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #F7F3EE' }}>
      <span style={{ minWidth: 110, flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.08em', paddingTop: 2 }}>{label}</span>
      <span style={{ fontSize: 14, color: '#1A1A1A', flex: 1 }}>{valor || '—'}</span>
    </div>
  )
}

function formatarResposta(r) {
  if (r.opcao_valor)     return r.opcao_valor
  if (r.resposta_texto)  return r.resposta_texto
  if (r.resposta_numero != null) return String(r.resposta_numero)
  if (r.resposta_bit != null)    return r.resposta_bit ? 'Sim' : 'Não'
  return '—'
}

export default function AvaliacaoView() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const [reatribuindo, setReatribuindo] = useState(false)
  const [msgOk, setMsgOk]              = useState(null)
  const [erro,  setErro]               = useState(null)

  const { data: av, isLoading, mutate } = useSWR(
    id ? `avaliacao-${id}` : null,
    () => avaliacaoService.buscarAvaliacao(id)
  )

  async function reatribuir() {
    if (!confirm('Deseja reatribuir o template para este aluno? O protocolo atual será inativado.')) return
    setReatribuindo(true); setErro(null); setMsgOk(null)
    try {
      const r = await avaliacaoService.reatribuirTemplate(id)
      setMsgOk(r.id_protocolo ? 'Template reatribuído com sucesso.' : 'Nenhum template encontrado para os critérios.')
      mutate()
    } catch (e) {
      setErro(e.response?.data?.erro || e.message || 'Erro ao reatribuir')
    } finally {
      setReatribuindo(false)
    }
  }

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!av) return (
    <div style={{ textAlign: 'center', paddingTop: 60, color: '#8A7F76' }}>
      <p>Avaliação não encontrada.</p>
    </div>
  )

  const concluida = av.status === 'concluida'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>
            Avaliação — {av.aluno_nome}
          </h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>{av.aluno_email}</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {concluida && (
            <button
              onClick={reatribuir}
              disabled={reatribuindo}
              style={{ height: 36, paddingInline: 14, display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #CC1A1A', borderRadius: 8, background: '#FFFFFF', cursor: reatribuindo ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, color: '#CC1A1A', opacity: reatribuindo ? 0.6 : 1 }}
            >
              <RefreshCw size={13} style={{ animation: reatribuindo ? 'spin 1s linear infinite' : 'none' }} />
              Reatribuir template
            </button>
          )}
          <BtnCancelar onClick={() => navigate('/admin/avaliacoes')} label="Voltar" />
        </div>
      </div>

      {/* Resultado da avaliação */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 28, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Resultado</p>

        <div className="av-resultado-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          <div>
            <Linha label="Status"
              valor={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {concluida
                    ? <CheckCircle2 size={14} color="#15803d" />
                    : <Clock size={14} color="#92400e" />}
                  <span style={{ fontWeight: 700, color: concluida ? '#15803d' : '#92400e' }}>
                    {concluida ? 'Concluída' : 'Em andamento'}
                  </span>
                </span>
              }
            />
            <Linha label="Objetivo"    valor={av.objetivo} />
            <Linha label="Nível"       valor={av.nivel} />
          </div>
          <div>
            <Linha label="Sexo"  valor={av.sexo === 'M' ? 'Masculino' : av.sexo === 'F' ? 'Feminino' : null} />
            <Linha label="Idade" valor={av.idade ? `${av.idade} anos` : null} />
            <Linha label="Data"  valor={data(av.data_finalizacao || av.data_criacao)} />
          </div>
        </div>

        {av.protocolo_nome && (
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Template atribuído</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>{av.protocolo_nome}</p>
          </div>
        )}

        {!av.protocolo_nome && concluida && (
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <p style={{ fontSize: 13, color: '#92400e' }}>Nenhum template foi atribuído. Verifique se há um template compatível e use "Reatribuir template".</p>
          </div>
        )}

        {msgOk && (
          <div style={{ marginTop: 12, padding: '10px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', color: '#15803d', fontSize: 13 }}>
            {msgOk}
          </div>
        )}
        {erro && (
          <div style={{ marginTop: 12, padding: '10px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A', fontSize: 13 }}>
            {erro}
          </div>
        )}
      </div>

      {/* Respostas */}
      {av.respostas?.length > 0 && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 28, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Respostas</p>

          <div>
            {av.respostas.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '12px 0', borderBottom: i < av.respostas.length - 1 ? '1px solid #F7F3EE' : 'none' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#F0EBE4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#8A7F76', flexShrink: 0, marginTop: 1 }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: '#6B6560', marginBottom: 4 }}>{r.pergunta}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>{formatarResposta(r)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 600px) {
          .av-resultado-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

    </div>
  )
}
