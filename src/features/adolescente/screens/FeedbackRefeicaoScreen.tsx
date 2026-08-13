// src/features/adolescente/screens/FeedbackRefeicaoScreen.tsx
import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../shared/ui/AppText';
import { BroxisMascot } from '../../../shared/ui/BroxisMascot';
import { typography } from '../../../shared/theme/typography';
import { ICONE_POR_TIPO_REFEICAO } from '../utils/refeicaoInfo';
import type { NivelQualidade } from '../utils/regraFeedbackRefeicao';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'FeedbackRefeicao'>;
type RouteProps = RouteProp<AdolescenteStackParamList, 'FeedbackRefeicao'>;

type ConteudoNivel = { titulo: string; pose: 'aceno' | 'apresentando' | 'pensando' | 'orgulhoso' | 'supercontente' | 'surpresoPositivo' | 'curioso' | 'calmo'; particulas: boolean; destaque: string };

// Cada nível reage com uma pose diferente do Bróxis, e dentro do nível a
// `intensidade` (-1 = tudo ultraprocessado, 1 = tudo in natura) escolhe QUAL
// expressão usar — 8 poses no total, então a cara muda de verdade conforme a
// composição daquela refeição, não só a fala. Nenhuma delas é uma pose
// triste/de reprovação de propósito — mesmo no nível de atenção, a reação é
// "curioso"/"pensando", nunca "julgando".
function escolherConteudo(nivelQualidade: NivelQualidade, intensidade: number): ConteudoNivel {
  if (nivelQualidade === 'EXCELENTE') {
    return intensidade >= 0.85
      ? { titulo: 'Uau, quase tudo natural!', pose: 'supercontente', particulas: true, destaque: '#8BC34A' }
      : { titulo: 'Mandou muito bem nessa!', pose: 'orgulhoso', particulas: true, destaque: '#8BC34A' };
  }
  if (nivelQualidade === 'EQUILIBRADO') {
    return intensidade >= 0.1
      ? { titulo: 'Boa! Puxando pro lado natural', pose: 'surpresoPositivo', particulas: false, destaque: '#F3E3B8' }
      : { titulo: 'Boa! Seguimos evoluindo', pose: 'calmo', particulas: false, destaque: '#F3E3B8' };
  }
  return intensidade <= -0.8
    ? { titulo: 'Valeu por registrar, vamos juntos nessa', pose: 'curioso', particulas: false, destaque: '#F3E3B8' }
    : { titulo: 'Valeu por registrar!', pose: 'pensando', particulas: false, destaque: '#F3E3B8' };
}

export default function FeedbackRefeicaoScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { params } = useRoute<RouteProps>();
  const conteudo = escolherConteudo(params.nivelQualidade, params.intensidade);

  function continuar() {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }));
  }

  return (
    <SafeAreaView style={styles.tela}>
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350 }}
        >
          <BroxisMascot size={92} pose={conteudo.pose} entrance="pulo" showParticles={conteudo.particulas} />
        </MotiView>

        <View style={styles.iconeTipoRefeicao}>
          <Ionicons name={ICONE_POR_TIPO_REFEICAO[params.tipo]} size={16} color="#8BC34A" />
          <AppText style={styles.nomeRefeicao}>{params.nomeRefeicao}</AppText>
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 12, scale: 0.9 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 350, delay: 150 }}
          style={[styles.pillTitulo, { backgroundColor: conteudo.destaque }]}
        >
          <AppText style={styles.titulo}>{conteudo.titulo}</AppText>
        </MotiView>

        {/* Trilha de processamento (NOVA): avaliativa, sempre presente,
            visual "de resultado" (borda verde, caixa translúcida) */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350, delay: 280 }}
          style={styles.cartao}
        >
          <AppText style={styles.rotuloCartao}>Como foi essa refeição</AppText>
          <AppText style={styles.textoCartao}>{params.processamento}</AppText>
          <View style={styles.divisor} />
          <AppText style={styles.textoCartao}>{params.nutricional}</AppText>
          <View style={styles.divisor} />
          <AppText style={[styles.textoCartao, styles.textoDica]}>{params.melhoria}</AppText>
        </MotiView>

        {/* Trilha de missão (lacuna de nutriente na semana): só aparece quando
            há convite — visual propositalmente diferente do cartão acima
            (fundo sólido claro, selo), pra não ler como mais uma "nota" */}
        {params.missao && (
          <MotiView
            from={{ opacity: 0, translateY: 12, scale: 0.96 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: 'timing', duration: 350, delay: 430 }}
            style={styles.cartaoMissao}
          >
            <View style={styles.seloMissao}>
              <Ionicons name="sparkles" size={16} color="#1F5138" />
            </View>
            <AppText style={styles.rotuloMissao}>{params.missao.titulo}</AppText>
            <AppText style={styles.textoMissao}>{params.missao.texto}</AppText>
          </MotiView>
        )}
      </ScrollView>

      <Pressable style={styles.botaoContinuar} onPress={continuar}>
        <AppText style={styles.botaoTexto}>CONTINUAR</AppText>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#1F5138', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },
  conteudo: { alignItems: 'center', paddingBottom: 12 },
  iconeTipoRefeicao: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, marginBottom: 6 },
  nomeRefeicao: { fontFamily: typography.medium, fontSize: 13, color: '#D9E8CE' },
  pillTitulo: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 6,
    marginBottom: 22,
  },
  titulo: {
    fontFamily: typography.bold,
    fontSize: 17,
    color: '#1F5138',
    textAlign: 'center',
  },
  cartao: {
    width: '100%',
    borderRadius: 18,
    padding: 18,
    backgroundColor: 'rgba(139,195,74,0.08)',
    borderWidth: 1.5,
    borderColor: '#8BC34A',
    marginBottom: 14,
  },
  rotuloCartao: {
    fontFamily: typography.bold,
    fontSize: 11,
    color: '#8BC34A',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  textoCartao: { fontFamily: typography.medium, fontSize: 13, color: '#EAF3E1', lineHeight: 19 },
  textoDica: { color: '#F3E3B8' },
  divisor: { height: 1, backgroundColor: 'rgba(139,195,74,0.25)', marginVertical: 10 },
  cartaoMissao: {
    width: '100%',
    borderRadius: 18,
    padding: 18,
    backgroundColor: '#F3E3B8',
    marginBottom: 4,
  },
  seloMissao: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rotuloMissao: { fontFamily: typography.bold, fontSize: 13, color: '#1F5138', marginBottom: 6 },
  textoMissao: { fontFamily: typography.medium, fontSize: 13, color: '#3A5137', lineHeight: 19 },
  botaoContinuar: { backgroundColor: '#fff', borderRadius: 24, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  botaoTexto: { fontFamily: typography.bold, fontSize: 13, color: '#1F5138', letterSpacing: 0.5 },
});
