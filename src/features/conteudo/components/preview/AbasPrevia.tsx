// src/features/conteudo/components/preview/AbasPrevia.tsx
// Alternância entre as duas prévias: "uso" (como o adolescente vê, sem gabarito) e "revisão"
// (visão editorial, com gabarito e avisos).
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';

export type AbaPrevia = 'uso' | 'revisao';

export function AbasPrevia({ aba, onTrocar, rotuloRevisao = 'Revisão (com gabarito)' }: { aba: AbaPrevia; onTrocar: (a: AbaPrevia) => void; rotuloRevisao?: string }) {
  const itens: { chave: AbaPrevia; rotulo: string }[] = [
    { chave: 'uso', rotulo: 'Como o adolescente vê' },
    { chave: 'revisao', rotulo: rotuloRevisao },
  ];
  return (
    <View style={styles.linha} accessibilityRole="tablist">
      {itens.map((i) => (
        <Pressable key={i.chave} onPress={() => onTrocar(i.chave)} accessibilityRole="tab" accessibilityState={{ selected: aba === i.chave }} style={[styles.aba, aba === i.chave && styles.abaOn]}>
          <AppText style={[styles.texto, aba === i.chave && { color: colors.white }]}>{i.rotulo}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  aba: { minHeight: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 2, borderColor: '#D9D9D9', justifyContent: 'center', backgroundColor: colors.white },
  abaOn: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  texto: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },
});
