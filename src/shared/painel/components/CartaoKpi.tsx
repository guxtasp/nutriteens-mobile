// src/shared/painel/components/CartaoKpi.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { painel } from '../painelTheme';
import { formatarNumero } from '../formatadores';
import type { IconeNome } from '../types';
import { AjudaInfo } from './AjudaInfo';

type Props = {
  titulo: string;
  valor: number | null | undefined;
  icone: IconeNome;
  /** destaca o cartão (ex.: itens aguardando aprovação) */
  alerta?: boolean;
  detalhe?: string;
  /** explicação curta do indicador (abre ao tocar no "i") */
  ajuda?: string;
};

export function CartaoKpi({ titulo, valor, icone, alerta, detalhe, ajuda }: Props) {
  const cor = alerta ? colors.warning : colors.primaryDark;
  return (
    <View style={[styles.card, alerta && styles.cardAlerta]}>
      <View style={styles.linhaIcone}>
        <View style={[styles.icone, { backgroundColor: alerta ? colors.warningSoft : '#EAF5DE' }]}>
          <Ionicons name={icone} size={20} color={cor} />
        </View>
        {!!ajuda && <AjudaInfo titulo={titulo} texto={ajuda} />}
      </View>
      <AppText style={styles.valor}>{formatarNumero(valor)}</AppText>
      <AppText style={styles.titulo} numberOfLines={2}>
        {titulo}
      </AppText>
      {!!detalhe && <AppText style={styles.detalhe}>{detalhe}</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: painel.card,
    borderRadius: painel.cardRaio,
    borderWidth: 2,
    borderColor: painel.cardBorda,
    padding: 14,
    gap: 4,
    flex: 1,
  },
  cardAlerta: { borderColor: colors.warning },
  linhaIcone: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  icone: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  valor: { fontFamily: typography.bold, fontSize: 26, color: colors.primaryDark },
  titulo: { fontFamily: typography.regular, fontSize: 12, color: painel.textoSuave },
  detalhe: { fontFamily: typography.medium, fontSize: 11, color: painel.textoSuave },
});
