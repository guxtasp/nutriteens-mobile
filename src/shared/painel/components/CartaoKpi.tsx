// src/shared/painel/components/CartaoKpi.tsx
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { typography } from '../../theme/typography';
import { formatarNumero } from '../formatadores';
import { formatarVariacao } from '../utils/widgets';
import type { IconeNome } from '../types';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';
import { AjudaInfo } from './AjudaInfo';
import { Sparkline } from './widgets/Sparkline';

type Props = {
  titulo: string;
  valor: number | null | undefined;
  icone: IconeNome;
  /** destaca o cartão (ex.: itens aguardando aprovação) */
  alerta?: boolean;
  detalhe?: string;
  /** explicação curta do indicador (abre ao tocar no "i") */
  ajuda?: string;
  /** minigráfico com a evolução diária (opcional) */
  sparkline?: number[];
  /** variação % da 2ª metade do período sobre a 1ª (opcional); null esconde a etiqueta */
  tendencia?: number | null;
};

export function CartaoKpi({ titulo, valor, icone, alerta, detalhe, ajuda, sparkline, tendencia }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const cor = alerta ? tema.alerta : tema.texto;
  const subiu = (tendencia ?? 0) >= 0;
  return (
    <View style={[styles.card, alerta && styles.cardAlerta]}>
      <View style={styles.linhaIcone}>
        <View style={[styles.icone, { backgroundColor: alerta ? tema.alertaSuave : tema.destaqueSuave }]}>
          <Ionicons name={icone} size={20} color={alerta ? tema.alerta : tema.destaque} />
        </View>
        {!!ajuda && <AjudaInfo titulo={titulo} texto={ajuda} />}
      </View>
      <View style={styles.linhaValor}>
        <AppText style={[styles.valor, { color: cor }]}>{formatarNumero(valor)}</AppText>
        {tendencia !== null && tendencia !== undefined && (
          <View
            style={[styles.etiqueta, { backgroundColor: subiu ? tema.destaqueSuave : tema.alertaSuave }]}
            accessibilityLabel={`${subiu ? 'Alta' : 'Queda'} de ${formatarVariacao(Math.abs(tendencia))} na segunda metade do período`}
          >
            <Ionicons name={subiu ? 'trending-up' : 'trending-down'} size={12} color={subiu ? tema.destaque : tema.alerta} />
            <AppText style={[styles.etiquetaTexto, { color: subiu ? tema.destaque : tema.alerta }]}>{formatarVariacao(tendencia)}</AppText>
          </View>
        )}
      </View>
      <AppText style={styles.titulo} numberOfLines={2}>
        {titulo}
      </AppText>
      {!!detalhe && <AppText style={styles.detalhe}>{detalhe}</AppText>}
      {!!sparkline && sparkline.length > 1 && <Sparkline valores={sparkline} cor={alerta ? tema.alerta : tema.destaque} />}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  card: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: 2, borderColor: t.cardBorda, padding: 14, gap: 4, flex: 1 } as const,
  cardAlerta: { borderColor: t.alerta } as const,
  linhaIcone: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } as const,
  icone: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 } as const,
  linhaValor: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 } as const,
  valor: { fontFamily: typography.bold, fontSize: 26 } as const,
  etiqueta: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 } as const,
  etiquetaTexto: { fontFamily: typography.bold, fontSize: 11 } as const,
  titulo: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave } as const,
  detalhe: { fontFamily: typography.medium, fontSize: 11, color: t.textoSuave } as const,
});
