// src/features/adolescente/trilha/components/exercicios/Memoria.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../../shared/ui/AppText';
import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';
import { layout } from '../../../../../shared/theme/layout';
import { tocarSom } from '../../../../../shared/audio/sons';
import type { ParAssocie } from '../../services/trilhaService';
import { BALANCO, PULINHO, atrasoCascata } from './animacoes';

type Props = {
  pares: ParAssocie[]; // mesmo formato do "associe": { id, esquerda, direita }
  resposta: Record<string, string>; // parId -> parId, só dos pares já encontrados
  respondido: boolean;
  onMudar: (novaResposta: Record<string, string>) => void;
};

type Carta = { chave: string; parId: string; texto: string };

const ESPACO = 10;
const PADDING_TELA = layout.margemFluxoH; // o mesmo paddingHorizontal do ExercicioQuizContainer
const TEMPO_ERRO_MS = 900;
// metade do "virar": a carta encolhe até sumir, troca a face e volta a crescer
const DURACAO_VIRADA_MS = 130;

function pseudoAleatorio(seed: number) {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

// Mesma ideia do Associe: embaralhamento determinístico, pra a ordem não
// mudar a cada renderização.
function montarCartas(pares: ParAssocie[]): Carta[] {
  const cartas: Carta[] = pares.flatMap((par) => [
    { chave: `${par.id}:e`, parId: par.id, texto: par.esquerda },
    { chave: `${par.id}:d`, parId: par.id, texto: par.direita },
  ]);
  return cartas
    .map((carta, i) => ({ carta, ordem: pseudoAleatorio(i + carta.chave.length + 7) }))
    .sort((a, b) => a.ordem - b.ordem)
    .map((x) => x.carta);
}

type CartaMemoriaProps = {
  indice: number;
  texto: string;
  larguraCarta: number;
  aberta: boolean;
  achada: boolean;
  errada: boolean;
  disabled: boolean;
  onPress: () => void;
};

/**
 * Uma carta do jogo. Entra em cascata e VIRA de verdade: ao abrir/fechar ela
 * encolhe na horizontal (scaleX → 0), troca a face no meio e volta a crescer.
 * Par certo dá um pulinho; par errado balança antes de desvirar.
 */
function CartaMemoria({ indice, texto, larguraCarta, aberta, achada, errada, disabled, onPress }: CartaMemoriaProps) {
  // `face` é o que está desenhado agora; só muda no meio da virada
  const [face, setFace] = useState(aberta);
  const [escalaX, setEscalaX] = useState(1);

  useEffect(() => {
    if (aberta === face) {
      setEscalaX(1);
      return;
    }
    setEscalaX(0);
    const timer = setTimeout(() => {
      setFace(aberta);
      setEscalaX(1);
    }, DURACAO_VIRADA_MS);
    return () => clearTimeout(timer);
  }, [aberta]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 260, delay: atrasoCascata(indice, 40, 45) }}
      style={{ width: larguraCarta }}
    >
      <MotiView
        animate={{
          scaleX: escalaX,
          scale: achada ? PULINHO : 1,
          translateX: errada ? BALANCO : 0,
        }}
        transition={{
          scaleX: { type: 'timing', duration: DURACAO_VIRADA_MS },
          // o pulinho/balanço começam depois que a carta terminou de virar
          scale: { type: 'timing', duration: 320, delay: 180 },
          translateX: { type: 'timing', duration: 380, delay: 180 },
        }}
      >
        <Pressable
          disabled={disabled}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={aberta ? texto : 'Carta virada para baixo'}
          style={[
            styles.carta,
            !face && styles.cartaFechada,
            face && !achada && styles.cartaAberta,
            face && errada && styles.cartaErrada,
            face && achada && styles.cartaAchada,
          ]}
        >
          {face ? (
            <AppText numberOfLines={4} style={styles.cartaTexto}>
              {texto}
            </AppText>
          ) : (
            <Ionicons name="leaf" size={26} color={colors.white} />
          )}
        </Pressable>
      </MotiView>
    </MotiView>
  );
}

/**
 * "Jogo da memória": as cartas começam viradas para baixo; o adolescente
 * vira duas por vez e tenta achar os pares (cada par = os dois lados de um
 * item de `dados_extra.pares`, ex.: "Laranja" e "in natura"). Par errado
 * desvira sozinho depois de um instante; par certo fica aberto.
 *
 * Não tem certo/errado: é um passo SEM NOTA (ver utils/sessaoPassos.ts) e
 * só termina quando todos os pares foram achados, então ninguém "erra".
 * Quem usa o componente remonta ele (via `key`) a cada passo novo.
 *
 * Sons: "virar" a cada carta (e quando um par errado desvira), "par" ao
 * achar um par. Errar não tem som de bronca: o jogo é sem nota.
 */
export default function Memoria({ pares, resposta, respondido, onMudar }: Props) {
  const { width } = useWindowDimensions();
  const cartas = useMemo(() => montarCartas(pares), [pares]);

  const [viradas, setViradas] = useState<string[]>([]);
  const [tentativas, setTentativas] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const colunas = pares.length <= 4 ? 2 : 3;
  const larguraCarta = (width - PADDING_TELA * 2 - ESPACO * (colunas - 1)) / colunas;
  const encontrados = Object.keys(resposta).length;
  const terminou = pares.length > 0 && encontrados === pares.length;

  function handleToque(carta: Carta) {
    if (respondido || bloqueado || resposta[carta.parId] || viradas.includes(carta.chave)) return;

    Haptics.selectionAsync();
    tocarSom('virar');
    const novas = [...viradas, carta.chave];
    setViradas(novas);
    if (novas.length < 2) return;

    setTentativas((t) => t + 1);
    const [a, b] = novas.map((chave) => cartas.find((c) => c.chave === chave)!);
    if (a.parId === b.parId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      tocarSom('par');
      onMudar({ ...resposta, [a.parId]: a.parId });
      setViradas([]);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setBloqueado(true);
      timerRef.current = setTimeout(() => {
        tocarSom('virar');
        setViradas([]);
        setBloqueado(false);
      }, TEMPO_ERRO_MS);
    }
  }

  return (
    <View style={styles.container}>
      {/* ao achar todos os pares a mensagem dá uma pulsada */}
      <MotiView
        animate={{ scale: terminou ? [1, 1.12, 1] : 1 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <AppText style={[styles.instrucao, terminou && styles.instrucaoFinal]}>
          {terminou ? 'Você achou todos os pares!' : 'Vire duas cartas e encontre os pares'}
        </AppText>
      </MotiView>
      <AppText style={styles.contador}>
        {encontrados}/{pares.length} pares · {tentativas} {tentativas === 1 ? 'tentativa' : 'tentativas'}
      </AppText>

      <View style={styles.grade}>
        {cartas.map((carta, indice) => {
          const achada = !!resposta[carta.parId];
          const virada = viradas.includes(carta.chave);
          const aberta = achada || virada;
          const errada = virada && bloqueado;

          return (
            <CartaMemoria
              key={carta.chave}
              indice={indice}
              texto={carta.texto}
              larguraCarta={larguraCarta}
              aberta={aberta}
              achada={achada}
              errada={errada}
              disabled={respondido || achada}
              onPress={() => handleToque(carta)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24 },
  instrucao: {
    fontFamily: typography.regular,
    fontSize: 13,
    color: colors.placeholder,
    textAlign: 'center',
  },
  instrucaoFinal: { fontFamily: typography.bold, color: colors.primaryDark },
  contador: {
    fontFamily: typography.semiBold,
    fontSize: 12,
    color: colors.primaryDark,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACO },
  carta: {
    minHeight: 84,
    borderRadius: 14,
    borderWidth: 1.5,
    borderBottomWidth: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartaFechada: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryShadow,
  },
  cartaAberta: {
    backgroundColor: colors.white,
    borderColor: colors.primaryDark,
  },
  cartaErrada: {
    borderColor: colors.exercicioErro,
    backgroundColor: 'rgba(255, 69, 64, 0.10)',
  },
  cartaAchada: {
    backgroundColor: 'rgba(139, 207, 74, 0.16)',
    borderColor: colors.primary,
  },
  cartaTexto: {
    fontFamily: typography.semiBold,
    fontSize: 13,
    color: colors.exercicioTexto,
    textAlign: 'center',
  },
});