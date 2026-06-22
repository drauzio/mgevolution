import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Dumbbell, Check, X, Play, Trophy, Video as VideoIcon } from 'lucide-react-native';
import api from '../../src/services/api';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Treinos() {
  const [protocolo, setProtocolo]           = useState(null);
  const [carregando, setCarregando]         = useState(true);
  const [diaSelecionado, setDiaSelecionado] = useState(new Date().getDay());
  const [sessao, setSessao]                 = useState(null);
  const [modalSessao, setModalSessao]       = useState(false);
  const [concluindo, setConcluindo]         = useState(false);
  const [contagem, setContagem]             = useState(null);

  const carregarProtocolo = useCallback(async () => {
    try {
      const res = await api.get('/treinos/meu-protocolo');
      setProtocolo(res.data);
    } catch (err) {
      console.log('[TREINO] erro protocolo:', err?.response?.status, JSON.stringify(err?.response?.data), err?.message);
      Alert.alert('Erro', 'Não foi possível carregar seu protocolo de treino.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregarProtocolo(); }, [carregarProtocolo]);

  const diaAtual = protocolo?.dias?.find(d => d.dia_semana === diaSelecionado);
  const exerciciosHoje = diaAtual?.exercicios ?? [];
  const ehDescanso = diaAtual?.descanso === true || diaAtual?.descanso === 1;

  async function iniciarTreino() {
    if (!diaAtual) return;
    try {
      const res = await api.get('/treinos/sessao', {
        params: {
          idTreinoDia: diaAtual.id_treino_dia,
          idProtocolo: protocolo.id_protocolo,
        },
      });
      const s = res.data;
      // Iniciar sessao se ainda nao iniciada
      if (!s.data_inicio) {
        await api.patch('/treinos/sessao/' + s.id_treino_sessao + '/iniciar');
      }
      setSessao(s);
      iniciarContagem();
    } catch {
      Alert.alert('Erro', 'Não foi possível iniciar o treino.');
    }
  }

  function iniciarContagem() {
    setContagem(5);
    let n = 5;
    const timer = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(timer);
        setContagem(null);
        setModalSessao(true);
      } else {
        setContagem(n);
      }
    }, 1000);
  }

  async function marcarExercicio(idTreinoDiaExercicio, feito, cargaUsada) {
    if (!sessao) return;
    await api.patch(
      '/treinos/sessao/' + sessao.id_treino_sessao + '/exercicio/' + idTreinoDiaExercicio,
      { feito, carga_usada: cargaUsada || null }
    );
    setSessao(s => ({
      ...s,
      exercicios: s.exercicios.map(e =>
        e.id_treino_dia_exercicio === idTreinoDiaExercicio
          ? { ...e, feito: feito ? 1 : 0, carga_usada: cargaUsada }
          : e
      ),
    }));
  }

  async function concluirTreino() {
    if (!sessao) return;
    const feitos = sessao.exercicios.filter(e => e.feito).length;
    const total  = sessao.exercicios.length;

    const confirmar = () => new Promise(resolve =>
      Alert.alert(
        'Concluir treino',
        feitos < total
          ? `Você completou ${feitos} de ${total} exercícios. Deseja concluir mesmo assim?`
          : 'Parabéns! Todos os exercícios concluídos. Finalizar treino?',
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Concluir', onPress: () => resolve(true) },
        ]
      )
    );

    if (!await confirmar()) return;
    setConcluindo(true);
    try {
      await api.patch('/treinos/sessao/' + sessao.id_treino_sessao + '/concluir');
      setModalSessao(false);
      setSessao(null);
      Alert.alert('Treino concluído! 💪', 'Continue assim, ótimo trabalho!');
    } catch {
      Alert.alert('Erro', 'Não foi possível concluir o treino.');
    } finally {
      setConcluindo(false);
    }
  }

  async function cancelarSessao() {
    Alert.alert('Cancelar treino', 'Deseja cancelar e descartar o progresso?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Cancelar treino', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete('/treinos/sessao/' + sessao.id_treino_sessao);
          } catch {}
          setModalSessao(false);
          setSessao(null);
        },
      },
    ]);
  }

  if (carregando) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color="#CC1A1A" size="large" />
      </View>
    );
  }

  if (!protocolo) {
    return (
      <View style={s.centered}>
        <Dumbbell size={48} color="#C4BAB2" strokeWidth={1.5} />
        <Text style={s.semDados}>Nenhum protocolo de treino ativo</Text>
        <Text style={s.semDadosSub}>Aguarde seu personal configurar seu treino.</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Header protocolo */}
      <View style={s.header}>
        <Text style={s.protoNome}>{protocolo.nome}</Text>
        {protocolo.objetivo ? <Text style={s.protoObj}>{protocolo.objetivo}</Text> : null}
      </View>

      {/* Seletor de dias */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.diasScroll} contentContainerStyle={s.diasContent}>
        {protocolo.dias.map(d => {
          const hoje     = d.dia_semana === new Date().getDay();
          const ativo    = d.dia_semana === diaSelecionado;
          const descanso = d.descanso === true || d.descanso === 1;
          return (
            <TouchableOpacity
              key={d.id_treino_dia}
              style={[s.diaBtn, ativo && s.diaBtnAtivo, descanso && s.diaBtnDescanso]}
              onPress={() => setDiaSelecionado(d.dia_semana)}
              activeOpacity={0.75}
            >
              <Text style={[s.diaBtnLabel, ativo && s.diaBtnLabelAtivo]}>
                {DIAS[d.dia_semana] ?? 'D' + d.dia_semana}
              </Text>
              {hoje && <View style={[s.diaHojeDot, ativo && s.diaHojeDotAtivo]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Conteúdo do dia */}
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>

        {diaAtual ? (
          <>
            <View style={s.diaHeader}>
              <Text style={s.diaNome}>{diaAtual.nome || DIAS[diaAtual.dia_semana]}</Text>
              {ehDescanso && (
                <View style={s.descansoBadge}>
                  <Text style={s.descansoBadgeText}>Descanso</Text>
                </View>
              )}
            </View>

            {ehDescanso ? (
              <View style={s.descansoCard}>
                <Text style={s.descansoEmoji}>😴</Text>
                <Text style={s.descansoTitle}>Dia de descanso</Text>
                <Text style={s.descansoSub}>Recuperação é parte do treino. Aproveite!</Text>
              </View>
            ) : exerciciosHoje.length === 0 ? (
              <Text style={s.semExercicios}>Nenhum exercício cadastrado para este dia.</Text>
            ) : (
              <>
                <Text style={s.totalEx}>{exerciciosHoje.length} exercícios</Text>
                {exerciciosHoje.map((ex, i) => (
                  <View key={ex.id_treino_dia_exercicio} style={s.exCard}>
                    <View style={s.exNumBox}>
                      <Text style={s.exNum}>{i + 1}</Text>
                    </View>
                    <View style={s.exInfo}>
                      <Text style={s.exNome}>{ex.exercicio_nome}</Text>
                      <Text style={s.exGrupo}>{ex.grupo_muscular}</Text>
                      <View style={s.exTags}>
                        <Tag label={ex.series + ' séries'} />
                        <Tag label={ex.repeticoes + ' reps'} />
                        {ex.carga_sugerida ? <Tag label={ex.carga_sugerida} /> : null}
                        {ex.descanso_seg ? <Tag label={ex.descanso_seg + 's descanso'} /> : null}
                      </View>
                      {ex.observacao ? <Text style={s.exObs}>{ex.observacao}</Text> : null}
                    </View>
                  </View>
                ))}

                <TouchableOpacity style={s.btnIniciar} onPress={iniciarTreino} activeOpacity={0.85}>
                  <Play size={18} color="#fff" fill="#fff" />
                  <Text style={s.btnIniciarText}>Iniciar Treino</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        ) : (
          <Text style={s.semExercicios}>Nenhum treino configurado para este dia.</Text>
        )}
      </ScrollView>

      {/* Contagem regressiva */}
      <Modal visible={contagem !== null} transparent animationType="fade" statusBarTranslucent>
        <View style={s.contagemOverlay}>
          <Text style={s.contagemNum}>{contagem}</Text>
          <Text style={s.contagemLabel}>Prepare-se!</Text>
        </View>
      </Modal>

      {/* Modal de sessão */}
      <Modal visible={modalSessao} animationType="slide" statusBarTranslucent>
        <SessaoView
          sessao={sessao}
          setSessao={setSessao}
          diaAtual={diaAtual}
          onMarcar={marcarExercicio}
          onConcluir={concluirTreino}
          onCancelar={cancelarSessao}
          concluindo={concluindo}
        />
      </Modal>
    </View>
  );
}

function useCronometro() {
  const [segundos, setSegundos] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    ref.current = setInterval(() => setSegundos(s => s + 1), 1000);
    return () => clearInterval(ref.current);
  }, []);

  const horas   = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs    = segundos % 60;

  const texto = horas > 0
    ? String(horas).padStart(2, '0') + ':' + String(minutos).padStart(2, '0') + ':' + String(segs).padStart(2, '0')
    : String(minutos).padStart(2, '0') + ':' + String(segs).padStart(2, '0');

  return texto;
}

function SessaoView({ sessao, diaAtual, onMarcar, onConcluir, onCancelar, concluindo }) {
  const [cargas, setCargas]           = useState({});
  const [videoSessao, setVideoSessao] = useState(null);
  const [descanso, setDescanso]       = useState(null); // { restando, total }
  const descansoRef                   = useRef(null);
  const tempo = useCronometro();

  function iniciarDescanso(segundos) {
    if (!segundos || segundos <= 0) return;
    clearInterval(descansoRef.current);
    setDescanso({ restando: segundos, total: segundos });
    descansoRef.current = setInterval(() => {
      setDescanso(d => {
        if (!d || d.restando <= 1) {
          clearInterval(descansoRef.current);
          return null;
        }
        return { ...d, restando: d.restando - 1 };
      });
    }, 1000);
  }

  function pularDescanso() {
    clearInterval(descansoRef.current);
    setDescanso(null);
  }

  useEffect(() => () => clearInterval(descansoRef.current), []);

  if (!sessao) return null;

  const total   = sessao.exercicios.length;
  const feitos  = sessao.exercicios.filter(e => e.feito).length;
  const progresso = total > 0 ? feitos / total : 0;

  return (
    <View style={m.root}>
      {/* Header */}
      <View style={m.header}>
        <TouchableOpacity onPress={onCancelar} style={m.closeBtn}>
          <X size={20} color="#8A7F76" />
        </TouchableOpacity>
        <View style={m.headerCenter}>
          <Text style={m.headerNome}>{diaAtual?.nome || 'Treino'}</Text>
          <Text style={m.headerProg}>{feitos}/{total} exercícios</Text>
        </View>
        <View style={m.tempoBox}>
          <Text style={m.tempoText}>{tempo}</Text>
        </View>
      </View>

      {/* Barra de progresso */}
      <View style={m.progressBar}>
        <View style={[m.progressFill, { width: (progresso * 100) + '%' }]} />
      </View>

      <ScrollView style={m.scroll} contentContainerStyle={m.scrollContent}>
        {sessao.exercicios.map((ex, i) => {
          const feito = ex.feito === 1 || ex.feito === true;
          const carga = cargas[ex.id_treino_dia_exercicio] ?? ex.carga_usada ?? '';
          return (
            <View key={ex.id_treino_dia_exercicio} style={[m.exCard, feito && m.exCardFeito]}>
              <View style={m.exTop}>
                <View style={m.exInfo}>
                  <View style={m.exNomeRow}>
                    <Text style={[m.exNome, feito && m.exNomeFeito, { flex: 1 }]}>{ex.exercicio_nome}</Text>
                    {ex.video_url ? (
                      <TouchableOpacity
                        onPress={async () => {
                          try {
                            const res = await api.get('/exercicios/' + ex.id_exercicio + '/video-url');
                            if (res.data.url) setVideoSessao(res.data.url);
                            else Alert.alert('Aviso', 'Vídeo não disponível.');
                          } catch { Alert.alert('Erro', 'Não foi possível carregar o vídeo.'); }
                        }}
                        style={m.videoBtnInline}
                        activeOpacity={0.7}
                      >
                        <VideoIcon size={14} color="#CC1A1A" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <Text style={m.exDetalhe}>
                    {ex.series} séries × {ex.repeticoes} reps
                    {ex.carga_sugerida ? '  •  ' + ex.carga_sugerida : ''}
                  </Text>
                </View>
              </View>

              <View style={m.cargaRow}>
                <Text style={m.cargaLabel}>Carga:</Text>
                <TextInput
                  style={m.cargaInput}
                  placeholder={ex.carga_sugerida || 'kg / lb'}
                  placeholderTextColor="#C4BAB2"
                  value={carga}
                  onChangeText={v => setCargas(c => ({ ...c, [ex.id_treino_dia_exercicio]: v }))}
                  onBlur={() => {
                    if (feito) onMarcar(ex.id_treino_dia_exercicio, true, carga);
                  }}
                />
                <TouchableOpacity
                  style={[m.checkBtn, feito && m.checkBtnFeito]}
                  onPress={() => {
                    const novoFeito = !feito;
                    onMarcar(ex.id_treino_dia_exercicio, novoFeito, carga);
                    if (novoFeito && ex.descanso_seg) iniciarDescanso(ex.descanso_seg);
                  }}
                  activeOpacity={0.8}
                >
                  {feito
                    ? <Check size={16} color="#fff" strokeWidth={3} />
                    : <Text style={m.checkBtnLabel}>✓</Text>
                  }
                </TouchableOpacity>
              </View>

              {ex.observacao ? <Text style={m.exObs}>{ex.observacao}</Text> : null}
            </View>
          );
        })}
      </ScrollView>

      {descanso ? (
        <View style={m.descansoOverlay}>
          <Text style={m.descansoLabel}>Descanso</Text>
          <Text style={m.descansoNum}>{descanso.restando}</Text>
          <View style={m.descansoBar}>
            <View style={[m.descansoFill, { width: ((descanso.restando / descanso.total) * 100) + '%' }]} />
          </View>
          <Text style={m.descansoSub}>segundos restantes</Text>
          <TouchableOpacity style={m.descansoPular} onPress={pularDescanso} activeOpacity={0.85}>
            <Text style={m.descansoPularText}>Pular descanso</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {videoSessao ? (
        <View style={m.videoOverlay}>
          <View style={m.videoHeader}>
            <TouchableOpacity onPress={() => setVideoSessao(null)} style={m.videoCloseBtn}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={m.videoHeaderTitle}>Execução do exercício</Text>
            <View style={{ width: 40 }} />
          </View>
          <WebView
            source={{ uri: videoSessao }}
            style={{ flex: 1 }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
          />
        </View>
      ) : null}

      <View style={m.footer}>
        <TouchableOpacity
          style={[m.btnConcluir, concluindo && m.btnDisabled]}
          onPress={onConcluir}
          disabled={concluindo}
          activeOpacity={0.85}
        >
          {concluindo
            ? <ActivityIndicator color="#fff" />
            : <>
                <Trophy size={18} color="#fff" />
                <Text style={m.btnConcluirText}>Concluir Treino</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}


function Tag({ label }) {
  return <View style={s.tag}><Text style={s.tagText}>{label}</Text></View>;
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F0EBE4' },
  centered: { flex: 1, backgroundColor: '#F0EBE4', justifyContent: 'center', alignItems: 'center', padding: 32 },
  semDados:    { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginTop: 16, textAlign: 'center' },
  semDadosSub: { fontSize: 14, color: '#8A7F76', marginTop: 8, textAlign: 'center' },

  header:   { backgroundColor: '#CC1A1A', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  protoNome: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  protoObj:  { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  diasScroll:   { maxHeight: 64, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0EBE4' },
  diasContent:  { paddingHorizontal: 16, alignItems: 'center', gap: 8, paddingVertical: 12 },
  diaBtn:       {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E8E2DC', backgroundColor: '#FAF8F6',
    alignItems: 'center', minWidth: 48,
  },
  diaBtnAtivo:   { backgroundColor: '#CC1A1A', borderColor: '#CC1A1A' },
  diaBtnDescanso: { borderColor: '#E8E2DC', backgroundColor: '#F5F2EF' },
  diaBtnLabel:   { fontSize: 13, fontWeight: '700', color: '#8A7F76' },
  diaBtnLabelAtivo: { color: '#fff' },
  diaHojeDot:    { width: 5, height: 5, borderRadius: 3, backgroundColor: '#CC1A1A', marginTop: 3 },
  diaHojeDotAtivo: { backgroundColor: '#fff' },

  scroll:        { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  diaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  diaNome:   { fontSize: 18, fontWeight: '900', color: '#1A1A1A', flex: 1 },
  descansoBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  descansoBadgeText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },

  descansoCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 32,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  descansoEmoji: { fontSize: 48 },
  descansoTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A1A', marginTop: 12 },
  descansoSub:   { fontSize: 14, color: '#8A7F76', marginTop: 6, textAlign: 'center' },

  totalEx: { fontSize: 12, fontWeight: '700', color: '#8A7F76', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  semExercicios: { fontSize: 14, color: '#8A7F76', textAlign: 'center', marginTop: 24 },

  exCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    flexDirection: 'row', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  exNumBox: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: '#FFF0F0',
    alignItems: 'center', justifyContent: 'center',
  },
  exNum:   { fontSize: 13, fontWeight: '900', color: '#CC1A1A' },
  exInfo:  { flex: 1 },
  exNome:  { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  exGrupo: { fontSize: 12, color: '#8A7F76', marginTop: 2 },
  exTags:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  exObs:   { fontSize: 12, color: '#8A7F76', marginTop: 6, fontStyle: 'italic' },

  tag:     { backgroundColor: '#F0EBE4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '700', color: '#8A7F76' },

  btnIniciar: {
    backgroundColor: '#CC1A1A', borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: 8,
    shadowColor: '#CC1A1A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnIniciarText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  exNomeRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  videoBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF0F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  videoBtnText: { fontSize: 11, fontWeight: '700', color: '#CC1A1A' },

  videoModal:      { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  videoModalClose: { position: 'absolute', top: 52, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  videoPlayer:     { width: '100%', height: 300 },

  contagemOverlay: {
    flex: 1, backgroundColor: 'rgba(204,26,26,0.93)',
    alignItems: 'center', justifyContent: 'center',
  },
  contagemNum:   { fontSize: 120, fontWeight: '900', color: '#fff', lineHeight: 130 },
  contagemLabel: { fontSize: 22, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 2, textTransform: 'uppercase' },
});

const m = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F0EBE4' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingTop: 56, paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0EBE4',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#F5F2EF', alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerNome:   { fontSize: 16, fontWeight: '900', color: '#1A1A1A' },
  headerProg:   { fontSize: 12, color: '#8A7F76', marginTop: 2 },
  tempoBox:     { alignItems: 'center', minWidth: 56 },
  tempoText:    { fontSize: 16, fontWeight: '900', color: '#CC1A1A', fontVariant: ['tabular-nums'] },

  progressBar: { height: 4, backgroundColor: '#E8E2DC' },
  progressFill: { height: 4, backgroundColor: '#CC1A1A' },

  scroll:        { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },

  exCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  exCardFeito: { borderLeftWidth: 3, borderLeftColor: '#4CAF50' },
  exTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  exInfo: { flex: 1 },
  exNome:      { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  exNomeFeito: { color: '#8A7F76', textDecorationLine: 'line-through' },
  exDetalhe:   { fontSize: 13, color: '#8A7F76', marginTop: 4 },
  exObs:       { fontSize: 12, color: '#8A7F76', marginTop: 8, fontStyle: 'italic' },

  checkBtn: {
    width: 36, height: 36, borderRadius: 12,
    borderWidth: 2, borderColor: '#E8E2DC',
    alignItems: 'center', justifyContent: 'center',
  },
  checkBtnFeito: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  checkBtnLabel: { fontSize: 16, color: '#C4BAB2', fontWeight: '700' },

  cargaRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  cargaLabel: { fontSize: 12, fontWeight: '700', color: '#8A7F76' },
  cargaInput: {
    flex: 1, height: 36, borderWidth: 1, borderColor: '#E8E2DC',
    borderRadius: 10, paddingHorizontal: 10,
    fontSize: 14, color: '#1A1A1A', backgroundColor: '#FAF8F6',
  },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingBottom: 36,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F0EBE4',
  },
  btnConcluir: {
    backgroundColor: '#CC1A1A', borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  btnDisabled:     { opacity: 0.7 },
  btnConcluirText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  exNomeRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exActions:    { alignItems: 'center', gap: 10 },
  videoBtn:     {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center',
  },
  videoBtnInline: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center',
  },
  descansoOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(26,26,26,0.96)', justifyContent: 'center',
    alignItems: 'center', zIndex: 99, padding: 40,
  },
  descansoLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  descansoNum:   { fontSize: 96, fontWeight: '900', color: '#CC1A1A', lineHeight: 110, fontVariant: ['tabular-nums'] },
  descansoSub:   { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4, marginBottom: 32 },
  descansoBar:   { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, marginTop: 8 },
  descansoFill:  { height: 6, backgroundColor: '#CC1A1A', borderRadius: 3 },
  descansoPular: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 36 },
  descansoPularText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  videoOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#000', zIndex: 99, flexDirection: 'column',
  },
  videoHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16,
    backgroundColor: '#1A1A1A',
  },
  videoCloseBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  videoHeaderTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
