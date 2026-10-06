import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { ProgressBar } from '../../../../shared/ui/ProgressBar';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { Progresso, textoAtual, textoFalta } from '../utils/progresso';

type Props = {
  icone: string | null;
  titulo: string;
  descricao: string;
  progresso: Progresso;
  pontos: number;
  /** os pontos já entraram no seu total */
  pontosCreditados: boolean;
  /** ex.: "Termina amanhã" */
  rodape?: string;
};

/** Card único para missões diárias, semanais e mensais: barra + "quanto falta". */
export function MissaoProgressoCard({ icone, titulo, descricao, progresso, pontos, pontosCreditados, rodape }: Props) {
  const feita = progresso.concluida;
  return (
    <View style={[styles.card, feita && styles.cardFeita]}>
      <View style={styles.topo}>
        <AppText style={styles.icone}>{icone ?? '🎯'}</AppText>
        <View style={{ flex: 1 }}>
          <AppText style={styles.titulo}>{titulo}</AppText>
          <AppText style={styles.descricao}>{descricao}</AppText>
        </View>
        {feita && <Ionicons name="checkmark-circle" size={26} color={colors.success} />}
      </View>

      <View style={styles.barra}>
        <ProgressBar progress={progresso.fracao} />
      </View>

      {/* uma embaixo da outra: unidades longas ("alimento fonte de proteína") não cabem lado a lado */}
      <View style={styles.numeros}>
        <AppText style={[styles.falta, feita && styles.faltaFeita]}>{textoFalta(progresso)}</AppText>
        <AppText style={styles.atual}>{textoAtual(progresso)}</AppText>
      </View>

      <View style={styles.rodape}>
        <View style={[styles.chipPontos, feita && pontosCreditados && styles.chipPontosGanhos]}>
          <AppText style={styles.chipPontosTexto}>
            {feita && pontosCreditados ? `+${pontos} pontos ganhos` : `+${pontos} pontos`}
          </AppText>
        </View>
        {!!rodape && !feita && <AppText style={styles.prazo}>{rodape}</AppText>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  cardFeita: { backgroundColor: colors.exercicioAcertoFundo, borderColor: colors.primary },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icone: { fontSize: 28 },
  titulo: { fontSize: 15, fontFamily: typography.bold, color: colors.primaryDark },
  descricao: { fontSize: 12, color: colors.trilhaChipTexto, marginTop: 2 },
  barra: { marginTop: 14 },
  numeros: { marginTop: 8, gap: 2 },
  atual: { fontSize: 12, fontFamily: typography.semiBold, color: colors.placeholder },
  falta: { fontSize: 12, fontFamily: typography.bold, color: colors.primaryDark },
  faltaFeita: { color: colors.success },
  rodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  chipPontos: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  chipPontosGanhos: { backgroundColor: colors.primary },
  chipPontosTexto: { fontSize: 11, fontFamily: typography.bold, color: colors.primaryDark },
  prazo: { fontSize: 11, fontFamily: typography.semiBold, color: colors.placeholder },
});
