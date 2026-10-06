import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import type { MissaoDoDia } from '../../home/services/missaoService';
import { useResumoMissoesHome } from '../hooks/useResumoMissoesHome';
import { intervaloDoPeriodo, nomeDoMes, textoContagem } from '../utils/periodos';
import { textoBarra, textoFalta } from '../utils/progresso';

type Props = { missao: MissaoDoDia; concluida: boolean; onPress: () => void };

/** Barra grossa com o texto centralizado dentro ("700 / 2000"). */
function BarraComTexto({ fracao, texto }: { fracao: number; texto: string }) {
  const pct = Math.round(Math.min(Math.max(fracao, 0), 1) * 100);
  return (
    <View style={styles.trilho}>
      <View style={[styles.preenchimento, { width: `${pct}%` }]} />
      <AppText style={[styles.textoBarra, pct >= 55 && styles.textoBarraSobreVerde]}>{texto}</AppText>
    </View>
  );
}

/**
 * Widget de missões da Home: banner com o mês e a contagem de dias (o Bróxis espia por
 * cima do card), e um card escuro com a missão de HOJE (quanto falta) e o andamento do MÊS.
 * Toque em qualquer parte abre a tela de Missões.
 */
export default function MissoesWidget({ missao, concluida, onPress }: Props) {
  const { progresso, mes } = useResumoMissoesHome(missao);
  const feita = concluida || !!progresso?.concluida;
  // fim do mês calculado no aparelho: aparece na hora, mesmo sem internet
  const { diasRestantes, fim } = intervaloDoPeriodo('MENSAL');
  const [, fimMes, fimDia] = fim.split('-');

  return (
    <Pressable onPress={onPress} style={styles.raiz} accessibilityRole="button" accessibilityLabel="Abrir missões">
      {/* banner (fica atrás do card; o mascote sai por cima do card) */}
      <View style={styles.banner}>
        <AppText style={styles.bannerTitulo}>Missão de {nomeDoMes()}</AppText>
        <View style={styles.contagem}>
          <Ionicons name="time-outline" size={16} color={colors.primaryDark} />
          <AppText style={styles.contagemTexto}>{textoContagem(diasRestantes)}</AppText>
          <AppText style={styles.contagemAte}>· até {fimDia}/{fimMes}</AppText>
        </View>
        <Image source={require('../../../../../assets/img/mascot/broxis-aceno.png')} style={styles.mascote} resizeMode="contain" />
      </View>

      <View style={styles.card}>
        {/* hoje */}
        <View style={styles.hojeTopo}>
          <AppText style={styles.emoji}>{missao.icone ?? '🎯'}</AppText>
          <View style={{ flex: 1 }}>
            <AppText style={styles.rotulo}>MISSÃO DE HOJE · +{missao.pontosRecompensa} pontos</AppText>
            <AppText style={styles.titulo} numberOfLines={1}>{missao.titulo}</AppText>
          </View>
          {feita && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
        </View>
        <AppText style={[styles.falta, feita && styles.faltaFeita]} numberOfLines={2}>
          {feita ? 'Missão cumprida!' : progresso ? textoFalta(progresso) : 'Toque para ver como cumprir'}
        </AppText>
        <BarraComTexto
          fracao={feita ? 1 : progresso?.fracao ?? 0}
          texto={feita ? 'Cumprida' : progresso ? textoBarra(progresso) : '—'}
        />

        {/* mês */}
        <AppText style={[styles.rotulo, { marginTop: 14 }]}>MISSÕES DO MÊS CONCLUÍDAS</AppText>
        <BarraComTexto fracao={mes && mes.total > 0 ? mes.feitas / mes.total : 0} texto={mes ? `${mes.feitas} / ${mes.total}` : '—'} />

        <View style={styles.verTodas}>
          <AppText style={styles.verTodasTexto}>Ver todas</AppText>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  raiz: { marginHorizontal: 16, marginBottom: 12 },
  banner: { height: 112, borderRadius: 22, backgroundColor: colors.primary, paddingHorizontal: 18, paddingTop: 16, zIndex: 1 },
  bannerTitulo: { fontSize: 22, fontFamily: typography.bold, color: colors.primaryDark },
  contagem: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  contagemTexto: { fontSize: 13, fontFamily: typography.bold, color: colors.primaryDark, opacity: 0.75 },
  // cabeça e mão acenando aparecem; o resto do corpo fica escondido atrás do card
  contagemAte: { fontSize: 12, fontFamily: typography.semiBold, color: colors.primaryDark, opacity: 0.6 },
  mascote: { position: 'absolute', right: 14, top: 4, width: 92, height: 146 },
  card: { marginTop: -22, zIndex: 2, backgroundColor: colors.primaryDark, borderRadius: 22, padding: 16 },
  hojeTopo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 26 },
  rotulo: { fontSize: 10, fontFamily: typography.bold, color: colors.primary, letterSpacing: 0.8 },
  titulo: { fontSize: 17, fontFamily: typography.bold, color: '#fff', marginTop: 1 },
  falta: { fontSize: 13, fontFamily: typography.semiBold, color: colors.textOnDarkMuted, marginTop: 8, marginBottom: 8 },
  faltaFeita: { color: colors.primary },
  trilho: { height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden', justifyContent: 'center', marginTop: 6 },
  preenchimento: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 12, backgroundColor: colors.primary },
  textoBarra: { textAlign: 'center', fontSize: 12, fontFamily: typography.bold, color: colors.textOnDarkMuted },
  textoBarraSobreVerde: { color: colors.primaryDark },
  verTodas: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 2, marginTop: 12 },
  verTodasTexto: { fontSize: 12, fontFamily: typography.bold, color: colors.primary },
});
