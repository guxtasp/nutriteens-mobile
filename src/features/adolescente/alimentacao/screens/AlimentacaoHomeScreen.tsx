// src/features/adolescente/alimentacao/screens/AlimentacaoHomeScreen.tsx
// Aba "Alternativas" (módulo Comer): hub no mesmo estilo da tela de registrar alimentação.
//  - Vitaminas e minerais (RF016, fase 3)  - Scanner de alimentos (RF013/RF022, fase 4)
//  - Alternativas alimentares / trocas (RF015, fase 1) -> SugestoesAlimentares
import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { InfoSheet } from '../../../../shared/ui/InfoSheet';
import { colors } from '../../../../shared/theme/colors';
import { layout } from '../../../../shared/theme/layout';
import { typography } from '../../../../shared/theme/typography';
import CartaoHub from '../components/CartaoHub';
import CartaoJogo from '../../jogos/components/CartaoJogo';
import HomeBottomBar from '../../_shared/components/HomeBottomBar';
import TabHeader from '../../_shared/components/TabHeader';
import QuickActionsMenu from '../../_shared/components/QuickActionsMenu';

type Nav = NativeStackNavigationProp<AdolescenteStackParamList, 'Alimentacao'>;

type Item = {
  key: 'vitaminas' | 'scanner' | 'alternativas' | 'receitas' | 'jogos';
  nome: string;
  descricao: string;
  icone: string;                 // MaterialCommunityIcons
  tags: string[];
  emBreve: boolean;
  info: { titulo: string; icone: keyof typeof Ionicons.glyphMap; explicacao: string; exemplo?: string };
};

const ITENS: Item[] = [
  {
    key: 'vitaminas',
    nome: 'Vitaminas',
    descricao: 'Para que serve cada uma e onde encontrar',
    icone: 'food-apple-outline',
    tags: ['NUTRIENTES', 'DISPONÍVEL'],
    emBreve: false,
    info: {
      titulo: 'Vitaminas e minerais',
      icone: 'nutrition',
      explicacao: 'Está com falta de vitaminas? Conheça a função de cada vitamina e mineral no seu corpo e descubra alimentos que podem ajudar a complementar sua alimentação.',
      exemplo: 'Vitamina C, ferro, cálcio...',
    },
  },
  {
    key: 'scanner',
    nome: 'Scanner',
    descricao: 'Aponte a câmera para um produto',
    icone: 'barcode-scan',
    tags: ['CÂMERA', 'DISPONÍVEL'],
    emBreve: false,
    info: {
      titulo: 'Scanner de alimentos',
      icone: 'scan',
      explicacao: 'Aponte a câmera para o código de barras de um produto e veja se ele é uma boa escolha. Quando não for, a gente sugere alternativas.',
    },
  },
  {
    key: 'alternativas',
    nome: 'Alternativas',
    descricao: 'Ideias de trocas mais saudáveis',
    icone: 'swap-horizontal-bold',
    tags: ['TROCAS', 'DISPONÍVEL'],
    emBreve: false,
    info: {
      titulo: 'Alternativas alimentares',
      icone: 'swap-horizontal',
      explicacao: 'Ideias de trocas mais saudáveis e fáceis de achar para refrigerantes, doces, salgadinhos, embutidos e outros ultraprocessados.',
      exemplo: 'Bebidas, doces, lanches, refeições...',
    },
  },
  {
    key: 'receitas',
    nome: 'Receitas',
    descricao: 'Receitas com o que você tem em casa',
    icone: 'chef-hat',
    tags: ['RECEITAS', 'DISPONÍVEL'],
    emBreve: false,
    info: {
      titulo: 'Receitas com o que tenho',
      icone: 'restaurant',
      explicacao: 'Conte o que você tem em casa e a gente mostra receitas simples com esses ingredientes, avisando o que ainda falta em cada uma.',
      exemplo: 'Ovo, banana, arroz, feijão...',
    },
  },
  {
    key: 'jogos',
    nome: 'Jogos',
    descricao: 'Aprenda jogando',
    icone: 'gamepad-variant-outline',
    tags: ['JOGOS', 'DISPONÍVEL'],
    emBreve: false,
    info: {
      titulo: 'Jogos',
      icone: 'game-controller',
      explicacao: 'Jogos rápidos para aprender a reconhecer alimentos in natura, processados e ultraprocessados. Sem nota e sem pressa.',
      exemplo: 'Classificar NOVA',
    },
  },
];

export default function AlimentacaoHomeScreen() {
  const navigation = useNavigation<Nav>();
  const [menuAberto, setMenuAberto] = useState(false);
  const [info, setInfo] = useState<Item['info'] | null>(null);

  function handleSelecionarAcao(opcao: 'alimentacao' | 'agua' | 'atividade') {
    setMenuAberto(false);
    if (opcao === 'atividade') navigation.navigate('AtividadeFisica');
    else if (opcao === 'agua') navigation.navigate('ConsumoAgua');
    else navigation.navigate('TipoRefeicao');
  }

  function abrir(item: Item) {
    if (item.key === 'alternativas') navigation.navigate('SugestoesAlimentares');
    else if (item.key === 'scanner') navigation.navigate('ScannerAlimento');
    else if (item.key === 'vitaminas') navigation.navigate('Vitaminas');
    else if (item.key === 'receitas') navigation.navigate('ReceitasIngredientes');
    else if (item.key === 'jogos') navigation.navigate('Jogos');
  }

  return (
    <SafeAreaView style={styles.tela}>
      <TabHeader titulo="Comer" />
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <AppText style={styles.pergunta}>O que você quer conhecer?</AppText>

        {ITENS.map((item, i) => item.key === 'jogos' ? (
          <CartaoJogo
            key={item.key}
            titulo={item.nome}
            subtitulo={item.descricao}
            atraso={i * 90}
            onPress={() => abrir(item)}
            onInfo={() => setInfo(item.info)}
          />
        ) : (
          <CartaoHub
            key={item.key}
            tags={item.tags}
            titulo={item.nome}
            subtitulo={item.descricao}
            icone={item.icone}
            ativo={!item.emBreve}
            onPress={() => abrir(item)}
            onInfo={() => setInfo(item.info)}
            atraso={i * 90}
          />
        ))}
      </ScrollView>

      <QuickActionsMenu aberto={menuAberto} onFechar={() => setMenuAberto(false)} onSelecionar={handleSelecionarAcao} />
      <HomeBottomBar activeTab="alimentacao" menuAberto={menuAberto} onAbrirMenu={() => setMenuAberto((v) => !v)} />
      <InfoSheet
        visivel={info !== null}
        onFechar={() => setInfo(null)}
        titulo={info?.titulo ?? ''}
        icone={info?.icone}
        explicacao={info?.explicacao ?? ''}
        exemplo={info?.exemplo}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  conteudo: { paddingHorizontal: layout.margemH, paddingBottom: 120, gap: 16 },
  pergunta: { fontFamily: typography.regular, fontSize: 13, color: '#7A8B94', marginBottom: 2 },
});
