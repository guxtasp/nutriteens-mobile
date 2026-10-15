// src/features/adolescente/metricas/components/EstadosMetricas.tsx
// Carregando, erro e "ainda sem dados": o Broxis sempre explica, nunca uma tela vazia.
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../shared/ui/AppText';
import { BroxisMascot } from '../../../../shared/ui/BroxisMascot';
import { SpeechBubble } from '../../../../shared/ui/SpeechBubble';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import type { FeedbackBroxis, ProximoPasso } from '../utils/feedbackBroxis';

export function MetricasCarregando() {
  return (
    <View style={styles.centro} accessibilityLiveRegion="polite">
      <BroxisMascot size={110} pose="pensando" entrance="fade" showParticles={false} />
      <ActivityIndicator color={colors.primaryDark} style={{ marginTop: 16 }} />
      <AppText style={styles.suave}>Juntando seus registros...</AppText>
    </View>
  );
}

export function MetricasErro({ onTentar }: { onTentar: () => void }) {
  return (
    <View style={styles.centro}>
      <BroxisMascot size={110} pose="calmo" entrance="fade" showParticles={false} />
      <AppText style={styles.titulo}>Não consegui buscar seus dados agora</AppText>
      <AppText style={styles.suave}>Seus registros estão salvos. Tente de novo em instantes.</AppText>
      <Botao texto="Tentar de novo" onPress={onTentar} />
    </View>
  );
}

export function MetricasSemDados({ feedback, onProximoPasso }: { feedback: FeedbackBroxis; onProximoPasso: (p: ProximoPasso) => void }) {
  const passo = feedback.proximoPasso;
  return (
    <View style={styles.centro}>
      <BroxisMascot size={120} pose={feedback.pose} entrance="pulo" showParticles={false} />
      <SpeechBubble text={feedback.texto} typewriter={false} style={{ marginTop: 12 }} />
      {passo && <Botao texto={passo.texto} onPress={() => onProximoPasso(passo)} />}
    </View>
  );
}

function Botao({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.botao, { opacity: pressed ? 0.8 : 1 }]}>
      <AppText style={styles.botaoTexto}>{texto}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centro: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 8, gap: 6 },
  titulo: { fontFamily: typography.bold, fontSize: 16, color: '#1B4332', textAlign: 'center', marginTop: 12 },
  suave: { fontFamily: typography.regular, fontSize: 13, color: '#4B4B4B', textAlign: 'center' },
  botao: { minHeight: 48, marginTop: 16, backgroundColor: colors.primaryDark, borderRadius: 16, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  botaoTexto: { fontFamily: typography.bold, fontSize: 14, color: '#fff', textAlign: 'center' },
});
