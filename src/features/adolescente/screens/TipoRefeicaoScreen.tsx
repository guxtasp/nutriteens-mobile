// src/features/adolescente/screens/TipoRefeicaoScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../shared/ui/AppText';
import { BackButton } from '../../../shared/ui/BackButton';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import HomeBottomBar from '../components/HomeBottomBar';
import QuickActionsMenu from '../components/QuickActionsMenu';
import type { TipoRefeicao } from '../services/alimentacaoService';
import GuiaAlimentacaoSheet from '../components/GuiaAlimentaçãoSheet';
import { ICONE_POR_TIPO_REFEICAO } from '../utils/refeicaoInfo';


type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'TipoRefeicao'>;

const REFEICOES: { tipo: TipoRefeicao; nome: string }[] = [
  { tipo: 'CAFE_DA_MANHA', nome: 'Café' },
  { tipo: 'LANCHE_MANHA', nome: 'Lanche da manhã' },
  { tipo: 'ALMOCO', nome: 'Almoço' },
  { tipo: 'LANCHE_TARDE', nome: 'Lanche da Tarde' },
  { tipo: 'JANTAR', nome: 'Jantar' },
  { tipo: 'CEIA', nome: 'Ceia' },
];
export default function TipoRefeicaoScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [menuAberto, setMenuAberto] = useState(false);
  const [sheetGuia, setSheetGuia] = useState(false);

  function selecionar(item: (typeof REFEICOES)[number]) {
    navigation.navigate('MetodoRegistroAlimentar', { tipo: item.tipo, nomeRefeicao: item.nome });
  }

  // mesmo tratamento de seleção usado na Home — mantém consistente caso o
  // usuário abra o menu rápido de novo a partir desta tela
  function handleSelecionarAcao(opcao: 'alimentacao' | 'agua' | 'atividade') {
    setMenuAberto(false);
    if (opcao === 'atividade') navigation.navigate('AtividadeFisica');
    else if (opcao === 'agua') navigation.navigate('ConsumoAgua');
    else if (opcao === 'alimentacao') navigation.navigate('TipoRefeicao');
  }

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.cabecalho}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.tituloBloco}>
          <AppText style={styles.titulo}>Alimentação</AppText>
          <AppText style={styles.subtitulo}>Diga pra gente: o que comeu agora?</AppText>
        </View>
      </View>

      <View style={styles.corpo}>
        <View style={styles.perguntaLinha}>
          <AppText style={styles.pergunta}>Qual você vai registrar agora?</AppText>
          <Pressable onPress={() => setSheetGuia(true)} hitSlop={8}>
            <Ionicons name="information-circle" size={25} color="#8BC34A" />
          </Pressable>
        </View>

        <FlatList
          data={REFEICOES}
          keyExtractor={(item) => item.tipo}
          contentContainerStyle={{ gap: 14 }}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => selecionar(item)}>
              <View style={styles.cardEsquerda}>
                <Ionicons name={ICONE_POR_TIPO_REFEICAO[item.tipo]} size={20} color={colors.primaryDark} />
                <AppText style={styles.cardTexto}>{item.nome}</AppText>
              </View>
              <View style={styles.botaoAdicionar}>
                <Ionicons name="add" size={18} color="#fff" />
              </View>
            </Pressable>
          )}
        />
      </View>

      <QuickActionsMenu
        aberto={menuAberto}
        onFechar={() => setMenuAberto(false)}
        onSelecionar={handleSelecionarAcao}
      />
      <HomeBottomBar activeTab="alimentacao" menuAberto={menuAberto} onAbrirMenu={() => setMenuAberto((v) => !v)} />
    <GuiaAlimentacaoSheet visivel={sheetGuia} onFechar={() => setSheetGuia(false)} />
      <QuickActionsMenu
        aberto={menuAberto}
        onFechar={() => setMenuAberto(false)}
        onSelecionar={handleSelecionarAcao}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white ?? '#fff' },
  cabecalho: { marginTop: 30, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 12 },
  tituloBloco: { flex: 1, alignItems: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark, textAlign: 'center' },
  subtitulo: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', textAlign: 'center', marginTop: 2 },
  corpo: { flex: 1, paddingHorizontal: 24, paddingTop: 12, },
  perguntaLinha: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, justifyContent: 'center' },
  pergunta: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark, flexShrink: 1 },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: '#D9E2E8', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  cardEsquerda: { flexDirection: 'row', alignItems: 'center', gap: 12,  },
  cardTexto: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  botaoAdicionar: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#8BC34A', alignItems: 'center', justifyContent: 'center' },
});