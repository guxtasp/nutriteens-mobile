// src/features/adolescente/jogos/screens/JogosScreen.tsx
// Hub de jogos do módulo Comer. Novos jogos entram na lista JOGOS.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { BackButton } from '../../../../shared/ui/BackButton';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import CartaoJogo from '../components/CartaoJogo';

type Nav = NativeStackNavigationProp<AdolescenteStackParamList, 'Jogos'>;

const JOGOS: { rota: 'JogoNova' | 'JogoMemoria'; nome: string; descricao: string; icone: string; tags: string[] }[] = [
  {
    rota: 'JogoNova',
    nome: 'Classificar NOVA',
    descricao: 'In natura, processado ou ultraprocessado?',
    icone: 'food-variant',
    tags: ['JOGO', 'ULTRAPROCESSADOS'],
  },
  {
    rota: 'JogoMemoria',
    nome: 'Memória dos nutrientes',
    descricao: 'Encontre o alimento que é fonte de cada vitamina',
    icone: 'cards',
    tags: ['JOGO', 'NUTRIENTES'],
  },
];

export default function JogosScreen() {
  const navigation = useNavigation<Nav>();
  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.cabecalho}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.tituloBloco}>
          <AppText style={styles.titulo}>Jogos</AppText>
          <AppText style={styles.subtitulo}>Aprenda jogando, sem pressa e sem nota</AppText>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        {JOGOS.map((j, i) => (
          <CartaoJogo
            key={j.rota}
            titulo={j.nome}
            subtitulo={j.descricao}
            icone={j.icone}
            onPress={() => navigation.navigate(j.rota)}
            atraso={i * 90}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  cabecalho: { marginTop: 30, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 12 },
  tituloBloco: { flex: 1, alignItems: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark, textAlign: 'center' },
  subtitulo: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', textAlign: 'center', marginTop: 2 },
  conteudo: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60, gap: 16 },
});