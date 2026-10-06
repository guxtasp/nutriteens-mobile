// src/shared/painel/screens/PainelEmBreve.tsx
//
// Rota já estruturada, tela ainda não implementada. Mantém o menu completo
// navegável sem telas "mortas" e diz em que etapa cada uma entra.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PainelLayout } from '../PainelLayout';
import { AppText } from '../../ui/AppText';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { painel } from '../painelTheme';
import type { ConfigPainel, IconeNome } from '../types';

type Props = { config: ConfigPainel; titulo: string; descricao: string; icone: IconeNome };

export function PainelEmBreve({ config, titulo, descricao, icone }: Props) {
  return (
    <PainelLayout config={config} titulo={titulo}>
      <View style={styles.card}>
        <View style={styles.icone}>
          <Ionicons name={icone} size={28} color={colors.primaryDark} />
        </View>
        <AppText style={styles.titulo}>Em breve</AppText>
        <AppText style={styles.texto}>{descricao}</AppText>
      </View>
    </PainelLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: painel.card,
    borderRadius: painel.cardRaio,
    borderWidth: 2,
    borderColor: painel.cardBorda,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  icone: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#EAF5DE', alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  texto: { fontFamily: typography.regular, fontSize: 13, color: painel.textoSuave, textAlign: 'center', maxWidth: 420 },
});
