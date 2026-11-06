// src/features/adolescente/perfil/components/ComoGanharPontos.tsx
//
// Cartão recolhível "Como ganhar pontos" do extrato de XP.
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { COMO_GANHAR_XP } from '../utils/comoGanharXp';
import { iconeOrigem } from '../utils/extratoXp';

export function ComoGanharPontos() {
  const [aberto, setAberto] = useState(false);
  return (
    <View style={styles.cartao}>
      <Pressable
        onPress={() => setAberto((v) => !v)}
        style={styles.cabecalho}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
        accessibilityLabel="Como ganhar pontos"
        accessibilityHint={aberto ? 'Toque para recolher' : 'Toque para ver as formas de ganhar pontos'}
      >
        <Ionicons name="help-circle-outline" size={20} color={colors.primaryDark} />
        <AppText style={styles.titulo}>Como ganhar pontos?</AppText>
        <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primaryDark} />
      </Pressable>
      {aberto &&
        COMO_GANHAR_XP.map((f) => (
          <View key={f.origem} style={styles.linha}>
            <Ionicons name={iconeOrigem(f.origem) as any} size={18} color={colors.primaryDark} style={styles.icone} />
            <View style={styles.textos}>
              <AppText style={styles.linhaTitulo}>{f.titulo}</AppText>
              <AppText style={styles.linhaTexto}>{f.texto}</AppText>
            </View>
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: { backgroundColor: colors.white, borderRadius: 16, paddingHorizontal: 16, marginBottom: 20 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52 },
  titulo: { flex: 1, fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },
  linha: { flexDirection: 'row', gap: 12, paddingBottom: 14 },
  icone: { marginTop: 2 },
  textos: { flex: 1 },
  linhaTitulo: { fontFamily: typography.semiBold, fontSize: 14, color: colors.primaryDark },
  linhaTexto: { fontFamily: typography.regular, fontSize: 13, lineHeight: 18, color: '#5F6B66' },
});
