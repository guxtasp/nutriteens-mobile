// src/features/adolescente/metricas/components/graficos/MiniRastreador.tsx
//
// Mini rastreador dos últimos 7 dias, uma linha por hábito (Comida, Água, Movimento).
// Marcado = aconteceu; vazio = só um dia sem registro (sem X e sem vermelho). Estático:
// sem animação. Cada linha abre a aba certa de "Minha jornada".
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../../shared/ui/AppText';
import { typography } from '../../../../../shared/theme/typography';
import { ACENTOS, TEXTO_SUAVE, TRILHO } from '../../ui/tokens';
import type { AbaId } from '../../utils/abas';
import type { CartaoId } from '../../utils/cartoesInfo';
import { rotuloDiaSemana } from '../../utils/periodos';
import type { DiaRastreador } from '../../utils/resumoHome';

type Chave = 'comida' | 'agua' | 'movimento';
const LINHAS: { chave: Chave; rotulo: string; cartao: CartaoId; aba: AbaId }[] = [
  { chave: 'comida', rotulo: 'Comida', cartao: 'alimentacao', aba: 'comida' },
  { chave: 'agua', rotulo: 'Água', cartao: 'agua', aba: 'habitos' },
  { chave: 'movimento', rotulo: 'Movimento', cartao: 'atividade', aba: 'habitos' },
];

const TAM = 20;

type Props = { semana: DiaRastreador[]; onAbrir: (aba: AbaId) => void };

export function MiniRastreador({ semana, onAbrir }: Props) {
  return (
    <View style={{ gap: 2 }}>
      {/* iniciais dos dias, alinhadas com as bolinhas */}
      <View style={styles.linha} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <View style={styles.rotuloCol} />
        {semana.map((d) => (
          <View key={d.data} style={styles.celula}>
            <AppText style={[styles.inicial, d.hoje && { fontFamily: typography.bold, color: '#1B4332' }]}>
              {rotuloDiaSemana(d.data).charAt(0)}
            </AppText>
          </View>
        ))}
      </View>

      {LINHAS.map((l) => {
        const ac = ACENTOS[l.cartao];
        const n = semana.filter((d) => d[l.chave]).length;
        return (
          <Pressable
            key={l.chave}
            onPress={() => onAbrir(l.aba)}
            accessibilityRole="button"
            accessibilityLabel={`${l.rotulo}: ${n} ${n === 1 ? 'dia' : 'dias'} nos últimos ${semana.length}. Abrir detalhes.`}
            style={({ pressed }) => [styles.linha, styles.linhaToque, pressed && { opacity: 0.7 }]}
          >
            <View style={styles.rotuloCol}>
              <Ionicons name={ac.icone} size={16} color={ac.cor} />
              <AppText style={styles.rotulo} numberOfLines={1}>{l.rotulo}</AppText>
            </View>
            {semana.map((d) => {
              const marcado = d[l.chave];
              return (
                <View key={d.data} style={styles.celula} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                  <View
                    style={[
                      styles.bolinha,
                      { backgroundColor: marcado ? ac.cor : TRILHO },
                      d.hoje && { borderWidth: 2, borderColor: ac.cor },
                      d.hoje && !marcado && { backgroundColor: '#fff' },
                    ]}
                  >
                    {marcado && <Ionicons name="checkmark" size={TAM * 0.6} color="#fff" />}
                  </View>
                </View>
              );
            })}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center' },
  linhaToque: { minHeight: 36 },
  rotuloCol: { width: 82, flexDirection: 'row', alignItems: 'center', gap: 6 },
  rotulo: { fontFamily: typography.semiBold, fontSize: 12, color: '#1B4332', flexShrink: 1 },
  celula: { flex: 1, alignItems: 'center' },
  bolinha: { width: TAM, height: TAM, borderRadius: TAM / 2, alignItems: 'center', justifyContent: 'center' },
  inicial: { fontFamily: typography.medium, fontSize: 11, color: TEXTO_SUAVE },
});
