// src/features/adolescente/trocas/components/TileCategoria.tsx
//
// Tile de categoria do hub de trocas ("Bateu vontade de quê?"). Monocromático no verde do app;
// o giro leve alternado é só enfeite e some com "reduzir movimento".
// Animação calma: o tile só aparece com um fade curto (`atraso` em cascata) e o toque muda a cor.
// Sem mola, balanço ou zoom: movimento demais incomodava.
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { feedbackSelecao } from '../../../../shared/audio/feedback';

type Props = {
  nome: string;
  icone: string; // MaterialCommunityIcons
  quantidade: number | null; // null = ainda carregando
  giro: number; // graus
  onPress: () => void;
  larguraInteira?: boolean;
  /** atraso do fade de entrada em ms (cascata) */
  atraso?: number;
  reduzirMovimento?: boolean;
};

export default function TileCategoria({ nome, icone, quantidade, giro, onPress, larguraInteira, atraso = 0, reduzirMovimento }: Props) {
  const [pressionado, setPressionado] = useState(false);
  const rotuloQtd = quantidade === null ? '' : quantidade === 1 ? '1 ideia' : `${quantidade} ideias`;
  return (
    <MotiView
      style={larguraInteira ? styles.inteira : styles.metade}
      from={{ opacity: reduzirMovimento ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 220, delay: atraso }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          setPressionado(true);
          feedbackSelecao();
        }}
        onPressOut={() => setPressionado(false)}
        style={[styles.tile, pressionado && styles.tilePressionado, { transform: [{ rotate: `${giro}deg` }] }]}
        accessibilityRole="button"
        accessibilityLabel={rotuloQtd ? `${nome}, ${rotuloQtd}` : nome}
      >
        <View style={styles.enfeite} accessibilityElementsHidden importantForAccessibility="no" />
        <View style={styles.icone}>
          <MaterialCommunityIcons name={icone as any} size={26} color={colors.primaryDark} />
        </View>
        <View>
          <AppText style={styles.nome} numberOfLines={1}>
            {nome}
          </AppText>
          {!!rotuloQtd && <AppText style={styles.qtd}>{rotuloQtd}</AppText>}
        </View>
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  tile: {
    height: 128,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
    backgroundColor: colors.superficieSuave,
    borderWidth: 1.5,
    borderColor: colors.divisoriaSuave,
    borderBottomWidth: 4,
    borderBottomColor: colors.bordaSuave,
    borderRadius: 22,
  },
  tilePressionado: { backgroundColor: colors.exercicioAcertoFundo, borderColor: colors.primary, borderBottomColor: colors.primary },
  metade: { flexBasis: '47%', flexGrow: 1 },
  inteira: { flexBasis: '100%' },
  enfeite: {
    position: 'absolute',
    right: -10,
    top: -10,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.exercicioAcertoFundo,
    opacity: 0.6,
  },
  icone: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nome: { fontFamily: typography.bold, fontSize: 17, color: colors.primaryDark },
  qtd: { fontFamily: typography.semiBold, fontSize: 12, color: colors.destaqueTexto, marginTop: 2 },
});
