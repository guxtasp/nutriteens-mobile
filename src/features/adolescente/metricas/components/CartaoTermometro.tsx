// src/features/adolescente/metricas/components/CartaoTermometro.tsx
//
// "Mistura da semana/do mês": termômetro da regra de ouro do Guia Alimentar.
// Mesmo visual do CartaoMetrica, mas sem ser um CartaoId (que alimenta feedbacks,
// detalhes, retrospectiva e a Home). Não compara com período anterior nem com ninguém.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { typography } from '../../../../shared/theme/typography';
import type { TipoPeriodo } from '../types/metricas';
import type { ProximoPasso } from '../utils/feedbackBroxis';
import type { MisturaNova } from '../utils/misturaNova';
import { textoTermometro } from '../utils/textoTermometro';
import { ACENTO_TERMOMETRO, TEXTO_SUAVE } from '../ui/tokens';
import { BroxisFeedback } from './BroxisFeedback';
import { BarraMistura } from './graficos/BarraMistura';

type Props = {
  mistura: MisturaNova;
  periodo: TipoPeriodo;
  /** vem da EBIA (só calibra o tom; nunca é exibida) */
  evitarCobranca: boolean;
  semente: string;
  indice?: number;
  onProximoPasso?: (passo: ProximoPasso) => void;
};

export function CartaoTermometro({ mistura, periodo, evitarCobranca, semente, indice = 0, onProximoPasso }: Props) {
  const ac = ACENTO_TERMOMETRO;
  const feedback = textoTermometro(mistura.estado, { evitarCobranca, periodo, semente: `${semente}|termometro` });
  const titulo = periodo === 'semana' ? 'Mistura da semana' : 'Mistura do mês';
  const comBarra = mistura.estado !== 'sem_dados';
  const nota = comBarra && mistura.semClassificacao > 0
    ? 'Alguns alimentos ainda não têm classificação e ficaram de fora dessa conta.'
    : null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320, delay: Math.min(indice, 6) * 70 }}
      style={styles.cartao}
    >
      <View style={styles.cabecalho}>
        <View style={[styles.icone, { backgroundColor: ac.suave }]}>
          <Ionicons name={ac.icone} size={20} color={ac.cor} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText style={styles.titulo} accessibilityRole="header">{titulo}</AppText>
          <AppText style={styles.descricao}>
            A mistura entre alimentos in natura, processados e ultraprocessados, baseada no que você registrou.
          </AppText>
        </View>
      </View>

      {comBarra && (
        <View style={styles.grafico}>
          <BarraMistura
            natural={mistura.natural}
            processado={mistura.processado}
            ultra={mistura.ultra}
            rotuloAcessivel={`Mistura de alimentos registrados: ${rotuloAcessivelEstado(mistura.estado)}`}
          />
        </View>
      )}

      {!!nota && (
        <View style={styles.nota} accessible accessibilityLabel={`Observação: ${nota}`}>
          <Ionicons name="information-circle-outline" size={16} color={TEXTO_SUAVE} />
          <AppText style={styles.notaTexto}>{nota}</AppText>
        </View>
      )}

      <BroxisFeedback feedback={feedback} corFundo={ac.suave} corTexto={ac.cor} onProximoPasso={onProximoPasso} />
    </MotiView>
  );
}

function rotuloAcessivelEstado(estado: MisturaNova['estado']): string {
  switch (estado) {
    case 'mais_natural': return 'predominam alimentos in natura e feitos em casa';
    case 'mais_industrializado': return 'predominam alimentos ultraprocessados';
    default: return 'mistura de in natura, processados e ultraprocessados';
  }
}

const styles = StyleSheet.create({
  cartao: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, borderColor: 'transparent', borderWidth: 2 },
  cabecalho: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  icone: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 16, color: '#1B4332' },
  descricao: { fontFamily: typography.regular, fontSize: 12, lineHeight: 17, color: TEXTO_SUAVE, marginTop: 2 },
  grafico: { marginTop: 14 },
  nota: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 10 },
  notaTexto: { flex: 1, fontFamily: typography.regular, fontSize: 12, lineHeight: 17, color: TEXTO_SUAVE },
});
