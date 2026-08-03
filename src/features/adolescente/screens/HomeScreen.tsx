// src/features/adolescente/screens/HomeScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../navigation/AdolescenteNavigator';
import HomeHeader from '../components/HomeHeader';
import WeekDaySelector from '../components/WeekDaySelector';
import WaterProgressCard from '../components/WaterProgressCard';
import QuickActionsMenu from '../components/QuickActionsMenu';
import ChatFab from '../components/ChatFab';
import HomeBottomBar from '../components/HomeBottomBar';
import { useSemanaAtual } from '../hooks/useSemanaAtual';
import { calcularStatusDia, DiaSemana } from '../types/statusDia';
import { colors } from '../../../shared/theme/colors';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { useAguaHoje } from '../hooks/useAguaHoje';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { dias, hojeISO } = useSemanaAtual();
  const [menuAberto, setMenuAberto] = useState(false);
  const { nomeCompleto } = useAuth();
  const primeiroNome = nomeCompleto?.trim().split(' ')[0] ?? 'Usuário';
  const { mlHoje, metaMl } = useAguaHoje();
  const diasComStatus: DiaSemana[] = dias.map((dia) => ({
    ...dia,
    status: calcularStatusDia({ data: dia.data, hojeISO }),
  }));

  function handleSelecionarAcao(opcao: 'alimentacao' | 'agua' | 'atividade') {
    setMenuAberto(false);
    if (opcao === 'atividade') {
      navigation.navigate('AtividadeFisica');
    }
    else if (opcao === 'agua') {
      navigation.navigate('ConsumoAgua');
    }
    else if (opcao === 'alimentacao') {
      navigation.navigate('TipoRefeicao');
    }
  }

  return (
    <SafeAreaView style={styles.tela}>
      <HomeHeader nome={primeiroNome} pontos={20} />
      <WeekDaySelector dias={diasComStatus} />

      <WaterProgressCard mlAtual={mlHoje} mlMeta={metaMl} />

      <View style={{ flex: 1 }} />

      {!menuAberto && <ChatFab />}
      <QuickActionsMenu
        aberto={menuAberto}
        onFechar={() => setMenuAberto(false)}
        onSelecionar={handleSelecionarAcao}
      />
      <HomeBottomBar menuAberto={menuAberto} onAbrirMenu={() => setMenuAberto((v) => !v)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: {
    marginTop: 16,
    marginBottom: 8,
    flex: 1,
    backgroundColor: colors.white ?? '#A9C7B8',
  },
});