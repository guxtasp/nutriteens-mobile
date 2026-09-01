// src/features/adolescente/home/components/EstatisticaPill.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../../../../shared/ui/AppText';
import { typography } from '../../../../shared/theme/typography';

type Props = {
  /** Ionicons/MaterialCommunityIcons etc. já instanciado com size/color prontos */
  icone: React.ReactNode;
  valor: number | string;
  /** cor do texto e da borda do pill */
  cor: string;
  /** rótulo opcional depois do valor, ex.: "XP" */
  sufixo?: string;
};

export default function EstatisticaPill({ icone, valor, cor, sufixo }: Props) {
  return (
    <View style={[styles.pill, { borderColor: cor }]}>
      {icone}
      <AppText style={[styles.texto, { color: cor }]}>
        {valor}
        {sufixo ? ` ${sufixo}` : ''}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  texto: {
    fontFamily: typography.bold,
    fontSize: 13,
  },
});
