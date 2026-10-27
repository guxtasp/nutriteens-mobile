// src/features/adolescente/metricas/components/CartaoRetrospectiva.tsx
//
// "Seu mês em resumo": destaques reais dos últimos 28 dias. Só celebra; nunca aponta falta.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { BroxisMascot } from '../../../../shared/ui/BroxisMascot';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import type { Retrospectiva } from '../utils/retrospectiva';
import { ACENTOS } from '../ui/tokens';

export function CartaoRetrospectiva({ dados }: { dados: Retrospectiva }) {
  const resumoAcessivel = `${dados.titulo}, ${dados.periodo}. ${dados.destaques.map((d) => `${d.valor} ${d.rotulo}`).join(', ')}.`;
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320 }}
      style={styles.cartao}
    >
      <View accessible accessibilityLabel={resumoAcessivel}>
        <View style={styles.topo}>
          <View style={{ flex: 1 }}>
            <AppText style={styles.periodo}>{dados.periodo}</AppText>
            <AppText style={styles.titulo} accessibilityRole="header">{dados.titulo}</AppText>
          </View>
          <BroxisMascot size={72} pose="supercontente" entrance="pulo" showParticles={false} />
        </View>

        <View style={styles.grade}>
          {dados.destaques.map((d) => (
            <View key={d.rotulo} style={[styles.tile, { backgroundColor: ACENTOS[d.cartao].suave }]}>
              <Ionicons name={ACENTOS[d.cartao].icone} size={18} color={ACENTOS[d.cartao].cor} />
              <AppText style={[styles.valor, { color: ACENTOS[d.cartao].cor }]}>{d.valor}</AppText>
              <AppText style={styles.rotulo}>{d.rotulo}</AppText>
            </View>
          ))}
        </View>

        {dados.conquista && (
          <View style={styles.conquista}>
            <Ionicons name="trophy" size={18} color={colors.primary} />
            <AppText style={styles.conquistaTexto}>Conquista do período: {dados.conquista}</AppText>
          </View>
        )}
        <AppText style={styles.mensagem}>{dados.mensagem}</AppText>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  cartao: { backgroundColor: colors.primaryDark, borderRadius: 22, padding: 16, marginBottom: 14 },
  topo: { flexDirection: 'row', alignItems: 'center' },
  periodo: { fontFamily: typography.bold, fontSize: 12, letterSpacing: 0.8, color: colors.primary },
  titulo: { fontFamily: typography.bold, fontSize: 22, color: '#fff', marginTop: 2 },
  grade: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tile: { flex: 1, borderRadius: 16, padding: 10, gap: 2, minHeight: 96 },
  valor: { fontFamily: typography.bold, fontSize: 26, lineHeight: 32 },
  rotulo: { fontFamily: typography.semiBold, fontSize: 12, lineHeight: 16, color: '#1B4332' },
  conquista: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  conquistaTexto: { flex: 1, fontFamily: typography.bold, fontSize: 13, color: '#fff' },
  mensagem: { fontFamily: typography.medium, fontSize: 13, lineHeight: 19, color: colors.textOnDarkMuted, marginTop: 10 },
});
