// src/features/adolescente/vitaminas/screens/TesteNutrienteScreen.tsx
//
// "Teste rápido" de um nutriente (HANDOFF_REBRAND, fase 4.3): 3 perguntas, sem nota. A opção
// escolhida que não era a certa fica amarela ("Quase!") e a certa fica verde; nunca "errado".
// O XP vem por terminar (qualquer resultado), 1x por nutriente, conferido pelo servidor.
import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { ProgressBar } from '../../../../shared/ui/ProgressBar';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useReduzirMovimento } from '../../../../shared/hooks/useReduzirMovimento';
import { concederXp } from '../../../../shared/services/xpService';
import * as Haptics from '../../../../shared/audio/haptics';
import { infoDoNutriente } from '../data/nutrientesInfo';
import { APOIO_TESTE, TITULO_ACERTO, TITULO_QUASE } from '../data/perguntasNutriente';
import { estadoDaOpcao, nomeEmFrase, perguntasDoNutriente } from '../utils/testeRapido';

type Props = NativeStackScreenProps<AdolescenteStackParamList, 'TesteNutriente'>;

const AVATAR = require('../../../../../assets/img/feedback/supercontente.png');

export default function TesteNutrienteScreen({ navigation, route }: Props) {
  const { nutriente } = route.params;
  const insets = useSafeAreaInsets();
  const reduzirMovimento = useReduzirMovimento();
  const info = infoDoNutriente(nutriente);
  const perguntas = useMemo(() => perguntasDoNutriente(nutriente), [nutriente]);

  const [indice, setIndice] = useState(0);
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const [terminou, setTerminou] = useState(false);
  const [xp, setXp] = useState(0);

  if (!info || !perguntas) {
    return (
      <SafeAreaView style={styles.tela}>
        <AppText style={styles.vazio}>Esse teste não está disponível.</AppText>
        <AppButton label="VOLTAR" onPress={() => navigation.goBack()} style={styles.voltarVazio} />
      </SafeAreaView>
    );
  }

  const pergunta = perguntas[indice];
  const respondeu = escolhida !== null;
  const acertou = escolhida === pergunta.certa;
  const progresso = terminou ? 1 : (indice + (respondeu ? 1 : 0)) / perguntas.length;

  function escolher(opcao: string) {
    if (respondeu) return;
    setEscolhida(opcao);
    if (opcao === pergunta.certa) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else void Haptics.selectionAsync(); // sem vibração de "erro"
  }

  async function continuar() {
    if (indice < perguntas!.length - 1) {
      setIndice((i) => i + 1);
      setEscolhida(null);
      return;
    }
    setTerminou(true);
    try {
      setXp(await concederXp('teste_nutriente', nutriente));
    } catch (e) {
      console.warn('XP do teste rápido não concedido:', e);
    }
  }

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <View style={styles.topo}>
        <Pressable onPress={() => navigation.goBack()} style={styles.fechar} accessibilityRole="button" accessibilityLabel="Fechar o teste">
          <Ionicons name="close" size={24} color={colors.primaryDark} />
        </Pressable>
        <View style={styles.flex} accessible accessibilityLabel={`Pergunta ${Math.min(indice + 1, perguntas.length)} de ${perguntas.length}`}>
          <ProgressBar progress={progresso} />
        </View>
      </View>

      {terminou ? (
        <MotiView
          from={reduzirMovimento ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          style={[styles.fim, { paddingBottom: 16 + insets.bottom }]}
          accessibilityLiveRegion="polite"
        >
          <Image source={AVATAR} style={styles.avatarFim} accessibilityElementsHidden importantForAccessibility="no" />
          <AppText style={styles.fimTitulo} accessibilityRole="header">
            Feito!
          </AppText>
          <AppText style={styles.fimTexto}>
            Você revisou {nomeEmFrase(info.nome)}. Volta quando quiser lembrar de novo.
          </AppText>
          {xp > 0 && (
            <View style={styles.xp} accessibilityLabel={`Você ganhou ${xp} XP`}>
              <Ionicons name="star-outline" size={16} color={colors.amareloTexto} />
              <AppText style={styles.xpTexto}>+{xp} XP</AppText>
            </View>
          )}
          <AppButton
            label="VOLTAR"
            backgroundColor={colors.primaryDark}
            textColor={colors.white}
            shadowColor={colors.primaryDarkShadow}
            onPress={() => navigation.goBack()}
            style={styles.botaoFim}
          />
        </MotiView>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.conteudo}>
            <View style={styles.selo}>
              <AppText style={styles.seloTexto}>TESTE RÁPIDO · {info.nome.toUpperCase()}</AppText>
            </View>
            <AppText style={styles.enunciado} accessibilityRole="header">
              {pergunta.enunciado}
            </AppText>
            <View style={styles.grade} accessibilityRole="radiogroup">
              {pergunta.opcoes.map((o) => {
                const estado = estadoDaOpcao(o, pergunta.certa, escolhida);
                return (
                  <Pressable
                    key={`${pergunta.id}:${o}`}
                    onPress={() => escolher(o)}
                    disabled={respondeu}
                    style={[
                      styles.opcao,
                      estado === 'certa' && styles.opcaoCerta,
                      estado === 'escolhidaOutra' && styles.opcaoOutra,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: o === escolhida, disabled: respondeu }}
                    accessibilityLabel={estado === 'certa' && respondeu ? `${o}, resposta certa` : o}
                  >
                    <AppText style={styles.opcaoTexto}>{o}</AppText>
                  </Pressable>
                );
              })}
            </View>
            {!respondeu && <AppText style={styles.apoio}>{APOIO_TESTE}</AppText>}
          </ScrollView>

          {respondeu && (
            <MotiView
              from={reduzirMovimento ? { opacity: 1 } : { opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 260 }}
              style={[styles.painel, acertou ? styles.painelAcerto : styles.painelQuase, { paddingBottom: 16 + insets.bottom }]}
              accessibilityLiveRegion="polite"
            >
              <View style={styles.painelLinha}>
                <Image source={AVATAR} style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no" />
                <View style={styles.flex}>
                  <AppText style={[styles.painelTitulo, { color: acertou ? colors.destaqueTexto : colors.amareloTexto }]}>
                    {acertou ? TITULO_ACERTO : TITULO_QUASE}
                  </AppText>
                  <AppText style={styles.painelTexto}>
                    {acertou ? pergunta.explicacao : `A marcada em verde é a certa. ${pergunta.explicacao}`}
                  </AppText>
                </View>
              </View>
              <AppButton
                label={indice < perguntas.length - 1 ? 'CONTINUAR' : 'TERMINAR'}
                backgroundColor={colors.primaryDark}
                textColor={colors.white}
                shadowColor={colors.primaryDarkShadow}
                onPress={continuar}
              />
            </MotiView>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  vazio: { fontFamily: typography.regular, fontSize: 15, color: colors.textoSuave, textAlign: 'center', margin: 32 },
  voltarVazio: { marginHorizontal: 24, width: undefined },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingTop: 4 },
  fechar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  conteudo: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24 },
  selo: {
    alignSelf: 'flex-start',
    backgroundColor: colors.exercicioAcertoFundo,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  seloTexto: { fontFamily: typography.bold, fontSize: 11, letterSpacing: 1, color: colors.destaqueTexto },
  enunciado: { fontFamily: typography.bold, fontSize: 24, lineHeight: 30, color: colors.primaryDark, marginTop: 14 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 22 },
  opcao: {
    flexBasis: '46%',
    flexGrow: 1,
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.bordaSuave,
    borderBottomWidth: 5,
    borderRadius: 18,
  },
  opcaoCerta: { backgroundColor: colors.exercicioAcertoFundo, borderColor: colors.primary },
  opcaoOutra: { backgroundColor: colors.amareloSuave, borderColor: colors.warning },
  opcaoTexto: { fontFamily: typography.bold, fontSize: 15, lineHeight: 20, color: colors.primaryDark, textAlign: 'center' },
  apoio: { fontFamily: typography.regular, fontSize: 13, color: colors.textoSuave, textAlign: 'center', marginTop: 18 },
  painel: { paddingHorizontal: 24, paddingTop: 20, borderTopLeftRadius: 26, borderTopRightRadius: 26, gap: 12 },
  painelAcerto: { backgroundColor: colors.exercicioAcertoFundo },
  painelQuase: { backgroundColor: colors.amareloSuave },
  painelLinha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  painelTitulo: { fontFamily: typography.bold, fontSize: 18 },
  painelTexto: { fontFamily: typography.regular, fontSize: 13, lineHeight: 19, color: colors.primaryDark, marginTop: 3 },
  fim: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  avatarFim: { width: 120, height: 120, borderRadius: 60 },
  fimTitulo: { fontFamily: typography.bold, fontSize: 28, color: colors.primaryDark },
  fimTexto: { fontFamily: typography.regular, fontSize: 15, lineHeight: 22, color: colors.textoCorrido, textAlign: 'center' },
  xp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.amareloSuave,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  xpTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.amareloTexto },
  botaoFim: { marginTop: 12 },
});
