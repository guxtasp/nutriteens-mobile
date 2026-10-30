// src/shared/painel/screens/PainelEmBreve.tsx
//
// Rota já estruturada, tela ainda não implementada. Mantém o menu completo
// navegável sem telas "mortas" e diz em que etapa cada uma entra.
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PainelLayout } from '../PainelLayout';
import { AppText } from '../../ui/AppText';
import { typography } from '../../theme/typography';
import type { ConfigPainel, IconeNome } from '../types';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';

type Props = { config: ConfigPainel; titulo: string; descricao: string; icone: IconeNome };

export function PainelEmBreve({ config, titulo, descricao, icone }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <PainelLayout config={config} titulo={titulo}>
      <View style={styles.card}>
        <View style={styles.icone}>
          <Ionicons name={icone} size={28} color={tema.texto} />
        </View>
        <AppText style={styles.titulo}>Em breve</AppText>
        <AppText style={styles.texto}>{descricao}</AppText>
      </View>
    </PainelLayout>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  card: {
    backgroundColor: t.card,
    borderRadius: t.cardRaio,
    borderWidth: 2,
    borderColor: t.cardBorda,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  icone: { width: 56, height: 56, borderRadius: 18, backgroundColor: t.destaqueSuave, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 16, color: t.texto },
  texto: { fontFamily: typography.regular, fontSize: 13, color: t.textoSuave, textAlign: 'center', maxWidth: 420 },
}) as const;
