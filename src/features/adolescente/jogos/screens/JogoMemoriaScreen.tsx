// src/features/adolescente/jogos/screens/JogoMemoriaScreen.tsx
// Memória dos nutrientes: casar a carta do nutriente (A, C, Ca, Fe...) com um alimento que é boa fonte dele.
// Mesmo "jeito" do jogo da memória da trilha (carta que vira de verdade, entrada em cascata, pulinho no
// acerto, balanço no erro), com mais: espiadinha inicial, Bróxis que reage, feedback também no erro
// (diz de que nutriente aquele alimento é fonte), sequência de acertos, barra de progresso e estrelas.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { BackButton } from '../../../../shared/ui/BackButton';
import { BroxisMascot } from '../../../../shared/ui/BroxisMascot';
import { colors } from '../../../../shared/theme/colors';
import { layout } from '../../../../shared/theme/layout';
import { typography } from '../../../../shared/theme/typography';
import { tocarSomJogo as tocarSom, iniciarMusicaJogo, pararMusicaJogo, useMudoJogo } from '../utils/somJogo';
import BotaoMudo from '../components/BotaoMudo';
import { BALANCO, PULINHO, atrasoCascata } from '../../trilha/components/exercicios/animacoes';
import { NUTRIENTES_INFO } from '../../vitaminas/data/nutrientesInfo';
import { PARES_NUTRIENTE, ParNutriente } from '../data/paresNutriente';
import ImagemAlimento from '../components/ImagemAlimento';
import { useImagensJogo, listarParesNutriente } from '../services/imagensJogoService';
import { montarBaralho, formamPar, Carta } from '../utils/memoriaNutriente';

type Nav = NativeStackNavigationProp<AdolescenteStackParamList, 'JogoMemoria'>;
const NIVEIS = [
  { nome: 'Fácil', pares: 4, colunas: 2, espiar: 3000 },
  { nome: 'Médio', pares: 6, colunas: 3, espiar: 4500 },
];
const ESPACO = 10;
const DURACAO_VIRADA_MS = 130;
const TEMPO_ERRO_MS = 1500; // um pouco mais para dar tempo de ler o feedback
const COR_NUTRIENTE = '#7C3AED';
const MSG_INICIAL = 'Vire duas cartas: um nutriente e um alimento que é boa fonte dele.';
const FRASES_PAR = ['Par certo!', 'Boa combinação!', 'É isso mesmo!', 'Você lembrou!'];

const nomeNutriente = (k: string) => NUTRIENTES_INFO.find((n) => n.chave === k)?.nome.split(' (')[0] ?? k;

function CartaMemoria({ indice, carta, imagens, largura, aberta, achada, errada, disabled, onPress }: {
  indice: number; carta: Carta; imagens: Record<string, string>; largura: number;
  aberta: boolean; achada: boolean; errada: boolean; disabled: boolean; onPress: () => void;
}) {
  // `face` só muda no meio da virada (a carta encolhe na horizontal, troca a face e volta a crescer)
  const [face, setFace] = useState(aberta);
  const [escalaX, setEscalaX] = useState(1);
  useEffect(() => {
    if (aberta === face) { setEscalaX(1); return; }
    setEscalaX(0);
    const t = setTimeout(() => { setFace(aberta); setEscalaX(1); }, DURACAO_VIRADA_MS);
    return () => clearTimeout(t);
  }, [aberta]); // eslint-disable-line react-hooks/exhaustive-deps

  const altura = Math.max(96, largura * 1.05);
  const info = carta.tipo === 'NUTRIENTE' ? NUTRIENTES_INFO.find((n) => n.chave === carta.nutriente) : null;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 260, delay: atrasoCascata(indice, 40, 45) }}
      style={{ width: largura }}
    >
      <MotiView
        animate={{ scaleX: escalaX, scale: achada ? PULINHO : 1, translateX: errada ? BALANCO : 0 }}
        transition={{
          scaleX: { type: 'timing', duration: DURACAO_VIRADA_MS },
          scale: { type: 'timing', duration: 320, delay: 180 },
          translateX: { type: 'timing', duration: 380, delay: 180 },
        }}
      >
        <Pressable
          disabled={disabled}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={face ? (carta.tipo === 'NUTRIENTE' ? `Nutriente ${nomeNutriente(carta.nutriente)}` : carta.par.nome) : 'Carta virada para baixo'}
          style={[styles.carta, { height: altura }, !face && styles.cartaFechada, face && styles.cartaAberta, face && errada && styles.cartaErrada, face && achada && styles.cartaAchada]}
        >
          {face ? (
            carta.tipo === 'NUTRIENTE' ? (
              <View style={styles.faceCentro}>
                <View style={styles.circuloNutriente}>
                  <AppText style={[styles.simbolo, { fontSize: Math.min(34, largura * 0.26) }]}>{info?.simbolo ?? '?'}</AppText>
                </View>
                <AppText style={styles.nomeCarta} numberOfLines={2}>{nomeNutriente(carta.nutriente)}</AppText>
                <AppText style={styles.tipoCarta}>NUTRIENTE</AppText>
              </View>
            ) : (
              <View style={styles.faceCentro}>
                <ImagemAlimento alimento={carta.par} url={imagens[carta.par.id]} tamanho={Math.min(76, largura * 0.5)} />
                <AppText style={styles.nomeCarta} numberOfLines={2}>{carta.par.nome}</AppText>
                <AppText style={[styles.tipoCarta, { color: '#4CAF50' }]}>ALIMENTO</AppText>
              </View>
            )
          ) : (
            <Ionicons name="leaf" size={Math.min(40, largura * 0.3)} color={colors.white} />
          )}
        </Pressable>
      </MotiView>
    </MotiView>
  );
}

export default function JogoMemoriaScreen() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const imagens = useImagensJogo();
  const [pares, setPares] = useState<ParNutriente[]>(PARES_NUTRIENTE);
  const [nivel, setNivel] = useState(0);
  const [rodadaId, setRodadaId] = useState(0);
  const [previa, setPrevia] = useState(true);
  const [abertas, setAbertas] = useState<number[]>([]);
  const [resolvidas, setResolvidas] = useState<string[]>([]);
  const [jogadas, setJogadas] = useState(0);
  const [sequencia, setSequencia] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [erroAgora, setErroAgora] = useState(false);
  const [mensagem, setMensagem] = useState('Memorize as cartas, vou virar já já!');
  const [humor, setHumor] = useState<'curioso' | 'supercontente' | 'pensando'>('curioso');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mudo, alternarMudo] = useMudoJogo();

  useEffect(() => {
    let ativo = true;
    listarParesNutriente().then((l) => { if (ativo) { setPares(l); setRodadaId((r) => r + 1); } });
    return () => { ativo = false; if (timer.current) clearTimeout(timer.current); };
  }, []);

  const cfg = NIVEIS[nivel];
  const baralho = useMemo(() => montarBaralho(pares, cfg.pares), [pares, nivel, rodadaId]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = baralho.length / 2;
  const terminou = total > 0 && resolvidas.length === total;
  const largura = (width - layout.margemH * 2 - ESPACO * (cfg.colunas - 1)) / cfg.colunas;

  // espiadinha inicial: mostra todas as cartas e depois desvira
  useEffect(() => {
    setPrevia(true);
    setMensagem('Memorize as cartas, vou virar já já!');
    setHumor('curioso');
    const t = setTimeout(() => { setPrevia(false); tocarSom('virar'); setMensagem(MSG_INICIAL); }, cfg.espiar);
    return () => clearTimeout(t);
  }, [rodadaId, nivel]); // eslint-disable-line react-hooks/exhaustive-deps

  // música de fundo: toca enquanto joga (some na tela final, para a fanfarra aparecer) e respeita o mudo
  useEffect(() => {
    if (!mudo && !terminou) iniciarMusicaJogo(); else pararMusicaJogo();
    return () => pararMusicaJogo();
  }, [mudo, terminou]);

  const estrelas = jogadas <= total * 1.5 ? 3 : jogadas <= total * 2.5 ? 2 : 1;
  useEffect(() => {
    if (!terminou) return;
    tocarSom('fanfarra');
    const ids = Array.from({ length: estrelas }, (_, n) => setTimeout(() => tocarSom('estrela'), 900 + 350 * (n + 1)));
    return () => ids.forEach(clearTimeout);
  }, [terminou]); // eslint-disable-line react-hooks/exhaustive-deps

  function reiniciar(novoNivel = nivel) {
    if (timer.current) clearTimeout(timer.current);
    setNivel(novoNivel);
    setRodadaId((r) => r + 1);
    setAbertas([]); setResolvidas([]); setJogadas(0); setSequencia(0); setBloqueado(false); setErroAgora(false);
  }

  function virar(i: number) {
    const c = baralho[i];
    if (previa || bloqueado || abertas.includes(i) || resolvidas.includes(c.nutriente)) return;
    tocarSom('virar');
    Haptics.selectionAsync().catch(() => {});
    const novas = [...abertas, i];
    setAbertas(novas);
    if (novas.length < 2) {
      setHumor('curioso');
      setMensagem(c.tipo === 'NUTRIENTE' ? `${nomeNutriente(c.nutriente)}! Agora ache um alimento que seja fonte dele.` : `${c.par.nome}! Agora ache o nutriente do qual ele é fonte.`);
      return;
    }

    setJogadas((j) => j + 1);
    setBloqueado(true);
    const [a, b] = [baralho[novas[0]], baralho[novas[1]]];
    if (formamPar(a, b)) {
      const seq = sequencia + 1;
      setSequencia(seq);
      timer.current = setTimeout(() => {
        const info = NUTRIENTES_INFO.find((n) => n.chave === a.nutriente);
        const alimento = (a.tipo === 'ALIMENTO' ? a : b) as Extract<Carta, { tipo: 'ALIMENTO' }>;
        setResolvidas((r) => [...r, a.nutriente]);
        setHumor('supercontente');
        setMensagem(`${FRASES_PAR[Math.floor(Math.random() * FRASES_PAR.length)]} ${alimento.par.nome} é fonte de ${nomeNutriente(a.nutriente)}. ${info?.paraQueServe ?? ''}`);
        tocarSom(seq === 3 ? 'sequencia' : 'par');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setAbertas([]); setBloqueado(false);
      }, 450);
    } else {
      setSequencia(0);
      setErroAgora(true);
      setHumor('pensando');
      // feedback de verdade: diz o que a carta é
      if (a.tipo === b.tipo) {
        setMensagem(a.tipo === 'NUTRIENTE' ? 'Duas de nutriente! Procure um nutriente e um alimento.' : 'Dois alimentos! Procure um nutriente e um alimento.');
      } else {
        const alim = (a.tipo === 'ALIMENTO' ? a : b) as Extract<Carta, { tipo: 'ALIMENTO' }>;
        const nut = a.tipo === 'NUTRIENTE' ? a : b;
        setMensagem(`${alim.par.nome} é fonte de ${nomeNutriente(alim.nutriente)}, não de ${nomeNutriente(nut.nutriente)}. Guarde essa!`);
      }
      tocarSom('quase');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      timer.current = setTimeout(() => { tocarSom('virar'); setAbertas([]); setBloqueado(false); setErroAgora(false); setHumor('curioso'); }, TEMPO_ERRO_MS);
    }
  }

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.topo}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.barra}>
          {Array.from({ length: total }).map((_, i) => (
            <MotiView key={i} animate={{ backgroundColor: i < resolvidas.length ? '#8BCF4A' : '#E5E7EB' }} transition={{ type: 'timing', duration: 300 }} style={styles.segmento} />
          ))}
        </View>
        <BotaoMudo mudo={mudo} onPress={alternarMudo} />
        {sequencia >= 2 && !terminou && (
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 250 }} style={styles.combo}>
            <MaterialCommunityIcons name="fire" size={16} color="#F97316" />
            <AppText style={styles.comboTexto}>{sequencia}</AppText>
          </MotiView>
        )}
      </View>

      {terminou ? (
        <View style={styles.fim}>
          <BroxisMascot size={170} pose="supercontente" entrance="fade" />
          <AppText style={styles.tituloFim}>{estrelas === 3 ? 'Memória de elefante!' : estrelas === 2 ? 'Mandou bem!' : 'Ótimo começo!'}</AppText>
          <View style={styles.estrelas}>
            {[1, 2, 3].map((n) => (
              <MotiView key={n} from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 350, delay: 350 * n }}>
                <MaterialCommunityIcons name={n <= estrelas ? 'star' : 'star-outline'} size={56} color={n <= estrelas ? '#FACC15' : '#D1D5DB'} />
              </MotiView>
            ))}
          </View>
          <AppText style={styles.texto}>Você achou os {total} pares em {jogadas} jogadas.</AppText>
          <AppButton label="Jogar de novo" onPress={() => { tocarSom('toque'); reiniciar(); }} />
          {nivel === 0 && <AppButton label="Tentar o nível Médio" onPress={() => { tocarSom('toque'); reiniciar(1); }} backgroundColor={colors.white} outlineColor={colors.primaryDark} textColor={colors.primaryDark} />}
          <AppButton label="Voltar aos jogos" onPress={() => { tocarSom('toque'); navigation.goBack(); }} backgroundColor={colors.white} outlineColor={colors.primaryDark} textColor={colors.primaryDark} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
          <View style={styles.niveis}>
            {NIVEIS.map((n, i) => (
              <Pressable key={n.nome} onPress={() => { if (i !== nivel) { tocarSom('selecionar'); reiniciar(i); } }} style={[styles.nivel, i === nivel && styles.nivelAtivo]} accessibilityRole="button" accessibilityLabel={`Nível ${n.nome}`}>
                <AppText style={[styles.nivelTexto, i === nivel && { color: '#fff' }]}>{n.nome}</AppText>
              </Pressable>
            ))}
          </View>

          <View style={styles.mascoteLinha}>
            <BroxisMascot size={76} pose={humor} entrance="fade" showParticles={false} />
            <MotiView key={mensagem} from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 250 }} style={[styles.balao, humor === 'supercontente' && styles.balaoOk, humor === 'pensando' && styles.balaoErro]}>
              <AppText style={styles.balaoTexto}>{mensagem}</AppText>
            </MotiView>
          </View>

          <AppText style={styles.contador}>{resolvidas.length}/{total} pares · {jogadas} {jogadas === 1 ? 'jogada' : 'jogadas'}</AppText>

          <View style={styles.grade}>
            {baralho.map((c, i) => {
              const achada = resolvidas.includes(c.nutriente);
              const virada = abertas.includes(i);
              return (
                <CartaMemoria
                  key={`${rodadaId}-${nivel}-${c.uid}`}
                  indice={i}
                  carta={c}
                  imagens={imagens}
                  largura={largura}
                  aberta={previa || achada || virada}
                  achada={achada}
                  errada={virada && erroAgora}
                  disabled={previa || achada}
                  onPress={() => virar(i)}
                />
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: layout.margemH, paddingVertical: 12 },
  barra: { flex: 1, flexDirection: 'row', gap: 4 },
  segmento: { flex: 1, height: 10, borderRadius: 5 },
  combo: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#FFEDD5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  comboTexto: { fontFamily: typography.bold, fontSize: 14, color: '#C2410C' },
  conteudo: { paddingHorizontal: layout.margemH, paddingBottom: 60, gap: 12 },
  niveis: { flexDirection: 'row', gap: 8, alignSelf: 'center' },
  nivel: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 16, backgroundColor: '#E5E7EB' },
  nivelAtivo: { backgroundColor: colors.primaryDark },
  nivelTexto: { fontFamily: typography.bold, fontSize: 13, color: '#4B5B55' },
  mascoteLinha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balao: { flex: 1, minHeight: 64, justifyContent: 'center', backgroundColor: '#fff', borderRadius: 18, borderWidth: 2, borderColor: '#E2F3D3', padding: 12 },
  balaoOk: { borderColor: colors.primary, backgroundColor: colors.exercicioAcertoFundo },
  balaoErro: { borderColor: '#FDBA74', backgroundColor: '#FFF7ED' },
  balaoTexto: { fontFamily: typography.semiBold, fontSize: 13, lineHeight: 18, color: colors.primaryDark },
  contador: { fontFamily: typography.semiBold, fontSize: 12, color: colors.primaryDark, textAlign: 'center' },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACO },
  // mesmas cartas do jogo da memória da trilha
  carta: { borderRadius: 14, borderWidth: 1.5, borderBottomWidth: 4, alignItems: 'center', justifyContent: 'center' },
  cartaFechada: { backgroundColor: colors.primary, borderColor: colors.primaryShadow },
  cartaAberta: { backgroundColor: colors.white, borderColor: colors.primaryDark },
  cartaErrada: { borderColor: colors.exercicioErro, backgroundColor: 'rgba(255, 69, 64, 0.08)' },
  cartaAchada: { backgroundColor: 'rgba(139, 207, 74, 0.16)', borderColor: colors.primary },
  faceCentro: { alignItems: 'center', gap: 3, padding: 6 },
  circuloNutriente: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  simbolo: { fontFamily: typography.bold, color: COR_NUTRIENTE },
  nomeCarta: { fontFamily: typography.semiBold, fontSize: 12, color: colors.primaryDark, textAlign: 'center' },
  tipoCarta: { fontFamily: typography.bold, fontSize: 9, letterSpacing: 0.8, color: COR_NUTRIENTE },
  texto: { fontFamily: typography.regular, fontSize: 14, color: '#4B5B55', textAlign: 'center' },
  fim: { flex: 1, paddingHorizontal: layout.margemH, justifyContent: 'center', gap: 12 },
  tituloFim: { fontFamily: typography.bold, fontSize: 24, color: colors.primaryDark, textAlign: 'center' },
  estrelas: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
});
