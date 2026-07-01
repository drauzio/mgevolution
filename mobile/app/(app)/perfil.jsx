import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Switch, Alert, Image, TextInput, ActivityIndicator,
} from 'react-native';
import {
  UserRound, LogOut, ScanFace, ChevronRight,
  Camera, Pencil, Check, X, Calendar, User, Trash2,
  CreditCard, Clock, ShieldAlert,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import api from '../../src/services/api';
import { buscarStatus } from '../../src/services/checkout';
import { formatarData, dataParaISO, dataParaDisplay, formatarTelefone, formatarCPF } from '../../src/utils/format';
import { validarCPF } from '../../src/utils/validators';

function CardPlano({ status }) {
  const router = useRouter();
  if (!status) return null;

  const config = {
    ativa:    { Icone: CreditCard, color: '#15803d', bg: '#F0FDF4', titulo: status.plano },
    carencia: { Icone: Clock,      color: '#B45309', bg: '#FFFBEB', titulo: 'Período gratuito (carência)' },
    expirado: { Icone: ShieldAlert,color: '#CC1A1A', bg: '#FFF0F0', titulo: 'Nenhum plano ativo' },
  }[status.status];
  const { Icone } = config;

  let subtitulo = '';
  if (status.status === 'ativa') {
    subtitulo = `Vence em ${dataParaDisplay(status.data_fim)}`;
  } else if (status.status === 'carencia') {
    subtitulo = status.dias_restantes === 0
      ? 'Último dia'
      : `${status.dias_restantes} dia${status.dias_restantes !== 1 ? 's' : ''} restante${status.dias_restantes !== 1 ? 's' : ''}`;
    if (status.data_fim_carencia) subtitulo += ` · até ${dataParaDisplay(status.data_fim_carencia)}`;
  } else {
    subtitulo = 'Assine um plano para continuar com acesso completo.';
  }

  return (
    <View style={s.secao}>
      <View style={[s.item, { borderTopWidth: 0, paddingVertical: 16 }]}>
        <View style={s.itemLeft}>
          <View style={[s.iconBox, { backgroundColor: config.bg }]}>
            <Icone size={18} color={config.color} strokeWidth={2} />
          </View>
          <View>
            <Text style={s.itemLabel}>{config.titulo}</Text>
            <Text style={s.itemSub}>{subtitulo}</Text>
          </View>
        </View>
        {status.status !== 'ativa' && (
          <TouchableOpacity onPress={() => router.push('/assinar')} style={s.acaoBtn2}>
            <Text style={s.acaoBtn2Text}>Assinar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function Perfil() {
  const { usuario, sair, faceIdAtivo, habilitarFaceId, desabilitarFaceId } = useAuth();
  const router = useRouter();

  const [perfil, setPerfil]           = useState(null);
  const [statusPlano, setStatusPlano] = useState(null);
  const [carregando, setCarregando]   = useState(true);
  const [editando, setEditando]       = useState(false);
  const [salvando, setSalvando]       = useState(false);
  const [uploadFoto, setUploadFoto]   = useState(false);
  const [loadingFaceId, setLoadingFaceId] = useState(false);
  const [excluindo, setExcluindo]     = useState(false);

  const [form, setForm] = useState({
    nome: '', telefone: '', data_nascimento: '', sexo: '', bio: '', cpf: '',
  });

  const carregarPerfil = useCallback(async () => {
    try {
      const res = await api.get('/perfil');
      setPerfil(res.data);
      const cpfBruto = res.data.cpf ?? ''
      setForm({
        nome:             res.data.nome    ?? '',
        telefone:         formatarTelefone(res.data.telefone ?? ''),
        data_nascimento:  dataParaDisplay(res.data.data_nascimento ?? ''),
        sexo:             res.data.sexo   ?? '',
        cpf:              cpfBruto === '00000000000' ? '' : formatarCPF(cpfBruto),
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o perfil.');
    } finally {
      setCarregando(false);
    }
  }, []);

  const isAluno = (usuario?.perfis ?? []).includes('aluno') || usuario?.perfil === 'aluno';

  useEffect(() => { carregarPerfil(); }, [carregarPerfil]);
  useEffect(() => {
    if (!isAluno) return;
    buscarStatus().then(setStatusPlano).catch(() => {});
  }, [isAluno]);

  async function salvar() {
    if (!form.nome.trim()) { Alert.alert('Atenção', 'Nome é obrigatório.'); return; }
    const cpfDigitos = form.cpf.replace(/\D/g, '')
    if (cpfDigitos && cpfDigitos !== '00000000000') {
      if (!validarCPF(cpfDigitos)) { Alert.alert('Atenção', 'CPF inválido.'); return; }
    }
    setSalvando(true);
    try {
      await api.put('/perfil', {
        nome:            form.nome,
        telefone:        form.telefone.replace(/\D/g, ''),
        data_nascimento: dataParaISO(form.data_nascimento),
        sexo:            form.sexo,
        cpf:             form.cpf,
      });
      await carregarPerfil();
      setEditando(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSalvando(false);
    }
  }

  async function uploadAsset(asset) {
    setUploadFoto(true);
    try {
      const formData = new FormData();
      formData.append('foto', {
        uri: asset.uri,
        name: 'foto.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      });
      const res = await api.post('/perfil/foto', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPerfil(p => ({ ...p, foto_url: res.data.foto_url }));
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a foto.');
    } finally {
      setUploadFoto(false);
    }
  }

  async function abrirCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à câmera nas configurações.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) await uploadAsset(result.assets[0]);
  }

  async function abrirGaleria() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria nas configurações.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) await uploadAsset(result.assets[0]);
  }

  function escolherFoto() {
    Alert.alert('Foto de perfil', 'Como deseja adicionar a foto?', [
      { text: 'Tirar foto',       onPress: abrirCamera  },
      { text: 'Escolher galeria', onPress: abrirGaleria },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function handleExcluirConta() {
    Alert.alert(
      'Excluir conta',
      'Esta ação é permanente e irrecuperável. Todos os seus dados serão apagados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, excluir',
          style: 'destructive',
          onPress: async () => {
            setExcluindo(true);
            try {
              await api.delete('/perfil');
              await sair();
              router.replace('/(auth)/login');
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir a conta. Tente novamente.');
              setExcluindo(false);
            }
          },
        },
      ]
    );
  }

  async function handleSair() {
    await sair();
    router.replace('/(auth)/login');
  }

  async function toggleFaceId(valor) {
    setLoadingFaceId(true);
    try {
      if (valor) {
        await habilitarFaceId();
        Alert.alert('Face ID ativado', 'Na próxima vez, entre com o rosto.');
      } else {
        await desabilitarFaceId();
      }
    } catch (err) {
      Alert.alert('Erro', err.message || 'Não foi possível configurar o Face ID.');
    } finally {
      setLoadingFaceId(false);
    }
  }

  const iniciais = perfil?.nome
    ? perfil.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : usuario?.nome?.slice(0, 2).toUpperCase() ?? 'MG';

  if (carregando) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color="#CC1A1A" size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

      {/* Avatar */}
      <View style={s.avatarArea}>
        <TouchableOpacity style={s.avatarTouch} onPress={escolherFoto} activeOpacity={0.85}>
          {perfil?.foto_url
            ? <Image source={{ uri: perfil.foto_url }} style={s.avatarImg} />
            : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.iniciais}>{iniciais}</Text>
              </View>
            )
          }
          <View style={s.cameraBtn}>
            {uploadFoto
              ? <ActivityIndicator color="#fff" size="small" />
              : <Camera size={14} color="#fff" strokeWidth={2.5} />
            }
          </View>
        </TouchableOpacity>
        <Text style={s.nomeHeader}>{perfil?.nome ?? usuario?.nome}</Text>
        <Text style={s.emailHeader}>{perfil?.email ?? usuario?.email}</Text>
      </View>

      {/* Plano / Carência */}
      <CardPlano status={statusPlano} />

      {/* Dados pessoais */}
      <View style={s.secao}>
        <View style={s.secaoHeaderRow}>
          <Text style={s.secaoTitle}>Dados pessoais</Text>
          {!editando
            ? (
              <TouchableOpacity style={s.editBtn} onPress={() => setEditando(true)}>
                <Pencil size={14} color="#CC1A1A" />
                <Text style={s.editBtnText}>Editar</Text>
              </TouchableOpacity>
            )
            : (
              <View style={s.editActions}>
                <TouchableOpacity onPress={() => { setEditando(false); carregarPerfil(); }} style={s.acaoBtn}>
                  <X size={16} color="#8A7F76" />
                </TouchableOpacity>
                <TouchableOpacity onPress={salvar} style={[s.acaoBtn, s.acaoBtnSave, s.acaoBtnSaveWide]} disabled={salvando}>
                  {salvando
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <>
                        <Check size={15} color="#fff" />
                        <Text style={s.acaoBtnSaveText}>Salvar</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            )
          }
        </View>

        <Campo
          icon={<User size={16} color="#8A7F76" />}
          label="Nome"
          value={form.nome}
          editando={editando}
          onChangeText={v => setForm(f => ({ ...f, nome: v }))}
        />
        <Campo
          icon={<UserRound size={16} color="#8A7F76" />}
          label="Telefone"
          value={form.telefone}
          editando={editando}
          onChangeText={v => setForm(f => ({ ...f, telefone: formatarTelefone(v) }))}
          placeholder="(00) 00000-0000"
          keyboardType="number-pad"
        />
        <Campo
          icon={<UserRound size={16} color="#8A7F76" />}
          label="CPF"
          value={form.cpf}
          editando={editando}
          onChangeText={v => setForm(f => ({ ...f, cpf: formatarCPF(v) }))}
          placeholder="000.000.000-00"
          keyboardType="number-pad"
        />
        <Campo
          icon={<Calendar size={16} color="#8A7F76" />}
          label="Nascimento"
          value={form.data_nascimento}
          editando={editando}
          onChangeText={v => setForm(f => ({ ...f, data_nascimento: formatarData(v) }))}
          placeholder="DD/MM/AAAA"
          keyboardType="number-pad"
        />
        <CampoSexo
          value={form.sexo}
          editando={editando}
          onChange={v => setForm(f => ({ ...f, sexo: v }))}
        />
      </View>

      {/* Segurança */}
      <View style={s.secao}>
        <Text style={s.secaoTitle}>Segurança</Text>
        <View style={s.item}>
          <View style={s.itemLeft}>
            <View style={[s.iconBox, { backgroundColor: '#FFF0F0' }]}>
              <ScanFace size={18} color="#CC1A1A" strokeWidth={2} />
            </View>
            <View>
              <Text style={s.itemLabel}>Face ID</Text>
              <Text style={s.itemSub}>Entrar sem digitar senha</Text>
            </View>
          </View>
          <Switch
            value={faceIdAtivo}
            onValueChange={toggleFaceId}
            disabled={loadingFaceId}
            trackColor={{ false: '#E8E2DC', true: '#CC1A1A' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Conta */}
      <View style={s.secao}>
        <Text style={s.secaoTitle}>Conta</Text>
        <TouchableOpacity style={s.itemBtn} onPress={handleSair} activeOpacity={0.85}>
          <View style={s.itemLeft}>
            <View style={[s.iconBox, { backgroundColor: '#FFF0F0' }]}>
              <LogOut size={18} color="#CC1A1A" strokeWidth={2} />
            </View>
            <Text style={s.itemLabelRed}>Sair</Text>
          </View>
          <ChevronRight size={18} color="#C4BAB2" />
        </TouchableOpacity>
      </View>

      {/* Zona de perigo */}
      <View style={[s.secao, { borderWidth: 1, borderColor: '#FECACA' }]}>
        <Text style={[s.secaoTitle, { color: '#DC2626' }]}>Exclusão de conta</Text>
        <View style={{ paddingHorizontal: 18, paddingBottom: 16 }}>
          <Text style={{ fontSize: 12, color: '#8A7F76', marginBottom: 14, lineHeight: 18 }}>
            A exclusão é permanente e irrecuperável. Todos os seus dados pessoais serão apagados.
          </Text>
          <TouchableOpacity
            style={s.btnExcluir}
            onPress={handleExcluirConta}
            disabled={excluindo}
            activeOpacity={0.85}
          >
            <Trash2 size={16} color="#DC2626" strokeWidth={2} />
            <Text style={s.btnExcluirText}>{excluindo ? 'Excluindo…' : 'Excluir minha conta'}</Text>
          </TouchableOpacity>
        </View>
      </View>

    </ScrollView>
  );
}

function Campo({ icon, label, value, editando, onChangeText, keyboardType, multiline, placeholder, last }) {
  return (
    <View style={[c.row, last && c.last]}>
      <View style={c.labelRow}>
        {icon}
        <Text style={c.label}>{label}</Text>
      </View>
      {editando
        ? (
          <TextInput
            style={[c.input, multiline && c.inputMulti]}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType ?? 'default'}
            multiline={multiline}
            placeholder={placeholder ?? label}
            placeholderTextColor="#C4BAB2"
          />
        )
        : <Text style={[c.value, !value && c.vazio]}>{value || '—'}</Text>
      }
    </View>
  );
}

function CampoSexo({ value, editando, onChange }) {
  const opcoes = [
    { v: 'M', label: 'Masculino' },
    { v: 'F', label: 'Feminino' },
    { v: 'O', label: 'Outro' },
  ];
  const texto = opcoes.find(o => o.v === value)?.label ?? '—';

  return (
    <View style={c.row}>
      <View style={c.labelRow}>
        <User size={16} color="#8A7F76" />
        <Text style={c.label}>Sexo</Text>
      </View>
      {editando
        ? (
          <View style={c.sexoRow}>
            {opcoes.map(o => (
              <TouchableOpacity
                key={o.v}
                style={[c.sexoOpt, value === o.v && c.sexoOptActive]}
                onPress={() => onChange(o.v)}
              >
                <Text style={[c.sexoOptText, value === o.v && c.sexoOptTextActive]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )
        : <Text style={[c.value, !value && c.vazio]}>{texto}</Text>
      }
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F0EBE4' },
  content: { padding: 24, paddingTop: 48, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0EBE4' },

  avatarArea:  { alignItems: 'center', marginBottom: 28 },
  avatarTouch: { marginBottom: 14, position: 'relative' },
  avatarImg:   { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#CC1A1A', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#CC1A1A', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  iniciais:   { fontSize: 34, fontWeight: '900', color: '#fff' },
  cameraBtn:  {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#F0EBE4',
  },
  nomeHeader:  { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
  emailHeader: { fontSize: 13, color: '#8A7F76', marginTop: 4 },

  secao: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: 'hidden',
  },
  secaoHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8,
  },
  secaoTitle: {
    fontSize: 11, fontWeight: '700', color: '#8A7F76',
    letterSpacing: 1.5, textTransform: 'uppercase',
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8,
  },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtnText: { fontSize: 13, fontWeight: '700', color: '#CC1A1A' },
  editActions: { flexDirection: 'row', gap: 8 },
  acaoBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#F5F2EF', alignItems: 'center', justifyContent: 'center',
  },
  acaoBtnSave:      { backgroundColor: '#CC1A1A' },
  acaoBtnSaveWide:  { flexDirection: 'row', gap: 6, paddingHorizontal: 14, width: 'auto' },
  acaoBtnSaveText:  { color: '#fff', fontSize: 13, fontWeight: '700' },
  acaoBtn2: {
    height: 32, paddingHorizontal: 14, borderRadius: 9,
    backgroundColor: '#CC1A1A', alignItems: 'center', justifyContent: 'center',
  },
  acaoBtn2Text: { color: '#fff', fontSize: 12, fontWeight: '700' },

  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: '#F5F2EF',
  },
  itemBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: '#F5F2EF',
  },
  itemLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemLabel:    { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  itemLabelRed: { fontSize: 15, fontWeight: '600', color: '#CC1A1A' },
  itemSub:      { fontSize: 12, color: '#8A7F76', marginTop: 2 },

  btnExcluir: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#FECACA', borderRadius: 12,
    paddingVertical: 13, backgroundColor: '#FFF5F5',
  },
  btnExcluirText: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
});

const c = StyleSheet.create({
  row: {
    paddingHorizontal: 18, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#F5F2EF',
  },
  last: { paddingBottom: 18 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label:    { fontSize: 11, fontWeight: '700', color: '#8A7F76', textTransform: 'uppercase', letterSpacing: 1 },
  value:    { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  vazio:    { color: '#C4BAB2' },
  input: {
    fontSize: 15, color: '#1A1A1A',
    borderWidth: 1, borderColor: '#E8E2DC', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FAF8F6',
  },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
  sexoRow:  { flexDirection: 'row', gap: 8 },
  sexoOpt:  {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: '#E8E2DC',
    alignItems: 'center', backgroundColor: '#FAF8F6',
  },
  sexoOptActive:     { backgroundColor: '#CC1A1A', borderColor: '#CC1A1A' },
  sexoOptText:       { fontSize: 13, fontWeight: '600', color: '#8A7F76' },
  sexoOptTextActive: { color: '#fff' },
});
