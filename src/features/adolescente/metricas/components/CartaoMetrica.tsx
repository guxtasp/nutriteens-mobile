// src/features/adolescente/metricas/components/CartaoMetrica.tsx
//
// Estrutura fixa de todo cartão, que cumpre o princípio "todo gráfico explica algo":
//   1) o que está sendo mostrado (título + descrição)   2) o número principal
//   3) a evolução (selo)   4) o gráfico   5) o que significa + próximo passo (Broxis)
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { typography } from '../../../../shared/theme/typography';
import type { Comparacao } from '../types/metricas';
import { CARTOES_INFO, type CartaoId } from '../utils/cartoesInfo';
import type { FeedbackBroxis, ProximoPasso } from '../utils/feedbackBroxis';
import { ACENTOS, TEXTO_SUAVE } from '../ui/tokens';
import { BroxisFeedback } from './BroxisFeedback';
import { SeloComparacao } from './SeloComparacao';
import { DetalheMetrica } from './DetalheMetrica';
import type { Detalhe } from '../utils/detalhes';

type Props = {
  cartao: CartaoId;
  feedback: FeedbackBroxis;
  destaque?: { valor: string; rotulo: string };
  comparacao?: Comparacao;
  /** gráfico; omitido quando não há dado para desenhar */
  children?: React.ReactNode;
  /** realça o cartão (ex.: conquista nova no período) */
  celebrar?: boolean;
  indice?: number;
  onProximoPasso?: (passo: ProximoPasso) => void;
  /** números de apoio, dicas e sugestões (expande em "Ver detalhes") */
  detalhe?: Detalhe;
  /** observação discreta sobre os dados (limitação conhecida) */
  nota?: string | null;
};

export function CartaoMetrica({ cartao, feedback, destaque, comparacao, children, celebrar, indice = 0, onProximoPasso, detalhe, nota }: Props) {
  const info = CARTOES_INFO[cartao];
  const ac = ACENTOS[cartao];
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320, delay: Math.min(indice, 6) * 70 }}
      style={[styles.cartao, celebrar && { borderColor: ac.cor, borderWidth: 2 }]}
    >
      <View style={styles.cabecalho}>
        <View style={[styles.icone, { backgroundColor: ac.suave }]}>
          <Ionicons name={ac.icone} size={20} color={ac.cor} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText style={styles.titulo} accessibilityRole="header">{info.titulo}</AppText>
          <AppText style={styles.descricao}>{info.oQueMostra}</AppText>
        </View>
      </View>

      {destaque && (
        <View style={styles.destaque}>
          <View style={styles.valorLinha}>
            <AppText style={[styles.valor, { color: ac.cor }]}>{destaque.valor}</AppText>
            <AppText style={styles.rotulo}>{destaque.rotulo}</AppText>
          </View>
          {comparacao && <SeloComparacao comparacao={comparacao} />}
        </View>
      )}

      {!!children && <View style={styles.grafico}>{children}</View>}

      {!!nota && (
        <View style={styles.nota} accessible accessibilityLabel={`Observação: ${nota}`}>
          <Ionicons name="information-circle-outline" size={16} color={TEXTO_SUAVE} />
          <AppText style={styles.notaTexto}>{nota}</AppText>
        </View>
      )}

      <BroxisFeedback feedback={feedback} corFundo={ac.suave} corTexto={ac.cor} onProximoPasso={onProximoPasso} />

      {detalhe && <DetalheMetrica detalhe={detalhe} cor={ac.cor} corSuave={ac.suave} />}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  cartao: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, borderColor: 'transparent', borderWidth: 2 },
  cabecalho: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  icone: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 16, color: '#1B4332' },
  descricao: { fontFamily: typography.regular, fontSize: 12, lineHeight: 17, color: TEXTO_SUAVE, marginTop: 2 },
  destaque: { marginTop: 14, gap: 8 },
  valorLinha: { flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  valor: { fontFamily: typography.bold, fontSize: 36, lineHeight: 42 },
  rotulo: { fontFamily: typography.semiBold, fontSize: 14, color: '#1B4332', flexShrink: 1 },
  grafico: { marginTop: 14 },
  nota: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 10 },
  notaTexto: { flex: 1, fontFamily: typography.regular, fontSize: 12, lineHeight: 17, color: TEXTO_SUAVE },
});
