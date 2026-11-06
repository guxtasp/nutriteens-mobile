import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { ProgressBar } from '../../../../shared/ui/ProgressBar';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { Progresso, textoAtual, textoFalta } from '../utils/progresso';
import { estadoDaMissao, ROTULO_ESTADO, type DestinoMissao } from '../utils/destinoMissao';

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
  /** onde a missão pode ser cumprida; sem isso o card não é clicável */
  destino?: DestinoMissao | null;
  onAbrirDestino?: (destino: DestinoMissao) => void;
};

/** Card único para missões diárias, semanais e mensais: barra + "quanto falta". */
export function MissaoProgressoCard({ icone, titulo, descricao, progresso, pontos, pontosCreditados, rodape, destino, onAbrirDestino }: Props) {
  const feita = progresso.concluida;
  const estado = estadoDaMissao(progresso);
  // missão concluída não precisa de atalho: o card só vira botão enquanto há o que fazer
  const acionavel = !!destino && !!onAbrirDestino && !feita;
  const Raiz: React.ElementType = acionavel ? Pressable : View;
  const propsRaiz = acionavel
    ? {
        onPress: () => onAbrirDestino!(destino!),
        accessibilityRole: 'button' as const,
        accessibilityLabel: `${titulo}. ${ROTULO_ESTADO[estado]}. ${destino!.rotulo}`,
      }
    : {};
  return (
    <Raiz style={[styles.card, feita && styles.cardFeita]} {...propsRaiz}>
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

      {/* estado escrito (não só cor/ícone) e, quando há o que fazer, para onde ir */}
      <View style={styles.estadoLinha}>
        <View style={[styles.chipEstado, estado === 'em_andamento' && styles.chipEmAndamento, feita && styles.chipConcluida]}>
          <AppText style={styles.chipEstadoTexto}>{ROTULO_ESTADO[estado]}</AppText>
        </View>
        {acionavel && (
          <View style={styles.irPara}>
            <AppText style={styles.irParaTexto}>{destino!.rotulo}</AppText>
            <Ionicons name="chevron-forward" size={16} color={colors.primaryDark} />
          </View>
        )}
      </View>

      <View style={styles.rodape}>
        <View style={[styles.chipPontos, feita && pontosCreditados && styles.chipPontosGanhos]}>
          <AppText style={styles.chipPontosTexto}>
            {feita && pontosCreditados ? `+${pontos} pontos ganhos` : `+${pontos} pontos`}
          </AppText>
        </View>
        {!!rodape && !feita && <AppText style={styles.prazo}>{rodape}</AppText>}
      </View>
    </Raiz>
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
  estadoLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, minHeight: 28 },
  chipEstado: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  chipEmAndamento: { backgroundColor: '#FFF3D6' },
  chipConcluida: { backgroundColor: colors.primary },
  chipEstadoTexto: { fontSize: 11, fontFamily: typography.bold, color: colors.primaryDark },
  irPara: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 28 },
  irParaTexto: { fontSize: 12, fontFamily: typography.bold, color: colors.primaryDark },
  rodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  chipPontos: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  chipPontosGanhos: { backgroundColor: colors.primary },
  chipPontosTexto: { fontSize: 11, fontFamily: typography.bold, color: colors.primaryDark },
  prazo: { fontSize: 11, fontFamily: typography.semiBold, color: colors.placeholder },
});
