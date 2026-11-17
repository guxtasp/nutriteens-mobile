// src/features/adolescente/metricas/components/CartaoMetricasHome.tsx
//
// Entrada na Home: widget "Minha jornada". Cartão verde-escuro (mesma linguagem do widget de
// Missões) com o Bróxis no canto, o balão com a frase da semana, uma folha branca com o mini
// rastreador dos 7 dias (Comida, Água, Movimento), os atalhos "Mistura da semana" e "Conquistas"
// e o botão principal. TUDO é tocável e cada parte abre a aba certa de "Minha jornada"; toda área
// tocável tem seta/ícone de ação e resposta ao toque. Só ícones (nada de emoji).
// Sem registros ou com erro: versão de convite, com quatro atalhos. Nunca derruba a Home.
import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../../shared/ui/AppText';
import { BroxisMascot } from '../../../../shared/ui/BroxisMascot';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { feedbackToque } from '../../../../shared/audio/feedback';
import { ACENTOS, COR_MISTURA, TEXTO_SUAVE } from '../ui/tokens';
import type { AbaId } from '../utils/abas';
import type { CartaoId } from '../utils/cartoesInfo';
import { useResumoJornadaHome } from '../hooks/useResumoJornadaHome';
import { MiniBarraMistura } from './graficos/MiniBarraMistura';
import { MiniRastreador } from './graficos/MiniRastreador';
import { useTourAlvo } from '../../tour/TourContext';

const ATALHOS: { id: CartaoId; rotulo: string; aba: AbaId }[] = [
  { id: 'alimentacao', rotulo: 'Refeições', aba: 'comida' },
  { id: 'agua', rotulo: 'Água', aba: 'habitos' },
  { id: 'atividade', rotulo: 'Atividade', aba: 'habitos' },
  { id: 'conquistas', rotulo: 'Conquistas', aba: 'conquistas' },
];

const LEGENDA_MISTURA = [
  { chave: 'natural', rotulo: 'Natural' },
  { chave: 'processado', rotulo: 'Processado' },
  { chave: 'ultra', rotulo: 'Ultra' },
] as const;

type Props = { onPress: (aba?: AbaId) => void };

/** Pressable com resposta de toque (leve "afundar") e vibração curta. */
function Toque({
  onPress,
  estilo,
  children,
  rotulo,
}: {
  onPress: () => void;
  estilo?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  rotulo: string;
}) {
  return (
    <Pressable
      onPress={() => {
        feedbackToque();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      android_ripple={{ color: 'rgba(27,67,50,0.12)', borderless: false }}
      style={({ pressed }) => [estilo, pressed && styles.pressionado]}
    >
      {children}
    </Pressable>
  );
}

export default function CartaoMetricasHome({ onPress }: Props) {
  const estado = useResumoJornadaHome();
  const refTour = useTourAlvo('metricas');
  const resumo = estado.status === 'pronto' ? estado.resumo : null;
  const m = resumo?.mistura;
  const conq = resumo?.conquistasNoPeriodo ?? 0;
  const temMistura = !!m && m.estado !== 'sem_dados';

  return (
    <View ref={refTour} collapsable={false} style={styles.sombra}>
      <LinearGradient colors={['#0F3A2C', colors.background, '#2A8A5B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.raiz}>
        {/* bolhas decorativas */}
        <View pointerEvents="none" style={[styles.bolha, { width: 90, height: 90, right: -22, top: -28 }]} />
        <View pointerEvents="none" style={[styles.bolha, { width: 46, height: 46, left: -12, top: 100 }]} />

        {/* topo: título + Bróxis */}
        <View style={styles.topo}>
          <View style={{ flex: 1, paddingRight: 6 }}>
            <AppText style={styles.rotulo}>{resumo && !resumo.semDados ? 'SÓ SEU · ÚLTIMOS 7 DIAS' : 'SÓ SEU'}</AppText>
            <AppText style={styles.titulo} accessibilityRole="header">Minha jornada</AppText>
            <AppText style={styles.sub}>
              {resumo && !resumo.semDados
                ? `${resumo.diasAtivos} de ${resumo.total} dias com registro`
                : estado.status === 'carregando'
                  ? 'Juntando seus registros...'
                  : 'Seus registros vão aparecer aqui, com a ajuda do Bróxis.'}
            </AppText>
          </View>
          <BroxisMascot size={78} pose={resumo?.pose ?? 'pensando'} entrance="nenhuma" showParticles={false} />
        </View>

        {resumo ? (
          <>
            {/* balão do Bróxis (toque abre a jornada) */}
            <Toque
              onPress={() => onPress()}
              rotulo={`Abrir Minha jornada. ${resumo.texto}`}
              estilo={styles.balao}
            >
              <AppText style={styles.balaoTexto}>{resumo.texto}</AppText>
              <View style={styles.balaoSeta}>
                <Ionicons name="chevron-forward" size={16} color={colors.primaryDark} />
              </View>
            </Toque>

            {!resumo.semDados && (
              <>
                {/* folha branca: rastreador (cada linha abre sua aba) */}
                <View style={styles.folha}>
                  <Toque
                    onPress={() => onPress('habitos')}
                    rotulo="Seus hábitos nos últimos 7 dias. Abrir detalhes."
                    estilo={styles.folhaCabecalho}
                  >
                    <AppText style={styles.folhaTitulo}>Seus hábitos</AppText>
                    <View style={styles.verMais}>
                      <AppText style={styles.verMaisTexto}>Detalhes</AppText>
                      <Ionicons name="chevron-forward" size={14} color={colors.primaryShadow} />
                    </View>
                  </Toque>
                  <MiniRastreador semana={resumo.semana} onAbrir={onPress} />
                </View>

                {/* atalhos */}
                <View style={styles.tiles}>
                  <Toque
                    onPress={() => onPress('comida')}
                    rotulo={temMistura ? 'Mistura da semana. Abrir o termômetro.' : 'Mistura da semana. Registre mais refeições para ver. Abrir.'}
                    estilo={[styles.tile, { flex: 1.45 }]}
                  >
                    <View style={styles.tileTopo}>
                      <View style={[styles.tileIcone, { backgroundColor: ACENTOS.alimentacao.suave }]}>
                        <Ionicons name="color-palette" size={15} color={ACENTOS.alimentacao.cor} />
                      </View>
                      <AppText style={styles.tileTitulo} numberOfLines={1}>Mistura da semana</AppText>
                      <Ionicons name="chevron-forward" size={14} color={TEXTO_SUAVE} />
                    </View>
                    {temMistura && m ? (
                      <>
                        <View style={{ marginTop: 11 }}>
                          <MiniBarraMistura valores={{ natural: m.natural, processado: m.processado, ultra: m.ultra }} />
                        </View>
                        <View style={styles.legenda}>
                          {LEGENDA_MISTURA.map((l) => (
                            <View key={l.chave} style={styles.legendaItem}>
                              <View style={[styles.legendaPonto, { backgroundColor: COR_MISTURA[l.chave] }]} />
                              <AppText style={styles.legendaTexto}>{l.rotulo}</AppText>
                            </View>
                          ))}
                        </View>
                      </>
                    ) : (
                      <AppText style={styles.tileSub}>Registre mais refeições para ver.</AppText>
                    )}
                  </Toque>

                  <Toque
                    onPress={() => onPress('conquistas')}
                    rotulo={conq > 0 ? `Conquistas: ${conq} ${conq === 1 ? 'nova' : 'novas'}. Abrir.` : 'Conquistas. Abrir.'}
                    estilo={[styles.tile, { flex: 1 }]}
                  >
                    <View style={styles.tileTopo}>
                      <AppText style={styles.tileTitulo} numberOfLines={1}>Conquistas</AppText>
                      <Ionicons name="chevron-forward" size={14} color={TEXTO_SUAVE} />
                    </View>
                    <View style={styles.conqLinha}>
                      <View style={styles.trofeu}>
                        <Ionicons name={ACENTOS.conquistas.icone} size={20} color={ACENTOS.conquistas.cor} />
                        {conq > 0 && (
                          <View style={styles.trofeuBadge}>
                            <AppText style={styles.trofeuBadgeTexto}>{conq}</AppText>
                          </View>
                        )}
                      </View>
                      <AppText style={styles.conqTexto}>{conq > 0 ? (conq === 1 ? '1 nova pra ver' : `${conq} novas pra ver`) : 'Veja as suas'}</AppText>
                    </View>
                  </Toque>
                </View>
              </>
            )}
          </>
        ) : (
          /* sem dados / carregando / erro: quatro atalhos grandes */
          <View style={styles.atalhos}>
            {ATALHOS.map(({ id, rotulo, aba }) => (
              <Toque key={id} onPress={() => onPress(aba)} rotulo={`${rotulo}. Abrir Minha jornada.`} estilo={styles.atalho}>
                <View style={[styles.atalhoIcone, { backgroundColor: ACENTOS[id].suave }]}>
                  <Ionicons name={ACENTOS[id].icone} size={20} color={ACENTOS[id].cor} />
                </View>
                <AppText style={styles.atalhoTexto} numberOfLines={1}>{rotulo}</AppText>
              </Toque>
            ))}
          </View>
        )}

        <Pressable
          onPress={() => {
            feedbackToque();
            onPress();
          }}
          accessibilityRole="button"
          accessibilityLabel="Ver minha jornada"
          style={({ pressed }) => [styles.botao, pressed && { opacity: 0.9, transform: [{ translateY: 2 }], borderBottomWidth: 2 }]}
        >
          <AppText style={styles.botaoTexto}>Ver minha jornada</AppText>
          <Ionicons name="arrow-forward" size={18} color={colors.primaryDark} />
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  sombra: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 28,
    shadowColor: colors.background,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  raiz: { borderRadius: 28, padding: 16, overflow: 'hidden' },
  bolha: { position: 'absolute', borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)' },
  topo: { flexDirection: 'row', alignItems: 'flex-start' },
  rotulo: { fontSize: 10, fontFamily: typography.bold, color: colors.primary, letterSpacing: 0.9 },
  titulo: { fontSize: 25, fontFamily: typography.bold, color: '#fff', marginTop: 2 },
  sub: { fontSize: 12, lineHeight: 17, fontFamily: typography.semiBold, color: colors.textOnDarkMuted, marginTop: 4 },
  pressionado: { opacity: 0.82, transform: [{ scale: 0.985 }] },

  balao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 11,
    overflow: 'hidden',
  },
  balaoTexto: { flex: 1, fontFamily: typography.semiBold, fontSize: 13, lineHeight: 19, color: colors.primaryDark },
  balaoSeta: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E2F3D3', alignItems: 'center', justifyContent: 'center' },

  folha: { marginTop: 12, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8, overflow: 'hidden' },
  folhaCabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 },
  folhaTitulo: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },
  verMais: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  verMaisTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryShadow },

  tiles: { flexDirection: 'row', gap: 8, marginTop: 8 },
  tile: { minHeight: 82, backgroundColor: '#fff', borderRadius: 18, padding: 12, overflow: 'hidden' },
  tileTopo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tileIcone: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tileTitulo: { flex: 1, fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
  tileSub: { fontFamily: typography.regular, fontSize: 12, lineHeight: 16, color: TEXTO_SUAVE, marginTop: 8 },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 9, rowGap: 2, marginTop: 8 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  legendaPonto: { width: 7, height: 7, borderRadius: 4 },
  legendaTexto: { fontFamily: typography.semiBold, fontSize: 9.5, color: TEXTO_SUAVE },
  conqLinha: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  trofeu: { width: 36, height: 36, borderRadius: 12, backgroundColor: ACENTOS.conquistas.suave, alignItems: 'center', justifyContent: 'center' },
  trofeuBadge: {
    position: 'absolute',
    right: -6,
    top: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#E9578F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trofeuBadgeTexto: { fontFamily: typography.bold, fontSize: 10, color: '#fff' },
  conqTexto: { flex: 1, fontFamily: typography.semiBold, fontSize: 11, lineHeight: 15, color: TEXTO_SUAVE },

  atalhos: { flexDirection: 'row', gap: 8, marginTop: 12 },
  atalho: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, paddingTop: 10, paddingBottom: 8, paddingHorizontal: 2, overflow: 'hidden' },
  atalhoIcone: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  atalhoTexto: { fontFamily: typography.bold, fontSize: 11, color: colors.primaryDark },

  botao: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    borderBottomWidth: 4,
    borderBottomColor: colors.primaryShadow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botaoTexto: { fontSize: 15, fontFamily: typography.bold, color: colors.primaryDark },
});
