// src/features/adolescente/metricas/components/CartaoMetricasHome.tsx
//
// Entrada na Home. Com dados: frase do Bróxis (a mesma do resumo da tela) + os 7 dias.
// Carregando ou erro: versão estática com prévia das áreas. Nunca derruba a Home.
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { BroxisMascot } from '../../../../shared/ui/BroxisMascot';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { ACENTOS, FUNDO, TRILHO } from '../ui/tokens';
import type { CartaoId } from '../utils/cartoesInfo';
import { textoAcessivelDias } from '../utils/apresentacao';
import { useResumoJornadaHome } from '../hooks/useResumoJornadaHome';
import { GraficoDias } from './graficos/GraficoDias';

const CHIPS: { id: CartaoId; rotulo: string }[] = [
  { id: 'alimentacao', rotulo: 'Refeições' },
  { id: 'agua', rotulo: 'Água' },
  { id: 'atividade', rotulo: 'Atividade' },
  { id: 'conquistas', rotulo: 'Conquistas' },
];

export default function CartaoMetricasHome({ onPress }: { onPress: () => void }) {
  const estado = useResumoJornadaHome();
  const resumo = estado.status === 'pronto' ? estado.resumo : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.raiz, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}
      accessibilityRole="button"
      accessibilityLabel="Abrir Minha jornada"
    >
      {resumo ? (
        <>
          <AppText style={styles.rotulo}>MINHA JORNADA · ÚLTIMOS 7 DIAS</AppText>
          <View style={styles.fala}>
            <BroxisMascot size={64} pose={resumo.pose} entrance="nenhuma" showParticles={false} />
            <View style={styles.balao}>
              <AppText style={styles.balaoTexto}>{resumo.texto}</AppText>
            </View>
          </View>
          {!resumo.semDados && (
            <View style={{ marginTop: 12 }}>
              <GraficoDias dias={resumo.dias} cor={colors.primaryDark} rotuloAcessivel={textoAcessivelDias(resumo.diasAtivos, resumo.total, 'com registro ou lição')} />
            </View>
          )}
        </>
      ) : (
        <>
          <View style={styles.topo}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <AppText style={styles.rotulo}>SÓ SEU</AppText>
              <AppText style={styles.titulo}>Minha jornada</AppText>
              <AppText style={styles.sub}>
                {estado.status === 'carregando' ? 'Juntando seus registros...' : 'Veja o que você registrou e aprendeu, com a ajuda do Bróxis.'}
              </AppText>
            </View>
            <Image source={require('../../../../../assets/img/mascot/broxis-pensando.png')} style={styles.mascote} resizeMode="contain" />
          </View>
          <View style={styles.chips}>
            {CHIPS.map(({ id, rotulo }) => (
              <View key={id} style={styles.chip}>
                <View style={[styles.chipIcone, { backgroundColor: ACENTOS[id].suave }]}>
                  <Ionicons name={ACENTOS[id].icone} size={20} color={ACENTOS[id].cor} />
                </View>
                <AppText style={styles.chipTexto} numberOfLines={1}>{rotulo}</AppText>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.botao}>
        <AppText style={styles.botaoTexto}>Ver minha jornada</AppText>
        <Ionicons name="arrow-forward" size={16} color={colors.primaryDark} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  raiz: { marginHorizontal: 16, marginBottom: 12, borderRadius: 24, backgroundColor: FUNDO, borderWidth: 2, borderColor: '#D5E8C2', padding: 16, overflow: 'hidden' },
  topo: { flexDirection: 'row', alignItems: 'flex-start' },
  rotulo: { fontSize: 11, fontFamily: typography.bold, color: colors.primaryShadow, letterSpacing: 0.8 },
  titulo: { fontSize: 24, fontFamily: typography.bold, color: colors.primaryDark, marginTop: 2 },
  sub: { fontSize: 13, lineHeight: 18, fontFamily: typography.semiBold, color: colors.trilhaChipTexto, marginTop: 4 },
  mascote: { width: 84, height: 100 },
  fala: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  balao: { flex: 1, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: TRILHO, paddingHorizontal: 12, paddingVertical: 10 },
  balaoTexto: { fontFamily: typography.medium, fontSize: 13, lineHeight: 19, color: colors.primaryDark },
  chips: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  chip: { alignItems: 'center', flex: 1, gap: 6 },
  chipIcone: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  chipTexto: { fontSize: 12, fontFamily: typography.semiBold, color: colors.primaryDark },
  botao: { marginTop: 16, minHeight: 46, borderRadius: 23, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  botaoTexto: { fontSize: 15, fontFamily: typography.bold, color: colors.primaryDark },
});
