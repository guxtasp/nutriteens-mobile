// src/features/adolescente/home/components/BroxisTristeFormas.tsx
//
// Versão "triste" do Bróxis feita só de formas (círculos + 1 ícone),
// pensada como wireframe visual pra tela de Sequência — trocar por um PNG
// final do personagem quando a arte estiver pronta, sem mudar quem chama.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const VERDE_BROXIS = '#3FA85C';
const VERDE_BROXIS_ESCURO = '#1B4332';

type Props = { size?: number };

export default function BroxisTristeFormas({ size = 130 }: Props) {
  const cabeca = size;
  const bolha = size * 0.42;

  return (
    <View style={[styles.wrapper, { width: cabeca, height: cabeca * 1.05 }]}>
      {/* "topo" cacheado do brócolis: 3 bolhas verdes sobrepostas */}
      <View style={[styles.bolha, { width: bolha, height: bolha, borderRadius: bolha / 2, top: 0, left: cabeca * 0.02 }]} />
      <View style={[styles.bolha, { width: bolha, height: bolha, borderRadius: bolha / 2, top: -bolha * 0.18, left: cabeca * 0.32 }]} />
      <View style={[styles.bolha, { width: bolha, height: bolha, borderRadius: bolha / 2, top: 0, left: cabeca * 0.58 }]} />

      {/* "rosto": círculo maior por baixo, ícone de tristeza no centro */}
      <View
        style={[
          styles.rosto,
          { width: cabeca * 0.82, height: cabeca * 0.82, borderRadius: (cabeca * 0.82) / 2, top: cabeca * 0.22 },
        ]}
      >
        <Ionicons name="sad-outline" size={cabeca * 0.4} color={VERDE_BROXIS_ESCURO} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  bolha: {
    position: 'absolute',
    backgroundColor: VERDE_BROXIS,
  },
  rosto: {
    position: 'absolute',
    backgroundColor: VERDE_BROXIS,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
