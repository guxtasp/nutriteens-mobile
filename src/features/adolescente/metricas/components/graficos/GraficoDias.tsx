// src/features/adolescente/metricas/components/graficos/GraficoDias.tsx
//
// Uma bolinha por dia. Marcado = aconteceu; vazio = só um dia sem registro
// (sem X, sem vermelho). 7 dias = uma linha com o nome do dia; 28 dias = 4 linhas.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../../shared/ui/AppText';
import { typography } from '../../../../../shared/theme/typography';
import { agruparEmSemanas } from '../../utils/apresentacao';
import { rotuloDiaSemana } from '../../utils/periodos';
import { TRILHO, TEXTO_SUAVE } from '../../ui/tokens';

export type DiaMarcado = { data: string; marcado: boolean };
type Props = { dias: DiaMarcado[]; cor: string; rotuloAcessivel: string };

export function GraficoDias({ dias, cor, rotuloAcessivel }: Props) {
  const semana = dias.length <= 7;
  const linhas = agruparEmSemanas(dias);
  const tam = semana ? 32 : 26;
  const ultimo = dias.length - 1;
  return (
    <View accessible accessibilityLabel={rotuloAcessivel} style={{ gap: 8 }}>
      {linhas.map((linha, li) => (
        <View key={li} style={styles.linha}>
          {linha.map((d, i) => {
            const idx = li * 7 + i;
            const hoje = idx === ultimo;
            return (
              <View key={d.data} style={styles.coluna}>
                <MotiView
                  from={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'timing', duration: 220, delay: idx * 18 }}
                  style={[
                    styles.bolinha,
                    { width: tam, height: tam, borderRadius: tam / 2, backgroundColor: d.marcado ? cor : TRILHO },
                    hoje && { borderWidth: 2, borderColor: cor },
                  ]}
                >
                  {d.marcado && <Ionicons name="checkmark" size={tam * 0.6} color="#fff" />}
                </MotiView>
                {semana && <AppText style={[styles.rotulo, hoje && { fontFamily: typography.bold, color: cor }]}>{rotuloDiaSemana(d.data)}</AppText>}
              </View>
            );
          })}
        </View>
      ))}
      {!semana && <AppText style={styles.legenda}>Cada bolinha é um dia; a última (com borda) é hoje.</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', justifyContent: 'space-between' },
  coluna: { flex: 1, alignItems: 'center', gap: 4 },
  bolinha: { alignItems: 'center', justifyContent: 'center' },
  rotulo: { fontFamily: typography.medium, fontSize: 12, color: TEXTO_SUAVE },
  legenda: { fontFamily: typography.regular, fontSize: 12, color: TEXTO_SUAVE },
});
