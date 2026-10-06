// src/shared/painel/components/CartaoSecao.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../ui/AppText';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { painel } from '../painelTheme';
import { AjudaInfo } from './AjudaInfo';

type Props = { titulo: string; subtitulo?: string; ajuda?: string; direita?: React.ReactNode; children: React.ReactNode };

/** Cartão branco padrão (mesmo raio/borda dos cards do adolescente). */
export function CartaoSecao({ titulo, subtitulo, ajuda, direita, children }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.topo}>
        <View style={{ flex: 1, minWidth: 140 }}>
          <View style={styles.linhaTitulo}>
            <AppText style={[styles.titulo, { flexShrink: 1 }]}>{titulo}</AppText>
            {!!ajuda && <AjudaInfo titulo={titulo} texto={ajuda} />}
          </View>
          {!!subtitulo && <AppText style={styles.subtitulo}>{subtitulo}</AppText>}
        </View>
        {!!direita && <View>{direita}</View>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: painel.card,
    borderRadius: painel.cardRaio,
    borderWidth: 2,
    borderColor: painel.cardBorda,
    padding: 16,
    gap: 12,
    minWidth: 0,
  },
  topo: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 8 },
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titulo: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },
  subtitulo: { fontFamily: typography.regular, fontSize: 12, color: painel.textoSuave, marginTop: 2 },
});
