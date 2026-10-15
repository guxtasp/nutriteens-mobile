// src/features/adolescente/metricas/components/BroxisFeedback.tsx
//
// O Broxis explicando o que os números significam. Texto estático (sem digitação)
// para vários cartões na mesma tela não competirem por atenção.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { BroxisMascot } from '../../../../shared/ui/BroxisMascot';
import { typography } from '../../../../shared/theme/typography';
import type { FeedbackBroxis, ProximoPasso } from '../utils/feedbackBroxis';

type Props = {
  feedback: FeedbackBroxis;
  corFundo: string;
  corTexto: string;
  onProximoPasso?: (passo: ProximoPasso) => void;
};

export function BroxisFeedback({ feedback, corFundo, corTexto, onProximoPasso }: Props) {
  const passo = feedback.proximoPasso;
  return (
    <View style={styles.raiz}>
      <View style={styles.linha}>
        <BroxisMascot size={52} pose={feedback.pose} entrance="nenhuma" showParticles={false} />
        <View style={[styles.balao, { backgroundColor: corFundo }]}>
          <AppText style={styles.texto} accessibilityLabel={`Broxis diz: ${feedback.texto}`}>{feedback.texto}</AppText>
        </View>
      </View>
      {passo && onProximoPasso && (
        <Pressable
          onPress={() => onProximoPasso(passo)}
          accessibilityRole="button"
          accessibilityLabel={passo.texto}
          style={({ pressed }) => [styles.passo, { borderColor: corTexto, opacity: pressed ? 0.7 : 1 }]}
        >
          <AppText style={[styles.passoTexto, { color: corTexto }]}>{passo.texto}</AppText>
          <Ionicons name="chevron-forward" size={16} color={corTexto} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: 10, marginTop: 14 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balao: { flex: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10 },
  texto: { fontFamily: typography.medium, fontSize: 13, lineHeight: 19, color: '#1B4332' },
  passo: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14 },
  passoTexto: { flex: 1, fontFamily: typography.bold, fontSize: 13 },
});
