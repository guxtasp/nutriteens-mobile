// src/features/adolescente/trilha/components/exercicios/MascoteFala.tsx
import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { AppText } from '../../../../../shared/ui/AppText';
import { BroxisMascot } from '../../../../../shared/ui/BroxisMascot';
import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';

type Props = {
  children: ReactNode;
};

/**
 * Broxis + balão de fala, igual ao do Recordatório e da EBIA: mesmo mascote
 * (pose "pensando", 70px) e mesmo balão (borda cinza fina, cantos de 16 e
 * setinha à esquerda). O conteúdo do balão é livre (`children`).
 *
 * Animação: o Broxis flutua de leve o tempo todo e o balão aparece com um
 * "pop" (cresce de 90% a 100% com um pouco de mola).
 */
export default function MascoteFala({ children }: Props) {
  return (
    <View style={styles.linha}>
      <MotiView
        from={{ translateY: 0 }}
        animate={{ translateY: -4 }}
        transition={{ type: 'timing', duration: 1500, loop: true, repeatReverse: true }}
      >
        <BroxisMascot pose="pensando" entrance="nenhuma" size={70} showParticles={false} />
      </MotiView>

      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 14, stiffness: 160, delay: 120 }}
        style={styles.balao}
      >
        {children}
        <View style={styles.seta} />
      </MotiView>
    </View>
  );
}

const COR_BORDA_BALAO = '#D9D9D9';

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 20,
  },
  balao: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COR_BORDA_BALAO,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  seta: {
    position: 'absolute',
    left: -10,
    top: '50%',
    marginTop: -8,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: COR_BORDA_BALAO,
  },
  textoSimples: {
    fontFamily: typography.bold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.exercicioTexto,
    textAlign: 'center',
  },
});

/** Enunciado de texto puro dentro do balão (múltipla escolha, V/F). */
export function EnunciadoSimples({ texto }: { texto: string }) {
  return <AppText style={styles.textoSimples}>{texto}</AppText>;
}