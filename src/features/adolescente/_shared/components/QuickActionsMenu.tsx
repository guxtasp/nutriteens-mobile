// src/features/adolescente/components/QuickActionsMenu.tsx
import React, { useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Modal, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';

type Opcao = 'alimentacao' | 'agua' | 'atividade';

type Props = {
  aberto: boolean;
  onFechar: () => void;
  onSelecionar: (opcao: Opcao) => void;
};

const OPCOES: { key: Opcao; label: string; icone: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'alimentacao', label: 'Alimentação', icone: 'restaurant-outline' },
  { key: 'agua', label: 'Água', icone: 'water-outline' },
  { key: 'atividade', label: 'Atividade Física', icone: 'walk-outline' },
];

export default function QuickActionsMenu({ aberto, onFechar, onSelecionar }: Props) {
  // controla se o Modal está montado — precisa ficar montado durante a animação de saída
  const [montado, setMontado] = React.useState(aberto);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const pillTranslateY = useRef(new Animated.Value(40)).current;
  const pillOpacity = useRef(new Animated.Value(0)).current;
  const opcoesOpacity = useRef(OPCOES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (aberto) {
      setMontado(true);
      backdropOpacity.setValue(0);
      pillTranslateY.setValue(40);
      pillOpacity.setValue(0);
      opcoesOpacity.forEach((v) => v.setValue(0));

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pillOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(pillTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.stagger(
          60,
          opcoesOpacity.map((v) =>
            Animated.timing(v, {
              toValue: 1,
              duration: 180,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            })
          )
        ),
      ]).start();
    } else if (montado) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pillOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pillTranslateY, {
          toValue: 40,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => setMontado(false));
    }
  }, [aberto]);

  if (!montado) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onFechar}>
      <Pressable style={styles.backdropTouch} onPress={onFechar}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </Pressable>

      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.wrapper,
          {
            opacity: pillOpacity,
            transform: [{ translateY: pillTranslateY }],
          },
        ]}
      >
        <View style={styles.pill}>
          <Pressable style={styles.fechar} onPress={onFechar}>
            <Ionicons name="close" size={14} color={colors.primaryDark} />
          </Pressable>

          {OPCOES.map((opcao, index) => (
            <Animated.View key={opcao.key} style={[styles.opcao, { opacity: opcoesOpacity[index] }]}>
              <Pressable style={styles.opcaoToque} onPress={() => onSelecionar(opcao.key)}>
                <Ionicons name={opcao.icone} size={30} color="#fff" />
                <AppText style={styles.rotulo}>{opcao.label}</AppText>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 110, // mesmo valor de antes — ajuste conforme a altura real da HomeBottomBar
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
  },
  fechar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  opcao: { flex: 1 },
  opcaoToque: { alignItems: 'center', gap: 2 },
  rotulo: { fontFamily: typography.bold, fontSize: 11, color: '#fff', textAlign: 'center' },
});