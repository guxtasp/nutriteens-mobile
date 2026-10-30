// src/shared/painel/components/CartaoAvaliacao.tsx
// Moldura única para qualquer avaliação do participante (EBIA, recordatório e as que vierem):
// ícone + título + selo de situação + data, e o conteúdo logo abaixo. Para acrescentar uma nova
// avaliação basta criar o conteúdo e envolvê-lo neste cartão.
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { typography } from '../../theme/typography';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';
import { AjudaInfo } from './AjudaInfo';

type Props = {
  titulo: string;
  icone: React.ComponentProps<typeof Ionicons>['name'];
  /** texto curto abaixo do título (ex.: "Realizada em 05/10/2026") */
  detalhe?: string;
  /** selo à direita (ex.: <Selo .../>) */
  situacao?: React.ReactNode;
  ajuda?: string;
  children: React.ReactNode;
};

export function CartaoAvaliacao({ titulo, icone, detalhe, situacao, ajuda, children }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.card}>
      <View style={styles.topo}>
        <View style={styles.icone}>
          <Ionicons name={icone} size={20} color={tema.destaque} />
        </View>
        <View style={{ flex: 1, minWidth: 140 }}>
          <View style={styles.linhaTitulo}>
            <AppText style={styles.titulo}>{titulo}</AppText>
            {!!ajuda && <AjudaInfo titulo={titulo} texto={ajuda} />}
          </View>
          {!!detalhe && <AppText style={styles.detalhe}>{detalhe}</AppText>}
        </View>
        {!!situacao && <View>{situacao}</View>}
      </View>
      <View style={styles.corpo}>{children}</View>
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  card: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: 2, borderColor: t.cardBorda, padding: 16, gap: 14, minWidth: 0 } as const,
  topo: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 } as const,
  icone: { width: 40, height: 40, borderRadius: 12, backgroundColor: t.destaqueSuave, alignItems: 'center', justifyContent: 'center' } as const,
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8 } as const,
  titulo: { fontFamily: typography.bold, fontSize: 15, color: t.texto, flexShrink: 1 } as const,
  detalhe: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave, marginTop: 2 } as const,
  corpo: { gap: 12 } as const,
});
