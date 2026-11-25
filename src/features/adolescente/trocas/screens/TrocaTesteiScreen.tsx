// src/features/adolescente/trocas/screens/TrocaTesteiScreen.tsx
//
// "E aí, conseguiu testar?" (HANDOFF_REBRAND, fase 3.3): o Bróxis pergunta como foi uma troca
// guardada há 2+ dias. Qualquer resposta vale o mesmo XP (por responder, não por "acertar") e
// só serve para o Bróxis ajustar as sugestões; ninguém mais vê.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { SpeechBubble } from '../../../../shared/ui/SpeechBubble';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { useReduzirMovimento } from '../../../../shared/hooks/useReduzirMovimento';
import { ehErroDeRede } from '../../../../shared/offline/erroRede';
import * as Haptics from '../../../../shared/audio/haptics';
import CartaoHub from '../../alimentacao/components/CartaoHub';
import { Bloco } from '../components/TrocaDetalheSheet';
import {
  avaliarTroca,
  lerAdiamentosTestei,
  listarMinhasRespostas,
  listarTrocas,
  salvarAdiamentosTestei,
} from '../services/trocasService';
import { adiarAteAmanha, diasDesde, trocasGuardadas, type AvaliacaoTroca } from '../utils/avaliacaoTrocas';
import { iconeDoDestino } from '../utils/iconesTrocas';
import { noLugarDe, type Troca } from '../utils/trocas';
import {
  APOIO_TESTEI,
  ORDEM_TESTEI,
  PERGUNTA_TESTEI,
  PERGUNTA_TESTEI_RESPONDIDA,
  PRIVACIDADE_TESTEI,
  RETORNO_TESTEI,
} from '../data/textosTestei';

type Props = NativeStackScreenProps<AdolescenteStackParamList, 'TrocaTestei'>;

export default function TrocaTesteiScreen({ navigation, route }: Props) {
  const { trocaId } = route.params;
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const reduzirMovimento = useReduzirMovimento();

  const [troca, setTroca] = useState<Troca | null>(null);
  const [dias, setDias] = useState<number | null>(null);
  const [erroCarga, setErroCarga] = useState(false);
  const [escolha, setEscolha] = useState<AvaliacaoTroca | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [xpGanho, setXpGanho] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    Promise.all([listarTrocas(), listarMinhasRespostas()])
      .then(([lista, respostas]) => {
        if (!vivo) return;
        const t = lista.find((x) => x.id === trocaId) ?? null;
        setTroca(t);
        setErroCarga(!t);
        const g = trocasGuardadas(respostas).find((x) => x.trocaId === trocaId);
        setDias(g ? diasDesde(g.guardadaEm, new Date()) : null);
      })
      .catch((e) => {
        console.error('Erro ao abrir o "Testei?":', e);
        if (vivo) setErroCarga(true);
      });
    return () => {
      vivo = false;
    };
  }, [trocaId]);

  async function responder(avaliacao: AvaliacaoTroca) {
    if (escolha || salvando) return; // uma resposta por vez; a escolha fica gravada
    void Haptics.selectionAsync();
    setSalvando(true);
    setAviso(null);
    try {
      const xp = await avaliarTroca(trocaId, avaliacao);
      setXpGanho(xp);
      setEscolha(avaliacao);
    } catch (e) {
      console.error('Erro ao salvar a resposta do "Testei?":', e);
      setAviso(ehErroDeRede(e) ? 'Sem internet agora. Tenta de novo daqui a pouco.' : 'Não deu pra salvar agora. Tenta de novo.');
    } finally {
      setSalvando(false);
    }
  }

  async function lembrarAmanha() {
    if (userId) {
      const atuais = await lerAdiamentosTestei(userId);
      await salvarAdiamentosTestei(userId, { ...atuais, [trocaId]: adiarAteAmanha(new Date()) });
    }
    navigation.goBack();
  }

  const retorno = escolha ? RETORNO_TESTEI[escolha] : null;

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <View style={styles.topo}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.fechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        >
          <Ionicons name="close" size={24} color={colors.primaryDark} />
        </Pressable>
        {dias !== null && (
          <View style={styles.selo}>
            <AppText style={styles.seloTexto}>
              {dias === 1 ? 'IDEIA GUARDADA HÁ 1 DIA' : `IDEIA GUARDADA HÁ ${dias} DIAS`}
            </AppText>
          </View>
        )}
      </View>

      {!troca && !erroCarga && <ActivityIndicator color={colors.primary} style={styles.carregando} />}
      {erroCarga && (
        <AppText style={styles.vazio}>Não deu pra abrir essa ideia agora. Ela pode ter saído do app.</AppText>
      )}

      {troca && (
        <ScrollView
          contentContainerStyle={[styles.conteudo, { paddingBottom: 16 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <CartaoHub
            tags={[]}
            titulo={troca.destinoNome}
            tituloNatural
            subtitulo={`${noLugarDe(troca.categoria)}. ${troca.frase}`}
            icone={iconeDoDestino(troca.destinoNome)}
          />

          <View style={styles.broxisLinha}>
            <Image
              source={require('../../../../../assets/img/mascot/broxis-aceno.png')}
              style={styles.broxis}
              resizeMode="contain"
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <SpeechBubble tailPosition="left" style={styles.balao}>
              <AppText style={styles.pergunta} accessibilityRole="header">
                {escolha ? PERGUNTA_TESTEI_RESPONDIDA : PERGUNTA_TESTEI}
              </AppText>
              <AppText style={styles.apoio}>{APOIO_TESTEI}</AppText>
            </SpeechBubble>
          </View>

          <View style={styles.grade} accessibilityRole="radiogroup" accessibilityLabel="Como foi">
            {ORDEM_TESTEI.map((k) => {
              const marcada = escolha === k;
              const r = RETORNO_TESTEI[k];
              return (
                <Pressable
                  key={k}
                  onPress={() => responder(k)}
                  disabled={!!escolha || salvando}
                  style={[styles.opcao, marcada && styles.opcaoMarcada]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: marcada, disabled: !!escolha || salvando }}
                  accessibilityLabel={r.rotulo}
                >
                  <View style={styles.opcaoIcone}>
                    <Ionicons name={r.icone as keyof typeof Ionicons.glyphMap} size={18} color={colors.destaqueTexto} />
                  </View>
                  <AppText style={styles.opcaoTexto}>{r.rotulo}</AppText>
                </Pressable>
              );
            })}
          </View>

          {!!aviso && (
            <AppText style={styles.aviso} accessibilityRole="alert">
              {aviso}
            </AppText>
          )}

          {retorno && (
            <MotiView
              from={reduzirMovimento ? { opacity: 1 } : { opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300 }}
              style={styles.retorno}
              accessibilityLiveRegion="polite"
            >
              <View style={styles.retornoCaixa}>
                <AppText style={styles.retornoTexto}>
                  <AppText style={styles.negrito}>{retorno.titulo}</AppText> {retorno.texto}
                </AppText>
                {retorno.mostraDica && !!troca.dica && (
                  <Bloco icone="lightbulb-on-outline" titulo="Dica pra dar outra chance" texto={troca.dica} destaque />
                )}
              </View>
              <View style={styles.rodapeRetorno}>
                <View style={styles.privacidade}>
                  <Ionicons name="lock-closed-outline" size={14} color={colors.textoSuave} />
                  <AppText style={styles.privacidadeTexto}>{PRIVACIDADE_TESTEI}</AppText>
                </View>
                {xpGanho > 0 && (
                  <View style={styles.xp} accessibilityLabel={`Você ganhou ${xpGanho} XP`}>
                    <Ionicons name="star-outline" size={14} color={colors.amareloTexto} />
                    <AppText style={styles.xpTexto}>+{xpGanho} XP</AppText>
                  </View>
                )}
              </View>
              <AppButton
                label={retorno.cta}
                onPress={() => navigation.replace('TrocaBaralho', { categoria: troca.categoria })}
              />
            </MotiView>
          )}

          {!escolha && (
            <Pressable onPress={lembrarAmanha} style={styles.depois} accessibilityRole="button">
              <AppText style={styles.depoisTexto}>Ainda não testei · me lembra amanhã</AppText>
            </Pressable>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  fechar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  selo: { backgroundColor: colors.exercicioAcertoFundo, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, marginRight: 8 },
  seloTexto: { fontFamily: typography.bold, fontSize: 11, letterSpacing: 1, color: colors.destaqueTexto },
  carregando: { marginTop: 40 },
  vazio: { fontFamily: typography.regular, fontSize: 14, color: colors.textoSuave, textAlign: 'center', margin: 32 },
  conteudo: { paddingHorizontal: 20, paddingTop: 6, gap: 14 },
  broxisLinha: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingLeft: 4 },
  broxis: { width: 92, height: 124 },
  balao: { flex: 1, marginTop: 34, paddingHorizontal: 16, paddingVertical: 14 },
  pergunta: { fontFamily: typography.bold, fontSize: 16, lineHeight: 22, color: colors.primaryDark },
  apoio: { fontFamily: typography.regular, fontSize: 13, lineHeight: 19, color: colors.textoSuave, marginTop: 4 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  opcao: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.bordaSuave,
    borderBottomWidth: 4,
    borderRadius: 16,
  },
  opcaoMarcada: { backgroundColor: colors.exercicioAcertoFundo, borderColor: colors.primary },
  opcaoIcone: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.superficieSuave2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcaoTexto: { flex: 1, fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  aviso: { fontFamily: typography.semiBold, fontSize: 13, color: colors.error, textAlign: 'center' },
  retorno: { gap: 10 },
  retornoCaixa: { backgroundColor: colors.superficieSuave, borderRadius: 18, padding: 14 },
  retornoTexto: { fontFamily: typography.regular, fontSize: 14, lineHeight: 21, color: colors.primaryDark },
  negrito: { fontFamily: typography.bold },
  rodapeRetorno: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  privacidade: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  privacidadeTexto: { flex: 1, fontFamily: typography.regular, fontSize: 12, color: colors.textoSuave },
  xp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.amareloSuave,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  xpTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.amareloTexto },
  depois: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  depoisTexto: {
    fontFamily: typography.regular,
    fontSize: 14,
    color: colors.primaryDark,
    textDecorationLine: 'underline',
  },
});
