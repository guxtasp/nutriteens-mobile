// src/shared/ui/InfoSheet.tsx
import React from 'react';
import { View, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  visivel: boolean;
  onFechar: () => void;
  titulo: string;
  icone?: keyof typeof Ionicons.glyphMap;
  explicacao: string;
  exemplo?: string;
};

export function InfoSheet({ visivel, onFechar, titulo, icone = 'information', explicacao, exemplo }: Props) {
  if (!visivel) return null;

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onFechar}>
      <Pressable style={styles.backdrop} onPress={onFechar}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconeCirculo}>
            <Ionicons name={icone} size={32} color="#fff" />
          </View>
          <AppText style={styles.titulo}>{titulo}</AppText>
          <AppText style={styles.explicacao}>{explicacao}</AppText>
          {!!exemplo && (
            <View style={styles.exemploBox}>
              <AppText style={styles.exemploLabel}>Exemplos:</AppText>
              <AppText style={styles.exemploTexto}>{exemplo}</AppText>
            </View>
          )}
          <Pressable style={styles.botaoFechar} onPress={onFechar}>
            <AppText style={styles.botaoFecharTexto}>Entendi</AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(10, 28, 39, 0.55)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28,
  },
  card: { width: '100%', backgroundColor: colors.white, borderRadius: 20, padding: 24, alignItems: 'center' },
  iconeCirculo: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#8BC34A',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  titulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark, marginBottom: 8, textAlign: 'center' },
  explicacao: { fontFamily: typography.regular, fontSize: 14, color: '#5A6B63', textAlign: 'center', lineHeight: 20 },
  exemploBox: { backgroundColor: '#F0F5F1', borderRadius: 12, padding: 12, marginTop: 16, width: '100%' },
  exemploLabel: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark, marginBottom: 4 },
  exemploTexto: { fontFamily: typography.regular, fontSize: 13, color: '#5A6B63' },
  botaoFechar: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 32, backgroundColor: colors.primaryDark, borderRadius: 20 },
  botaoFecharTexto: { fontFamily: typography.bold, fontSize: 13, color: '#fff' },
});