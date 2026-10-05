// src/features/adolescente/_shared/components/TabHeader.tsx
//
// Cabeçalho padrão das abas: título à esquerda (mesmo tamanho da saudação da
// Home) e, opcionalmente, algo à direita (ex.: pills de XP e sequência).
// Use em toda aba nova pra o topo ficar sempre na mesma altura e com a mesma
// margem lateral.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { layout } from '../../../../shared/theme/layout';
import { typography } from '../../../../shared/theme/typography';

type Props = {
  titulo: string;
  direita?: React.ReactNode;
};

export default function TabHeader({ titulo, direita }: Props) {
  return (
    <View style={styles.linha}>
      <AppText style={styles.titulo}>{titulo}</AppText>
      {!!direita && <View style={styles.direita}>{direita}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.margemH,
    paddingTop: layout.cabecalhoPaddingTop,
    paddingBottom: layout.cabecalhoPaddingBottom,
  },
  titulo: { fontFamily: typography.bold, fontSize: 24, color: colors.primaryDark },
  direita: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
