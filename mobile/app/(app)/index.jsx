import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Dumbbell, ChevronRight, Flame, Calendar,
  Trophy, Play, Sun, Sunset, Moon, Bell, Bot,
} from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import api from '../../src/services/api';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_FULL   = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES       = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return { texto: 'Bom dia', Icone: Sun };
  if (h < 18) return { texto: 'Boa tarde', Icone: Sunset };
  return { texto: 'Boa noite', Icone: Moon };
}

function dataHoje() {
  const d = new Date();
  return `${DIAS_FULL[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

export default function Inicio() {
  const { usuario } = useAuth();
  const router      = useRouter();
  const [protocolo, setProtocolo]       = useState(null);
  const [treinoHoje, setTreinoHoje]     = useState(null);
  const [refreshing, setRefreshing]     = useState(false);
  const [fotoUrl, setFotoUrl]           = useState(null);
  const [totalNotif, setTotalNotif]     = useState(0);

  const nome      = usuario?.nome?.split(' ')[0] ?? 'Aluno';
  const { texto: saud, Icone: IconeSaud } = saudacao();
  const hoje      = new Date().getDay();

  async function carregar() {
    try {
      const [resProtocolo, resPerfil, resNotif] = await Promise.all([
        api.get('/treinos/meu-protocolo'),
        api.get('/perfil'),
        api.get('/notificacoes').catch(() => ({ data: { total: 0, itens: [] } })),
      ]);
      setProtocolo(resProtocolo.data);
      const diaHoje = resProtocolo.data.dias?.find(d => d.dia_semana === hoje);
      setTreinoHoje(diaHoje ?? null);
      setFotoUrl(resPerfil.data?.foto_url ?? null);
      setTotalNotif(resNotif.data?.total ?? 0);
    } catch {}
  }

  useEffect(() => { carregar(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  }, []);

  const diasComTreino = protocolo?.dias?.length ?? 0;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CC1A1A" />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.saudacaoRow}>
            <IconeSaud size={16} color="#8A7F76" strokeWidth={2} />
            <Text style={s.saudacao}>{saud}</Text>
          </View>
          <Text style={s.nome}>{nome}</Text>
          <Text style={s.data}>{dataHoje()}</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.sinoWrap} onPress={() => router.push('/(app)/notificacoes')} activeOpacity={0.8}>
            <Bell size={20} color="#1A1A1A" strokeWidth={2} />
            {totalNotif > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{totalNotif > 9 ? '9+' : totalNotif}</Text>
              </View>
            )}
          </TouchableOpacity>
          {fotoUrl ? (
            <Image source={{ uri: fotoUrl }} style={s.avatar} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <Text style={s.avatarInicial}>{nome[0]?.toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>


      {/* Treino de Hoje */}
      {treinoHoje ? (
        <TouchableOpacity
          style={s.cardTreino}
          onPress={() => router.push('/(app)/treinos')}
          activeOpacity={0.88}
        >
          <View style={s.cardTreinoTop}>
            <View style={s.badgeHoje}>
              <Text style={s.badgeHojeText}>HOJE</Text>
            </View>
            <Text style={s.cardTreinoGrupo} numberOfLines={1}>{treinoHoje.grupo_muscular}</Text>
            <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
          </View>
          <View style={s.cardTreinoMeta}>
            <View style={s.metaItem}>
              <Dumbbell size={13} color="rgba(255,255,255,0.7)" strokeWidth={2} />
              <Text style={s.metaText}>{treinoHoje.exercicios?.length ?? 0} exercícios</Text>
            </View>
          </View>
          <TouchableOpacity
            style={s.btnIniciar}
            onPress={() => router.push('/(app)/treinos')}
            activeOpacity={0.85}
          >
            <Play size={14} color="#CC1A1A" fill="#CC1A1A" />
            <Text style={s.btnIniciarText}>Iniciar treino</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ) : (
        <View style={[s.cardTreino, s.cardTreinoDescanso]}>
          <View style={s.cardTreinoTop}>
            <View style={s.badgeHoje}>
              <Text style={s.badgeHojeText}>HOJE</Text>
            </View>
            <Text style={s.cardTreinoGrupo}>Dia de descanso</Text>
          </View>
          <Text style={s.cardTreinoSub}>Recupere-se bem para o próximo treino.</Text>
        </View>
      )}

      {/* Cards rápidos */}
      <View style={s.statsRow}>
        <View style={[s.statCard, { flex: 1 }]}>
          <View style={[s.statIcon, { backgroundColor: '#FFF0F0' }]}>
            <Calendar size={18} color="#CC1A1A" strokeWidth={2} />
          </View>
          <Text style={s.statNum}>{diasComTreino}</Text>
          <Text style={s.statLabel}>dias / semana</Text>
        </View>
        <View style={[s.statCard, { flex: 1 }]}>
          <View style={[s.statIcon, { backgroundColor: '#FFF5E6' }]}>
            <Flame size={18} color="#F97316" strokeWidth={2} />
          </View>
          <Text style={s.statNum}>–</Text>
          <Text style={s.statLabel}>sequência</Text>
        </View>
        <View style={[s.statCard, { flex: 1 }]}>
          <View style={[s.statIcon, { backgroundColor: '#F0FFF4' }]}>
            <Trophy size={18} color="#22C55E" strokeWidth={2} />
          </View>
          <Text style={s.statNum}>–</Text>
          <Text style={s.statLabel}>treinos feitos</Text>
        </View>
      </View>

      {/* Próximos treinos */}
      {protocolo?.dias?.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Protocolo da semana</Text>
          {protocolo.dias.map((d, i) => (
            <View key={i} style={[s.diaRow, i < protocolo.dias.length - 1 && s.diaRowBorder]}>
              <View style={[s.diaBadge, d.dia_semana === hoje && s.diaBadgeHoje]}>
                <Text style={[s.diaBadgeText, d.dia_semana === hoje && s.diaBadgeTextHoje]}>
                  {DIAS_SEMANA[d.dia_semana]}
                </Text>
              </View>
              <Text style={s.diaGrupo} numberOfLines={1}>{d.grupo_muscular}</Text>
              <Text style={s.diaExs}>{d.exercicios?.length ?? 0} ex.</Text>
            </View>
          ))}
        </View>
      )}

      {/* Coach IA */}
      <TouchableOpacity
        style={s.cardCoach}
        onPress={() => router.push('/(app)/coach-ia')}
        activeOpacity={0.88}
      >
        <View style={s.coachIcon}>
          <Bot size={22} color="#fff" strokeWidth={2} />
        </View>
        <View style={s.coachInfo}>
          <Text style={s.coachTitle}>Coach IA</Text>
          <Text style={s.coachSub}>Tire dúvidas sobre treino e dieta</Text>
        </View>
        <ChevronRight size={18} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>


    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F0EBE4' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 32, gap: 16 },

  header:          { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerLeft:      { flex: 1 },
  saudacaoRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  saudacao:        { fontSize: 13, color: '#8A7F76', fontWeight: '600' },
  nome:            { fontSize: 20, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.3 },
  data:            { fontSize: 13, color: '#8A7F76', marginTop: 2 },
  headerRight:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sinoWrap:        { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  badge:           { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#CC1A1A', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText:       { color: '#fff', fontSize: 10, fontWeight: '900' },
  avatar:          { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#fff' },
  avatarPlaceholder: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#CC1A1A', alignItems: 'center', justifyContent: 'center',
  },
  avatarInicial:   { color: '#fff', fontSize: 20, fontWeight: '900' },


  cardTreino: {
    backgroundColor: '#CC1A1A', borderRadius: 20, padding: 16,
    shadowColor: '#CC1A1A', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  cardTreinoDescanso: { backgroundColor: '#1A1A1A' },
  cardTreinoTop:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  badgeHoje:       { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeHojeText:   { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  cardTreinoGrupo: { flex: 1, fontSize: 15, fontWeight: '800', color: '#fff' },
  cardTreinoSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  metaItem:        { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText:        { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  cardTreinoMeta:  { flexDirection: 'row', gap: 16, marginBottom: 12 },
  btnIniciar: {
    backgroundColor: '#fff', borderRadius: 10,
    paddingVertical: 9, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 7,
    alignSelf: 'flex-start',
  },
  btnIniciarText:  { color: '#CC1A1A', fontWeight: '800', fontSize: 13 },

  statsRow:        { flexDirection: 'row', gap: 10 },
  statCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statIcon:        { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statNum:         { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  statLabel:       { fontSize: 11, color: '#8A7F76', fontWeight: '600', textAlign: 'center' },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTitle:       { fontSize: 13, fontWeight: '800', color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },

  diaRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  diaRowBorder:    { borderBottomWidth: 1, borderBottomColor: '#F0EBE4' },
  diaBadge:        { width: 38, height: 24, borderRadius: 8, backgroundColor: '#F0EBE4', alignItems: 'center', justifyContent: 'center' },
  diaBadgeHoje:    { backgroundColor: '#CC1A1A' },
  diaBadgeText:    { fontSize: 11, fontWeight: '800', color: '#8A7F76' },
  diaBadgeTextHoje:{ color: '#fff' },
  diaGrupo:        { flex: 1, fontSize: 14, color: '#1A1A1A', fontWeight: '600' },
  diaExs:          { fontSize: 12, color: '#8A7F76', fontWeight: '600' },

  cardCoach: {
    backgroundColor: '#1A1A1A', borderRadius: 20, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  coachIcon:  { width: 44, height: 44, borderRadius: 14, backgroundColor: '#CC1A1A', alignItems: 'center', justifyContent: 'center' },
  coachInfo:  { flex: 1 },
  coachTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  coachSub:   { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

});
