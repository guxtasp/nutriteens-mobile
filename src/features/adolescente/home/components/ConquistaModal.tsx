// src/features/adolescente/home/components/ConquistaModal.tsx
//
// Tela de vitória única do app: insígnia, medalha ou troféu (três níveis, como nas referências),
// com confete e botão "Continuar". Reutilizável: sequência, desafio em grupo, "fizemos juntos".
// Arte de formas (Ionicons) até existirem os PNGs finais; trocar só o miolo de `Emblema`.
// Tom de celebração sem comparar com ninguém e sem ranking.
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Modal, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { AppButton } from '../../../../shared/ui/AppButton';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { rotuloNivel, type NivelConquista } from '../utils/marcosSequencia';

type Props = {
  visivel: boolean;
  nivel: NivelConquista;
  titulo: string;
  /** frase curta abaixo do título */
  descricao?: string;
  /** linhas de destaque (ex.: "7 dias seguidos") */
  destaques?: string[];
  rotuloBotao?: string;
  onFechar: () => void;
};

const VISUAL: Record<NivelConquista, { icone: keyof typeof Ionicons.glyphMap; cor: string; fundo: string }> = {
  INSIGNIA: { icone: 'ribbon', cor: '#E8505B', fundo: '#FDE7E9' },
  MEDALHA: { icone: 'medal', cor: '#F5A623', fundo: '#FEF1DA' },
  TROFEU: { icone: 'trophy', cor: '#E0A800', fundo: '#FFF6CC' },
};

function Emblema({ nivel }: { nivel: NivelConquista }) {
  const v = VISUAL[nivel];
  return (
    <View style={[estilos.hexagono, { backgroundColor: v.fundo, borderColor: v.cor }]}>
      <Ionicons name={v.icone} size={72} color={v.cor} />
    </View>
  );
}

export default function ConquistaModal({ visivel, nivel, titulo, descricao, destaques = [], rotuloBotao = 'CONTINUAR', onFechar }: Props) {
  const [reduzir, setReduzir] = useState(false);
  const escala = useRef(new Animated.Value(0.5)).current;
  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduzir).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!visivel) return;
    escala.setValue(0.5);
    opacidade.setValue(0);
    const a = Animated.parallel([
      Animated.timing(opacidade, { toValue: 1, duration: 240, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.spring(escala, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
    ]);
    a.start();
    return () => a.stop();
  }, [visivel, escala, opacidade]);

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onFechar}>
      <View style={estilos.fundo}>
        {visivel && !reduzir && (
          <ConfettiCannon count={90} origin={{ x: -10, y: 0 }} fadeOut autoStart explosionSpeed={350} fallSpeed={2800}
            colors={['#E8505B', '#F5A623', '#4AA3F0', '#8BCF4A', '#A66BE6']} />
        )}
        <View style={estilos.cartao} accessibilityViewIsModal>
          <Animated.View style={{ opacity: opacidade, transform: [{ scale: escala }], alignItems: 'center' }}>
            <Emblema nivel={nivel} />
          </Animated.View>
          <AppText style={estilos.nivel}>{rotuloNivel(nivel).toUpperCase()}</AppText>
          <AppText style={estilos.titulo}>{titulo}</AppText>
          {!!descricao && <AppText style={estilos.descricao}>{descricao}</AppText>}
          {destaques.length > 0 && (
            <View style={estilos.destaques}>
              {destaques.map((d) => (
                <View key={d} style={estilos.linhaDestaque}>
                  <Ionicons name="star" size={12} color={VISUAL[nivel].cor} />
                  <AppText style={estilos.textoDestaque}>{d}</AppText>
                </View>
              ))}
            </View>
          )}
          <AppButton label={rotuloBotao} onPress={onFechar} />
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  cartao: { backgroundColor: colors.white, borderRadius: 24, padding: 24, gap: 10, alignItems: 'stretch' },
  hexagono: { width: 140, height: 140, borderRadius: 40, borderWidth: 4, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '0deg' }] },
  nivel: { textAlign: 'center', fontFamily: typography.bold, fontSize: 12, letterSpacing: 2, color: '#7A8B94', marginTop: 8 },
  titulo: { textAlign: 'center', fontFamily: typography.bold, fontSize: 24, color: colors.primaryDark },
  descricao: { textAlign: 'center', fontFamily: typography.regular, fontSize: 14, lineHeight: 20, color: '#5A6B64' },
  destaques: { gap: 6, alignSelf: 'center', marginVertical: 6 },
  linhaDestaque: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  textoDestaque: { fontFamily: typography.semiBold, fontSize: 13, color: colors.primaryDark },
});
