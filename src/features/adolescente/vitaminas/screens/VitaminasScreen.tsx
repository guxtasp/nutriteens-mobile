// src/features/adolescente/vitaminas/screens/VitaminasScreen.tsx
// RF016 — lista de vitaminas e minerais. Tocar abre a página do nutriente.
// Rebrand: abas Todos / Vitaminas / Minerais e uma 2ª linha curta (`resumo`) em cada cartão.
// Animação calma: os cartões só aparecem com um fade curto (sem mola nem pulo) e o toque muda a cor.
import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useAcoesRapidas, AcaoRapida } from '../../_shared/hooks/useAcoesRapidas';
import HomeBottomBar, { useAlturaBarraAbas } from '../../_shared/components/HomeBottomBar';
import QuickActionsMenu from '../../_shared/components/QuickActionsMenu';
import { NUTRIENTES_INFO, NutrienteInfo } from '../data/nutrientesInfo';
import { buscarNutrientesComFonte } from '../services/fontesService';
import type { NutrienteChave } from '../../alimentacao/utils/nutrientesPorGrupo';
import { vit } from '../ui/tokens';
import { SimboloLista } from '../components/SimboloAnimado';
import * as Haptics from '../../../../shared/audio/haptics';
import { filtrarNutrientes, type AbaNutrientes } from '../utils/testeRapido';

type Nav = NativeStackNavigationProp<AdolescenteStackParamList, 'Vitaminas'>;

const ABAS: { chave: AbaNutrientes; rotulo: string }[] = [
  { chave: 'TODOS', rotulo: 'Todos' },
  { chave: 'VITAMINA', rotulo: 'Vitaminas' },
  { chave: 'MINERAL', rotulo: 'Minerais' },
];

/** Controle segmentado: fundo suave, aba ativa branca. */
function AbasNutrientes({ valor, onChange }: { valor: AbaNutrientes; onChange: (a: AbaNutrientes) => void }) {
  return (
    <View style={styles.abas} accessibilityRole="tablist">
      {ABAS.map((a) => {
        const ativa = a.chave === valor;
        return (
          <Pressable
            key={a.chave}
            onPress={() => {
              if (!ativa) Haptics.selectionAsync().catch(() => {});
              onChange(a.chave);
            }}
            style={[styles.aba, ativa && styles.abaAtiva]}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativa }}
            accessibilityLabel={a.rotulo}
          >
            <AppText style={[styles.abaTexto, ativa && styles.abaTextoAtiva]}>{a.rotulo}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const SECOES: { titulo: string; tipo: NutrienteInfo['tipo'] }[] = [
  { titulo: 'Vitaminas', tipo: 'VITAMINA' },
  { titulo: 'Minerais', tipo: 'MINERAL' },
];

function CardNutriente({ n, atraso, emBreve, onPress }: { n: NutrienteInfo; atraso: number; emBreve: boolean; onPress: () => void }) {
  const [pressionado, setPressionado] = useState(false);
  return (
    <MotiView
      from={{ opacity: 0, translateY: 6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 220, delay: atraso }}
    >
      <Pressable
        style={[styles.card, pressionado && styles.cardPressionado]}
        onPressIn={() => { setPressionado(true); Haptics.selectionAsync().catch(() => {}); }}
        onPressOut={() => setPressionado(false)}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={emBreve ? `${n.nome}, ${n.resumo}, alimentos em breve` : `${n.nome}, ${n.resumo}`}
        accessibilityHint="Abre a página do nutriente"
      >
        <View style={styles.cardEsquerda}>
          <SimboloLista simbolo={n.simbolo} pressionado={pressionado} />
          <View style={styles.cardTextos}>
            <AppText style={styles.cardTexto}>{n.nome}</AppText>
            <AppText style={styles.cardResumo}>{n.resumo}</AppText>
          </View>
        </View>
        {emBreve && <View style={styles.emBreve}><AppText style={styles.emBreveTexto}>Em breve</AppText></View>}
        <View style={styles.botao}>
          <Ionicons name="chevron-forward" size={18} color={vit.texto} />
        </View>
      </Pressable>
    </MotiView>
  );
}

export default function VitaminasScreen() {
  const alturaBarra = useAlturaBarraAbas();
  const navigation = useNavigation<Nav>();
  const [menuAberto, setMenuAberto] = useState(false);
  const [aba, setAba] = useState<AbaNutrientes>('TODOS');
  const navegarAcaoRapida = useAcoesRapidas();
  // quais nutrientes já têm alimentos; null = ainda não sabemos (ou falhou) → não mostra etiqueta nenhuma
  const [comFonte, setComFonte] = useState<Set<NutrienteChave> | null>(null);

  useEffect(() => {
    let ativo = true;
    buscarNutrientesComFonte()
      .then((s) => { if (ativo) setComFonte(s); })
      .catch((e) => console.warn('Não deu pra checar quais nutrientes têm alimentos:', e));
    return () => { ativo = false; };
  }, []);

  function handleSelecionarAcao(opcao: AcaoRapida) {
    setMenuAberto(false);
    navegarAcaoRapida(opcao);
  }

  let indice = 0; // atraso da animação continua entre as seções

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScreenHeader
        titulo="Vitaminas e minerais"
        subtitulo="Escolha uma para saber mais"
        onVoltar={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={[styles.conteudo, { paddingBottom: alturaBarra + 24 }]} showsVerticalScrollIndicator={false}>
        <AbasNutrientes valor={aba} onChange={setAba} />
        {SECOES.filter((secao) => aba === 'TODOS' || aba === secao.tipo).map((secao) => (
          <View key={secao.tipo} style={styles.secao}>
            <AppText style={styles.secaoTitulo} accessibilityRole="header">{secao.titulo}</AppText>
            {filtrarNutrientes(NUTRIENTES_INFO, secao.tipo).map((n) => {
              const atraso = Math.min(indice++, 8) * 30;
              const emBreve = comFonte !== null && !comFonte.has(n.chave);
              return (
                <CardNutriente
                  key={n.chave}
                  n={n}
                  atraso={atraso}
                  emBreve={emBreve}
                  onPress={() => navigation.navigate('NutrienteDetalhe', { nutriente: n.chave })}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>

      <QuickActionsMenu aberto={menuAberto} onFechar={() => setMenuAberto(false)} onSelecionar={handleSelecionarAcao} />
      <HomeBottomBar activeTab="alimentacao" menuAberto={menuAberto} onAbrirMenu={() => setMenuAberto((v) => !v)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  tituloBloco: { flex: 1, alignItems: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark, textAlign: 'center' },
  subtitulo: { fontFamily: typography.regular, fontSize: 13, color: vit.textoSuave, textAlign: 'center', marginTop: 2 },
  conteudo: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 20 },
  secao: { gap: 10 },
  secaoTitulo: { fontFamily: typography.bold, fontSize: 14, color: vit.textoSuave },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: vit.borda, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16,
  },
  cardPressionado: { backgroundColor: vit.fundoSuave, borderColor: vit.destaque },
  cardEsquerda: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardTextos: { flex: 1 },
  cardTexto: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  cardResumo: { fontFamily: typography.regular, fontSize: 12, color: colors.textoSuave, marginTop: 2 },
  abas: { flexDirection: 'row', gap: 6, backgroundColor: colors.superficieSuave2, borderRadius: 14, padding: 4 },
  aba: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  abaAtiva: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.bordaSuave },

  abaTexto: { fontFamily: typography.semiBold, fontSize: 13, color: colors.textoSuave },
  abaTextoAtiva: { fontFamily: typography.bold, color: colors.primaryDark },
  emBreve: { backgroundColor: vit.fundoSuave, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 },
  emBreveTexto: { fontFamily: typography.bold, fontSize: 11, color: vit.textoSuave },
  botao: { width: 26, height: 26, borderRadius: 13, backgroundColor: vit.destaque, alignItems: 'center', justifyContent: 'center' },
});
