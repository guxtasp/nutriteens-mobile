// src/features/adolescente/components/EmBreveTab.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { AdolescenteStackParamList } from '../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import HomeBottomBar, { HomeTabKey } from './HomeBottomBar';
import QuickActionsMenu from './QuickActionsMenu';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList>;

interface Props {
  activeTab: HomeTabKey;
  titulo: string;
  subtitulo: string;
  icone: keyof typeof Ionicons.glyphMap;
}

// Aviso "em breve" como conteúdo normal da página (não é modal/popup) —
// usado nas abas que ainda não têm funcionalidade própria.
export function EmBreveTab({ activeTab, titulo, subtitulo, icone }: Props) {
  const navigation = useNavigation<NavigationProp>();
  const [menuAberto, setMenuAberto] = useState(false);

  function handleSelecionarAcao(opcao: 'alimentacao' | 'agua' | 'atividade') {
    setMenuAberto(false);
    if (opcao === 'atividade') navigation.navigate('AtividadeFisica');
    else if (opcao === 'agua') navigation.navigate('ConsumoAgua');
    else if (opcao === 'alimentacao') navigation.navigate('TipoRefeicao');
  }

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.conteudo}>
        <View style={styles.iconeCirculo}>
          <Ionicons name={icone} size={32} color={colors.primary} />
        </View>
        <AppText style={styles.titulo}>{titulo}</AppText>
        <AppText style={styles.subtitulo}>{subtitulo}</AppText>
      </View>

      <QuickActionsMenu aberto={menuAberto} onFechar={() => setMenuAberto(false)} onSelecionar={handleSelecionarAcao} />
      <HomeBottomBar activeTab={activeTab} menuAberto={menuAberto} onAbrirMenu={() => setMenuAberto((v) => !v)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white ?? '#fff' },
  conteudo: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  iconeCirculo: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#EAF6D9', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  titulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark, textAlign: 'center' },
  subtitulo: { fontFamily: typography.regular, fontSize: 13, color: '#7A8B94', textAlign: 'center', marginTop: 6, lineHeight: 19 },
});
