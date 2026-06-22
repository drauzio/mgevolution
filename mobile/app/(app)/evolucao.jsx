import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, Image, Modal, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft, TrendingUp, Dumbbell, Camera, Plus,
  Trash2, Bot, Weight, Ruler, ChevronDown, ChevronUp, X,
} from 'lucide-react-native';
import api from '../../src/services/api';


function StatCard({ icon: Icon, color, bg, valor, label }) {
  return (
    <View style={[s.statCard, { backgroundColor: bg }]}>
      <Icon size={18} color={color} strokeWidth={2} />
      <Text style={[s.statNum, { color }]}>{valor ?? '–'}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function ModalMedida({ visible, onClose, onSalvar }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [campos, setCampos] = useState({ data: hoje, peso: '', gordura_pct: '', massa_magra: '', cintura_cm: '', observacao: '' });

  function set(k, v) { setCampos(c => ({ ...c, [k]: v })); }

  async function salvar() {
    if (!campos.peso && !campos.gordura_pct) {
      Alert.alert('Atenção', 'Informe ao menos o peso ou o % de gordura.');
      return;
    }
    await onSalvar(campos);
    setCampos({ data: hoje, peso: '', gordura_pct: '', massa_magra: '', cintura_cm: '', observacao: '' });
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.modalRoot}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Nova medição</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color="#1A1A1A" /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={s.modalBody} keyboardShouldPersistTaps="handled">
            {[
              { key: 'data',        label: 'Data (AAAA-MM-DD)', kb: 'default'  },
              { key: 'peso',        label: 'Peso (kg)',          kb: 'numeric'  },
              { key: 'gordura_pct', label: 'Gordura (%)',        kb: 'numeric'  },
              { key: 'massa_magra', label: 'Massa magra (kg)',   kb: 'numeric'  },
              { key: 'cintura_cm',  label: 'Cintura (cm)',       kb: 'numeric'  },
              { key: 'observacao',  label: 'Observação',         kb: 'default'  },
            ].map(({ key, label, kb }) => (
              <View key={key} style={s.modalField}>
                <Text style={s.modalLabel}>{label}</Text>
                <TextInput
                  style={s.modalInput}
                  value={campos[key]}
                  onChangeText={v => set(key, v)}
                  keyboardType={kb}
                  placeholderTextColor="#C4BAB2"
                  placeholder={label}
                />
              </View>
            ))}
            <TouchableOpacity style={s.btnSalvar} onPress={salvar} activeOpacity={0.85}>
              <Text style={s.btnSalvarText}>Salvar medição</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function Evolucao() {
  const router = useRouter();
  const [resumo, setResumo]         = useState(null);
  const [medidas, setMedidas]       = useState([]);
  const [fotos, setFotos]           = useState([]);
  const [analise, setAnalise]       = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalMedida, setModalMedida] = useState(false);
  const [gerandoIA, setGerandoIA]   = useState(false);
  const [medidasExp, setMedidasExp] = useState(false);
  const [tipoFoto, setTipoFoto]     = useState('progresso');

  async function carregar() {
    try {
      const [r, m, f, a] = await Promise.all([
        api.get('/evolucao/resumo'),
        api.get('/evolucao/medidas'),
        api.get('/evolucao/fotos'),
        api.get('/evolucao/analise-ia').catch(() => ({ data: null })),
      ]);
      setResumo(r.data);
      setMedidas(m.data || []);
      setFotos(f.data || []);
      setAnalise(a.data?.analise || null);
    } catch {}
  }

  useEffect(() => { carregar(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  }, []);

  async function salvarMedida(dados) {
    try {
      await api.post('/evolucao/medidas', dados);
      setModalMedida(false);
      await carregar();
      Alert.alert('Salvo!', 'Medição registrada com sucesso.');
    } catch (err) {
      Alert.alert('Erro', err?.response?.data?.erro || 'Não foi possível salvar.');
    }
  }

  async function adicionarFoto(tipo) {
    setTipoFoto(tipo);
    Alert.alert('Adicionar foto', 'Escolha a origem', [
      {
        text: 'Câmera', onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) { Alert.alert('Permissão necessária', 'Permita o acesso à câmera.'); return; }
          const res = await ImagePicker.launchCameraAsync({ quality: 0.75, allowsEditing: true, aspect: [3, 4] });
          if (!res.canceled) await enviarFoto(res.assets[0], tipo);
        },
      },
      {
        text: 'Galeria', onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) { Alert.alert('Permissão necessária', 'Permita o acesso à galeria.'); return; }
          const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.75, allowsEditing: true, aspect: [3, 4] });
          if (!res.canceled) await enviarFoto(res.assets[0], tipo);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function enviarFoto(asset, tipo) {
    try {
      const form = new FormData();
      const ext  = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const mime = asset.mimeType || (ext === 'png' ? 'image/png' : 'image/jpeg');
      form.append('foto', { uri: asset.uri, name: `evolucao.${ext}`, type: mime });
      form.append('tipo', tipo || tipoFoto);
      form.append('data', new Date().toISOString().slice(0, 10));
      await api.post('/evolucao/fotos', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      await carregar();
    } catch (err) {
      Alert.alert('Erro ao enviar foto', err?.response?.data?.erro || err?.message || 'Não foi possível enviar a foto.');
    }
  }

  async function deletarFoto(id) {
    Alert.alert('Remover foto', 'Deseja remover esta foto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          try { await api.delete(`/evolucao/fotos/${id}`); await carregar(); }
          catch { Alert.alert('Erro', 'Não foi possível remover.'); }
        },
      },
    ]);
  }

  async function gerarAnaliseIA() {
    setGerandoIA(true);
    try {
      const res = await api.post('/evolucao/analise-ia');
      setAnalise(res.data.analise);
    } catch (err) {
      const msg = err?.response?.data?.erro || 'Não foi possível gerar a análise.';
      Alert.alert('Atenção', msg);
    } finally {
      setGerandoIA(false);
    }
  }

  const ultimaMedida = medidas[0] ?? null;

  return (
    <View style={s.root}>
      {/* Topbar */}
      <View style={s.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={s.btnVoltar} activeOpacity={0.7}>
          <ArrowLeft size={22} color="#1A1A1A" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.topbarTitle}>Minha Evolução</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CC1A1A" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Cards resumo */}
        <View style={s.statsRow}>
          <StatCard icon={Dumbbell} color="#CC1A1A" bg="#FFF0F0"
            valor={resumo?.total_sessoes} label="treinos totais" />
          <StatCard icon={Dumbbell} color="#F97316" bg="#FFF7ED"
            valor={resumo?.total_mes} label="este mês" />
          <StatCard icon={Weight} color="#22C55E" bg="#F0FFF4"
            valor={ultimaMedida?.peso ? `${parseFloat(ultimaMedida.peso)}kg` : null} label="último peso" />
        </View>

        {/* Medidas */}
        <View style={s.card}>
          <TouchableOpacity style={s.cardHeaderRow} onPress={() => setMedidasExp(v => !v)} activeOpacity={0.8}>
            <View style={s.cardHeaderLeft}>
              <Ruler size={16} color="#CC1A1A" strokeWidth={2} />
              <Text style={s.cardTitle}>Medidas</Text>
            </View>
            <View style={s.cardHeaderRight}>
              <TouchableOpacity style={s.btnAdd} onPress={() => setModalMedida(true)} activeOpacity={0.8}>
                <Plus size={15} color="#CC1A1A" strokeWidth={2.5} />
              </TouchableOpacity>
              {medidasExp
                ? <ChevronUp size={18} color="#8A7F76" />
                : <ChevronDown size={18} color="#8A7F76" />}
            </View>
          </TouchableOpacity>

          {ultimaMedida && !medidasExp && (
            <View style={s.medidaResumo}>
              {ultimaMedida.peso        && <Text style={s.medidaItem}>Peso: <Text style={s.medidaVal}>{parseFloat(ultimaMedida.peso)} kg</Text></Text>}
              {ultimaMedida.gordura_pct && <Text style={s.medidaItem}>Gordura: <Text style={s.medidaVal}>{parseFloat(ultimaMedida.gordura_pct)}%</Text></Text>}
              {ultimaMedida.massa_magra && <Text style={s.medidaItem}>Massa magra: <Text style={s.medidaVal}>{parseFloat(ultimaMedida.massa_magra)} kg</Text></Text>}
              {ultimaMedida.cintura_cm  && <Text style={s.medidaItem}>Cintura: <Text style={s.medidaVal}>{parseFloat(ultimaMedida.cintura_cm)} cm</Text></Text>}
            </View>
          )}

          {medidasExp && medidas.map((m, i) => (
            <View key={m.id_evolucao_medida ?? i} style={[s.medidaRow, i < medidas.length - 1 && s.medidaRowBorder]}>
              <Text style={s.medidaData}>{new Date(m.data).toLocaleDateString('pt-BR')}</Text>
              <View style={s.medidaVals}>
                {m.peso        && <Text style={s.medidaTag}>{parseFloat(m.peso)}kg</Text>}
                {m.gordura_pct && <Text style={s.medidaTag}>{parseFloat(m.gordura_pct)}%G</Text>}
                {m.massa_magra && <Text style={s.medidaTag}>{parseFloat(m.massa_magra)}kg MM</Text>}
                {m.cintura_cm  && <Text style={s.medidaTag}>{parseFloat(m.cintura_cm)}cm C</Text>}
              </View>
            </View>
          ))}

          {medidas.length === 0 && (
            <Text style={s.emptyText}>Nenhuma medida registrada ainda.</Text>
          )}
        </View>

        {/* Fotos — posição corporal */}
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <View style={s.cardHeaderLeft}>
              <Camera size={16} color="#CC1A1A" strokeWidth={2} />
              <Text style={s.cardTitle}>Fotos corporais</Text>
            </View>
          </View>
          <View style={s.posColunas}>
            {['frente', 'costas', 'lateral'].map(tipo => {
              const lista = fotos.filter(f => f.tipo === tipo).slice(0, 5);
              return (
                <View key={tipo} style={s.posColuna}>
                  <Text style={s.posLabel}>{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</Text>
                  {lista.length === 0 ? (
                    <TouchableOpacity style={s.posVazio} onPress={() => adicionarFoto(tipo)} activeOpacity={0.8}>
                      <Camera size={20} color="#C4BAB2" strokeWidth={1.5} />
                      <Text style={s.posVazioText}>Adicionar</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      {lista.map((f, i) => (
                        <View key={f.id_evolucao_foto ?? i} style={s.posFotoWrap}>
                          <Image source={{ uri: f.url }} style={s.posFoto} resizeMode="cover" />
                          <Text style={s.posFotoData}>{f.data ? new Date(f.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}</Text>
                          <TouchableOpacity style={s.posFotoDelete} onPress={() => deletarFoto(f.id_evolucao_foto)}>
                            <Trash2 size={11} color="#CC1A1A" strokeWidth={2} />
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity style={s.posAddMais} onPress={() => adicionarFoto(tipo)} activeOpacity={0.8}>
                        <Plus size={16} color="#C4BAB2" strokeWidth={2} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              );
            })}
          </View>
        </View>


        {/* Análise IA */}
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <View style={s.cardHeaderLeft}>
              <Bot size={16} color="#CC1A1A" strokeWidth={2} />
              <Text style={s.cardTitle}>Análise da IA</Text>
            </View>
            <TouchableOpacity
              style={[s.btnGerarIA, gerandoIA && { opacity: 0.6 }]}
              onPress={gerarAnaliseIA}
              disabled={gerandoIA}
              activeOpacity={0.85}
            >
              {gerandoIA
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.btnGerarIAText}>Gerar</Text>}
            </TouchableOpacity>
          </View>

          {analise ? (
            <Text style={s.analiseText}>{analise}</Text>
          ) : (
            <Text style={s.emptyText}>Toque em "Gerar" para receber uma análise personalizada da sua evolução.</Text>
          )}
        </View>

      </ScrollView>

      <ModalMedida visible={modalMedida} onClose={() => setModalMedida(false)} onSalvar={salvarMedida} />
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F0EBE4' },
  topbar:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingBottom: 14, paddingHorizontal: 20,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0EBE4',
  },
  btnVoltar:    { width: 38, height: 38, borderRadius: 10, backgroundColor: '#F0EBE4', alignItems: 'center', justifyContent: 'center' },
  topbarTitle:  { fontSize: 17, fontWeight: '900', color: '#1A1A1A' },
  content:      { padding: 20, gap: 14, paddingBottom: 40 },

  statsRow:  { flexDirection: 'row', gap: 10 },
  statCard:  { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 5 },
  statNum:   { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 10, color: '#8A7F76', fontWeight: '600', textAlign: 'center' },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, gap: 12,
  },
  cardHeaderRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardHeaderRight:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle:      { fontSize: 13, fontWeight: '800', color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: 1 },
  btnAdd:         { width: 30, height: 30, borderRadius: 8, borderWidth: 1.5, borderColor: '#CC1A1A', alignItems: 'center', justifyContent: 'center' },
  emptyText:      { fontSize: 13, color: '#C4BAB2', textAlign: 'center', paddingVertical: 8 },

  medidaResumo:   { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  medidaItem:     { fontSize: 13, color: '#8A7F76' },
  medidaVal:      { fontWeight: '800', color: '#1A1A1A' },
  medidaRow:      { paddingVertical: 10 },
  medidaRowBorder:{ borderBottomWidth: 1, borderBottomColor: '#F0EBE4' },
  medidaData:     { fontSize: 12, color: '#8A7F76', fontWeight: '700', marginBottom: 4 },
  medidaVals:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  medidaTag:      { fontSize: 13, fontWeight: '700', color: '#1A1A1A', backgroundColor: '#F0EBE4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },

  posColunas:     { flexDirection: 'row', gap: 8 },
  posColuna:      { flex: 1, gap: 6 },
  posLabel:       { fontSize: 11, fontWeight: '800', color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, textAlign: 'center' },
  posVazio:       { aspectRatio: 3/4, borderRadius: 10, backgroundColor: '#F0EBE4', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E8E2DC', borderStyle: 'dashed', gap: 6 },
  posVazioText:   { fontSize: 10, color: '#C4BAB2', fontWeight: '700' },
  posAddMais:     { height: 36, borderRadius: 10, backgroundColor: '#F0EBE4', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E8E2DC', borderStyle: 'dashed' },
  posFotoWrap:    { position: 'relative' },
  posFoto:        { width: '100%', aspectRatio: 3/4, borderRadius: 10 },
  posFotoData:    { fontSize: 10, color: '#8A7F76', fontWeight: '600', textAlign: 'center', marginTop: 3 },
  posFotoDelete:  { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },


  btnGerarIA:     { backgroundColor: '#CC1A1A', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 7, minWidth: 60, alignItems: 'center' },
  btnGerarIAText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  analiseText:    { fontSize: 14, color: '#1A1A1A', lineHeight: 22 },

  modalRoot:    { flex: 1, backgroundColor: '#F0EBE4' },
  modalHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0EBE4' },
  modalTitle:   { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  modalBody:    { padding: 20, gap: 14 },
  modalField:   { gap: 6 },
  modalLabel:   { fontSize: 11, fontWeight: '700', color: '#8A7F76', textTransform: 'uppercase', letterSpacing: 1 },
  modalInput:   { height: 48, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, fontSize: 15, color: '#1A1A1A', borderWidth: 1, borderColor: '#E8E2DC' },
  btnSalvar:    { backgroundColor: '#CC1A1A', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnSalvarText:{ color: '#fff', fontWeight: '800', fontSize: 16 },
});
