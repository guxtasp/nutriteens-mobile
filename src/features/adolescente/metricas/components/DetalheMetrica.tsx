// src/features/adolescente/metricas/components/DetalheMetrica.tsx
//
// "Ver detalhes" de um cartão: números de apoio, dicas do Bróxis e sugestões.
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { typography } from '../../../../shared/theme/typography';
import type { Detalhe } from '../utils/detalhes';
import { TEXTO_SUAVE, TRILHO } from '../ui/tokens';

type Props = { detalhe: Detalhe; cor: string; corSuave: string };

export function DetalheMetrica({ detalhe, cor, corSuave }: Props) {
  const [aberto, setAberto] = useState(false);
  const vazio = detalhe.linhas.length === 0 && detalhe.dicas.length === 0 && !detalhe.sugestoes;
  if (vazio) return null;

  return (
    <View style={styles.raiz}>
      <Pressable
        onPress={() => setAberto((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
        accessibilityLabel={aberto ? 'Ocultar detalhes' : 'Ver detalhes'}
        style={({ pressed }) => [styles.botao, { opacity: pressed ? 0.7 : 1 }]}
      >
        <AppText style={[styles.botaoTexto, { color: cor }]}>{aberto ? 'Ocultar detalhes' : 'Ver detalhes'}</AppText>
        <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={18} color={cor} />
      </Pressable>

      {aberto && (
        <MotiView from={{ opacity: 0, translateY: -6 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 220 }}>
          {detalhe.linhas.map((l, i) => (
            <View key={`${l.rotulo}-${i}`} style={[styles.linha, i > 0 && styles.linhaBorda]}>
              <AppText style={styles.rotulo}>{l.rotulo}</AppText>
              <AppText style={[styles.valor, { color: cor }]}>{l.valor}</AppText>
            </View>
          ))}

          {detalhe.sugestoes && (
            <View style={styles.bloco}>
              <AppText style={styles.blocoTitulo}>Ainda não apareceram por aqui</AppText>
              {detalhe.sugestoes.map((s) => (
                <View key={s.titulo} style={{ marginTop: 8 }}>
                  <AppText style={styles.grupo}>{s.titulo}</AppText>
                  <View style={styles.chips}>
                    {s.alimentos.map((n) => (
                      <View key={n} style={[styles.chip, { backgroundColor: corSuave }]}>
                        <AppText style={[styles.chipTexto, { color: cor }]}>{n}</AppText>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {detalhe.dicas.map((d) => (
            <View key={d} style={[styles.dica, { backgroundColor: corSuave }]}>
              <Ionicons name="bulb" size={18} color={cor} />
              <AppText style={styles.dicaTexto}>{d}</AppText>
            </View>
          ))}
        </MotiView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { marginTop: 12, borderTopWidth: 1, borderTopColor: TRILHO },
  botao: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  botaoTexto: { fontFamily: typography.bold, fontSize: 14 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 10 },
  linhaBorda: { borderTopWidth: 1, borderTopColor: TRILHO },
  rotulo: { flex: 1, fontFamily: typography.medium, fontSize: 13, color: TEXTO_SUAVE },
  valor: { flexShrink: 1, textAlign: 'right', fontFamily: typography.bold, fontSize: 14 },
  bloco: { marginTop: 8 },
  blocoTitulo: { fontFamily: typography.bold, fontSize: 13, color: '#1B4332' },
  grupo: { fontFamily: typography.semiBold, fontSize: 12, color: TEXTO_SUAVE, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7 },
  chipTexto: { fontFamily: typography.bold, fontSize: 13 },
  dica: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderRadius: 14, padding: 12, marginTop: 10 },
  dicaTexto: { flex: 1, fontFamily: typography.medium, fontSize: 13, lineHeight: 19, color: '#1B4332' },
});
