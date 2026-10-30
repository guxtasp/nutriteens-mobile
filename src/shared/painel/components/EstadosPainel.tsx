// src/shared/painel/components/EstadosPainel.tsx
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { typography } from '../../theme/typography';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';

export function EstadoCarregando() {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.centro}>
      <ActivityIndicator color={tema.destaque} />
    </View>
  );
}

export function EstadoErro({ mensagem, onTentar }: { mensagem: string; onTentar?: () => void }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <View style={[styles.centro, styles.caixaErro]}>
      <Ionicons name="alert-circle-outline" size={28} color={tema.alerta} />
      <AppText style={styles.erroTitulo}>Não foi possível carregar</AppText>
      <AppText style={styles.erroTexto}>{mensagem}</AppText>
      {!!onTentar && (
        <AppButton
          label="TENTAR DE NOVO"
          fullWidth={false}
          size="compact"
          backgroundColor={tema.botaoFundo}
          textColor={tema.botaoTexto}
          shadowColor={tema.botaoSombra}
          style={{ paddingHorizontal: 20 }}
          onPress={onTentar}
        />
      )}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  centro: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 8 } as const,
  caixaErro: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: 2, borderColor: t.alerta, paddingHorizontal: 20 } as const,
  erroTitulo: { fontFamily: typography.bold, fontSize: 15, color: t.texto } as const,
  erroTexto: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave, textAlign: 'center' } as const,
});
