import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, Modal, TextInput, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Salad, Flame, Beef, Wheat, Droplets, ChevronDown, ChevronUp,
  ArrowLeftRight, Clock, Send, X, RefreshCw,
} from 'lucide-react-native';
import api from '../../src/services/api';

function MacroBadge({ icon: Icon, color, bg, valor, label }) {
  return (
    <View style={[s.macroBadge, { backgroundColor: bg }]}>
      <Icon size={14} color={color} strokeWidth={2} />
      <Text style={[s.macroValor, { color }]}>{valor ?? '–'}</Text>
      <Text style={s.macroLabel}>{label}</Text>
    </View>
  );
}

function ItemAlimento({ item }) {
  const [expandido, setExpandido] = useState(false);
  const temSub = item.substituicoes?.length > 0;

  return (
    <View style={s.itemWrap}>
      <TouchableOpacity
        style={s.itemRow}
        onPress={() => temSub && setExpandido(v => !v)}
        activeOpacity={temSub ? 0.75 : 1}
      >
        <View style={s.itemInfo}>
          <Text style={s.itemNome}>{item.descricao}</Text>
          <Text style={s.itemQtd}>
            {item.quantidade ? `${item.quantidade} ${item.unidade}` : item.unidade ?? ''}
            {item.calorias ? `  •  ${item.calorias} kcal` : ''}
          </Text>
        </View>
        <View style={s.itemMacros}>
          {item.proteina    != null && <Text style={[s.itemMacroNum, { color: '#EF4444' }]}>{item.proteina}P</Text>}
          {item.carboidrato != null && <Text style={[s.itemMacroNum, { color: '#F97316' }]}>{item.carboidrato}C</Text>}
          {item.gordura     != null && <Text style={[s.itemMacroNum, { color: '#EAB308' }]}>{item.gordura}G</Text>}
        </View>
        {temSub && (
          expandido
            ? <ChevronUp size={16} color="#C4BAB2" />
            : <ChevronDown size={16} color="#C4BAB2" />
        )}
      </TouchableOpacity>

      {expandido && (
        <View style={s.subWrap}>
          <View style={s.subHeader}>
            <ArrowLeftRight size={11} color="#8A7F76" strokeWidth={2} />
            <Text style={s.subHeaderText}>Substituições</Text>
          </View>
          {item.substituicoes.map((sub, i) => (
            <View key={i} style={[s.subRow, i < item.substituicoes.length - 1 && s.subRowBorder]}>
              <View style={s.itemInfo}>
                <Text style={s.subNome}>{sub.descricao}</Text>
                <Text style={s.itemQtd}>
                  {sub.quantidade ? `${sub.quantidade} ${sub.unidade}` : sub.unidade ?? ''}
                  {sub.calorias ? `  •  ${sub.calorias} kcal` : ''}
                </Text>
              </View>
              <View style={s.itemMacros}>
                {sub.proteina    != null && <Text style={[s.itemMacroNum, { color: '#EF4444' }]}>{sub.proteina}P</Text>}
                {sub.carboidrato != null && <Text style={[s.itemMacroNum, { color: '#F97316' }]}>{sub.carboidrato}C</Text>}
                {sub.gordura     != null && <Text style={[s.itemMacroNum, { color: '#EAB308' }]}>{sub.gordura}G</Text>}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function CardRefeicao({ ref: refeicao }) {
  const totalCal = refeicao.itens?.reduce((a, i) => a + (i.calorias ?? 0), 0) ?? 0;

  return (
    <View style={s.cardRef}>
      <View style={s.refHeader}>
        <View style={s.refTitleRow}>
          <Text style={s.refNome}>{refeicao.nome}</Text>
          {refeicao.horario ? (
            <View style={s.horarioBadge}>
              <Clock size={11} color="#8A7F76" strokeWidth={2} />
              <Text style={s.horarioText}>{refeicao.horario}</Text>
            </View>
          ) : null}
        </View>
        {totalCal > 0 && <Text style={s.refCal}>{totalCal} kcal</Text>}
      </View>
      {refeicao.itens?.map((item, i) => (
        <ItemAlimento key={item.id_dieta_refeicao_item ?? i} item={item} />
      ))}
    </View>
  );
}

const OBJETIVOS = ['Emagrecimento', 'Ganho de massa', 'Manutenção', 'Saúde geral', 'Performance'];

function ModalSolicitacao({ visivel, onClose, onSucesso, temPlano }) {
  const [objetivo,     setObjetivo]    = useState('');
  const [restricoes,   setRestricoes]  = useState('');
  const [preferencias, setPreferencias]= useState('');
  const [refeicoes,    setRefeicoes]   = useState('');
  const [observacao,   setObservacao]  = useState('');
  const [loading,      setLoading]     = useState(false);

  async function enviar() {
    setLoading(true);
    try {
      await api.post('/dieta/solicitacao', {
        objetivo:     objetivo || null,
        restricoes:   restricoes || null,
        preferencias: preferencias || null,
        refeicoes_dia:refeicoes ? Number(refeicoes) : null,
        observacao:   observacao || null,
      });
      onSucesso();
    } catch (err) {
      Alert.alert('Erro', err?.response?.data?.erro || 'Não foi possível enviar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={m.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={m.sheet}>
          {/* Header */}
          <View style={m.sheetHeader}>
            <Text style={m.sheetTitle}>{temPlano ? 'Solicitar mudança de dieta' : 'Solicitar plano alimentar'}</Text>
            <TouchableOpacity onPress={onClose} style={m.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#8A7F76" />
            </TouchableOpacity>
          </View>
          <Text style={m.sheetSub}>Preencha as informações para seu nutricionista preparar o plano ideal para você.</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Objetivo */}
            <Text style={m.label}>Objetivo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingRight: 4 }}>
                {OBJETIVOS.map(o => (
                  <TouchableOpacity
                    key={o}
                    style={[m.chip, objetivo === o && m.chipAtivo]}
                    onPress={() => setObjetivo(objetivo === o ? '' : o)}
                    activeOpacity={0.75}
                  >
                    <Text style={[m.chipText, objetivo === o && m.chipTextAtivo]}>{o}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Refeições por dia */}
            <Text style={m.label}>Refeições por dia</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['3','4','5','6'].map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[m.chip, refeicoes === n && m.chipAtivo]}
                    onPress={() => setRefeicoes(refeicoes === n ? '' : n)}
                    activeOpacity={0.75}
                  >
                    <Text style={[m.chipText, refeicoes === n && m.chipTextAtivo]}>{n}x</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Restrições */}
            <Text style={m.label}>Restrições alimentares / alergias</Text>
            <TextInput
              style={m.input}
              placeholder="Ex: intolerância à lactose, sem glúten..."
              placeholderTextColor="#C4BAB2"
              value={restricoes}
              onChangeText={setRestricoes}
              multiline
              numberOfLines={2}
            />

            {/* Preferências */}
            <Text style={m.label}>Alimentos preferidos</Text>
            <TextInput
              style={m.input}
              placeholder="Ex: frango, arroz, ovos, frutas..."
              placeholderTextColor="#C4BAB2"
              value={preferencias}
              onChangeText={setPreferencias}
              multiline
              numberOfLines={2}
            />

            {/* Observações */}
            <Text style={m.label}>Observações gerais</Text>
            <TextInput
              style={[m.input, { minHeight: 80 }]}
              placeholder="Conte mais sobre sua rotina, horários, qualquer detalhe que ajude..."
              placeholderTextColor="#C4BAB2"
              value={observacao}
              onChangeText={setObservacao}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[m.btnEnviar, loading && { opacity: 0.6 }]}
              onPress={enviar}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Send size={16} color="#fff" strokeWidth={2} />
              <Text style={m.btnEnviarText}>{loading ? 'Enviando...' : 'Enviar solicitação'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function Dieta() {
  const [plano, setPlano]         = useState(null);
  const [solicitacao, setSol]     = useState(null);
  const [carregando, setCarreg]   = useState(true);
  const [refreshing, setRefresh]  = useState(false);
  const [modalAberto, setModal]   = useState(false);

  async function carregar() {
    try {
      const res = await api.get('/dieta/meu-plano');
      setPlano(res.data);
    } catch {
      setPlano(null);
    }
    try {
      const res2 = await api.get('/dieta/solicitacao');
      setSol(res2.data);
    } catch {
      setSol(null);
    }
  }

  useEffect(() => {
    carregar().finally(() => setCarreg(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefresh(true);
    await carregar();
    setRefresh(false);
  }, []);

  async function aoEnviarSolicitacao() {
    setModal(false);
    await carregar();
    Alert.alert('Solicitado!', 'Seu nutricionista irá analisar e preparar seu plano em breve.');
  }

  if (carregando) {
    return (
      <View style={s.center}>
        <Salad size={36} color="#C4BAB2" strokeWidth={1.5} />
        <Text style={s.centerText}>Carregando...</Text>
      </View>
    );
  }

  // Sem plano
  if (!plano) {
    return (
      <ScrollView
        style={s.root}
        contentContainerStyle={s.centerContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CC1A1A" />}
      >
        <View style={s.emptyWrap}>
          <View style={s.emptyIcon}>
            <Salad size={40} color="#CC1A1A" strokeWidth={1.5} />
          </View>
          <Text style={s.emptyTitle}>Nenhum plano alimentar</Text>

          {solicitacao ? (
            <>
              <Text style={s.emptySub}>Sua solicitação está sendo processada.</Text>
              <View style={s.statusCard}>
                <Text style={s.statusLabel}>Status</Text>
                <Text style={s.statusValor}>
                  {solicitacao.status === 'pendente'     ? 'Aguardando nutricionista' :
                   solicitacao.status === 'em_andamento' ? 'Em preparação'             :
                   solicitacao.status}
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text style={s.emptySub}>Solicite seu plano alimentar personalizado ao seu nutricionista.</Text>
              <TouchableOpacity style={s.btnSolicitar} onPress={() => setModal(true)} activeOpacity={0.85}>
                <Send size={16} color="#fff" strokeWidth={2} />
                <Text style={s.btnSolicitarText}>Solicitar plano alimentar</Text>
              </TouchableOpacity>
            </>
          )}

          <ModalSolicitacao
            visivel={modalAberto}
            onClose={() => setModal(false)}
            onSucesso={aoEnviarSolicitacao}
            temPlano={false}
          />
        </View>
      </ScrollView>
    );
  }

  const totalCal  = plano.refeicoes?.reduce((a, r) => a + r.itens?.reduce((b, i) => b + (i.calorias ?? 0), 0), 0) ?? 0;
  const totalProt = plano.refeicoes?.reduce((a, r) => a + r.itens?.reduce((b, i) => b + (i.proteina ?? 0), 0), 0) ?? 0;
  const totalCarb = plano.refeicoes?.reduce((a, r) => a + r.itens?.reduce((b, i) => b + (i.carboidrato ?? 0), 0), 0) ?? 0;
  const totalGord = plano.refeicoes?.reduce((a, r) => a + r.itens?.reduce((b, i) => b + (i.gordura ?? 0), 0), 0) ?? 0;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CC1A1A" />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{plano.nome}</Text>
          {plano.objetivo ? <Text style={s.headerObj}>{plano.objetivo}</Text> : null}
        </View>
        {solicitacao && solicitacao.status !== 'concluida' ? (
          <View style={s.mudancaBadge}>
            <RefreshCw size={12} color="#CC8800" strokeWidth={2.5} />
            <Text style={s.mudancaBadgeText}>Solicitado</Text>
          </View>
        ) : null}
      </View>

      {/* Solicitação em andamento */}
      {solicitacao && solicitacao.status !== 'concluida' && (
        <TouchableOpacity style={s.mudancaCard} onPress={() => setModal(true)} activeOpacity={0.8}>
          <View style={s.mudancaRow}>
            <RefreshCw size={15} color="#CC8800" strokeWidth={2} />
            <Text style={s.mudancaTitulo}>Mudança solicitada</Text>
          </View>
          <Text style={s.mudancaStatus}>
            {solicitacao.status === 'pendente' ? 'Aguardando análise · toque para editar' : 'Em preparação pelo nutricionista'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Macros totais */}
      <View style={s.macrosRow}>
        <MacroBadge icon={Flame}   color="#CC1A1A" bg="#FFF0F0" valor={plano.calorias_meta ?? totalCal}  label="kcal" />
        <MacroBadge icon={Beef}    color="#EF4444" bg="#FEF2F2" valor={plano.proteina_meta ?? totalProt} label="prot g" />
        <MacroBadge icon={Wheat}   color="#F97316" bg="#FFF7ED" valor={totalCarb || null}                label="carb g" />
        <MacroBadge icon={Droplets}color="#EAB308" bg="#FEFCE8" valor={totalGord || null}                label="gord g" />
      </View>

      {/* Observações */}
      {plano.observacoes ? (
        <View style={s.obsCard}>
          <Text style={s.obsText}>{plano.observacoes}</Text>
        </View>
      ) : null}

      {/* Refeições */}
      {plano.refeicoes?.map((ref, i) => (
        <CardRefeicao key={ref.id_dieta_refeicao ?? i} ref={ref} />
      ))}

      {/* Botão solicitar mudança */}
      {(!solicitacao || solicitacao.status === 'concluida') && (
        <TouchableOpacity style={s.btnMudancaGrande} onPress={() => setModal(true)} activeOpacity={0.85}>
          <View style={s.btnMudancaIcon}>
            <RefreshCw size={20} color="#CC1A1A" strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.btnMudancaGrandeTitulo}>Solicitar outra dieta</Text>
            <Text style={s.btnMudancaGrandeSub}>Não está satisfeito? Peça uma alteração</Text>
          </View>
        </TouchableOpacity>
      )}

      <ModalSolicitacao
        visivel={modalAberto}
        onClose={() => setModal(false)}
        onSucesso={aoEnviarSolicitacao}
        temPlano={true}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F0EBE4' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40, gap: 14 },
  center:  { flex: 1, backgroundColor: '#F0EBE4', alignItems: 'center', justifyContent: 'center', gap: 12 },
  centerText: { color: '#8A7F76', fontSize: 14 },
  centerContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },

  emptyWrap:   { alignItems: 'center', gap: 12 },
  emptyIcon:   { width: 72, height: 72, borderRadius: 22, backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:  { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
  emptySub:    { fontSize: 14, color: '#8A7F76', textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  statusCard:  { backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', gap: 4, width: '100%', marginTop: 8 },
  statusLabel: { fontSize: 11, fontWeight: '700', color: '#8A7F76', textTransform: 'uppercase', letterSpacing: 1 },
  statusValor: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  btnSolicitar: {
    backgroundColor: '#CC1A1A', borderRadius: 14,
    paddingVertical: 15, paddingHorizontal: 28,
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8,
  },
  btnSolicitarText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  header:      { gap: 4 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
  headerObj:   { fontSize: 13, color: '#8A7F76', fontWeight: '600' },

  macrosRow:   { flexDirection: 'row', gap: 8 },
  macroBadge:  { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 },
  macroValor:  { fontSize: 16, fontWeight: '900' },
  macroLabel:  { fontSize: 10, color: '#8A7F76', fontWeight: '600' },

  obsCard:     { backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  obsText:     { fontSize: 13, color: '#8A7F76', lineHeight: 20 },

  cardRef: {
    backgroundColor: '#fff', borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
  },
  refHeader:   { padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0EBE4' },
  refTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  refNome:     { fontSize: 14, fontWeight: '800', color: '#1A1A1A', flex: 1 },
  refCal:      { fontSize: 12, color: '#8A7F76', fontWeight: '600' },
  horarioBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0EBE4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  horarioText: { fontSize: 11, color: '#8A7F76', fontWeight: '700' },

  itemWrap:    {},
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F8F5F2',
  },
  itemInfo:    { flex: 1 },
  itemNome:    { fontSize: 14, color: '#1A1A1A', fontWeight: '600' },
  itemQtd:     { fontSize: 12, color: '#8A7F76', marginTop: 2 },
  itemMacros:  { flexDirection: 'row', gap: 6, alignItems: 'center' },
  itemMacroNum:{ fontSize: 11, fontWeight: '800' },

  subWrap:     { backgroundColor: '#FAF8F6', paddingHorizontal: 16, paddingVertical: 10, gap: 0 },
  subHeader:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  subHeaderText: { fontSize: 10, fontWeight: '800', color: '#8A7F76', textTransform: 'uppercase', letterSpacing: 1 },
  subRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  subRowBorder:{ borderBottomWidth: 1, borderBottomColor: '#F0EBE4' },
  subNome:     { fontSize: 13, color: '#4A4038', fontWeight: '600' },

  btnMudancaGrande: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#E0D6CA',
  },
  btnMudancaIcon: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center',
  },
  btnMudancaGrandeTitulo: { fontSize: 14, fontWeight: '800', color: '#CC1A1A', marginBottom: 2 },
  btnMudancaGrandeSub:    { fontSize: 12, color: '#8A7F76' },

  mudancaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFF8E7', borderRadius: 10, borderWidth: 1, borderColor: '#FDE68A',
    paddingHorizontal: 8, paddingVertical: 5,
  },
  mudancaBadgeText: { color: '#CC8800', fontSize: 11, fontWeight: '800' },

  mudancaCard: {
    backgroundColor: '#FFF8E7', borderRadius: 14, padding: 14,
    borderLeftWidth: 3, borderLeftColor: '#CC8800', gap: 4,
  },
  mudancaRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mudancaTitulo:{ fontSize: 13, fontWeight: '800', color: '#CC8800' },
  mudancaStatus:{ fontSize: 12, color: '#8A7F76' },
});

const m = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '90%',
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  sheetTitle:  { fontSize: 17, fontWeight: '900', color: '#1A1A1A', flex: 1 },
  sheetSub:    { fontSize: 13, color: '#8A7F76', marginBottom: 20, lineHeight: 20 },
  closeBtn:    { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F0EBE4', alignItems: 'center', justifyContent: 'center' },

  label: { fontSize: 10, fontWeight: '700', color: '#8A7F76', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },

  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E0D6CA', backgroundColor: '#FAF8F6',
  },
  chipAtivo:     { borderColor: '#CC1A1A', backgroundColor: '#FEF2F2' },
  chipText:      { fontSize: 13, color: '#8A7F76', fontWeight: '600' },
  chipTextAtivo: { color: '#CC1A1A', fontWeight: '800' },

  input: {
    borderWidth: 1, borderColor: '#E0D6CA', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#1A1A1A', backgroundColor: '#FAF8F6',
    marginBottom: 16, textAlignVertical: 'top',
  },

  btnEnviar: {
    backgroundColor: '#CC1A1A', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginTop: 4, marginBottom: 8,
  },
  btnEnviarText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
