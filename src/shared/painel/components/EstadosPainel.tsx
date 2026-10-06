// src/shared/painel/components/EstadosPainel.tsx
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { painel } from '../painelTheme';

export function EstadoCarregando() {
  return (
    <View style={styles.centro}>
      <ActivityIndicator color={colors.primaryDark} />
    </View>
  );
}

export function EstadoErro({ mensagem, onTentar }: { mensagem: string; onTentar?: () => void }) {
  return (
    <View style={[styles.centro, styles.caixaErro]}>
      <Ionicons name="alert-circle-outline" size={28} color={colors.warning} />
      <AppText style={styles.erroTitulo}>Não foi possível carregar</AppText>
      <AppText style={styles.erroTexto}>{mensagem}</AppText>
      {!!onTentar && (
        <AppButton
          label="TENTAR DE NOVO"
          fullWidth={false}
          size="compact"
          backgroundColor={colors.primaryDark}
          textColor={colors.white}
          shadowColor="#123024"
          style={{ paddingHorizontal: 20 }}
          onPress={onTentar}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 8 },
  caixaErro: {
    backgroundColor: colors.white,
    borderRadius: painel.cardRaio,
    borderWidth: 2,
    borderColor: colors.warning,
    paddingHorizontal: 20,
  },
  erroTitulo: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },
  erroTexto: { fontFamily: typography.regular, fontSize: 12, color: painel.textoSuave, textAlign: 'center' },
});
