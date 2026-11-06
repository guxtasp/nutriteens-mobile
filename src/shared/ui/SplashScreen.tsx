import React, { useEffect, useRef, useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, Animated, Easing, AccessibilityInfo } from 'react-native';

// Amarelo da marca: o mesmo do ícone do app e da splash nativa (app.json),
// para a troca da splash nativa para esta tela ser imperceptível.
export const AMARELO_SPLASH = '#FCCB28';
const VERDE_ESCURO = '#1F5138';

// Tela exibida enquanto o app carrega (fontes, sessão).
// Fica FORA dos providers em App.tsx, então não usa contexto: lê o "reduzir
// movimento" do sistema direto. (A chave do app em Mais > Acessibilidade não
// vale aqui porque ela só é lida depois que o app carrega.)
export default function SplashScreen() {
  const [reduzir, setReduzir] = useState(false);
  const pulo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let ativo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => ativo && setReduzir(v))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  // Bróxis dá um pulinho suave em repetição enquanto carrega
  useEffect(() => {
    if (reduzir) {
      pulo.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulo, { toValue: 1, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulo, { toValue: 0, duration: 520, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(280),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [reduzir, pulo]);

  const translateY = pulo.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando o NutriTeens"
    >
      <Animated.Image
        // Bróxis "supercontente" (o mesmo dos feedbacks): o círculo amarelo da imagem
        // tem a cor do fundo, então só o mascote e os brilhos aparecem.
        source={require('../../../assets/img/feedback/supercontente.png')}
        style={[styles.mascote, { transform: [{ translateY }] }]}
        resizeMode="contain"
      />
      <Image
        source={require('../../../assets/img/logo.png')} // Logo NutriTeens
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color={VERDE_ESCURO} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AMARELO_SPLASH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascote: {
    width: 190,
    height: 196,
    marginBottom: 8,
  },
  logo: {
    width: 230,
    height: 67,
    marginBottom: 20,
  },
  loader: {
    marginTop: 24,
  },
});
