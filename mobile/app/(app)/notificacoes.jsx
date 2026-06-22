import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, AlertCircle, Info } from 'lucide-react-native';
import api from '../../src/services/api';

export default function Notificacoes() {
  const router = useRouter();
  const [itens, setItens]       = useState([]);
  const [carregando, setLoad]   = useState(true);

  useEffect(() => {
    api.get('/notificacoes')
      .then(r => {
        const lista = r.data?.itens ?? [];
        setItens(lista);
        // Marca como lidas as notificações do admin não lidas
        lista
          .filter(n => n.fonte === 'admin' && !n.lida && n.id_notificacao_aluno)
          .forEach(n => api.put(`/notificacoes/${n.id_notificacao_aluno}/lida`).catch(() => {}));
      })
      .catch(() => {})
      .finally(() => setLoad(false));
  }, []);

  function renderItem({ item, index }) {
    const Icone = item.urgente ? AlertCircle : Info;
    const cor   = item.urgente ? '#CC1A1A' : '#8A7F76';
    const bg    = item.urgente ? '#FFF0F0' : '#F0EBE4';
    const deAdmin = item.fonte === 'admin';
    return (
      <View style={[s.item, index === 0 && s.itemFirst]}>
        <View style={[s.iconWrap, { backgroundColor: bg }]}>
          <Icone size={18} color={cor} strokeWidth={2} />
        </View>
        <View style={s.itemTexto}>
          <Text style={s.itemTitulo}>{item.titulo}</Text>
          {item.descricao ? <Text style={s.itemDesc}>{item.descricao}</Text> : null}
          {deAdmin && (
            <Text style={s.itemFonte}>Mensagem da equipe MG</Text>
          )}
        </View>
        {item.urgente && !item.lida && <View style={s.dot} />}
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Topbar */}
      <View style={s.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={s.btnVoltar} activeOpacity={0.7}>
          <ArrowLeft size={22} color="#1A1A1A" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.topbarTitle}>Notificações</Text>
        <View style={{ width: 40 }} />
      </View>

      {carregando ? (
        <View style={s.loadWrap}>
          <ActivityIndicator size="large" color="#CC1A1A" />
        </View>
      ) : itens.length === 0 ? (
        <View style={s.vazio}>
          <Bell size={40} color="#C4BAB2" strokeWidth={1.5} />
          <Text style={s.vazioTitulo}>Sem notificações</Text>
          <Text style={s.vazioSub}>Você está em dia com tudo!</Text>
        </View>
      ) : (
        <FlatList
          data={itens}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderItem}
          contentContainerStyle={s.lista}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F0EBE4' },

  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingBottom: 14, paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0EBE4',
  },
  btnVoltar:    { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0EBE4', alignItems: 'center', justifyContent: 'center' },
  topbarTitle:  { fontSize: 16, fontWeight: '900', color: '#1A1A1A' },

  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  vazioTitulo: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  vazioSub:    { fontSize: 13, color: '#8A7F76', fontWeight: '600' },

  lista: { padding: 16, gap: 10 },

  item: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  itemFirst: {},
  iconWrap:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  itemTexto: { flex: 1 },
  itemTitulo: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  itemDesc:   { fontSize: 13, color: '#8A7F76', lineHeight: 19 },
  itemFonte:  { fontSize: 11, color: '#CC1A1A', fontWeight: '700', marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CC1A1A', marginTop: 4, flexShrink: 0 },
});
