import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  UserRound, Mail, Phone, LockKeyhole, Eye, EyeOff,
  ArrowLeft, CheckCircle2, MessageCircle,
} from 'lucide-react-native';
import api from '../../src/services/api';

// ── Campo com ícone ──────────────────────────────────────────────────────────
function Campo({ icon: Icon, label, children }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputBox}>
        <Icon size={18} color="#8A7F76" strokeWidth={1.8} />
        {children}
      </View>
    </View>
  );
}

// ── 6 caixas OTP ────────────────────────────────────────────────────────────
function OTPInput({ value, onChange }) {
  const refs = useRef([]);
  const digits = value.padEnd(6, '').split('').slice(0, 6);

  function handle(idx, val) {
    const clean = val.replace(/\D/g, '');
    if (clean.length > 1) {
      const next = [...digits];
      const chars = clean.slice(0, 6 - idx).split('');
      chars.forEach((c, i) => { next[idx + i] = c; });
      onChange(next.join(''));
      refs.current[Math.min(idx + chars.length, 5)]?.focus();
    } else {
      const d = clean.slice(-1);
      const next = [...digits];
      next[idx] = d;
      onChange(next.join(''));
      if (d && idx < 5) refs.current[idx + 1]?.focus();
    }
  }

  function handleKey(idx, e) {
    if (e.nativeEvent.key === 'Backspace' && !digits[idx] && idx > 0) {
      const next = [...digits];
      next[idx - 1] = '';
      onChange(next.join(''));
      refs.current[idx - 1]?.focus();
    }
  }

  return (
    <View style={s.otpRow}>
      {[0,1,2,3,4,5].map(i => (
        <TextInput
          key={i}
          ref={el => refs.current[i] = el}
          style={[s.otpBox, digits[i] ? s.otpBoxFilled : null]}
          value={digits[i]}
          onChangeText={v => handle(i, v)}
          onKeyPress={e => handleKey(i, e)}
          keyboardType="number-pad"
          textAlign="center"
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

// ── Countdown ────────────────────────────────────────────────────────────────
function Countdown({ segundos, onZero }) {
  const [restam, setRestam] = useState(segundos);
  useEffect(() => {
    setRestam(segundos);
    const t = setInterval(() => setRestam(r => {
      if (r <= 1) { clearInterval(t); return 0; }
      return r - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [segundos]);
  useEffect(() => {
    if (restam === 0) onZero();
  }, [restam]);
  if (restam === 0) return null;
  return (
    <Text style={s.countdown}>
      Reenviar em <Text style={{ fontWeight: '800', color: '#CC1A1A' }}>{restam}s</Text>
    </Text>
  );
}

// ── Tela principal ───────────────────────────────────────────────────────────
export default function Cadastro() {
  const router = useRouter();

  const [etapa, setEtapa]             = useState('form'); // 'form' | 'otp' | 'ok'
  const [nome, setNome]               = useState('');
  const [email, setEmail]             = useState('');
  const [telefone, setTelefone]       = useState('');
  const [senha, setSenha]             = useState('');
  const [confirmar, setConfirmar]     = useState('');
  const [mostrarSenha, setMostra]     = useState(false);
  const [otp, setOtp]                 = useState('');
  const [loading, setLoading]         = useState(false);
  const [aguardar, setAguardar]       = useState(0);
  const [podReenviar, setPodReenviar] = useState(false);

  function fmtTelefone(v) {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2)  return d;
    if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`;
    if (d.length <= 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
    return v;
  }

  async function enviarOTP() {
    const tel = telefone.replace(/\D/g, '');
    setLoading(true);
    try {
      const res = await api.post('/auth/otp/enviar', { telefone: tel });
      setAguardar(res.data?.aguardar ?? 120);
      setPodReenviar(false);
      setEtapa('otp');
    } catch (err) {
      const msg = err?.response?.data?.erro || 'Erro ao enviar código';
      const wait = err?.response?.data?.aguardar;
      if (wait) { setAguardar(wait); setPodReenviar(false); setEtapa('otp'); }
      else Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleContinuar() {
    const e = email.trim().toLowerCase();
    const tel = telefone.replace(/\D/g, '');
    if (!nome.trim())         return Alert.alert('Atenção', 'Informe seu nome.');
    if (!e || !e.includes('@')) return Alert.alert('Atenção', 'E-mail inválido.');
    if (tel.length < 10)      return Alert.alert('Atenção', 'Telefone inválido.');
    if (senha.length < 6)     return Alert.alert('Atenção', 'Senha com mínimo 6 caracteres.');
    if (senha !== confirmar)  return Alert.alert('Atenção', 'Senhas não coincidem.');
    await enviarOTP();
  }

  async function handleCriarConta() {
    if (otp.length < 6) return Alert.alert('Atenção', 'Digite o código completo.');
    const tel = telefone.replace(/\D/g, '');
    setLoading(true);
    try {
      // 1. Verifica o código e obtém o token UUID
      const resVerif = await api.post('/auth/otp/verificar', { telefone: tel, codigo: otp });
      const { token } = resVerif.data;

      // 2. Cria a conta com o token
      await api.post('/auth/registro', {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        telefone: tel,
        senha,
        token_otp: token,
      });
      setEtapa('ok');
    } catch (err) {
      Alert.alert('Erro', err?.response?.data?.erro || 'Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  }

  // ── Tela sucesso ────────────────────────────────────────────
  if (etapa === 'ok') {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <View style={s.okIcon}>
          <CheckCircle2 size={48} color="#15803D" strokeWidth={1.5} />
        </View>
        <Text style={s.okTitulo}>Conta criada!</Text>
        <Text style={s.okSub}>Seu cadastro foi concluído com sucesso. Agora é só entrar.</Text>
        <TouchableOpacity style={s.okBtn} onPress={() => router.replace('/(auth)/login')} activeOpacity={0.85}>
          <Text style={s.btnText}>Ir para o login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── OTP ─────────────────────────────────────────────────────
  if (etapa === 'otp') {
    return (
      <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={s.voltar} onPress={() => setEtapa('form')} activeOpacity={0.7}>
          <ArrowLeft size={22} color="#1A1A1A" strokeWidth={2.5} />
        </TouchableOpacity>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.topArea}>
            <Image source={require('../../assets/icon.png')} style={s.logo} resizeMode="contain" />
            <Text style={s.appName}>MG EVOLUTION</Text>
          </View>

          <View style={s.card}>
            <View style={[s.cardHeader, { justifyContent: 'center', marginBottom: 8 }]}>
              <View style={s.whatsappBadge}>
                <MessageCircle size={22} color="#15803D" strokeWidth={2} />
              </View>
            </View>
            <Text style={[s.cardTitle, { textAlign: 'center' }]}>Verificação</Text>
            <Text style={[s.cardSub, { textAlign: 'center', marginBottom: 28 }]}>
              Enviamos um código de 6 dígitos para seu WhatsApp{'\n'}
              <Text style={{ fontWeight: '700', color: '#1A1A1A' }}>{telefone}</Text>
            </Text>

            <OTPInput value={otp} onChange={setOtp} />

            <TouchableOpacity
              style={[s.btn, { marginTop: 28 }, (loading || otp.length < 6) && s.btnDisabled]}
              onPress={handleCriarConta}
              disabled={loading || otp.length < 6}
              activeOpacity={0.85}
            >
              <Text style={s.btnText}>{loading ? 'Criando conta...' : 'Criar conta'}</Text>
            </TouchableOpacity>

            <View style={s.reenviarWrap}>
              {podReenviar ? (
                <TouchableOpacity onPress={enviarOTP} disabled={loading} activeOpacity={0.7}>
                  <Text style={s.reenviarLink}>Reenviar código</Text>
                </TouchableOpacity>
              ) : (
                <Countdown segundos={aguardar} onZero={() => setPodReenviar(true)} />
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Formulário ───────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableOpacity style={s.voltar} onPress={() => router.back()} activeOpacity={0.7}>
        <ArrowLeft size={22} color="#1A1A1A" strokeWidth={2.5} />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.topArea}>
          <Image source={require('../../assets/icon.png')} style={s.logo} resizeMode="contain" />
          <Text style={s.appName}>MG EVOLUTION</Text>
          <Text style={s.tagline}>Mais que um treino, uma evolução.</Text>
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}>
            <UserRound size={20} color="#CC1A1A" strokeWidth={2} />
            <Text style={s.cardTitle}>Criar conta</Text>
          </View>
          <Text style={s.cardSub}>Preencha seus dados para começar</Text>

          <Campo icon={UserRound} label="Nome completo">
            <TextInput
              style={s.input}
              placeholder="Seu nome"
              placeholderTextColor="#C4BAB2"
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
            />
          </Campo>

          <Campo icon={Mail} label="E-mail">
            <TextInput
              style={s.input}
              placeholder="seu@email.com"
              placeholderTextColor="#C4BAB2"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Campo>

          <Campo icon={Phone} label="WhatsApp (com DDD)">
            <TextInput
              style={s.input}
              placeholder="(11) 99999-9999"
              placeholderTextColor="#C4BAB2"
              value={telefone}
              onChangeText={v => setTelefone(fmtTelefone(v))}
              keyboardType="phone-pad"
            />
          </Campo>

          <Campo icon={LockKeyhole} label="Senha">
            <TextInput
              style={s.input}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#C4BAB2"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!mostrarSenha}
            />
            <TouchableOpacity onPress={() => setMostra(v => !v)} activeOpacity={0.7} style={{ paddingRight: 14 }}>
              {mostrarSenha ? <EyeOff size={18} color="#8A7F76" /> : <Eye size={18} color="#8A7F76" />}
            </TouchableOpacity>
          </Campo>

          <Campo icon={LockKeyhole} label="Confirmar senha">
            <TextInput
              style={s.input}
              placeholder="Repita a senha"
              placeholderTextColor="#C4BAB2"
              value={confirmar}
              onChangeText={setConfirmar}
              secureTextEntry={!mostrarSenha}
            />
          </Campo>

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleContinuar}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={s.btnText}>{loading ? 'Enviando código...' : 'Continuar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.linkWrap} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={s.linkText}>Já tem conta? <Text style={s.link}>Entrar</Text></Text>
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>© MG Evolution</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F0EBE4' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  voltar: {
    width: 40, height: 40, borderRadius: 12, marginTop: 56, marginLeft: 16,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    alignSelf: 'flex-start',
  },

  topArea: { alignItems: 'center', marginBottom: 28, marginTop: 24 },
  logo:    { width: 80, height: 80, marginBottom: 10 },
  appName: { fontSize: 15, fontWeight: '900', color: '#1A1A1A', letterSpacing: 6 },
  tagline: { fontSize: 12, color: '#8A7F76', marginTop: 6, letterSpacing: 0.3, fontStyle: 'italic' },

  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 5,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle:  { fontSize: 20, fontWeight: '900', color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: 1 },
  cardSub:    { fontSize: 13, color: '#8A7F76', marginBottom: 20 },

  field:    { marginBottom: 14 },
  label:    { fontSize: 10, fontWeight: '700', color: '#8A7F76', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  inputBox: {
    minHeight: 48, borderWidth: 1, borderColor: '#E8E2DC',
    borderRadius: 12, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FAF8F6',
  },
  input: { flex: 1, fontSize: 14, color: '#1A1A1A', paddingVertical: 12 },

  btn:         { backgroundColor: '#CC1A1A', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },

  linkWrap: { alignItems: 'center', marginTop: 18 },
  linkText: { fontSize: 13, color: '#8A7F76' },
  link:     { color: '#CC1A1A', fontWeight: '700' },
  footer:   { textAlign: 'center', color: '#C4BAB2', fontSize: 12, marginTop: 24 },

  // OTP
  otpRow:      { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  otpBox:      { width: 46, height: 56, borderRadius: 12, borderWidth: 2, borderColor: '#E0D6CA', fontSize: 24, fontWeight: '800', color: '#1A1A1A', backgroundColor: '#FAF8F6' },
  otpBoxFilled:{ borderColor: '#CC1A1A', backgroundColor: '#FEF2F2' },

  // Whatsapp badge
  whatsappBadge: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(21,128,61,0.1)', alignItems: 'center', justifyContent: 'center' },

  // Countdown / reenviar
  reenviarWrap: { alignItems: 'center', marginTop: 20 },
  countdown:    { fontSize: 13, color: '#8A7F76' },
  reenviarLink: { fontSize: 13, color: '#CC1A1A', fontWeight: '700' },

  // Sucesso
  okIcon:   { width: 88, height: 88, borderRadius: 28, backgroundColor: 'rgba(21,128,61,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  okTitulo: { fontSize: 24, fontWeight: '900', color: '#1A1A1A', marginBottom: 10 },
  okSub:    { fontSize: 14, color: '#8A7F76', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  okBtn:    { backgroundColor: '#CC1A1A', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, alignItems: 'center' },
});
