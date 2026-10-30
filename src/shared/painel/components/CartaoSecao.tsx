// src/shared/painel/components/CartaoSecao.tsx
import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../ui/AppText';
import { typography } from '../../theme/typography';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos } from '../tema/TemaPainelContext';
import { AjudaInfo } from './AjudaInfo';

type Props = { titulo: string; subtitulo?: string; ajuda?: string; direita?: React.ReactNode; children: React.ReactNode };

/** Cartão padrão do painel (mesmo raio/borda dos cards do adolescente), claro ou escuro. */
export function CartaoSecao({ titulo, subtitulo, ajuda, direita, children }: Props) {
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.card}>
      <View style={styles.topo}>
        <View style={{ flex: 1, minWidth: 140 }}>
          <View style={styles.linhaTitulo}>
            <AppText style={[styles.titulo, { flexShrink: 1 }]}>{titulo}</AppText>
            {!!ajuda && <AjudaInfo titulo={titulo} texto={ajuda} />}
          </View>
          {!!subtitulo && <AppText style={styles.subtitulo}>{subtitulo}</AppText>}
        </View>
        {!!direita && <View>{direita}</View>}
      </View>
      {children}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  card: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: 2, borderColor: t.cardBorda, padding: 16, gap: 12, minWidth: 0 } as const,
  topo: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 8 } as const,
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8 } as const,
  titulo: { fontFamily: typography.bold, fontSize: 15, color: t.texto } as const,
  subtitulo: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave, marginTop: 2 } as const,
});
