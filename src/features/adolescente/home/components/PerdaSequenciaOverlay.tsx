// src/features/adolescente/home/components/PerdaSequenciaOverlay.tsx
//
// Aviso de "perdeu a sequência", com a história contada em animação:
//   1. o foguinho aparece com um "pop" e treme
//   2. o número de dias desce até 0 (contagem regressiva)
//   3. o foguinho apaga soltando fumacinha
//   4. o Bróxis triste cai de cima, quica e fica balançando de leve
//   5. a mensagem entra em sequência (título, frase, recorde)
//   6. o botão "Recomeçar hoje" aparece e pulsa devagar
// Uma chuvinha suave cai o tempo todo ao fundo. Tocar em qualquer lugar pula
// direto para o final. Só opacidade/escala/translação/rotação com driver nativo
// (a contagem é a única animação em JS). Nenhuma cor é animada.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { feedbackPerda } from '../../../../shared/audio/feedback';
import { BroxisTristeAnimado } from './BroxisTristeAnimado';
import { useReduzirMovimento } from '../../../../shared/hooks/useReduzirMovimento';

type Props = {
  visivel: boolean;
  /** chamado quando o adolescente fecha o aviso */
  onFinalizado: () => void;
  /** tamanho da sequência perdida — se informado (e > 1), entra na mensagem e na contagem */
  diasPerdidos?: number;
  /** recorde pessoal — se informado (e > 0), aparece como motivo para recomeçar */
  recorde?: number;
};

const CINZA_APAGADO = '#9AA5A0';
// A arte do Bróxis triste é um PNG de 148 px: acima de ~120 dp ela estoura e perde qualidade.
const TAMANHO_MASCOTE = 120;
const TAMANHO_FOGUINHO = 96;

export function mensagemPerda(diasPerdidos?: number): string {
  return diasPerdidos && diasPerdidos > 1
    ? `Sua sequência de ${diasPerdidos} dias acabou`
    : 'Sua sequência acabou';
}

// posição (% da largura), atraso e duração de cada gotinha da chuva
const GOTAS = [
  { x: 6, atraso: 0, dur: 2600 },
  { x: 17, atraso: 900, dur: 3000 },
  { x: 28, atraso: 300, dur: 2800 },
  { x: 39, atraso: 1500, dur: 3200 },
  { x: 50, atraso: 600, dur: 2700 },
  { x: 61, atraso: 1200, dur: 3100 },
  { x: 72, atraso: 100, dur: 2900 },
  { x: 83, atraso: 1000, dur: 2600 },
  { x: 93, atraso: 500, dur: 3000 },
];

function Gota({ x, atraso, dur, altura, ativa }: { x: number; atraso: number; dur: number; altura: number; ativa: boolean }) {
  const t = useRef(new Animated.Value(0)).current;
  const reduzir = useReduzirMovimento();
  useEffect(() => {
    if (!ativa || reduzir) return;
    t.setValue(0);
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: dur, delay: atraso, easing: Easing.in(Easing.quad), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [ativa, reduzir, atraso, dur, t]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.gota,
        {
          left: `${x}%`,
          opacity: t.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 0.22, 0.22, 0] }),
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-30, altura] }) }],
        },
      ]}
    />
  );
}

export default function PerdaSequenciaOverlay({ visivel, onFinalizado, diasPerdidos, recorde }: Props) {
  const { height } = useWindowDimensions();
  const total = diasPerdidos && diasPerdidos > 1 ? Math.min(diasPerdidos, 999) : 0;
  const [numero, setNumero] = useState(total);
  const [rostoAtivo, setRostoAtivo] = useState(false); // piscar/lágrimas começam quando o Bróxis pousa

  // foguinho
  const foguinhoEntrada = useRef(new Animated.Value(0)).current;
  const foguinhoTremor = useRef(new Animated.Value(0)).current;
  const contagem = useRef(new Animated.Value(0)).current; // 0 -> 1 (JS driver)
  const contagemBump = useRef(new Animated.Value(1)).current;
  const apagar = useRef(new Animated.Value(0)).current;
  const fumaca = useRef(new Animated.Value(0)).current;
  // mascote
  const mascoteEntrada = useRef(new Animated.Value(0)).current;
  const mascoteIdle = useRef(new Animated.Value(0)).current;
  // texto e botão
  const texto = useRef(new Animated.Value(0)).current;
  const botao = useRef(new Animated.Value(0)).current;
  const pulso = useRef(new Animated.Value(0)).current;

  const linha = useRef<Animated.CompositeAnimation | null>(null);
  const loops = useRef<Animated.CompositeAnimation[]>([]);
  const terminou = useRef(false);

  function pararLoops() {
    loops.current.forEach((l) => l.stop());
    loops.current = [];
  }

  function iniciarLoops() {
    pararLoops();
    const idle = Animated.loop(
      Animated.sequence([
        Animated.timing(mascoteIdle, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(mascoteIdle, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const pulsar = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loops.current = [idle, pulsar];
    idle.start();
    pulsar.start();
  }

  /** estado final (usado ao tocar na tela para pular) */
  function irParaOFinal() {
    if (terminou.current) return;
    terminou.current = true;
    linha.current?.stop();
    contagem.stopAnimation();
    setNumero(0);
    foguinhoEntrada.setValue(1);
    foguinhoTremor.setValue(0);
    apagar.setValue(1);
    fumaca.setValue(1);
    mascoteEntrada.setValue(1);
    texto.setValue(1);
    botao.setValue(1);
    setRostoAtivo(true);
    iniciarLoops();
  }

  useEffect(() => {
    if (!visivel) return;
    terminou.current = false;
    setNumero(total);
    [foguinhoEntrada, foguinhoTremor, contagem, apagar, fumaca, mascoteEntrada, mascoteIdle, texto, botao, pulso].forEach((v) =>
      v.setValue(0)
    );
    contagemBump.setValue(1);
    setRostoAtivo(false);
    feedbackPerda();

    // número que desce: só atualiza o texto quando o inteiro muda, e dá um "tec" a cada passo
    let ultimo = total;
    const id = contagem.addListener(({ value }) => {
      const atual = Math.max(0, total - Math.round(value * total));
      if (atual !== ultimo) {
        ultimo = atual;
        setNumero(atual);
        contagemBump.setValue(1.3);
        Animated.spring(contagemBump, { toValue: 1, friction: 5, tension: 160, useNativeDriver: true }).start();
      }
    });

    const tremor = (v: number, ms = 70) =>
      Animated.timing(foguinhoTremor, { toValue: v, duration: ms, easing: Easing.linear, useNativeDriver: true });
    const duracaoContagem = total > 0 ? Math.min(2000, 500 + total * 70) : 0;

    const etapas: Animated.CompositeAnimation[] = [
      // 1. foguinho aparece com pop
      Animated.spring(foguinhoEntrada, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true }),
      // 2. treme enquanto a contagem desce
      Animated.parallel([
        Animated.sequence([tremor(1), tremor(-1), tremor(1), tremor(-1), tremor(0.6), tremor(-0.6), tremor(0.3), tremor(0)]),
        ...(duracaoContagem > 0
          ? [Animated.timing(contagem, { toValue: 1, duration: duracaoContagem, easing: Easing.out(Easing.quad), useNativeDriver: false })]
          : []),
      ]),
      Animated.delay(120),
      // 3. apaga soltando fumaça
      Animated.parallel([
        Animated.timing(apagar, { toValue: 1, duration: 450, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.timing(fumaca, { toValue: 1, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
      // 4. Bróxis cai de cima e quica
      Animated.spring(mascoteEntrada, { toValue: 1, friction: 4, tension: 55, useNativeDriver: true }),
    ];
    const sequencia = Animated.sequence(etapas);
    linha.current = sequencia;
    sequencia.start(({ finished }) => {
      if (!finished || terminou.current) return;
      // o Bróxis pousou: o rosto começa a piscar/chorar e a mensagem entra
      setRostoAtivo(true);
      const fim = Animated.sequence([
        // 5. mensagem em sequência
        Animated.timing(texto, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        // 6. botão
        Animated.spring(botao, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      ]);
      linha.current = fim;
      fim.start(({ finished: ok }) => {
        if (ok && !terminou.current) {
          terminou.current = true;
          iniciarLoops();
        }
      });
    });

    return () => {
      sequencia.stop();
      linha.current?.stop();
      pararLoops();
      contagem.removeListener(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visivel, total]);

  // ---------- estilos animados ----------
  const foguinhoOpacity = Animated.multiply(
    foguinhoEntrada.interpolate({ inputRange: [0, 0.3], outputRange: [0, 1], extrapolate: 'clamp' }),
    apagar.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })
  );
  const foguinhoEscala = Animated.multiply(
    foguinhoEntrada.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
    apagar.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] })
  );
  const foguinhoGiro = foguinhoTremor.interpolate({ inputRange: [-1, 1], outputRange: ['-9deg', '9deg'] });
  const brilhoOpacity = Animated.multiply(
    foguinhoEntrada.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3], extrapolate: 'clamp' }),
    apagar.interpolate({ inputRange: [0, 0.6], outputRange: [1, 0], extrapolate: 'clamp' })
  );
  const numeroOpacity = Animated.multiply(
    foguinhoEntrada.interpolate({ inputRange: [0.5, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
    apagar.interpolate({ inputRange: [0, 0.8], outputRange: [1, 0], extrapolate: 'clamp' })
  );

  const mascoteY = mascoteEntrada.interpolate({ inputRange: [0, 1], outputRange: [-260, 0] });
  const mascoteOpacity = mascoteEntrada.interpolate({ inputRange: [0, 0.25], outputRange: [0, 1], extrapolate: 'clamp' });
  const mascoteEscala = mascoteEntrada.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const idleY = mascoteIdle.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const idleGiro = mascoteIdle.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] });

  const faixa = (de: number, ate: number) => ({
    opacity: texto.interpolate({ inputRange: [de, ate], outputRange: [0, 1], extrapolate: 'clamp' }),
    transform: [{ translateY: texto.interpolate({ inputRange: [de, ate], outputRange: [18, 0], extrapolate: 'clamp' }) }],
  });
  const estiloTitulo = faixa(0, 0.45);
  const estiloLegenda = faixa(0.25, 0.7);
  const estiloRecorde = {
    opacity: texto.interpolate({ inputRange: [0.55, 0.9], outputRange: [0, 1], extrapolate: 'clamp' }),
    transform: [{ scale: texto.interpolate({ inputRange: [0.55, 0.9], outputRange: [0.8, 1], extrapolate: 'clamp' }) }],
  };

  const botaoEscala = Animated.multiply(
    botao.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
    pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] })
  );
  const botaoOpacity = botao.interpolate({ inputRange: [0, 0.4], outputRange: [0, 1], extrapolate: 'clamp' });

  const fumacinhas = useMemo(
    () => [
      { x: -22, subida: 70 },
      { x: 0, subida: 90 },
      { x: 22, subida: 62 },
    ],
    []
  );

  return (
    <Modal visible={visivel} transparent animationType="fade" statusBarTranslucent onRequestClose={onFinalizado}>
      <Pressable style={styles.tudo} onPress={irParaOFinal} accessible={false}>
        <LinearGradient colors={[colors.background, colors.primaryDark]} style={styles.fundo}>
          {GOTAS.map((g, i) => (
            <Gota key={i} {...g} altura={height} ativa={visivel} />
          ))}

          <View style={styles.centro}>
            {/* palco: o foguinho e o Bróxis ocupam o mesmo lugar, um depois do outro */}
            <View style={styles.palco}>
              <Animated.View pointerEvents="none" style={[styles.brilho, { opacity: brilhoOpacity }]} />

              <Animated.View
                pointerEvents="none"
                style={{ opacity: foguinhoOpacity, transform: [{ scale: foguinhoEscala }, { rotate: foguinhoGiro }] }}
              >
                <Ionicons name="flame" size={TAMANHO_FOGUINHO} color={colors.primary} />
              </Animated.View>

              {total > 0 && (
                <Animated.View pointerEvents="none" style={[styles.numeroBloco, { opacity: numeroOpacity, transform: [{ scale: contagemBump }] }]}>
                  <AppText style={styles.numero}>{numero}</AppText>
                </Animated.View>
              )}

              {fumacinhas.map((f, i) => (
                <Animated.View
                  key={i}
                  pointerEvents="none"
                  style={[
                    styles.fumaca,
                    {
                      marginLeft: f.x,
                      opacity: fumaca.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.5, 0] }),
                      transform: [
                        { translateY: fumaca.interpolate({ inputRange: [0, 1], outputRange: [0, -f.subida] }) },
                        { scale: fumaca.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.6] }) },
                      ],
                    },
                  ]}
                />
              ))}

              <Animated.View
                pointerEvents="none"
                style={[
                  styles.mascoteBloco,
                  {
                    opacity: mascoteOpacity,
                    transform: [{ translateY: mascoteY }, { translateY: idleY }, { rotate: idleGiro }, { scale: mascoteEscala }],
                  },
                ]}
              >
                <BroxisTristeAnimado tamanho={TAMANHO_MASCOTE} ativo={rostoAtivo} />
              </Animated.View>
            </View>

            <View style={styles.bloco}>
              <Animated.View style={estiloTitulo}>
                <AppText style={styles.titulo} accessibilityRole="header">
                  {mensagemPerda(diasPerdidos)}
                </AppText>
              </Animated.View>
              <Animated.View style={estiloLegenda}>
                <AppText style={styles.legenda}>
                  Acontece com todo mundo! Registre qualquer coisa hoje e o foguinho acende de novo.
                </AppText>
              </Animated.View>
              {!!recorde && recorde > 0 && (
                <Animated.View style={[styles.recordeChip, estiloRecorde]}>
                  <Ionicons name="trophy" size={14} color={colors.warning} />
                  <AppText style={styles.recordeTexto}>
                    Seu recorde é de {recorde} {recorde === 1 ? 'dia' : 'dias'}. Dá pra bater!
                  </AppText>
                </Animated.View>
              )}
            </View>
          </View>

          <Animated.View style={[styles.botaoContainer, { opacity: botaoOpacity, transform: [{ scale: botaoEscala }] }]}>
            <AppButton label="Recomeçar hoje" onPress={onFinalizado} />
          </Animated.View>
        </LinearGradient>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tudo: { flex: 1 },
  fundo: { flex: 1, paddingHorizontal: 24, paddingTop: 72, paddingBottom: 40, overflow: 'hidden' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gota: {
    position: 'absolute',
    top: 0,
    width: 5,
    height: 12,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  palco: { width: 200, height: 190, alignItems: 'center', justifyContent: 'center' },
  brilho: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.primary,
  },
  numeroBloco: { position: 'absolute', bottom: 0 },
  numero: { fontFamily: typography.bold, fontSize: 40, lineHeight: 46, color: colors.white, textAlign: 'center' },
  fumaca: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: CINZA_APAGADO,
  },
  mascoteBloco: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  bloco: { alignItems: 'center', marginTop: 8, gap: 10, paddingHorizontal: 8 },
  titulo: {
    fontFamily: typography.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.white,
    textAlign: 'center',
  },
  legenda: {
    fontFamily: typography.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textOnDarkMuted,
    textAlign: 'center',
  },
  recordeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(245,166,35,0.16)',
  },
  recordeTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.white },
  botaoContainer: { width: '100%' },
});
