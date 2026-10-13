// src/features/adolescente/vitaminas/screens/VitaminasScreen.tsx
// RF016 — lista de vitaminas e minerais. Tocar abre a página do nutriente.
import React, { useState } from 'react';
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
import HomeBottomBar from '../../_shared/components/HomeBottomBar';
import QuickActionsMenu from '../../_shared/components/QuickActionsMenu';
import { NUTRIENTES_INFO, NutrienteInfo } from '../data/nutrientesInfo';

type Nav = NativeStackNavigationProp<AdolescenteStackParamList, 'Vitaminas'>;

const SECOES: { titulo: string; tipo: NutrienteInfo['tipo'] }[] = [
  { titulo: 'Vitaminas', tipo: 'VITAMINA' },
  { titulo: 'Minerais', tipo: 'MINERAL' },
];

export default function VitaminasScreen() {
  const navigation = useNavigation<Nav>();
  const [menuAberto, setMenuAberto] = useState(false);

  function handleSelecionarAcao(opcao: 'alimentacao' | 'agua' | 'atividade') {
    setMenuAberto(false);
    if (opcao === 'atividade') navigation.navigate('AtividadeFisica');
    else if (opcao === 'agua') navigation.navigate('ConsumoAgua');
    else navigation.navigate('TipoRefeicao');
  }

  let indice = 0; // atraso da animação continua entre as seções

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.cabecalho}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.tituloBloco}>
          <AppText style={styles.titulo}>Vitaminas e minerais</AppText>
          <AppText style={styles.subtitulo}>Escolha uma para saber mais</AppText>
        </View>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        {SECOES.map((secao) => (
          <View key={secao.tipo} style={styles.secao}>
            <AppText style={styles.secaoTitulo}>{secao.titulo}</AppText>
            {NUTRIENTES_INFO.filter((n) => n.tipo === secao.tipo).map((n) => {
              const atraso = Math.min(indice++, 10) * 50;
              return (
                <MotiView
                  key={n.chave}
                  from={{ opacity: 0, translateY: 16 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 300, delay: atraso }}
                >
                  <Pressable
                    style={({ pressed }) => [styles.card, pressed && styles.pressionado]}
                    onPress={() => navigation.navigate('NutrienteDetalhe', { nutriente: n.chave })}
                    accessibilityRole="button"
                    accessibilityLabel={n.nome}
                  >
                    <View style={styles.cardEsquerda}>
                      <View style={styles.simbolo}><AppText style={styles.simboloTexto}>{n.simbolo}</AppText></View>
                      <AppText style={styles.cardTexto}>{n.nome}</AppText>
                    </View>
                    <View style={styles.botao}><Ionicons name="chevron-forward" size={18} color="#fff" /></View>
                  </Pressable>
                </MotiView>
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
  subtitulo: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', textAlign: 'center', marginTop: 2 },
  conteudo: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 20 },
  secao: { gap: 10 },
  secaoTitulo: { fontFamily: typography.bold, fontSize: 14, color: '#7A8B94' },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: '#D9E2E8', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16,
  },
  pressionado: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  cardEsquerda: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  simbolo: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F0F5F1', alignItems: 'center', justifyContent: 'center' },
  simboloTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  cardTexto: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark, flex: 1 },
  botao: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#8BC34A', alignItems: 'center', justifyContent: 'center' },
});
