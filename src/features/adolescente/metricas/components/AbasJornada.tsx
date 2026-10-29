// src/features/adolescente/metricas/components/AbasJornada.tsx
//
// Abas de seção (Resumo / Comida / Hábitos / Conquistas). Ficam abaixo do seletor de
// período, que continua valendo para todas. Ícone sobre o rótulo para caber 4 abas em
// telas estreitas; a aba ativa usa a cor do cartão que ela representa.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { typography } from '../../../../shared/theme/typography';
import { feedbackSelecao } from '../../../../shared/audio/feedback';
import { ABAS, type AbaId } from '../utils/abas';
import { ACENTOS, TEXTO_SUAVE } from '../ui/tokens';

type Props = { valor: AbaId; onChange: (aba: AbaId) => void };

export function AbasJornada({ valor, onChange }: Props) {
  return (
    <View style={styles.raiz} accessibilityRole="tablist">
      {ABAS.map((aba) => {
        const ativa = aba.id === valor;
        const ac = ACENTOS[aba.cartao];
        return (
          <Pressable
            key={aba.id}
            onPress={() => {
              if (ativa) return;
              feedbackSelecao(); // vibração leve, sem som nem animação
              onChange(aba.id);
            }}
            accessibilityRole="tab"
            accessibilityLabel={aba.rotulo}
            accessibilityState={{ selected: ativa }}
            style={({ pressed }) => [
              styles.aba,
              ativa && { backgroundColor: ac.suave, borderColor: ac.cor },
              pressed && !ativa && { opacity: 0.7 },
            ]}
          >
            <Ionicons name={ac.icone} size={20} color={ativa ? ac.cor : TEXTO_SUAVE} />
            <AppText style={[styles.rotulo, ativa && { color: ac.cor, fontFamily: typography.bold }]} numberOfLines={1}>
              {aba.rotulo}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flexDirection: 'row', gap: 6, marginTop: 12 },
  aba: {
    flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 3,
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: 'transparent', paddingHorizontal: 2,
  },
  rotulo: { fontFamily: typography.semiBold, fontSize: 11.5, color: TEXTO_SUAVE },
});
