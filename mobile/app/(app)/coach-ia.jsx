import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Keyboard,
} from 'react-native';
import { Bot, Send, RotateCcw, User } from 'lucide-react-native';
import api from '../../src/services/api';

const SUGESTOES = [
  'Como está minha progressão de cargas?',
  'Qual exercício devo focar esta semana?',
  'Dicas para recuperação muscular',
  'Como ajustar meu treino para emagrecer mais?',
];

function BolhaIA({ texto }) {
  return (
    <View style={s.rowIA}>
      <View style={s.avatarIA}>
        <Bot size={16} color="#CC1A1A" strokeWidth={2} />
      </View>
      <View style={s.bolhaIA}>
        <Text style={s.textoIA}>{texto}</Text>
      </View>
    </View>
  );
}

function BolhaUser({ texto }) {
  return (
    <View style={s.rowUser}>
      <View style={s.bolhaUser}>
        <Text style={s.textoUser}>{texto}</Text>
      </View>
      <View style={s.avatarUser}>
        <User size={16} color="#fff" strokeWidth={2} />
      </View>
    </View>
  );
}

function DigitandoIndicador() {
  return (
    <View style={s.rowIA}>
      <View style={s.avatarIA}>
        <Bot size={16} color="#CC1A1A" strokeWidth={2} />
      </View>
      <View style={[s.bolhaIA, s.bolhaDigitando]}>
        <ActivityIndicator size="small" color="#CC1A1A" />
        <Text style={s.digitandoText}>Coach IA está pensando...</Text>
      </View>
    </View>
  );
}

export default function CoachIA() {
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto]         = useState('');
  const [enviando, setEnviando]   = useState(false);
  const [iniciando, setIniciando] = useState(true);
  const [nomeSessao, setNome]     = useState('');
  const listRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => listRef.current?.scrollToEnd({ animated: true }),
    );
    return () => show.remove();
  }, []);

  async function iniciar() {
    setIniciando(true);
    setMensagens([]);
    try {
      const res = await api.get('/coach-ia/iniciar');
      const nome = res.data.nome?.split(' ')[0] ?? 'você';
      setNome(nome);
      setMensagens([{
        id: 'boas-vindas',
        papel: 'ia',
        texto: `Olá, ${nome}! Sou o Coach IA MG, seu assistente pessoal de treino e nutrição baseado no método do Márcio Gonçalves.\n\nJá carreguei seu protocolo e seus dados. Pode me perguntar sobre seus exercícios, cargas, evolução ou qualquer dúvida de treino!`,
      }]);
    } catch {
      setMensagens([{
        id: 'erro-inicio',
        papel: 'ia',
        texto: 'Olá! Não consegui carregar seus dados agora, mas pode me perguntar assim mesmo.',
      }]);
    } finally {
      setIniciando(false);
    }
  }

  useEffect(() => { iniciar(); }, []);

  useEffect(() => {
    if (mensagens.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [mensagens]);

  async function enviar(msg) {
    const texto_enviar = (msg ?? texto).trim();
    if (!texto_enviar || enviando) return;

    setTexto('');
    const idUser = Date.now().toString();
    setMensagens(prev => [...prev, { id: idUser, papel: 'user', texto: texto_enviar }]);
    setEnviando(true);

    try {
      const res = await api.post('/coach-ia/chat', { mensagem: texto_enviar });
      setMensagens(prev => [...prev, {
        id: idUser + '_resp',
        papel: 'ia',
        texto: res.data.resposta,
      }]);
    } catch (err) {
      setMensagens(prev => [...prev, {
        id: idUser + '_err',
        papel: 'ia',
        texto: 'Não consegui processar sua mensagem. Tente novamente.',
      }]);
    } finally {
      setEnviando(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function novaConversa() {
    Alert.alert(
      'Nova conversa',
      'Quer iniciar uma nova conversa? O histórico atual será apagado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try { await api.delete('/coach-ia/sessao'); } catch {}
            await iniciar();
          },
        },
      ]
    );
  }

  const renderItem = useCallback(({ item }) => {
    if (item.papel === 'user') return <BolhaUser texto={item.texto} />;
    return <BolhaIA texto={item.texto} />;
  }, []);

  return (
    <View style={s.root}>
      {/* Topbar — fora do KAV, sempre fixa */}
      <View style={s.topbar}>
        <View style={s.topbarLeft}>
          <View style={s.topbarIcon}>
            <Bot size={20} color="#CC1A1A" strokeWidth={2} />
          </View>
          <View>
            <Text style={s.topbarTitle}>Coach IA</Text>
            <Text style={s.topbarSub}>Método MG</Text>
          </View>
        </View>
        <TouchableOpacity onPress={novaConversa} style={s.btnNova} activeOpacity={0.7}>
          <RotateCcw size={18} color="#8A7F76" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Lista de mensagens */}
        {iniciando ? (
          <View style={s.loadWrap}>
            <ActivityIndicator size="large" color="#CC1A1A" />
            <Text style={s.loadText}>Carregando seus dados...</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={mensagens}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={s.lista}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={enviando ? <DigitandoIndicador /> : null}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
            maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 10 }}
          />
        )}

        {/* Sugestões rápidas */}
        {!iniciando && mensagens.length === 1 && !enviando && (
          <View style={s.sugestoesWrap}>
            <Text style={s.sugestoesTitulo}>Sugestões</Text>
            <View style={s.sugestoesRow}>
              {SUGESTOES.map((s_item, i) => (
                <TouchableOpacity
                  key={i}
                  style={s.chip}
                  onPress={() => enviar(s_item)}
                  activeOpacity={0.8}
                >
                  <Text style={s.chipText}>{s_item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input */}
        <View style={s.inputWrap}>
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder="Pergunte ao Coach IA..."
            placeholderTextColor="#C4BAB2"
            value={texto}
            onChangeText={setTexto}
            multiline
            maxLength={500}
            returnKeyType="default"
            editable={!enviando && !iniciando}
          />
          <TouchableOpacity
            style={[s.btnEnviar, (!texto.trim() || enviando) && s.btnEnviarDisabled]}
            onPress={() => enviar()}
            disabled={!texto.trim() || enviando}
            activeOpacity={0.8}
          >
            <Send size={18} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#F0EBE4' },

  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingBottom: 14, paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0EBE4',
  },
  topbarLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topbarIcon:  { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center' },
  topbarTitle: { fontSize: 16, fontWeight: '900', color: '#1A1A1A' },
  topbarSub:   { fontSize: 11, color: '#8A7F76', fontWeight: '600' },
  btnNova:     { width: 38, height: 38, borderRadius: 10, backgroundColor: '#F0EBE4', alignItems: 'center', justifyContent: 'center' },

  loadWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadText:  { fontSize: 14, color: '#8A7F76', fontWeight: '600' },

  lista:     { padding: 16, gap: 12, paddingBottom: 8 },

  rowIA:   { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '85%' },
  rowUser: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '85%', alignSelf: 'flex-end' },

  avatarIA: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarUser: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#CC1A1A', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  bolhaIA: {
    backgroundColor: '#fff', borderRadius: 18, borderBottomLeftRadius: 4,
    padding: 14, flex: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  bolhaUser: {
    backgroundColor: '#CC1A1A', borderRadius: 18, borderBottomRightRadius: 4,
    padding: 14, flex: 1,
  },
  textoIA:   { fontSize: 14, color: '#1A1A1A', lineHeight: 22 },
  textoUser: { fontSize: 14, color: '#fff',    lineHeight: 22 },

  bolhaDigitando: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  digitandoText:  { fontSize: 13, color: '#8A7F76', fontStyle: 'italic' },

  sugestoesWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  sugestoesTitulo: { fontSize: 11, fontWeight: '700', color: '#8A7F76', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  sugestoesRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: '#E8E2DC',
  },
  chipText: { fontSize: 13, color: '#1A1A1A', fontWeight: '600' },

  inputWrap: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0EBE4',
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120,
    backgroundColor: '#F0EBE4', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#1A1A1A',
  },
  btnEnviar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#CC1A1A', alignItems: 'center', justifyContent: 'center',
  },
  btnEnviarDisabled: { backgroundColor: '#E8E2DC' },
});
