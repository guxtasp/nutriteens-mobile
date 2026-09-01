// src/features/adolescente/components/WeekDaySelector.tsx
import React, { useRef, useEffect } from 'react';
import { ScrollView, View, Image, StyleSheet } from 'react-native';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { DiaSemana, IMAGENS_STATUS_DIA } from '../types/statusDia';

type Props = {
  dias: DiaSemana[];
};

const LARGURA_COLUNA = 64;

function ehHoje(status: DiaSemana['status']) {
  return status === 'hoje_pendente' || status === 'hoje_mantido';
}

export default function WeekDaySelector({ dias }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const indiceHoje = dias.findIndex((dia) => ehHoje(dia.status));
    if (indiceHoje >= 0 && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: indiceHoje * LARGURA_COLUNA, animated: false });
      }, 0);
    }
  }, [dias]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.linha}
    >
      {dias.map((dia) => {
        const hoje = ehHoje(dia.status);
        return (
          <View key={dia.data} style={styles.coluna}>
            <View style={[styles.circulo, hoje && styles.circuloHoje]}>
              <Image source={IMAGENS_STATUS_DIA[dia.status]} style={styles.imagem} resizeMode="contain" />
            </View>
            <AppText style={[styles.label, hoje && styles.labelAtivo]}>{dia.label}</AppText>
            <AppText style={[styles.numero, hoje && styles.labelAtivo]}>{dia.numero}</AppText>
          </View>
        );
      })}
    </ScrollView>
  );
}


const styles = StyleSheet.create({

  scroll: { height: 132, flexGrow: 0, marginBottom: 8 },
  linha: { paddingHorizontal: 16, paddingRight: 20, gap: 14 },
  coluna: { alignItems: 'center', width: 80 },
  circulo: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  circuloHoje: { borderWidth: 3, borderColor: colors.primaryDark },
  imagem: { width: 80, height: 80 },
  label: { fontFamily: typography.regular, fontSize: 11, color: '#7A8B94', marginTop: 6 },
  numero: { fontFamily: typography.regular, fontSize: 13, color: '#7A8B94' },
  labelAtivo: { color: colors.primaryDark, fontFamily: typography.bold },
});