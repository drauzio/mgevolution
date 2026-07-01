import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView, Switch, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, LockKeyhole, Mail, Dumbbell, ScanFace } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { useAuth } from '../../src/contexts/AuthContext';
import { Loading } from '../../src/components/Loading';
import api from '../../src/services/api';

export default function Login() {
  const { entrar, faceIdAtivo, loginComFaceId, sessaoExpirada, setSessaoExpirada } = useAuth();
  const router = useRouter();

  const [email, setEmail]               = useState('');
  const [senha, setSenha]               = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [lembrar, setLembrar]           = useState(false);
  const [mostrarFaceId, setMostrarFaceId] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('login_email').then(v => {
      if (v) { setEmail(v); setLembrar(true); }
    });
  }, []);

  useEffect(() => {
    if (sessaoExpirada) {
      Alert.alert('Sessão expirada', 'Entre com seu e-mail e senha para continuar.');
      setSessaoExpirada(false);
    }
  }, [sessaoExpirada]);

  useEffect(() => {
    if (faceIdAtivo) {
      SecureStore.getItemAsync('mg_token')
        .then(t => setMostrarFaceId(!!t))
        .catch(() => setMostrarFaceId(false));
    } else {
      setMostrarFaceId(false);
    }
  }, [faceIdAtivo]);

  async function handleFaceId() {
    try {
      const resultado = await loginComFaceId();
      if (resultado === 'ok') router.replace('/(app)');
      else if (resultado === 'expirado') {
        setMostrarFaceId(false);
        Alert.alert('Sessão expirada', 'Entre com seu e-mail e senha para continuar.');
      }
    } catch {}
  }

  async function handleLogin() {
    const e = email.trim().toLowerCase();
    const s = senha.trim();
    if (!e || !s) { Alert.alert('Atenção', 'Preencha e-mail e senha.'); return; }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: e, senha: s });
      const { token, usuario } = res.data;
      if (lembrar) await AsyncStorage.setItem('login_email', e);
      else await AsyncStorage.removeItem('login_email');
      await entrar(token, usuario);
      router.replace('/(app)');
    } catch (err) {
      Alert.alert('Erro', err?.response?.data?.erro || err?.message || 'E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <View style={s.topArea}>
          <Image
            source={require('../../assets/icon.png')}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.appName}>MG EVOLUTION</Text>
          <Text style={s.tagline}>Mais que um treino, uma evolução.</Text>
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}>
            <Dumbbell size={20} color="#CC1A1A" strokeWidth={2} />
            <Text style={s.cardTitle}>Entrar</Text>
          </View>
          <Text style={s.cardSub}>Acesse com suas credenciais</Text>

          <View style={s.field}>
            <Text style={s.label}>E-mail</Text>
            <View style={s.inputBox}>
              <Mail size={18} color="#8A7F76" />
              <TextInput
                style={s.input}
                placeholder="seu@email.com"
                placeholderTextColor="#C4BAB2"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Senha</Text>
            <View style={s.inputBox}>
              <LockKeyhole size={18} color="#8A7F76" />
              <TextInput
                style={s.input}
                placeholder="••••••••"
                placeholderTextColor="#C4BAB2"
                secureTextEntry={!mostrarSenha}
                value={senha}
                onChangeText={setSenha}
                editable={!loading}
                onSubmitEditing={handleLogin}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={() => setMostrarSenha(v => !v)} activeOpacity={0.7}>
                {mostrarSenha
                  ? <EyeOff size={19} color="#8A7F76" />
                  : <Eye size={19} color="#8A7F76" />
                }
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.lembrarRow}>
            <Switch
              value={lembrar}
              onValueChange={setLembrar}
              trackColor={{ false: '#E0D6CA', true: '#CC1A1A' }}
              thumbColor="#fff"
              style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
            />
            <Text style={s.lembrarText}>Lembrar e-mail</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/esqueci-senha')} activeOpacity={0.7} style={{ marginLeft: 'auto' }}>
              <Text style={s.esqueciLink}>Esqueci minha senha</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <Loading variant="button" color="#fff" />
              : <Text style={s.btnText}>Entrar</Text>
            }
          </TouchableOpacity>

          {mostrarFaceId && (
            <TouchableOpacity style={s.btnFaceId} onPress={handleFaceId} activeOpacity={0.85}>
              <ScanFace size={22} color="#CC1A1A" strokeWidth={2} />
              <Text style={s.btnFaceIdText}>Entrar com Face ID</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={s.linkWrap} onPress={() => router.push('/(auth)/cadastro')} activeOpacity={0.7}>
          <Text style={s.linkText}>Não tem conta? <Text style={s.link}>Criar conta</Text></Text>
        </TouchableOpacity>

        <Text style={s.footer}>
          © MG Evolution · v{Constants.nativeApplicationVersion || Updates.runtimeVersion || '?'} ({Constants.nativeBuildVersion || '?'})
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0EBE4' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  topArea: { alignItems: 'center', marginBottom: 32 },
  logo:    { width: 90, height: 90, marginBottom: 12 },
  appName: { fontSize: 15, fontWeight: '900', color: '#1A1A1A', letterSpacing: 6 },
  tagline: { fontSize: 12, color: '#8A7F76', marginTop: 6, letterSpacing: 0.3, fontStyle: 'italic' },
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 5,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: 1 },
  cardSub:   { fontSize: 13, color: '#8A7F76', marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', color: '#8A7F76', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  inputBox: {
    minHeight: 50, borderWidth: 1, borderColor: '#E8E2DC',
    borderRadius: 14, paddingHorizontal: 14, backgroundColor: '#FAF8F6',
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: '#1A1A1A', paddingVertical: 12 },
  btn: {
    backgroundColor: '#CC1A1A', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  btnFaceId: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#CC1A1A', borderRadius: 14,
    paddingVertical: 14, marginTop: 12,
  },
  btnFaceIdText: { fontSize: 15, fontWeight: '700', color: '#CC1A1A' },
  lembrarRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 4 },
  lembrarText: { fontSize: 13, color: '#8A7F76' },
  esqueciLink: { fontSize: 13, color: '#CC1A1A', fontWeight: '700' },
  linkWrap:    { alignItems: 'center', marginTop: 20 },
  linkText:    { fontSize: 13, color: '#8A7F76' },
  link:        { color: '#CC1A1A', fontWeight: '700' },
  footer:      { textAlign: 'center', color: '#C4BAB2', fontSize: 12, marginTop: 16 },
});
