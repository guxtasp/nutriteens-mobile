// Tela inicial (boas-vindas) — proposta C do rebrand.
// Fundo verde em degradê, Bróxis grande com balão de fala, chips das áreas do app
// e dois botões. As animações de entrada/loop respeitam "reduzir movimento".
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { AppText } from '../../../shared/ui/AppText';
import { useReduzirMovimento } from '../../../shared/hooks/useReduzirMovimento';
import { acessoProfissionalDisponivel } from '../utils/acessoProfissional';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

// Cores só desta tela (o restante vem de colors.ts)
const AMARELO = '#FCCB28';
const ROSA = '#FF7AA8';
const LARANJA = '#FF9F43';
const VERDE_TEXTO_BOTAO = '#0F3D2E';

// Medidas do desenho (390 x 844). O miolo do Bróxis é desenhado nesta caixa e
// reduzido quando a tela é menor, para nada ficar cortado.
const LARGURA_DESENHO = 390;
const ALTURA_DESENHO = 844;
const HERO_L = 334; // largura da caixa do Bróxis (390 - 2 x 28)
const HERO_A = 384; // altura usada pelo desenho do Bróxis
const BIG = 232;

const CHIPS = [
  { texto: 'Trilhas', cor: colors.primary },
  { texto: 'Desafios', cor: colors.trilhaCeu },
  { texto: 'Conquistas', cor: AMARELO },
];

// x, y (no desenho), atraso, duração do vai-e-vem, rotação, forma, cor
const CONFETES = [
  { x: 30, y: 150, d: 1200, t: 4600, r: 20, tipo: 'tira', cor: AMARELO },
  { x: 338, y: 130, d: 1350, t: 5200, r: -35, tipo: 'tira', cor: ROSA },
  { x: 350, y: 258, d: 1500, t: 4200, r: 0, tipo: 'bola', cor: colors.trilhaCeu },
  { x: 22, y: 292, d: 1650, t: 5600, r: 50, tipo: 'tira', cor: colors.trilhaCeu },
  { x: 66, y: 402, d: 1800, t: 4800, r: 0, tipo: 'bola', cor: LARANJA },
  { x: 340, y: 408, d: 1950, t: 5000, r: -20, tipo: 'tira', cor: AMARELO },
  { x: 300, y: 86, d: 2100, t: 4400, r: 0, tipo: 'bola', cor: colors.primary },
  { x: 92, y: 118, d: 2250, t: 5400, r: 30, tipo: 'tira', cor: colors.white },
] as const;

const curvaPop = Easing.bezier(0.3, 1.5, 0.5, 1);
const curvaDrop = Easing.bezier(0.2, 0.8, 0.2, 1);
const suave = Easing.inOut(Easing.ease);

// ---------- animações ----------

// 0 -> 1 uma vez. Com "reduzir movimento" já começa pronto (1).
function useEntrada(reduzir: boolean, delay: number, duration: number, easing: (v: number) => number) {
  const v = useRef(new Animated.Value(reduzir ? 1 : 0)).current;
  useEffect(() => {
    if (reduzir) {
      v.setValue(1);
      return;
    }
    v.setValue(0);
    const a = Animated.timing(v, { toValue: 1, duration, delay, easing, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [reduzir, v, delay, duration, easing]);
  return v;
}

// Vai-e-vem 0 -> 1 -> 0 em loop (flutuar, brilho). Parado em 0 com "reduzir movimento".
function useVaiEVem(reduzir: boolean, duration: number, delay = 0) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(0);
    if (reduzir) return;
    const a = Animated.sequence([
      Animated.delay(delay),
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: duration / 2, easing: suave, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: duration / 2, easing: suave, useNativeDriver: true }),
        ]),
      ),
    ]);
    a.start();
    return () => a.stop();
  }, [reduzir, v, duration, delay]);
  return v;
}

// 0 -> 1 e volta para 0 de uma vez (anel que se expande e some), em loop.
function useOnda(reduzir: boolean, duration: number, delay: number) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(0);
    if (reduzir) return;
    const a = Animated.sequence([
      Animated.delay(delay),
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ),
    ]);
    a.start();
    return () => a.stop();
  }, [reduzir, v, duration, delay]);
  return v;
}

// ---------- peças ----------

function Brilho({ cor, alpha, tamanho, style }: { cor: string; alpha: number; tamanho: number; style?: object }) {
  // id único por cor: no web os ids de SVG são globais na página
  const id = `brilho-${cor.replace('#', '')}`;
  return (
    <View pointerEvents="none" style={[{ width: tamanho, height: tamanho }, style]}>
      <Svg width={tamanho} height={tamanho}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={cor} stopOpacity={alpha} />
            <Stop offset="0.68" stopColor={cor} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={tamanho} height={tamanho} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

function Confete({ c, reduzir }: { c: (typeof CONFETES)[number]; reduzir: boolean }) {
  const aparecer = useEntrada(reduzir, c.d, 600, Easing.out(Easing.ease));
  const vai = useVaiEVem(reduzir, c.t * 2, c.d);
  const tira = c.tipo === 'tira';
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.confete,
        tira ? styles.confeteTira : styles.confeteBola,
        {
          left: `${(c.x / LARGURA_DESENHO) * 100}%`,
          top: `${(c.y / ALTURA_DESENHO) * 100}%`,
          backgroundColor: c.cor,
          opacity: aparecer,
          transform: [
            { translateY: vai.interpolate({ inputRange: [0, 1], outputRange: [0, 9] }) },
            { rotate: vai.interpolate({ inputRange: [0, 1], outputRange: [`${c.r}deg`, `${c.r + 25}deg`] }) },
          ],
        },
      ]}
    />
  );
}

function Botao({
  label,
  onPress,
  variante,
  style,
}: {
  label: string;
  onPress: () => void;
  variante: 'cheio' | 'contorno';
  style?: object;
}) {
  const cheio = variante === 'cheio';
  return (
    <Animated.View style={[styles.botaoWrap, style]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [
          styles.botao,
          cheio ? styles.botaoCheio : styles.botaoContorno,
          // ao apertar, o relevo "afunda" (igual aos outros botões do app)
          pressed && { transform: [{ translateY: 3 }], borderBottomWidth: 1 },
        ]}
      >
        <AppText style={[styles.botaoTexto, { color: cheio ? VERDE_TEXTO_BOTAO : colors.white }]}>{label}</AppText>
      </Pressable>
    </Animated.View>
  );
}

function rise(v: Animated.Value, reduzir: boolean) {
  return {
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [reduzir ? 0 : 22, 0] }) }],
  };
}

// ---------- tela ----------

export default function OnboardingScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduzir = useReduzirMovimento();
  // o acesso profissional só aparece no computador (ver acessoProfissional.ts)
  const mostrarProfissional = acessoProfissionalDisponivel(Platform.OS, width);

  // espaço que sobrou para o Bróxis (entre o logo e o título) — define a escala do miolo
  const [hero, setHero] = useState({ w: HERO_L, h: HERO_A });
  const aoMedirHero = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setHero((atual) => (atual.w === w && atual.h === h ? atual : { w, h }));
  };
  const escala = Math.max(0.5, Math.min(1, hero.w / HERO_L, hero.h / HERO_A));

  // logo
  const logo = useEntrada(reduzir, 0, 600, curvaDrop);
  // Bróxis grande: aparece girando e depois flutua
  const grande = useEntrada(reduzir, 200, 800, curvaPop);
  const grandeFlutua = useVaiEVem(reduzir, 4000, 1000);
  // Bróxis pequeno (rosa)
  const pequeno = useEntrada(reduzir, 1100, 700, curvaPop);
  const pequenoFlutua = useVaiEVem(reduzir, 4600, 1800);
  // balão
  const balao = useEntrada(reduzir, 900, 550, curvaPop);
  // brilho e anéis
  const brilho = useVaiEVem(reduzir, 5000);
  const anel1 = useOnda(reduzir, 3400, 1200);
  const anel2 = useOnda(reduzir, 3400, 2900);
  // título, chips e botões entram em sequência
  const t1 = useEntrada(reduzir, 1100, 600, Easing.out(Easing.ease));
  const t2 = useEntrada(reduzir, 1250, 600, Easing.out(Easing.ease));
  const t3 = useEntrada(reduzir, 1400, 600, Easing.out(Easing.ease));
  const t4 = useEntrada(reduzir, 1550, 600, Easing.out(Easing.ease));

  const flutuar = (v: Animated.Value) => [
    { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
    { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '3deg'] }) },
  ];
  const pop = (v: Animated.Value) => [
    { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
    { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '0deg'] }) },
  ];
  const anel = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }],
  });

  return (
    <LinearGradient colors={['#186650', colors.background, '#0F4636']} locations={[0, 0.5, 1]} style={styles.container}>
      {/* manchas de cor ao fundo */}
      <Brilho cor={ROSA} alpha={0.22} tamanho={300} style={{ position: 'absolute', right: -110, top: 60 }} />
      <Brilho cor={colors.trilhaCeu} alpha={0.2} tamanho={320} style={{ position: 'absolute', left: -120, top: 330 }} />

      {/* confete */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none" importantForAccessibility="no-hide-descendants">
        {CONFETES.map((c, i) => (
          <Confete key={i} c={c} reduzir={reduzir} />
        ))}
      </View>

      <View style={[styles.conteudo, { paddingTop: Math.max(insets.top + 12, 40), paddingBottom: insets.bottom + 32 }]}>
        <Animated.View
          style={{
            opacity: logo,
            transform: [{ translateY: logo.interpolate({ inputRange: [0, 1], outputRange: [reduzir ? 0 : -18, 0] }) }],
          }}
        >
          <Image
            source={require('../../../../assets/img/logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="NutriTeens"
          />
        </Animated.View>

        {/* Bróxis + balão */}
        <View style={styles.hero} onLayout={aoMedirHero}>
          <View
            style={[
              styles.heroMiolo,
              { left: (hero.w - HERO_L) / 2, transform: [{ scale: escala }], transformOrigin: '50% 0%' },
            ]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.brilhoAmarelo,
                {
                  opacity: brilho.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }),
                  transform: [{ scale: brilho.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
                },
              ]}
            >
              <Brilho cor={AMARELO} alpha={0.34} tamanho={380} />
            </Animated.View>

            {!reduzir && (
              <>
                <Animated.View pointerEvents="none" style={[styles.anel, anel(anel1)]} />
                <Animated.View pointerEvents="none" style={[styles.anel, anel(anel2)]} />
              </>
            )}

            <Animated.Image
              source={require('../../../../assets/img/boas-vindas/broxis-feliz-amarelo.png')}
              accessibilityLabel="Bróxis, o mascote do NutriTeens, muito feliz"
              style={[styles.grande, { opacity: grande.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }), transform: [...pop(grande), ...flutuar(grandeFlutua)] }]}
            />

            <Animated.View
              style={[
                styles.balao,
                {
                  opacity: balao.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }),
                  transformOrigin: '20% 100%',
                  transform: [
                    { scale: balao.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
                    { translateY: balao.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
                  ],
                },
              ]}
            >
              <AppText style={styles.balaoTexto}>Boas-vindas ao NutriTeens!</AppText>
            </Animated.View>

            <Animated.Image
              source={require('../../../../assets/img/boas-vindas/broxis-feliz-rosa.png')}
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={[styles.pequeno, { opacity: pequeno.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }), transform: [...pop(pequeno), ...flutuar(pequenoFlutua)] }]}
            />
          </View>
        </View>

        {/* título */}
        <Animated.View
          style={[styles.titulo, rise(t1, reduzir)]}
          accessible
          accessibilityRole="header"
          accessibilityLabel="Aprenda, brinque e transforme"
        >
          <AppText style={styles.tituloTexto}>Aprenda, brinque e</AppText>
          <View style={styles.destaque}>
            <AppText style={[styles.tituloTexto, { color: colors.primary }]}>transforme</AppText>
            <Svg style={styles.sublinhado} viewBox="0 0 120 10" preserveAspectRatio="none">
              <Path
                d="M2 6 Q 15 1 30 5 T 60 5 T 90 5 T 118 4"
                stroke={AMARELO}
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
              />
            </Svg>
          </View>
        </Animated.View>

        {/* chips */}
        <Animated.View style={[styles.chips, rise(t2, reduzir)]} importantForAccessibility="no-hide-descendants">
          {CHIPS.map((c) => (
            <View key={c.texto} style={styles.chip}>
              <View style={[styles.chipPonto, { backgroundColor: c.cor }]} />
              <AppText style={styles.chipTexto}>{c.texto}</AppText>
            </View>
          ))}
        </Animated.View>

        {/* botões */}
        <View style={styles.botoes}>
          <Animated.View style={rise(t3, reduzir)}>
            <Botao label="COMEÇAR AGORA" variante="cheio" onPress={() => navigation.navigate('AppPresentation')} />
          </Animated.View>
          <Animated.View style={rise(t4, reduzir)}>
            <Botao label="JÁ TENHO UMA CONTA" variante="contorno" onPress={() => navigation.navigate('Login')} />
          </Animated.View>

          {mostrarProfissional && (
            <Pressable
              onPress={() => navigation.navigate('LoginProfissional')}
              accessibilityRole="link"
              style={styles.linkProfissional}
            >
              <AppText style={styles.linkProfissionalTexto}>Sou nutricionista ou administrador</AppText>
            </Pressable>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  conteudo: { flex: 1, alignItems: 'center', paddingHorizontal: 28 },

  logo: { width: 188, height: 55 },

  // área do Bróxis: ocupa o que sobrar de altura
  hero: { width: '100%', flexGrow: 1, minHeight: 0, marginTop: 6 },
  heroMiolo: { position: 'absolute', top: 0, width: HERO_L, height: HERO_A },

  brilhoAmarelo: { position: 'absolute', left: (HERO_L - 380) / 2, top: 40, width: 380, height: 380 },
  anel: {
    position: 'absolute',
    left: (HERO_L - BIG) / 2,
    top: 96,
    width: BIG,
    height: BIG,
    borderRadius: BIG / 2,
    borderWidth: 3,
    borderColor: AMARELO,
  },
  grande: {
    position: 'absolute',
    left: (HERO_L - BIG) / 2,
    top: 96,
    width: BIG,
    height: BIG,
    borderRadius: BIG / 2,
    borderWidth: 7,
    borderColor: colors.white,
    backgroundColor: AMARELO,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 14,
  },
  balao: {
    position: 'absolute',
    left: 0,
    top: 16,
    width: 206,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 6,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 22,
    elevation: 8,
  },
  balaoTexto: { fontFamily: typography.bold, fontSize: 15, lineHeight: 19, color: colors.primaryDark },
  pequeno: {
    position: 'absolute',
    left: 246,
    top: 292,
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: colors.white,
    backgroundColor: ROSA,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 8,
  },

  confete: { position: 'absolute' },
  confeteTira: { width: 12, height: 5, borderRadius: 3 },
  confeteBola: { width: 7, height: 7, borderRadius: 3.5 },

  titulo: { alignItems: 'center', marginTop: 16, marginBottom: 14 },
  tituloTexto: {
    fontFamily: typography.bold,
    fontSize: 31,
    lineHeight: 37,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  destaque: { alignSelf: 'center' },
  sublinhado: { position: 'absolute', left: 0, right: 0, bottom: -4, height: 9 },

  chips: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chipPonto: { width: 7, height: 7, borderRadius: 3.5 },
  chipTexto: { fontFamily: typography.bold, fontSize: 12.5, color: colors.white },

  botoes: { width: '100%', gap: 12 },
  botaoWrap: { width: '100%' },
  botao: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
  },
  botaoCheio: { backgroundColor: colors.primary, borderBottomColor: colors.primaryShadow },
  botaoContorno: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderBottomWidth: 4,
  },
  botaoTexto: { fontFamily: typography.bold, fontSize: 15, letterSpacing: 0.9 },

  // entrada discreta para quem não é adolescente (tem 44 px de altura para o toque)
  linkProfissional: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkProfissionalTexto: {
    fontFamily: typography.semiBold,
    fontSize: 14,
    color: colors.white,
    textDecorationLine: 'underline',
  },
});
