// src/features/adolescente/trilha/components/exercicios/MascoteFala.tsx
import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../../../../../shared/ui/AppText';
import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';

type Props = {
  children: ReactNode;
};

/**
 * Avatar do Broxis + balão de fala — mesmo padrão visual em todos os
 * formatos. O conteúdo do balão é livre (`children`): texto simples pra
 * múltipla escolha/V-F, ou a frase com a lacuna (ver FraseComLacuna em
 * CompletarFrase.tsx) quando o formato é "completar". Placeholder de
 * emoji até existir a ilustração oficial do mascote nesse contexto (ver
 * BroxisTristeFormas.tsx na Home pra um exemplo já ilustrado).
 */
export default function MascoteFala({ children }: Props) {
  return (
    <View style={styles.linha}>
      <View style={styles.avatar}>
        <AppText style={styles.emoji}>🥦</AppText>
      </View>
      <View style={styles.balao}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 30 },
  balao: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  textoSimples: {
    fontFamily: typography.bold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textOnLight,
    textAlign: 'center',
  },
});

/** Enunciado de texto puro dentro do balão (múltipla escolha, V/F). */
export function EnunciadoSimples({ texto }: { texto: string }) {
  return <AppText style={styles.textoSimples}>{texto}</AppText>;
}
