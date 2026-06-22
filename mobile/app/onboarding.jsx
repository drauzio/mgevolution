import { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '../src/contexts/AuthContext';
import api from '../src/services/api';

// Seletor de data de nascimento DD / MM / AAAA
function DatePicker({ value, onChange }) {
  const refMes = useRef(); const refAno = useRef();
  const partes = value ? value.split('/') : ['', '', ''];
  const [dia, setDia]   = useState(partes[0]);
  const [mes, setMes]   = useState(partes[1]);
  const [ano, setAno]   = useState(partes[2]);

  function atualizar(d, m, a) {
    if (d.length === 2 && m.length === 2 && a.length === 4) onChange(`${d}/${m}/${a}`);
    else onChange('');
  }

  return (
    <View style={s.dateRow}>
      <View style={s.dateBox}>
        <Text style={s.dateLabel}>Dia</Text>
        <TextInput
          style={s.dateInput}
          placeholder="DD"
          placeholderTextColor="#C4BAB2"
          keyboardType="number-pad"
          maxLength={2}
          value={dia}
          onChangeText={v => { setDia(v); if (v.length === 2) refMes.current?.focus(); atualizar(v, mes, ano); }}
        />
      </View>
      <Text style={s.dateSep}>/</Text>
      <View style={s.dateBox}>
        <Text style={s.dateLabel}>Mês</Text>
        <TextInput
          ref={refMes}
          style={s.dateInput}
          placeholder="MM"
          placeholderTextColor="#C4BAB2"
          keyboardType="number-pad"
          maxLength={2}
          value={mes}
          onChangeText={v => { setMes(v); if (v.length === 2) refAno.current?.focus(); atualizar(dia, v, ano); }}
        />
      </View>
      <Text style={s.dateSep}>/</Text>
      <View style={[s.dateBox, { flex: 2 }]}>
        <Text style={s.dateLabel}>Ano</Text>
        <TextInput
          ref={refAno}
          style={s.dateInput}
          placeholder="AAAA"
          placeholderTextColor="#C4BAB2"
          keyboardType="number-pad"
          maxLength={4}
          value={ano}
          onChangeText={v => { setAno(v); atualizar(dia, mes, v); }}
        />
      </View>
    </View>
  );
}

function OpcaoCard({ label, selecionado, onPress }) {
  return (
    <TouchableOpacity
      style={[s.opcao, selecionado && s.opcaoAtiva]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[s.opcaoText, selecionado && s.opcaoTextAtiva]}>{label}</Text>
      {selecionado && <Check size={16} color="#CC1A1A" strokeWidth={2.5} />}
    </TouchableOpacity>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const { usuario } = useAuth();

  const [perguntas, setPerguntas] = useState([]);
  const [step, setStep]           = useState(0);
  const [respostas, setRespostas] = useState({});
  const [detalhe, setDetalhe]     = useState('');
  const [enviando, setEnviando]   = useState(false);
  const [erro, setErro]           = useState(null);
  const [carregando, setCarreg]   = useState(true);

  useEffect(() => {
    api.get('/avaliacao/perguntas')
      .then(r => setPerguntas(r.data))
      .catch(() => {})
      .finally(() => setCarreg(false));
  }, []);

  const steps    = perguntas.filter(p => p.codigo !== 'lesao_detalhe');
  const total    = steps.length;
  const pergunta = steps[step];
  const progresso= total > 0 ? (step / total) * 100 : 0;

  function resposta(p) { return respostas[p?.id]; }

  function setResp(id, valor) {
    setRespostas(prev => ({ ...prev, [id]: valor }));
  }

  function podeAvancar() {
    if (!pergunta) return false;
    if (!pergunta.obrigatorio) return true;
    const r = resposta(pergunta);
    if (pergunta.tipo === 'opcao')  return r?.id_opcao != null;
    if (pergunta.tipo === 'bool')   return r?.bit != null;
    if (pergunta.codigo === 'idade') return r?.texto?.length === 10; // DD/MM/AAAA
    if (pergunta.tipo === 'numero') return r?.numero != null && r.numero > 0;
    return true;
  }

  function avancar() {
    if (step < total - 1) { setStep(s => s + 1); return; }
    submeter();
  }

  async function submeter() {
    setEnviando(true);
    setErro(null);
    try {
      const payload = Object.entries(respostas).map(([id_pergunta, r]) => ({
        id_pergunta:     Number(id_pergunta),
        codigo:          perguntas.find(p => p.id === Number(id_pergunta))?.codigo,
        resposta_bit:    r.bit       ?? null,
        resposta_texto:  r.texto     ?? null,
        resposta_numero: r.numero    ?? null,
        id_opcao:        r.id_opcao  ?? null,
        valor_texto:     r.valor_texto ?? null,
      }));

      // Campo de detalhe da lesão
      const pergLesao   = perguntas.find(p => p.codigo === 'lesao');
      const pergDetalhe = perguntas.find(p => p.codigo === 'lesao_detalhe');
      if (pergLesao && pergDetalhe && respostas[pergLesao.id]?.bit === true && detalhe.trim()) {
        payload.push({
          id_pergunta:     pergDetalhe.id,
          codigo:          'lesao_detalhe',
          resposta_texto:  detalhe.trim(),
          resposta_bit: null, resposta_numero: null, id_opcao: null, valor_texto: null,
        });
      }

      await api.post('/avaliacao', { respostas: payload });
      router.replace('/(app)/index');
    } catch {
      setErro('Erro ao salvar. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <View style={s.loadWrap}>
        <ActivityIndicator size="large" color="#CC1A1A" />
      </View>
    );
  }

  if (!pergunta) return null;

  const primeiroNome = usuario?.nome?.split(' ')[0] ?? '';

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={s.header}>
        <Image source={require('../assets/icon.png')} style={s.logo} resizeMode="contain" />
        <Text style={s.stepText}>{step + 1} de {total}</Text>
      </View>

      {/* Barra de progresso */}
      <View style={s.progressBg}>
        <View style={[s.progressFill, { width: `${progresso}%` }]} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <Text style={s.saudacao}>Olá, {primeiroNome} 👋</Text>
        )}

        <Text style={s.titulo}>{pergunta.pergunta}</Text>
        <Text style={s.sub}>
          {step === 0 ? 'Vamos montar seu perfil de treino.' : 'Selecione a opção que melhor te descreve.'}
        </Text>

        {/* Tipo: opção múltipla */}
        {pergunta.tipo === 'opcao' && (
          <View style={s.opcoesWrap}>
            {pergunta.opcoes.map(op => (
              <OpcaoCard
                key={op.id}
                label={op.valor}
                selecionado={resposta(pergunta)?.id_opcao === op.id}
                onPress={() => setResp(pergunta.id, { id_opcao: op.id, valor_texto: op.valor })}
              />
            ))}
          </View>
        )}

        {/* Tipo: sim/não */}
        {pergunta.tipo === 'bool' && (
          <View style={s.opcoesWrap}>
            {[{ label: 'Sim', valor: true }, { label: 'Não', valor: false }].map(op => (
              <OpcaoCard
                key={op.label}
                label={op.label}
                selecionado={resposta(pergunta)?.bit === op.valor}
                onPress={() => setResp(pergunta.id, { bit: op.valor })}
              />
            ))}
            {pergunta.exibir_detalhe_sim && resposta(pergunta)?.bit === true && (
              <TextInput
                style={s.textarea}
                placeholder={pergunta.descricao_detalhe_sim || 'Descreva aqui...'}
                placeholderTextColor="#C4BAB2"
                value={detalhe}
                onChangeText={setDetalhe}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            )}
          </View>
        )}

        {/* Tipo: data de nascimento */}
        {pergunta.codigo === 'idade' && (
          <DatePicker
            value={resposta(pergunta)?.texto ?? ''}
            onChange={v => setResp(pergunta.id, { texto: v, resposta_texto: v })}
          />
        )}

        {/* Tipo: número genérico */}
        {pergunta.tipo === 'numero' && pergunta.codigo !== 'idade' && (
          <TextInput
            style={s.inputNumero}
            placeholder="0"
            placeholderTextColor="#C4BAB2"
            keyboardType="numeric"
            value={resposta(pergunta)?.numero != null ? String(resposta(pergunta).numero) : ''}
            onChangeText={v => setResp(pergunta.id, { numero: v ? Number(v) : null })}
          />
        )}

        {erro && <Text style={s.erro}>{erro}</Text>}
      </ScrollView>

      {/* Navegação */}
      <View style={s.nav}>
        {step > 0 && (
          <TouchableOpacity style={s.btnVoltar} onPress={() => setStep(s => s - 1)} activeOpacity={0.75}>
            <ChevronLeft size={20} color="#6B6560" strokeWidth={2.5} />
            <Text style={s.btnVoltarText}>Voltar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.btnAvancar, !podeAvancar() && s.btnAvancarDisabled, step === 0 && { flex: 1 }]}
          onPress={avancar}
          disabled={!podeAvancar() || enviando}
          activeOpacity={0.85}
        >
          {enviando
            ? <ActivityIndicator size="small" color="#fff" />
            : <>
                <Text style={s.btnAvancarText}>{step < total - 1 ? 'Continuar' : 'Concluir'}</Text>
                {step < total - 1
                  ? <ChevronRight size={20} color="#fff" strokeWidth={2.5} />
                  : <Check size={20} color="#fff" strokeWidth={2.5} />
                }
              </>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F0EBE4' },
  loadWrap:{ flex: 1, backgroundColor: '#F0EBE4', alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E0D6CA',
  },
  logo:     { width: 36, height: 36 },
  stepText: { fontSize: 13, color: '#8A7F76', fontWeight: '600' },

  progressBg:   { height: 3, backgroundColor: '#E0D6CA' },
  progressFill: { height: 3, backgroundColor: '#CC1A1A' },

  content:  { padding: 24, paddingBottom: 16, flexGrow: 1 },
  saudacao: { fontSize: 13, color: '#CC1A1A', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  titulo:   { fontSize: 24, fontWeight: '900', color: '#1A1A1A', lineHeight: 30, marginBottom: 8 },
  sub:      { fontSize: 13, color: '#8A7F76', marginBottom: 28 },

  opcoesWrap: { gap: 10 },
  opcao: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 14,
    borderWidth: 2, borderColor: '#E0D6CA', backgroundColor: '#fff',
  },
  opcaoAtiva:     { borderColor: '#CC1A1A', backgroundColor: 'rgba(204,26,26,0.05)' },
  opcaoText:      { fontSize: 15, color: '#1A1A1A', fontWeight: '500', flex: 1 },
  opcaoTextAtiva: { color: '#CC1A1A', fontWeight: '700' },

  textarea: {
    marginTop: 8, borderWidth: 2, borderColor: '#E0D6CA', borderRadius: 12,
    padding: 14, fontSize: 14, color: '#1A1A1A', backgroundColor: '#fff',
    minHeight: 80, textAlignVertical: 'top',
  },

  inputNumero: {
    height: 64, borderWidth: 2, borderColor: '#E0D6CA', borderRadius: 14,
    paddingHorizontal: 20, fontSize: 28, fontWeight: '700', color: '#1A1A1A',
    backgroundColor: '#fff',
  },
  dateRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  dateBox:   { flex: 1, alignItems: 'center' },
  dateLabel: { fontSize: 10, fontWeight: '700', color: '#8A7F76', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  dateInput: {
    width: '100%', height: 64, borderWidth: 2, borderColor: '#E0D6CA', borderRadius: 14,
    fontSize: 24, fontWeight: '700', color: '#1A1A1A', backgroundColor: '#fff',
    textAlign: 'center',
  },
  dateSep: { fontSize: 28, fontWeight: '300', color: '#C4BAB2', paddingBottom: 10 },

  erro: { marginTop: 16, color: '#CC1A1A', fontSize: 13, textAlign: 'center' },

  nav: {
    flexDirection: 'row', gap: 12, padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E0D6CA',
  },
  btnVoltar:      { flexDirection: 'row', alignItems: 'center', gap: 4, height: 52, paddingHorizontal: 16, borderRadius: 12, borderWidth: 2, borderColor: '#E0D6CA', backgroundColor: '#fff' },
  btnVoltarText:  { fontSize: 14, fontWeight: '700', color: '#6B6560' },
  btnAvancar:     { flex: 1, height: 52, borderRadius: 12, backgroundColor: '#CC1A1A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnAvancarDisabled: { backgroundColor: '#E0D6CA' },
  btnAvancarText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
