// src/shared/ui/SeloPeriodo.tsx
//
// Selo fixo que diz a QUE PERÍODO a pergunta da tela se refere. Existe porque duas etapas
// seguidas da triagem falam de tempos diferentes (recordatório = ontem; EBIA = últimos
// meses) e o adolescente misturava as respostas. Fica fora da rolagem, sempre visível.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { typography } from '../theme/typography';

type Props = {
  titulo: string;
  detalhe?: string;
  icone?: React.ComponentProps<typeof Ionicons>['name'];
  /** cores do selo; padrão âmbar (atenção sem parecer erro) */
  cor?: string;
  corFundo?: string;
};

export function SeloPeriodo({ titulo, detalhe, icone = 'calendar', cor = '#8A5A06', corFundo = '#FDEBC8' }: Props) {
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={detalhe ? `${titulo}. ${detalhe}` : titulo}
      style={[styles.selo, { backgroundColor: corFundo, borderColor: cor }]}
    >
      <Ionicons name={icone} size={22} color={cor} />
      <View style={styles.textos}>
        <AppText style={[styles.titulo, { color: cor }]}>{titulo}</AppText>
        {!!detalhe && <AppText style={[styles.detalhe, { color: cor }]}>{detalhe}</AppText>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  selo: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  textos: { flex: 1 },
  titulo: { fontFamily: typography.bold, fontSize: 14, lineHeight: 19 },
  detalhe: { fontFamily: typography.medium, fontSize: 12, lineHeight: 16 },
});
