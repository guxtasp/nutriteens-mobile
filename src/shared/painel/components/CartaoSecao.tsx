// src/shared/painel/components/CartaoSecao.tsx
import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../ui/AppText';
import { typography } from '../../theme/typography';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos } from '../tema/TemaPainelContext';
import type { AjudaWidget } from '../ajuda';
import { fonte } from '../painelTheme';
import { AjudaInfo } from './AjudaInfo';

type Props = { titulo: string; subtitulo?: string; ajuda?: AjudaWidget; direita?: React.ReactNode; children: React.ReactNode };

/** Cartão padrão do painel: título de seção, ajuda opcional, ação à direita e conteúdo. */
export function CartaoSecao({ titulo, subtitulo, ajuda, direita, children }: Props) {
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.card}>
      <View style={styles.topo}>
        <View style={{ flex: 1, minWidth: 160 }}>
          <View style={styles.linhaTitulo}>
            <AppText style={[styles.titulo, { flexShrink: 1 }]} accessibilityRole="header">
              {titulo}
            </AppText>
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
  card: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: t.borda, borderColor: t.cardBorda, padding: 16, gap: 14, minWidth: 0, flexGrow: 1 } as const,
  topo: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 8 } as const,
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8 } as const,
  titulo: { fontFamily: typography.bold, fontSize: fonte.tituloSecao, color: t.texto } as const,
  subtitulo: { fontFamily: typography.regular, fontSize: fonte.legenda, color: t.textoSuave, marginTop: 2 } as const,
});
