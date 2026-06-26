import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Phone, LockKeyhole, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import api from '../../src/services/api';

function OTPInput({ value, onChange }) {
  const refs = useRef([]);
  const digits = value.padEnd(6, '').split('').slice(0, 6);

  function handle(idx, val) {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = d;
    onChange(next.join(''));
    if (d && idx < 5) refs.current[idx + 1]?.focus();
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
          maxLength={1}
          textAlign="center"
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

function Countdown({ segundos, onZero }) {
  const [restam, setRestam] = useState(segundos);
  useEffect(() => {
    setRestam(segundos);
    const t = setInterval(() => setRestam(r => {
      if (r <= 1) { clearInterval(t); onZero(); return 0; }
      return r - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [segundos]);
  if (restam === 0) return null;
  return (
    <Text style={s.countdown}>
      Reenviar em <Text style={{ fontWeight: '800', color: '#CC1A1A' }}>{restam}s</Text>
    </Text>
  );
}

export default function EsqueciSenha() {
  const router = useRouter();

  const [etapa, setEtapa]         = useState('telefone');
  const [telefone, setTelefone]   = useState('');
  const [otp, setOtp]             = useState('');
  const [tokenOtp, setTokenOtp]   = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrar, setMostrar]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [aguardar, setAguardar]   = useState(0);
  const [podReenviar, setPod]     = useState(false);

  function fmtTelefone(v) {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2)  return d;
    if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  }

  async function enviarOTP() {
    const tel = telefone.replace(/\D/g, '');
    if (tel.length < 10) return Alert.alert('Atenção', 'Informe um telefone válido com DDD.');
    setLoading(true);
    try {
      const res = await api.post('/auth/otp/enviar', { telefone: tel });
      setAguardar(res.data?.aguardar ?? 120);
      setPod(false);
      setEtapa('otp');
    } catch (err) {
      const wait = err?.response?.data?.aguardar;
      if (wait) { setAguardar(wait); setPod(false); setEtapa('otp'); }
      else Alert.alert('Erro', err?.response?.data?.erro || 'Erro ao enviar código.');
    } finally {
      setLoading(false);
    }
  }

  async function verificarOTP() {
    if (otp.length < 6) return Alert.alert('Atenção', 'Digite o código completo.');
    setLoading(true);
    try {
      const tel = telefone.replace(/\D/g, '');
      const res = await api.post('/auth/otp/verificar', { telefone: tel, codigo: otp });
      setTokenOtp(res.data.token);
      setEtapa('senha');
    } catch (err) {
      Alert.alert('Erro', err?.response?.data?.erro || 'Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  }

  async function redefinirSenha() {
    if (novaSenha.length < 6) return Alert.alert('Atenção', 'Senha com mínimo 6 caracteres.');
    if (novaSenha !== confirmar) return Alert.alert('Atenção', 'Senhas não coincidem.');
    setLoading(true);
    try {
      await api.post('/auth/redefinir-senha-otp', {
        telefone: telefone.replace(/\D/g, ''),
        token_otp: tokenOtp,
        nova_senha: novaSenha,
      });
      setEtapa('ok');
    } catch (err) {
      Alert.alert('Erro', err?.response?.data?.erro || 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  }

  function voltar() {
    if (etapa === 'otp')   { setOtp(''); setEtapa('telefone'); return; }
    if (etapa === 'senha') { setEtapa('otp'); return; }
    router.back();
  }

  if (etapa === 'ok') {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <View style={s.okIcon}><CheckCircle2 size={48} color="#15803D" strokeWidth={1.5} /></View>
        <Text style={s.okTitulo}>Senha redefinida!</Text>
        <Text style={s.okSub}>Sua senha foi atualizada com sucesso.</Text>
        <TouchableOpacity style={s.okBtn} onPress={() => router.replace('/(auth)/login')} activeOpacity={0.85}>
          <Text style={s.btnText}>Ir para o login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={s.voltar} onPress={voltar} activeOpacity={0.7}>
        <ArrowLeft size={22} color="#1A1A1A" strokeWidth={2.5} />
      </TouchableOpacity>
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

          {/* ── Etapa 1: telefone ── */}
          {etapa === 'telefone' && (
            <>
              <View style={s.cardHeader}>
                <Phone size={20} color="#CC1A1A" strokeWidth={2} />
                <Text style={s.cardTitle}>Recuperar senha</Text>
              </View>
              <Text style={s.cardSub}>Informe seu WhatsApp cadastrado para receber o código</Text>

              <View style={s.field}>
                <Text style={s.label}>WhatsApp (com DDD)</Text>
                <View style={s.inputBox}>
                  <Phone size={18} color="#8A7F76" strokeWidth={1.8} />
                  <TextInput
                    style={s.input}
                    placeholder="(11) 99999-9999"
                    placeholderTextColor="#C4BAB2"
                    value={telefone}
                    onChangeText={v => setTelefone(fmtTelefone(v))}
                    keyboardType="phone-pad"
                    editable={!loading}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[s.btn, loading && s.btnDisabled]}
                onPress={enviarOTP}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={s.btnText}>{loading ? 'Enviando...' : 'Enviar código'}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Etapa 2: OTP ── */}
          {etapa === 'otp' && (
            <>
              <View style={[s.cardHeader, { justifyContent: 'center' }]}>
                <Text style={[s.cardTitle, { textAlign: 'center' }]}>Verificação</Text>
              </View>
              <Text style={[s.cardSub, { textAlign: 'center', marginBottom: 28 }]}>
                Código enviado para o WhatsApp{'\n'}
                <Text style={{ fontWeight: '700', color: '#1A1A1A' }}>{telefone}</Text>
              </Text>

              <OTPInput value={otp} onChange={setOtp} />

              <TouchableOpacity
                style={[s.btn, { marginTop: 28 }, (loading || otp.length < 6) && s.btnDisabled]}
                onPress={verificarOTP}
                disabled={loading || otp.length < 6}
                activeOpacity={0.85}
              >
                <Text style={s.btnText}>{loading ? 'Verificando...' : 'Confirmar'}</Text>
              </TouchableOpacity>

              <View style={s.reenviarWrap}>
                {podReenviar ? (
                  <TouchableOpacity onPress={enviarOTP} disabled={loading} activeOpacity={0.7}>
                    <Text style={s.reenviarLink}>Reenviar código</Text>
                  </TouchableOpacity>
                ) : (
                  <Countdown segundos={aguardar} onZero={() => setPod(true)} />
                )}
              </View>
            </>
          )}

          {/* ── Etapa 3: nova senha ── */}
          {etapa === 'senha' && (
            <>
              <View style={s.cardHeader}>
                <LockKeyhole size={20} color="#CC1A1A" strokeWidth={2} />
                <Text style={s.cardTitle}>Nova senha</Text>
              </View>
              <Text style={s.cardSub}>Escolha uma senha com mínimo 6 caracteres</Text>

              <View style={s.field}>
                <Text style={s.label}>Nova senha</Text>
                <View style={s.inputBox}>
                  <LockKeyhole size={18} color="#8A7F76" strokeWidth={1.8} />
                  <TextInput
                    style={s.input}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor="#C4BAB2"
                    value={novaSenha}
                    onChangeText={setNovaSenha}
                    secureTextEntry={!mostrar}
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setMostrar(v => !v)} activeOpacity={0.7}>
                    {mostrar ? <EyeOff size={19} color="#8A7F76" /> : <Eye size={19} color="#8A7F76" />}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.field}>
                <Text style={s.label}>Confirmar senha</Text>
                <View style={s.inputBox}>
                  <LockKeyhole size={18} color="#8A7F76" strokeWidth={1.8} />
                  <TextInput
                    style={s.input}
                    placeholder="Repita a senha"
                    placeholderTextColor="#C4BAB2"
                    value={confirmar}
                    onChangeText={setConfirmar}
                    secureTextEntry={!mostrar}
                    editable={!loading}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[s.btn, loading && s.btnDisabled]}
                onPress={redefinirSenha}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={s.btnText}>{loading ? 'Salvando...' : 'Salvar nova senha'}</Text>
              </TouchableOpacity>
            </>
          )}

        </View>

        <Text style={s.footer}>© MG Evolution</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F0EBE4' },
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
  cardTitle:  { flex: 1, fontSize: 20, fontWeight: '900', color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: 1 },
  cardSub:    { fontSize: 13, color: '#8A7F76', marginBottom: 24 },

  voltar: {
    width: 40, height: 40, borderRadius: 12, marginTop: 56, marginLeft: 16,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },

  field:    { marginBottom: 16 },
  label:    { fontSize: 11, fontWeight: '700', color: '#8A7F76', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  inputBox: {
    minHeight: 50, borderWidth: 1, borderColor: '#E8E2DC',
    borderRadius: 14, paddingHorizontal: 14, backgroundColor: '#FAF8F6',
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: '#1A1A1A', paddingVertical: 12 },

  btn:         { backgroundColor: '#CC1A1A', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },

  otpRow:       { flexDirection: 'row', gap: 6 },
  otpBox:       { flex: 1, height: 52, borderRadius: 12, borderWidth: 2, borderColor: '#E0D6CA', fontSize: 22, fontWeight: '800', color: '#1A1A1A', backgroundColor: '#FAF8F6' },
  otpBoxFilled: { borderColor: '#CC1A1A', backgroundColor: '#FEF2F2' },

  reenviarWrap: { alignItems: 'center', marginTop: 20 },
  countdown:    { fontSize: 13, color: '#8A7F76' },
  reenviarLink: { fontSize: 13, color: '#CC1A1A', fontWeight: '700' },

  okIcon:   { width: 88, height: 88, borderRadius: 28, backgroundColor: 'rgba(21,128,61,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  okTitulo: { fontSize: 24, fontWeight: '900', color: '#1A1A1A', marginBottom: 10 },
  okSub:    { fontSize: 14, color: '#8A7F76', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  okBtn:    { backgroundColor: '#CC1A1A', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, alignItems: 'center' },

  footer: { textAlign: 'center', color: '#C4BAB2', fontSize: 12, marginTop: 16 },
});
