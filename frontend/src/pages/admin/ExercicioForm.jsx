import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BtnSalvar, BtnCancelar, BtnExcluir } from '../../components/ui/Botoes'
import * as exerciciosService from '../../services/exercicios'

const GRUPOS = ['Peito','Costas','Pernas','Ombro','Bíceps','Tríceps','Abdômen','Cardio']
const EQUIPAMENTOS = ['Barra','Halteres','Cabo','Máquina','Peso corporal','Elástico','Kettlebell']

function Campo({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  height: 42, padding: '0 14px',
  border: '1px solid #E0D6CA', borderRadius: 10,
  fontSize: 14, color: '#1A1A1A', outline: 'none', background: '#FFFFFF',
  width: '100%', boxSizing: 'border-box',
}

export default function ExercicioForm() {
  const { id } = useParams()
  const isEdicao = !!id
  const navigate = useNavigate()

  const [form, setForm] = useState({ nome: '', grupo_muscular: '', equipamento: '', descricao: '', video_url: '' })
  const [ativo, setAtivo] = useState(true)
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [toggleando, setToggleando] = useState(false)
  const [carregando, setCarregando] = useState(isEdicao)

  // vídeo upload
  const videoInputRef = useRef(null)
  const [uploadando, setUploadando] = useState(false)
  const [uploadProgresso, setUploadProgresso] = useState(0)
  const [erroVideo, setErroVideo] = useState(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null)
  const [carregandoVideo, setCarregandoVideo] = useState(false)

  useEffect(() => {
    if (!isEdicao) return
    exerciciosService.buscarPorId(id)
      .then(data => {
        setForm({ nome: data.nome, grupo_muscular: data.grupo_muscular, equipamento: data.equipamento || '', descricao: data.descricao || '', video_url: data.video_url || '' })
        setAtivo(!!data.ativo)
      })
      .finally(() => setCarregando(false))
  }, [id])

  async function carregarVideoUrl() {
    if (!isEdicao || !form.video_url || form.video_url.startsWith('http')) return
    setCarregandoVideo(true)
    try {
      const { url } = await exerciciosService.buscarVideoUrl(id)
      setVideoPreviewUrl(url)
    } catch (_) {}
    finally { setCarregandoVideo(false) }
  }

  async function handleUploadVideo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!isEdicao) { setErroVideo('Salve o exercício antes de fazer upload do vídeo.'); return }
    setErroVideo(null)
    setUploadando(true)
    setUploadProgresso(0)
    try {
      await exerciciosService.uploadVideo(id, file, setUploadProgresso)
      // recarrega dados reais do exercício (incluindo o video_url correto com extensão)
      const data = await exerciciosService.buscarPorId(id)
      setForm(f => ({ ...f, video_url: data.video_url || '' }))
      // gera SAS URL para preview
      const { url } = await exerciciosService.buscarVideoUrl(id)
      setVideoPreviewUrl(url)
    } catch (e2) {
      setErroVideo(e2.response?.data?.erro || e2.message || 'Erro ao fazer upload')
    } finally {
      setUploadando(false)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  async function handleRemoverVideo() {
    if (!confirm('Remover o vídeo deste exercício?')) return
    try {
      await exerciciosService.removerVideo(id)
      setForm(f => ({ ...f, video_url: '' }))
      setVideoPreviewUrl(null)
    } catch (e2) {
      setErroVideo(e2.response?.data?.erro || e2.message || 'Erro ao remover vídeo')
    }
  }

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function salvar() {
    if (!form.nome || !form.grupo_muscular) { setErro('Nome e grupo muscular são obrigatórios'); return }
    setSalvando(true); setErro(null)
    try {
      if (isEdicao) {
        await exerciciosService.atualizar(id, form)
      } else {
        await exerciciosService.criar(form)
      }
      navigate('/admin/exercicios')
    } catch (e) {
      setErro(e.response?.data?.erro || e.message || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function toggle() {
    if (!confirm(`Deseja ${ativo ? 'inativar' : 'reativar'} este exercício?`)) return
    setToggleando(true)
    try {
      await exerciciosService.toggleAtivo(id)
      navigate('/admin/exercicios')
    } finally {
      setToggleando(false)
    }
  }

  if (carregando) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>
            {isEdicao ? 'Editar Exercício' : 'Novo Exercício'}
          </h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>
            {isEdicao ? 'Atualize os dados do exercício.' : 'Preencha os dados para adicionar ao catálogo.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {isEdicao && <BtnExcluir onClick={toggle} loading={toggleando} label={ativo ? 'Inativar' : 'Reativar'} />}
          <BtnCancelar onClick={() => navigate('/admin/exercicios')} />
          <BtnSalvar onClick={salvar} loading={salvando} />
        </div>
      </div>

      {/* Formulário */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>

        <Campo label="Nome do exercício">
          <input style={inputStyle} placeholder="Ex: Supino Reto com Barra" value={form.nome} onChange={set('nome')} />
        </Campo>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Campo label="Grupo muscular">
            <select value={form.grupo_muscular} onChange={set('grupo_muscular')} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Selecione</option>
              {GRUPOS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Campo>

          <Campo label="Equipamento">
            <select value={form.equipamento} onChange={set('equipamento')} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Nenhum / Livre</option>
              {EQUIPAMENTOS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </Campo>
        </div>

        <Campo label="Descrição / Dica de execução">
          <textarea
            value={form.descricao}
            onChange={set('descricao')}
            placeholder="Ex: Deite no banco, segure a barra na largura dos ombros..."
            rows={3}
            style={{ padding: '10px 14px', border: '1px solid #E0D6CA', borderRadius: 10, fontSize: 14, color: '#1A1A1A', outline: 'none', background: '#FFFFFF', resize: 'vertical', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}
          />
        </Campo>

        {/* Seção de vídeo */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Vídeo do exercício (opcional)</label>

          {/* vídeo Azure já salvo */}
          {form.video_url && !form.video_url.startsWith('http') && (
            <div style={{ marginTop: 10, padding: 16, background: '#F9F5F0', border: '1px solid #E0D6CA', borderRadius: 12 }}>
              {videoPreviewUrl ? (
                <video
                  src={videoPreviewUrl}
                  controls
                  style={{ width: '100%', maxHeight: 300, borderRadius: 8, background: '#000' }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: '#8A7F76' }}>
                    {carregandoVideo ? 'Carregando vídeo…' : 'Vídeo salvo no Azure.'}
                  </span>
                  {!carregandoVideo && (
                    <button
                      type="button"
                      onClick={carregarVideoUrl}
                      style={{ fontSize: 12, color: '#CC1A1A', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      Visualizar
                    </button>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadando}
                  style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid #E0D6CA', background: '#FFF', cursor: 'pointer', color: '#1A1A1A' }}
                >
                  {uploadando ? `Enviando ${uploadProgresso}%…` : 'Substituir vídeo'}
                </button>
                <button
                  type="button"
                  onClick={handleRemoverVideo}
                  style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', color: '#CC1A1A' }}
                >
                  Remover vídeo
                </button>
              </div>
            </div>
          )}

          {/* sem vídeo Azure: campo URL manual + botão upload */}
          {(!form.video_url || form.video_url.startsWith('http')) && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                style={inputStyle}
                placeholder="https://youtube.com/... ou faça upload abaixo"
                value={form.video_url.startsWith('http') ? form.video_url : ''}
                onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
              />
              {isEdicao && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadando}
                    style={{ fontSize: 13, padding: '8px 18px', borderRadius: 10, border: '1px solid #CC1A1A', background: uploadando ? '#F9F5F0' : '#CC1A1A', color: uploadando ? '#8A7F76' : '#FFF', cursor: uploadando ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                  >
                    {uploadando ? `Enviando ${uploadProgresso}%…` : '⬆ Upload de vídeo'}
                  </button>
                  <span style={{ fontSize: 12, color: '#8A7F76' }}>MP4, MOV, WebM — máx. 200 MB</span>
                </div>
              )}
              {!isEdicao && (
                <span style={{ fontSize: 12, color: '#8A7F76' }}>Salve o exercício primeiro para habilitar upload de vídeo.</span>
              )}
            </div>
          )}

          {erroVideo && (
            <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A', fontSize: 13 }}>
              {erroVideo}
            </div>
          )}

          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/avi"
            style={{ display: 'none' }}
            onChange={handleUploadVideo}
          />
        </div>

        {erro && (
          <div style={{ padding: '10px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A', fontSize: 13 }}>
            {erro}
          </div>
        )}
      </div>
    </div>
  )
}
