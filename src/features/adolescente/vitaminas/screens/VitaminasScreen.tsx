// src/features/adolescente/vitaminas/screens/VitaminasScreen.tsx
// RF016 — lista de vitaminas e minerais. Tocar abre a página do nutriente.
import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { BackButton } from '../../../../shared/ui/BackButton';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useAcoesRapidas, AcaoRapida } from '../../_shared/hooks/useAcoesRapidas';
import HomeBottomBar from '../../_shared/components/HomeBottomBar';
import QuickActionsMenu from '../../_shared/components/QuickActionsMenu';
import { NUTRIENTES_INFO, NutrienteInfo } from '../data/nutrientesInfo';
import { buscarNutrientesComFonte } from '../services/fontesService';
import type { NutrienteChave } from '../../alimentacao/utils/nutrientesPorGrupo';
import { vit } from '../ui/tokens';
import { SimboloLista } from '../components/SimboloAnimado';
import * as Haptics from 'expo-haptics';

type Nav = NativeStackNavigationProp<AdolescenteStackParamList, 'Vitaminas'>;

const SECOES: { titulo: string; tipo: NutrienteInfo['tipo'] }[] = [
  { titulo: 'Vitaminas', tipo: 'VITAMINA' },
  { titulo: 'Minerais', tipo: 'MINERAL' },
];

function CardNutriente({ n, atraso, emBreve, onPress }: { n: NutrienteInfo; atraso: number; emBreve: boolean; onPress: () => void }) {
  const [pressionado, setPressionado] = useState(false);
  return (
    <MotiView
      from={{ opacity: 0, translateY: 24, scale: 0.92 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 14, stiffness: 160, delay: atraso }}
    >
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.pressionado]}
        onPressIn={() => { setPressionado(true); Haptics.selectionAsync().catch(() => {}); }}
        onPressOut={() => setPressionado(false)}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={emBreve ? `${n.nome}, alimentos em breve` : n.nome}
        accessibilityHint="Abre a página do nutriente"
      >
        <View style={styles.cardEsquerda}>
          <SimboloLista simbolo={n.simbolo} fase={(atraso / 50) * 120} pressionado={pressionado} />
          <AppText style={styles.cardTexto}>{n.nome}</AppText>
        </View>
        {emBreve && <View style={styles.emBreve}><AppText style={styles.emBreveTexto}>Em breve</AppText></View>}
        <MotiView
          animate={{ translateX: pressionado ? 4 : 0 }}
          transition={{ type: 'spring', damping: 10, stiffness: 250 }}
          style={styles.botao}
        >
          <Ionicons name="chevron-forward" size={18} color={vit.texto} />
        </MotiView>
      </Pressable>
    </MotiView>
  );
}

export default function VitaminasScreen() {
  const navigation = useNavigation<Nav>();
  const [menuAberto, setMenuAberto] = useState(false);
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
    <SafeAreaView style={styles.tela}>
      <View style={styles.cabecalho}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.tituloBloco}>
          <AppText style={styles.titulo} accessibilityRole="header">Vitaminas e minerais</AppText>
          <AppText style={styles.subtitulo}>Escolha uma para saber mais</AppText>
        </View>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        {SECOES.map((secao) => (
          <View key={secao.tipo} style={styles.secao}>
            <AppText style={styles.secaoTitulo} accessibilityRole="header">{secao.titulo}</AppText>
            {NUTRIENTES_INFO.filter((n) => n.tipo === secao.tipo).map((n) => {
              const atraso = Math.min(indice++, 10) * 50;
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
  cabecalho: { marginTop: 30, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 12 },
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
  pressionado: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  cardEsquerda: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardTexto: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark, flex: 1 },
  emBreve: { backgroundColor: vit.fundoSuave, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 },
  emBreveTexto: { fontFamily: typography.bold, fontSize: 11, color: vit.textoSuave },
  botao: { width: 26, height: 26, borderRadius: 13, backgroundColor: vit.destaque, alignItems: 'center', justifyContent: 'center' },
});
