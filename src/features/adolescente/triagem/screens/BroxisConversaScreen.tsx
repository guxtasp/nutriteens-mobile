// src/features/adolescente/triagem/screens/BroxisConversaScreen.tsx
//
// Conversa com o Bróxis antes do recordatório (substitui TriagemIntro + TriagemApresentacao).
// Começa em "fase herói" (Bróxis grande com o balão em cima da cabeça). Na primeira resposta o
// herói encolhe e vira o avatar do topo, e as falas iniciais passam para o histórico do chat SEM
// animar de novo: a pessoa não perde o fio da conversa. O roteiro é dado puro (data/roteiroBroxis).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Image, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '../../../../shared/ui/BackButton';
import { AppButton } from '../../../../shared/ui/AppButton';
import { AppText } from '../../../../shared/ui/AppText';
import { SpeechBubble } from '../../../../shared/ui/SpeechBubble';
import { RespostaRapida } from '../../../../shared/ui/RespostaRapida';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useReduzirMovimento } from '../../../../shared/hooks/useReduzirMovimento';
import * as Haptics from '../../../../shared/audio/haptics';
import { registrarEvento } from '../../../../shared/analytics/analytics';
import {
  DICA_PRIMEIRA_RESPOSTA,
  DICA_RESPOSTA,
  NO_INICIAL,
  type IdCartao,
  type MensagemRoteiro,
  type OpcaoRoteiro,
} from '../data/roteiroBroxis';
import { falaDoNo, PAUSA_ENTRE_MENSAGENS_MS, tempoDigitacao, type Fala } from '../utils/roteiroBroxis';
import {
  AVATAR_BROXIS,
  BolhaBroxis,
  BolhaDigitando,
  BolhaUsuario,
  CartaoRoteiro,
  EntradaMensagem,
  PontosDigitando,
} from '../components/ChatBroxis';

type ItemChat =
  | { id: number; tipo: 'broxis'; texto: string; doHeroi: boolean }
  | { id: number; tipo: 'cartao'; cartao: IdCartao; doHeroi: boolean }
  | { id: number; tipo: 'usuario'; texto: string; doHeroi: false };

type Fase = 'heroi' | 'chat';

const DURACAO_TRANSICAO_MS = 550;
const ESPERA_INICIAL_MS = 250;
const ESPERA_RESPOSTAS_MS = 150;

export default function BroxisConversaScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const reduzirMovimento = useReduzirMovimento();
  const reduzirRef = useRef(reduzirMovimento);
  reduzirRef.current = reduzirMovimento;

  const [fase, setFase] = useState<Fase>('heroi');
  const [itens, setItens] = useState<ItemChat[]>([]);
  const [digitando, setDigitando] = useState(false);
  const [opcoes, setOpcoes] = useState<OpcaoRoteiro[]>([]);
  const [terminou, setTerminou] = useState(false);
  const faseRef = useRef<Fase>('heroi');
  const proximoId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  // 0 = herói, 1 = chat
  const progresso = useSharedValue(0);
  const alturaHeroi = useSharedValue(0);

  const depois = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Bróxis "digita" cada mensagem e, no fim, mostra as respostas (ou o COMEÇAR)
  const falar = useCallback(
    (fala: Fala) => {
      const doHeroi = faseRef.current === 'heroi';
      let t = ESPERA_INICIAL_MS;
      fala.mensagens.forEach((m: MensagemRoteiro) => {
        depois(t, () => setDigitando(true));
        t += tempoDigitacao(m, reduzirRef.current);
        depois(t, () => {
          setDigitando(false);
          const id = proximoId.current++;
          setItens((prev) => [
            ...prev,
            m.tipo === 'broxis'
              ? { id, tipo: 'broxis', texto: m.texto, doHeroi }
              : { id, tipo: 'cartao', cartao: m.cartao, doHeroi },
          ]);
          // iOS não lê a liveRegion: anuncia cada fala
          if (m.tipo === 'broxis' && Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(m.texto);
        });
        t += PAUSA_ENTRE_MENSAGENS_MS;
      });
      depois(t + ESPERA_RESPOSTAS_MS, () => {
        if (fala.final) setTerminou(true);
        else setOpcoes(fala.opcoes);
      });
    },
    [depois],
  );

  useEffect(() => {
    falar(falaDoNo(NO_INICIAL));
  }, [falar]);

  function responder(opcao: OpcaoRoteiro) {
    void Haptics.selectionAsync();
    registrarEvento('broxis_intro_resposta', { resposta: opcao.codigo });
    setOpcoes([]);
    const id = proximoId.current++;
    setItens((prev) => [...prev, { id, tipo: 'usuario', texto: opcao.rotulo, doHeroi: false }]);

    if (faseRef.current === 'heroi') {
      faseRef.current = 'chat';
      setFase('chat');
      progresso.value = withTiming(1, {
        duration: reduzirRef.current ? 0 : DURACAO_TRANSICAO_MS,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
    }
    falar(falaDoNo(opcao.proximo));
  }

  const estiloHeroi = useAnimatedStyle(() => ({
    height: alturaHeroi.value * (1 - progresso.value),
    opacity: 1 - progresso.value,
  }));
  const estiloBroxis = useAnimatedStyle(() => ({ transform: [{ scale: 1 - 0.7 * progresso.value }] }));
  const estiloTopoChat = useAnimatedStyle(() => ({
    opacity: progresso.value,
    transform: [{ translateY: 30 * (1 - progresso.value) }],
  }));
  const estiloSelo = useAnimatedStyle(() => ({ opacity: 1 - progresso.value }));
  const estiloLinhaTopo = useAnimatedStyle(() => ({ opacity: progresso.value }));

  const falasHeroi = itens.filter((i): i is Extract<ItemChat, { tipo: 'broxis' }> => i.tipo === 'broxis' && i.doHeroi);
  const abrirPolitica = () => navigation.navigate('PoliticaPrivacidade');

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      {/* topo: no começo só o selo; no chat aparecem avatar, nome e status */}
      <View style={styles.topo}>
        <BackButton onPress={() => navigation.canGoBack() && navigation.goBack()} />
        <Animated.View style={[styles.topoChat, estiloTopoChat]} pointerEvents="none">
          <Image source={AVATAR_BROXIS} style={styles.avatarTopo} accessibilityElementsHidden importantForAccessibility="no" />
          <View>
            <AppText style={styles.nome}>Bróxis</AppText>
            <AppText style={styles.status}>{digitando ? 'digitando…' : 'online'}</AppText>
          </View>
        </Animated.View>
        <Animated.View style={[styles.seloPosicao, estiloSelo]} pointerEvents="none">
          <View style={styles.selo}>
            <AppText style={styles.seloTexto}>ANTES DA SUA TRILHA</AppText>
          </View>
        </Animated.View>
        <Animated.View style={[styles.linhaTopo, estiloLinhaTopo]} />
      </View>

      {/* herói: ocupa o espaço livre; ao responder, a altura medida anima até 0 */}
      <Animated.View
        style={[styles.heroi, fase === 'heroi' ? styles.heroiCheio : estiloHeroi]}
        onLayout={(e) => {
          if (faseRef.current === 'heroi') alturaHeroi.value = e.nativeEvent.layout.height;
        }}
        accessibilityElementsHidden={fase === 'chat'}
        importantForAccessibility={fase === 'chat' ? 'no-hide-descendants' : 'auto'}
      >
        <SpeechBubble tailPosition="bottom" style={styles.balaoHeroi}>
          <View accessibilityLiveRegion="polite">
            {falasHeroi.map((f, i) => (
              <EntradaMensagem key={f.id} semAnimacao={reduzirMovimento}>
                <AppText style={i === 0 ? styles.heroiFala1 : styles.heroiFala2}>{f.texto}</AppText>
              </EntradaMensagem>
            ))}
            {fase === 'heroi' && digitando && (
              <View style={styles.pontosHeroi}>
                <PontosDigitando reduzirMovimento={reduzirMovimento} />
              </View>
            )}
          </View>
        </SpeechBubble>
        <Animated.Image
          source={require('../../../../../assets/img/mascot/broxis-aceno.png')}
          style={[styles.broxisHeroi, estiloBroxis]}
          resizeMode="contain"
          accessibilityLabel="Bróxis acenando"
        />
      </Animated.View>

      {/* conversa + respostas no fluxo da tela (sem painel fixo); folga para a barra do Android */}
      <ScrollView
        ref={scrollRef}
        style={fase === 'heroi' ? styles.listaHeroi : styles.listaChat}
        contentContainerStyle={[styles.listaConteudo, { paddingBottom: 16 + insets.bottom }]}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: !reduzirMovimento })}
        showsVerticalScrollIndicator={false}
      >
        {fase === 'chat' && (
          <View style={styles.mensagens} accessibilityLiveRegion="polite">
            {itens.map((item, i) => {
              const prox = itens[i + 1];
              // avatar só na última fala de cada sequência do Bróxis
              const comAvatar = item.tipo === 'broxis' && (!prox || prox.tipo === 'usuario');
              return (
                <EntradaMensagem key={item.id} semAnimacao={reduzirMovimento || item.doHeroi}>
                  {item.tipo === 'broxis' && <BolhaBroxis texto={item.texto} comAvatar={comAvatar} />}
                  {item.tipo === 'usuario' && <BolhaUsuario texto={item.texto} />}
                  {item.tipo === 'cartao' && <CartaoRoteiro cartao={item.cartao} onAbrirPolitica={abrirPolitica} />}
                </EntradaMensagem>
              );
            })}
            {digitando && (
              <EntradaMensagem semAnimacao={reduzirMovimento}>
                <BolhaDigitando reduzirMovimento={reduzirMovimento} />
              </EntradaMensagem>
            )}
          </View>
        )}

        {opcoes.length > 0 && (
          <View style={styles.respostas}>
            <EntradaMensagem semAnimacao={reduzirMovimento}>
              <View style={styles.dica}>
                <Ionicons name="information-circle-outline" size={14} color={colors.textoSuave} />
                <AppText style={styles.dicaTexto}>{fase === 'heroi' ? DICA_PRIMEIRA_RESPOSTA : DICA_RESPOSTA}</AppText>
              </View>
            </EntradaMensagem>
            {opcoes.map((o) => (
              <EntradaMensagem key={o.codigo} semAnimacao={reduzirMovimento}>
                <RespostaRapida rotulo={o.rotulo} onPress={() => responder(o)} />
              </EntradaMensagem>
            ))}
          </View>
        )}

        {terminou && (
          <EntradaMensagem semAnimacao={reduzirMovimento}>
            <AppButton
              label="COMEÇAR"
              onPress={() => navigation.navigate('RecordatorioRefeicao', { indice: 0 })}
              style={styles.comecar}
            />
          </EntradaMensagem>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  topo: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  topoChat: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarTopo: { width: 40, height: 40, borderRadius: 20 },
  nome: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },
  status: { fontFamily: typography.regular, fontSize: 12, color: colors.destaqueTexto },
  seloPosicao: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 10, alignItems: 'center', justifyContent: 'center' },
  selo: { backgroundColor: colors.exercicioAcertoFundo, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  seloTexto: { fontFamily: typography.bold, fontSize: 11, letterSpacing: 1.1, color: colors.destaqueTexto },
  linhaTopo: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, backgroundColor: colors.divisoriaSuave },
  heroi: { marginHorizontal: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: 18 },
  heroiCheio: { flex: 1 },
  balaoHeroi: { width: 300, maxWidth: '100%', minHeight: 58 },
  heroiFala1: {
    fontFamily: typography.bold,
    fontSize: 19,
    lineHeight: 25,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  heroiFala2: {
    fontFamily: typography.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.primaryDark,
    textAlign: 'center',
    marginTop: 6,
  },
  pontosHeroi: { paddingTop: 8, paddingBottom: 2 },
  broxisHeroi: { width: 160, height: 216 },
  listaHeroi: { flexGrow: 0 },
  listaChat: { flex: 1 },
  listaConteudo: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 14, gap: 8 },
  mensagens: { gap: 8 },
  respostas: { gap: 8, paddingHorizontal: 4, paddingTop: 8 },
  dica: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  dicaTexto: { fontFamily: typography.regular, fontSize: 12, color: colors.textoSuave },
  comecar: { marginTop: 12 },
});
