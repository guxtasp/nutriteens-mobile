// src/features/adolescente/components/EmptyTab.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { colors } from '../../../../shared/theme/colors';
import HomeBottomBar, { HomeTabKey } from './HomeBottomBar';
import QuickActionsMenu from './QuickActionsMenu';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList>;

interface Props {
  activeTab: HomeTabKey;
}

// Casca reaproveitável pras abas que ainda não têm conteúdo (Trilha, Social,
// Mais). De propósito sem texto/ícone de "em breve" — fica vazia mesmo, só
// com a bottom bar e o menu rápido já funcionando, até o conteúdo real
// dessa aba ser definido.
export function EmptyTab({ activeTab }: Props) {
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
      <View style={styles.conteudo} />

      <QuickActionsMenu aberto={menuAberto} onFechar={() => setMenuAberto(false)} onSelecionar={handleSelecionarAcao} />
      <HomeBottomBar activeTab={activeTab} menuAberto={menuAberto} onAbrirMenu={() => setMenuAberto((v) => !v)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white ?? '#fff' },
  conteudo: { flex: 1 },
});
