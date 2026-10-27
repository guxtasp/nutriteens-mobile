// src/features/adolescente/jogos/screens/JogoNovaScreen.tsx
// Jogo "Classificar NOVA": um alimento por vez, 4 grupos coloridos, Bróxis reage,
// sons, vibração, sequência de acertos e partículas. Sem cronômetro, sem ranking,
// sem nota negativa: o fim sempre comemora (1 a 3 estrelas).
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { GRUPOS_NOVA, GrupoNova, ALIMENTOS_NOVA, AlimentoNova } from '../data/alimentosNova';
import ImagemAlimento from '../components/ImagemAlimento';
import { useImagensJogo, listarAlimentosJogo } from '../services/imagensJogoService';
import { sortearRodada, acertou } from '../utils/rodadaNova';

type Nav = NativeStackNavigationProp<AdolescenteStackParamList, 'JogoNova'>;
const TAMANHO_RODADA = 8;

// visual de cada grupo (cor + ícone); o texto vem de GRUPOS_NOVA
const VISUAL: Record<GrupoNova, { cor: string; icone: string }> = {
  IN_NATURA: { cor: '#4CAF50', icone: 'leaf' },
  INGREDIENTE_CULINARIO: { cor: '#F59E0B', icone: 'shaker-outline' },
  PROCESSADO: { cor: '#3B82F6', icone: 'package-variant-closed' },
  ULTRAPROCESSADO: { cor: '#E11D48', icone: 'factory' },
};
const FRASES_ACERTO = ['Isso aí!', 'Mandou bem!', 'Na mosca!', 'Boa, craque!', 'Acertou em cheio!'];
const FRASES_ERRO = ['Quase! Olha a dica.', 'Ops, esse é de outro grupo.', 'Boa tentativa! Veja a dica.'];
const CONFETES = ['#8BCF4A', '#F59E0B', '#EC4899', '#3B82F6', '#7C3AED', '#E11D48', '#FACC15', '#10B981'];

function Confete() {
  return (
    <View pointerEvents="none" style={styles.confeteBase}>
      {CONFETES.map((c, i) => {
        const ang = (i / CONFETES.length) * Math.PI * 2;
        return (
          <MotiView
            key={i}
            from={{ opacity: 1, translateX: 0, translateY: 0, scale: 0.4 }}
            animate={{ opacity: 0, translateX: Math.cos(ang) * 60, translateY: Math.sin(ang) * 60, scale: 1.1 }}
            transition={{ type: 'timing', duration: 650 }}
            style={[styles.confete, { backgroundColor: c }]}
          />
        );
      })}
    </View>
  );
}

export default function JogoNovaScreen() {
  const navigation = useNavigation<Nav>();
  const imagens = useImagensJogo();
  const [base, setBase] = useState<AlimentoNova[]>(ALIMENTOS_NOVA);
  const [rodadaId, setRodadaId] = useState(0);
  const [indice, setIndice] = useState(0);
  const [escolha, setEscolha] = useState<GrupoNova | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [sequencia, setSequencia] = useState(0);
  const [resultados, setResultados] = useState<boolean[]>([]);
  const [frase, setFrase] = useState('');
  const [mudo, alternarMudo] = useMudoJogo();

  useEffect(() => {
    let ativo = true;
    listarAlimentosJogo().then((l) => { if (ativo) { setBase(l); setRodadaId((r) => r + 1); setIndice(0); } });
    return () => { ativo = false; };
  }, []);
  const rodada = useMemo(() => sortearRodada(TAMANHO_RODADA, Math.random, base), [rodadaId, base]);

  const terminou = indice >= rodada.length;
  const alimento = rodada[indice];
  const respondeu = escolha !== null;
  const ultimoOk = respondeu && acertou(alimento, escolha!);

  // som só no fim da rodada; as perguntas não tocam nada ao aparecer (menos ruído)
  useEffect(() => {
    if (terminou) tocarSom(acertos >= TAMANHO_RODADA / 2 ? 'fanfarra' : 'conquista');
  }, [terminou]); // eslint-disable-line react-hooks/exhaustive-deps

  function responder(g: GrupoNova) {
    if (respondeu) return;
    const ok = acertou(alimento, g);
    setEscolha(g);
    setResultados((r) => [...r, ok]);
    const lista = ok ? FRASES_ACERTO : FRASES_ERRO;
    setFrase(lista[Math.floor(Math.random() * lista.length)]);
    if (ok) {
      const seq = sequencia + 1;
      setAcertos((a) => a + 1);
      setSequencia(seq);
      tocarSom(seq === 3 ? 'sequencia' : 'acerto');
    } else {
      setSequencia(0);
      tocarSom('erro');
    }
    Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }

  function proxima() {
    tocarSom('avancar');
    setEscolha(null);
    setIndice((i) => i + 1);
  }

  function jogarDeNovo() {
    tocarSom('toque');
    setRodadaId((r) => r + 1);
    setIndice(0);
    setEscolha(null);
    setAcertos(0);
    setSequencia(0);
    setResultados([]);
  }

  useEffect(() => {
    if (!terminou) return;
    const ids = [1, 2, 3].filter((n) => n <= (acertos >= TAMANHO_RODADA - 1 ? 3 : acertos >= TAMANHO_RODADA / 2 ? 2 : 1))
      .map((n) => setTimeout(() => tocarSom('estrela'), 350 * n + 900));
    return () => ids.forEach(clearTimeout);
  }, [terminou]); // eslint-disable-line react-hooks/exhaustive-deps

  // música de fundo: toca enquanto joga (some na tela final) e respeita o mudo
  useEffect(() => {
    if (!mudo && !terminou) iniciarMusicaJogo(); else pararMusicaJogo();
    return () => pararMusicaJogo();
  }, [mudo, terminou]);

  const estrelas = acertos >= TAMANHO_RODADA - 1 ? 3 : acertos >= TAMANHO_RODADA / 2 ? 2 : 1;

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.topo}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.barra}>
          {Array.from({ length: rodada.length }).map((_, i) => (
            <MotiView
              key={i}
              animate={{ backgroundColor: i < resultados.length ? (resultados[i] ? '#8BCF4A' : '#F59E0B') : i === indice && !terminou ? '#CFE9B5' : '#E5E7EB', scale: i === indice && !terminou ? 1.15 : 1 }}
              transition={{ type: 'timing', duration: 250 }}
              style={styles.segmento}
            />
          ))}
        </View>
        <BotaoMudo mudo={mudo} onPress={alternarMudo} />
        {sequencia >= 2 && (
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 250 }} style={styles.combo}>
            <AppText style={styles.comboTexto}>{sequencia}</AppText>
          </MotiView>
        )}
      </View>

      {terminou ? (
        <View style={styles.fim}>
          <BroxisMascot size={170} pose="supercontente" />
          <AppText style={styles.tituloFim}>{estrelas === 3 ? 'Show de bola!' : estrelas === 2 ? 'Mandou bem!' : 'Ótimo começo!'}</AppText>
          <View style={styles.estrelas}>
            {[1, 2, 3].map((n) => (
              <MotiView key={n} from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 350, delay: 350 * n }}>
                <MaterialCommunityIcons name={n <= estrelas ? 'star' : 'star-outline'} size={56} color={n <= estrelas ? '#FACC15' : '#D1D5DB'} />
              </MotiView>
            ))}
          </View>
          <AppText style={styles.texto}>Você acertou {acertos} de {rodada.length}</AppText>
          <AppText style={styles.dicaFim}>Dica prática: se a lista de ingredientes tem coisas que você não usa na cozinha de casa, é ultraprocessado.</AppText>
          <AppButton label="Jogar de novo" onPress={jogarDeNovo} />
          <AppButton label="Voltar aos jogos" onPress={() => { tocarSom('toque'); navigation.goBack(); }} backgroundColor={colors.white} outlineColor={colors.primaryDark} textColor={colors.primaryDark} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
          <View style={styles.mascoteLinha}>
            <MotiView key={`${indice}-${respondeu}-${ultimoOk}`}>
              <BroxisMascot size={84} pose={!respondeu ? 'curioso' : ultimoOk ? 'supercontente' : 'pensando'} entrance="fade" showParticles={false} />
            </MotiView>
            <View style={styles.balao}>
              <AppText style={styles.balaoTexto}>{respondeu ? frase : 'Em qual grupo esse alimento entra?'}</AppText>
            </View>
          </View>

          <MotiView
            key={`${alimento.id}-${respondeu}`}
            from={respondeu ? undefined : { opacity: 0, translateY: 12 }}
            animate={
              !respondeu
                ? { opacity: 1, translateY: 0 }
                : ultimoOk
                  ? { scale: [1, 1.05, 1] }
                  : { translateX: [0, -5, 5, -3, 3, 0] }
            }
            transition={{ type: 'timing', duration: respondeu ? 500 : 300 }}
            style={styles.cartaAlimento}
          >
            {/* flutuar devagar e pouco: dá vida sem cansar; para ao responder */}
            <MotiView
              from={{ translateY: 0 }}
              animate={{ translateY: respondeu ? 0 : -5 }}
              transition={{ type: 'timing', duration: 1800, loop: !respondeu, repeatReverse: true }}
            >
              <ImagemAlimento alimento={alimento} url={imagens[alimento.id]} tamanho={130} />
            </MotiView>
            <AppText style={styles.nomeAlimento}>{alimento.nome}</AppText>
            {ultimoOk && <Confete />}
          </MotiView>

          <View style={styles.grade}>
            {GRUPOS_NOVA.map((g, i) => {
              const v = VISUAL[g.chave];
              const certo = respondeu && g.chave === alimento.grupo;
              const errado = respondeu && g.chave === escolha && g.chave !== alimento.grupo;
              const apagado = respondeu && !certo && !errado;
              return (
                <MotiView
                  key={g.chave}
                  from={{ opacity: 0 }}
                  animate={{ opacity: apagado ? 0.4 : 1 }}
                  transition={{ type: 'timing', duration: 250, delay: respondeu ? 0 : i * 40 }}
                  style={styles.celula}
                >
                  <Pressable
                    disabled={respondeu}
                    onPress={() => responder(g.chave)}
                    onPressIn={() => { if (!respondeu) { tocarSom('selecionar'); Haptics.selectionAsync().catch(() => {}); } }}
                    accessibilityRole="button"
                    accessibilityLabel={`${g.nome}. ${g.resumo}`}
                    style={({ pressed }) => [
                      styles.opcao,
                      { backgroundColor: v.cor, borderBottomColor: 'rgba(0,0,0,0.22)' },
                      certo && styles.opcaoCerta,
                      errado && styles.opcaoErrada,
                      pressed && { transform: [{ translateY: 4 }], borderBottomWidth: 2 },
                    ]}
                  >
                    <MaterialCommunityIcons name={(certo ? 'check-circle' : errado ? 'close-circle' : v.icone) as any} size={30} color="#fff" />
                    <AppText style={styles.opcaoNome}>{g.nome}</AppText>
                  </Pressable>
                </MotiView>
              );
            })}
          </View>

          {respondeu && (
            <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={[styles.feedback, ultimoOk ? styles.feedbackOk : styles.feedbackErro]}>
              <AppText style={styles.feedbackTitulo}>{ultimoOk ? 'Isso aí!' : `Esse é: ${GRUPOS_NOVA.find((g) => g.chave === alimento.grupo)!.nome}`}</AppText>
              <AppText style={styles.texto}>{alimento.dica}</AppText>
              <AppButton label={indice + 1 === rodada.length ? 'Ver resultado' : 'Próximo'} onPress={proxima} />
            </MotiView>
          )}
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
  mascoteLinha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balao: { flex: 1, backgroundColor: '#fff', borderRadius: 18, borderWidth: 2, borderColor: '#E2F3D3', padding: 12 },
  balaoTexto: { fontFamily: typography.semiBold, fontSize: 14, color: colors.primaryDark },
  cartaAlimento: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  nomeAlimento: { fontFamily: typography.bold, fontSize: 24, color: colors.primaryDark, textAlign: 'center' },
  texto: { fontFamily: typography.regular, fontSize: 14, color: '#4B5B55', textAlign: 'center' },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  celula: { width: '48%', flexGrow: 1 },
  opcao: { minHeight: 92, borderRadius: 18, borderBottomWidth: 5, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 10 },
  opcaoCerta: { borderWidth: 3, borderColor: '#fff' },
  opcaoErrada: { opacity: 0.85 },
  opcaoNome: { fontFamily: typography.bold, fontSize: 14, color: '#fff', textAlign: 'center' },
  feedback: { gap: 10, marginTop: 6, padding: 16, borderRadius: 20 },
  feedbackOk: { backgroundColor: colors.exercicioAcertoFundo },
  feedbackErro: { backgroundColor: '#FFF1E6' },
  feedbackTitulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark, textAlign: 'center' },
  confeteBase: { position: 'absolute', top: 65, alignSelf: 'center', width: 1, height: 1 },
  confete: { position: 'absolute', width: 12, height: 12, borderRadius: 6 },
  fim: { flex: 1, paddingHorizontal: layout.margemH, justifyContent: 'center', alignItems: 'stretch', gap: 12 },
  tituloFim: { fontFamily: typography.bold, fontSize: 26, color: colors.primaryDark, textAlign: 'center' },
  estrelas: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dicaFim: { fontFamily: typography.regular, fontSize: 13, color: '#4B5B55', textAlign: 'center', marginBottom: 6 },
});
