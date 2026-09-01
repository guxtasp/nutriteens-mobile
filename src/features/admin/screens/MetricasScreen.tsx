// src/features/admin/screens/MetricasScreen.tsx
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { MetricasApp, buscarMetricas } from '../services/metricasAdminService';

const LARGURA_GRID_4_COLUNAS = 900;
const LARGURA_GRID_2_COLUNAS = 560;

function CardMetrica({ titulo, valor, largura }: { titulo: string; valor: number; largura: string }) {
  return (
    <View style={[styles.card, { width: largura as any }]}>
      <AppText style={styles.cardValor}>{valor}</AppText>
      <AppText style={styles.cardTitulo}>{titulo}</AppText>
    </View>
  );
}

export default function MetricasScreen() {
  const [metricas, setMetricas] = useState<MetricasApp | null>(null);
  const [carregando, setCarregando] = useState(true);
  const { width } = useWindowDimensions();

  const colunas = width >= LARGURA_GRID_4_COLUNAS ? 4 : width >= LARGURA_GRID_2_COLUNAS ? 2 : 1;
  const larguraCard = colunas === 4 ? '23%' : colunas === 2 ? '48%' : '100%';

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setCarregando(true);
      buscarMetricas().then((dados) => {
        if (ativo) {
          setMetricas(dados);
          setCarregando(false);
        }
      });
      return () => {
        ativo = false;
      };
    }, [])
  );

  return (
    <View style={styles.root}>
      <AppText style={styles.titulo}>Métricas do app</AppText>

      {carregando || !metricas ? (
        <ActivityIndicator color={colors.primaryDark} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.grid}>
          <CardMetrica titulo="Adolescentes cadastrados" valor={metricas.totalAdolescentes} largura={larguraCard} />
          <CardMetrica titulo="Novos nos últimos 7 dias" valor={metricas.novosUltimos7Dias} largura={larguraCard} />
          <CardMetrica titulo="Alimentos no catálogo" valor={metricas.totalAlimentos} largura={larguraCard} />
          <CardMetrica titulo="Receitas cadastradas" valor={metricas.totalReceitas} largura={larguraCard} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 24, paddingTop: 20, maxWidth: 1100, width: '100%', alignSelf: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 12,
    padding: 20,
  },
  cardValor: { fontFamily: typography.bold, fontSize: 28, color: colors.primaryDark },
  cardTitulo: { fontFamily: typography.regular, fontSize: 13, color: '#8A8A8A', marginTop: 6 },
});