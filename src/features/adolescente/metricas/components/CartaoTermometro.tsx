// src/features/adolescente/metricas/components/CartaoTermometro.tsx
//
// "Mistura da semana/do mês": termômetro da regra de ouro do Guia Alimentar.
// Mesmo visual do CartaoMetrica, mas sem ser um CartaoId (que alimenta feedbacks,
// detalhes, retrospectiva e a Home). Não compara com período anterior nem com ninguém.
//
// Interação (sem animação nova): alternar entre barra e prato; tocar numa parte (barra,
// prato ou chip) para ver os alimentos que entraram nela; vibração leve a cada toque.
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { typography } from '../../../../shared/theme/typography';
import { feedbackSelecao } from '../../../../shared/audio/feedback';
import type { TipoPeriodo } from '../types/metricas';
import type { ProximoPasso } from '../utils/feedbackBroxis';
import type { ClasseMistura, MisturaNova } from '../utils/misturaNova';
import { textoTermometro } from '../utils/textoTermometro';
import { ACENTO_TERMOMETRO, TEXTO_SUAVE } from '../ui/tokens';
import { AlimentosDaClasse } from './AlimentosDaClasse';
import { BroxisFeedback } from './BroxisFeedback';
import { LegendaMistura } from './LegendaMistura';
import { BarraMistura } from './graficos/BarraMistura';
import { PratoMistura } from './graficos/PratoMistura';

type Props = {
  mistura: MisturaNova;
  periodo: TipoPeriodo;
  /** vem da EBIA (só calibra o tom; nunca é exibida) */
  evitarCobranca: boolean;
  semente: string;
  indice?: number;
  onProximoPasso?: (passo: ProximoPasso) => void;
};

type Vista = 'barra' | 'prato';
const VISTAS: { chave: Vista; rotulo: string; icone: 'reorder-two-outline' | 'pie-chart-outline' }[] = [
  { chave: 'barra', rotulo: 'Barra', icone: 'reorder-two-outline' },
  { chave: 'prato', rotulo: 'Prato', icone: 'pie-chart-outline' },
];

export function CartaoTermometro({ mistura, periodo, evitarCobranca, semente, indice = 0, onProximoPasso }: Props) {
  const ac = ACENTO_TERMOMETRO;
  const [vista, setVista] = useState<Vista>('barra');
  const [selecionada, setSelecionada] = useState<ClasseMistura | null>(null);

  const feedback = textoTermometro(mistura.estado, { evitarCobranca, periodo, semente: `${semente}|termometro` });
  const titulo = periodo === 'semana' ? 'Mistura da semana' : 'Mistura do mês';
  const comGrafico = mistura.estado !== 'sem_dados';
  const valores = { natural: mistura.natural, processado: mistura.processado, ultra: mistura.ultra };
  const nota = comGrafico && mistura.semClassificacao > 0
    ? 'Alguns alimentos ainda não têm classificação e ficaram de fora dessa conta.'
    : null;

  // tocar de novo na parte já escolhida a desmarca
  const escolher = (c: ClasseMistura) => {
    feedbackSelecao();
    setSelecionada((atual) => (atual === c ? null : c));
  };
  const trocarVista = (v: Vista) => {
    if (v === vista) return;
    feedbackSelecao();
    setVista(v);
  };

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

      {comGrafico && (
        <View style={styles.grafico}>
          <View style={styles.alternador} accessibilityRole="tablist">
            {VISTAS.map((v) => {
              const ativa = v.chave === vista;
              return (
                <Pressable
                  key={v.chave}
                  onPress={() => trocarVista(v.chave)}
                  accessibilityRole="tab"
                  accessibilityLabel={`Ver como ${v.rotulo.toLowerCase()}`}
                  accessibilityState={{ selected: ativa }}
                  style={[styles.opcao, ativa && styles.opcaoAtiva]}
                >
                  <Ionicons name={v.icone} size={16} color={ativa ? ac.cor : TEXTO_SUAVE} />
                  <AppText style={[styles.opcaoTexto, ativa && { color: ac.cor, fontFamily: typography.bold }]}>{v.rotulo}</AppText>
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: 14 }}>
            {vista === 'barra'
              ? <BarraMistura valores={valores} selecionada={selecionada} onSelecionar={escolher} />
              : <PratoMistura valores={valores} selecionada={selecionada} onSelecionar={escolher} />}
          </View>

          <View style={{ marginTop: 14 }}>
            <LegendaMistura valores={valores} selecionada={selecionada} onSelecionar={escolher} />
          </View>

          {selecionada
            ? <AlimentosDaClasse classe={selecionada} alimentos={mistura.alimentos[selecionada]} />
            : <AppText style={styles.dica}>Toque em uma parte para ver o que entrou nela.</AppText>}
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

const styles = StyleSheet.create({
  cartao: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, borderColor: 'transparent', borderWidth: 2 },
  cabecalho: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  icone: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 16, color: '#1B4332' },
  descricao: { fontFamily: typography.regular, fontSize: 12, lineHeight: 17, color: TEXTO_SUAVE, marginTop: 2 },
  grafico: { marginTop: 14 },
  alternador: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: '#E3E8E5', borderRadius: 12, padding: 3 },
  opcao: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, borderRadius: 9 },
  opcaoAtiva: { backgroundColor: '#fff' },
  opcaoTexto: { fontFamily: typography.semiBold, fontSize: 12.5, color: TEXTO_SUAVE },
  dica: { fontFamily: typography.regular, fontSize: 12, lineHeight: 17, color: TEXTO_SUAVE, marginTop: 12 },
  nota: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 10 },
  notaTexto: { flex: 1, fontFamily: typography.regular, fontSize: 12, lineHeight: 17, color: TEXTO_SUAVE },
});
