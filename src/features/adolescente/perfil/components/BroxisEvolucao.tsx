// src/features/adolescente/perfil/components/BroxisEvolucao.tsx
//
// O Broxis no topo do perfil, na fase atual do aluno, bem "vivo":
//  - pula sem parar, com amassa-e-estica ao pousar (cartoon), num ritmo próprio de cada fase
//    (o Broxinho é mais agitado; o Super Broxis, mais confiante);
//  - balança de um lado para o outro e, de tempos em tempos, dá um pulo maior;
//  - a aura respira e solta ondas; brilhos piscam em volta (folhinhas, estrelinhas ou estrelas);
//  - TOCAR nele faz um pulo com giro, vibração, som e uma explosão de brilhos.
// Com "reduzir movimento" (sistema ou app), fica parado: só a arte e a aura.
// Só Animated com driver nativo; todos os loops são parados ao desmontar ou trocar de fase.
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../../../shared/audio/haptics';
import { tocarSom } from '../../../../shared/audio/sons';
import { useReduzirMovimento } from '../../../../shared/hooks/useReduzirMovimento';
import { colors } from '../../../../shared/theme/colors';
import { ARTE_FASE } from '../data/broxisFasesArte';
import type { FaseId } from '../utils/fasesMascote';

// bebê é visivelmente menor; cresce a cada fase. Mesmo a maior fica a ~90% da aura:
// a arte é de corpo inteiro (capa, tênis e sombra) e passaria da bolinha em 100%.
const ESCALA: Record<FaseId, number> = { filhote: 0.72, jovem: 0.84, adulto: 0.9 };

/** personalidade do movimento: duração de um pulo (ms), altura (px) e brilho de cada fase */
const JEITO: Record<FaseId, { pulo: number; altura: number; icone: keyof typeof Ionicons.glyphMap; cor: string }> = {
  filhote: { pulo: 520, altura: 9, icone: 'leaf', cor: colors.primary },
  jovem: { pulo: 680, altura: 8, icone: 'sparkles', cor: '#FFFFFF' },
  adulto: { pulo: 820, altura: 7, icone: 'star', cor: colors.warning },
};

const QTD_BRILHOS = 6;
const QTD_EXPLOSAO = 8;

type Props = { fase: FaseId; size?: number };

export function BroxisEvolucao({ fase, size = 190 }: Props) {
  const reduzir = useReduzirMovimento();
  const lado = size * ESCALA[fase];
  const jeito = JEITO[fase];

  const pulo = useRef(new Animated.Value(0)).current; // 0 chão .. 1 alto (pulo contínuo)
  const amassa = useRef(new Animated.Value(0)).current; // 0 normal, 1 amassado (pouso)
  const balanco = useRef(new Animated.Value(0)).current; // -1..1
  const puloExtra = useRef(new Animated.Value(0)).current; // pulo grande (a cada ~7 s ou no toque)
  const giro = useRef(new Animated.Value(0)).current; // 0..1 = uma volta (só no toque)
  const respira = useRef(new Animated.Value(0)).current;
  const onda = useRef(new Animated.Value(0)).current;
  const brilhos = useRef(Array.from({ length: QTD_BRILHOS }, () => new Animated.Value(0))).current;
  const explosao = useRef(new Animated.Value(0)).current;
  const ocupado = useRef(false);

  useEffect(() => {
    const valores = [pulo, amassa, balanco, puloExtra, giro, respira, onda, explosao, ...brilhos];
    valores.forEach((v) => v.setValue(0));
    if (reduzir) return;

    const loops: Animated.CompositeAnimation[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];
    const meio = jeito.pulo / 2;

    // pulo contínuo: sobe desacelerando, desce acelerando, amassa ao tocar o chão e estica de volta
    loops.push(
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulo, { toValue: 1, duration: meio, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(amassa, { toValue: -0.6, duration: meio * 0.5, useNativeDriver: true }), // estica subindo
          ]),
          Animated.parallel([
            Animated.timing(pulo, { toValue: 0, duration: meio, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            Animated.timing(amassa, { toValue: 0, duration: meio, useNativeDriver: true }),
          ]),
          Animated.timing(amassa, { toValue: 1, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }), // pousa
          Animated.timing(amassa, { toValue: 0, duration: 160, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
          Animated.delay(fase === 'adulto' ? 260 : 120),
        ]),
      ),
    );

    // balanço lateral, bem mais lento que o pulo
    loops.push(
      Animated.loop(
        Animated.sequence([
          Animated.timing(balanco, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(balanco, { toValue: -1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(balanco, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
    );

    // aura respirando + onda saindo dela
    loops.push(
      Animated.loop(
        Animated.sequence([
          Animated.timing(respira, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(respira, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
    );
    loops.push(
      Animated.loop(
        Animated.sequence([
          Animated.timing(onda, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(onda, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.delay(900),
        ]),
      ),
    );

    // brilhos piscando, cada um no seu tempo
    brilhos.forEach((v, i) => {
      const l = Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 800, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay(500 + i * 170),
        ]),
      );
      loops.push(l);
      timers.push(setTimeout(() => l.start(), i * 330));
    });

    loops.slice(0, 4).forEach((l) => l.start());

    // de vez em quando, um pulo maior "de alegria"
    const intervalo = setInterval(() => {
      if (ocupado.current) return;
      Animated.sequence([
        Animated.timing(puloExtra, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(puloExtra, { toValue: 0, duration: 300, easing: Easing.bounce, useNativeDriver: true }),
      ]).start();
    }, 7000);

    return () => {
      loops.forEach((l) => l.stop());
      timers.forEach(clearTimeout);
      clearInterval(intervalo);
    };
  }, [fase, reduzir, jeito.pulo, pulo, amassa, balanco, puloExtra, giro, respira, onda, explosao, brilhos]);

  const tocar = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    tocarSom('pop');
    if (reduzir || ocupado.current) return;
    ocupado.current = true;
    giro.setValue(0);
    explosao.setValue(0);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(puloExtra, { toValue: 1.8, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(puloExtra, { toValue: 0, duration: 380, easing: Easing.bounce, useNativeDriver: true }),
      ]),
      Animated.timing(giro, { toValue: 1, duration: 620, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.timing(explosao, { toValue: 1, duration: 750, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start(() => {
      giro.setValue(0);
      ocupado.current = false;
    });
  }, [reduzir, giro, explosao, puloExtra]);

  // posições fixas dos brilhos (em volta, na metade de cima) e da explosão (círculo completo)
  const posBrilhos = useMemo(
    () =>
      Array.from({ length: QTD_BRILHOS }, (_, i) => {
        const ang = Math.PI * (1.05 + (i / (QTD_BRILHOS - 1)) * 0.9); // arco de cima
        const r = size * (i % 2 ? 0.47 : 0.42);
        return { x: Math.cos(ang) * r, y: Math.sin(ang) * r * 0.9, tam: i % 2 ? 14 : 18 };
      }),
    [size],
  );
  const posExplosao = useMemo(
    () => Array.from({ length: QTD_EXPLOSAO }, (_, i) => (i / QTD_EXPLOSAO) * Math.PI * 2),
    [],
  );

  const alturaPulo = jeito.altura;
  const subida = Animated.add(
    pulo.interpolate({ inputRange: [0, 1], outputRange: [0, -alturaPulo] }),
    puloExtra.interpolate({ inputRange: [0, 1, 2], outputRange: [0, -22, -44] }),
  );

  return (
    <Pressable
      onPress={tocar}
      accessibilityRole="button"
      accessibilityLabel="Seu Broxis. Toque para ele pular"
      style={[styles.palco, { width: size, height: size }]}
    >
      {/* onda saindo da aura */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.circulo,
          styles.onda,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: onda.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.55, 0] }),
            transform: [{ scale: onda.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.22] }) }],
          },
        ]}
      />
      {/* aura respirando */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.circulo,
          styles.aura,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: respira.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.03] }) }],
          },
        ]}
      />

      {/* brilhos em volta */}
      {!reduzir &&
        posBrilhos.map((p, i) => (
          <Animated.View
            key={`b${i}`}
            pointerEvents="none"
            style={[
              styles.solto,
              {
                opacity: brilhos[i],
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  { scale: brilhos[i].interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
                  { rotate: brilhos[i].interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '15deg'] }) },
                ],
              },
            ]}
          >
            <Ionicons name={jeito.icone} size={p.tam} color={i % 3 === 0 ? colors.warning : jeito.cor} />
          </Animated.View>
        ))}

      {/* explosão do toque */}
      {!reduzir &&
        posExplosao.map((ang, i) => (
          <Animated.View
            key={`e${i}`}
            pointerEvents="none"
            style={[
              styles.solto,
              {
                opacity: explosao.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 1, 0] }),
                transform: [
                  { translateX: explosao.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(ang) * size * 0.55] }) },
                  { translateY: explosao.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(ang) * size * 0.55] }) },
                  { scale: explosao.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1.1, 0.6] }) },
                ],
              },
            ]}
          >
            <Ionicons name={i % 2 ? 'star' : jeito.icone} size={16} color={i % 2 ? colors.warning : colors.primary} />
          </Animated.View>
        ))}

      {/* o Broxis: sobe/desce (fora), amassa/estica a partir dos pés e balança (dentro) */}
      <Animated.View style={{ transform: [{ translateY: subida }] }}>
        <Animated.View
          style={{
            transform: [
              // amassa/estica ancorado nos pés: desloca, escala, desloca de volta
              { translateY: lado / 2 },
              { scaleY: amassa.interpolate({ inputRange: [-1, 0, 1], outputRange: [1.06, 1, 0.9] }) },
              { scaleX: amassa.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.96, 1, 1.08] }) },
              { translateY: -lado / 2 },
              { rotate: balanco.interpolate({ inputRange: [-1, 1], outputRange: ['-4deg', '4deg'] }) },
              { rotateY: giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
            ],
          }}
        >
          <Image source={ARTE_FASE[fase]} style={{ width: lado, height: lado }} resizeMode="contain" accessibilityIgnoresInvertColors />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  palco: { alignItems: 'center', justifyContent: 'center' },
  circulo: { position: 'absolute' },
  aura: { backgroundColor: '#E2F3D3' },
  onda: { borderWidth: 3, borderColor: colors.primary },
  solto: { position: 'absolute' },
});
