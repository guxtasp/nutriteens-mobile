// src/features/adolescente/metricas/components/CartaoMetricasHome.tsx
//
// Entrada na Home. Com dados: frase do Bróxis + mini rastreador dos 7 dias (Comida, Água,
// Movimento) + mini termômetro da mistura + conquistas. Cada parte abre a aba certa de
// "Minha jornada". Carregando ou erro: versão estática com prévia das áreas. Nunca derruba
// a Home. Estático: sem animação nova.
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { BroxisMascot } from '../../../../shared/ui/BroxisMascot';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { ACENTOS, FUNDO, TEXTO_SUAVE, TRILHO } from '../ui/tokens';
import type { AbaId } from '../utils/abas';
import type { CartaoId } from '../utils/cartoesInfo';
import { useResumoJornadaHome } from '../hooks/useResumoJornadaHome';
import { MiniBarraMistura } from './graficos/MiniBarraMistura';
import { MiniRastreador } from './graficos/MiniRastreador';

const CHIPS: { id: CartaoId; rotulo: string }[] = [
  { id: 'alimentacao', rotulo: 'Refeições' },
  { id: 'agua', rotulo: 'Água' },
  { id: 'atividade', rotulo: 'Atividade' },
  { id: 'conquistas', rotulo: 'Conquistas' },
];

type Props = { onPress: (aba?: AbaId) => void };

export default function CartaoMetricasHome({ onPress }: Props) {
  const estado = useResumoJornadaHome();
  const resumo = estado.status === 'pronto' ? estado.resumo : null;
  const m = resumo?.mistura;
  const conq = resumo?.conquistasNoPeriodo ?? 0;

  return (
    <View style={styles.raiz}>
      {resumo ? (
        <>
          <Pressable
            onPress={() => onPress()}
            accessibilityRole="button"
            accessibilityLabel={`Abrir Minha jornada. ${resumo.texto}`}
            style={({ pressed }) => pressed && { opacity: 0.9 }}
          >
            <AppText style={styles.rotulo}>MINHA JORNADA · ÚLTIMOS 7 DIAS</AppText>
            <View style={styles.fala}>
              <BroxisMascot size={60} pose={resumo.pose} entrance="nenhuma" showParticles={false} />
              <View style={styles.balao}>
                <AppText style={styles.balaoTexto}>{resumo.texto}</AppText>
              </View>
            </View>
          </Pressable>

          {!resumo.semDados && (
            <>
              <View style={styles.bloco}>
                <MiniRastreador semana={resumo.semana} onAbrir={onPress} />
              </View>

              <View style={styles.tiles}>
                <Pressable
                  onPress={() => onPress('comida')}
                  accessibilityRole="button"
                  accessibilityLabel={m && m.estado !== 'sem_dados' ? 'Mistura da semana. Abrir o termômetro.' : 'Mistura da semana. Registre mais refeições para ver. Abrir.'}
                  style={({ pressed }) => [styles.tile, { flex: 1.5 }, pressed && { opacity: 0.8 }]}
                >
                  <AppText style={styles.tileTitulo}>Mistura da semana</AppText>
                  {m && m.estado !== 'sem_dados'
                    ? <View style={{ marginTop: 10 }}><MiniBarraMistura valores={{ natural: m.natural, processado: m.processado, ultra: m.ultra }} /></View>
                    : <AppText style={styles.tileSub}>Registre mais refeições para ver.</AppText>}
                </Pressable>

                <Pressable
                  onPress={() => onPress('conquistas')}
                  accessibilityRole="button"
                  accessibilityLabel={conq > 0 ? `Conquistas: ${conq} ${conq === 1 ? 'nova' : 'novas'}. Abrir.` : 'Conquistas. Abrir.'}
                  style={({ pressed }) => [styles.tile, { flex: 1 }, pressed && { opacity: 0.8 }]}
                >
                  <View style={styles.tileLinha}>
                    <Ionicons name={ACENTOS.conquistas.icone} size={16} color={ACENTOS.conquistas.cor} />
                    <AppText style={styles.tileTitulo}>Conquistas</AppText>
                  </View>
                  <AppText style={styles.tileSub}>{conq > 0 ? `${conq} ${conq === 1 ? 'nova' : 'novas'}` : 'Veja as suas'}</AppText>
                </Pressable>
              </View>
            </>
          )}
        </>
      ) : (
        <Pressable
          onPress={() => onPress()}
          accessibilityRole="button"
          accessibilityLabel="Abrir Minha jornada"
          style={({ pressed }) => pressed && { opacity: 0.9 }}
        >
          <View style={styles.topo}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <AppText style={styles.rotulo}>SÓ SEU</AppText>
              <AppText style={styles.titulo}>Minha jornada</AppText>
              <AppText style={styles.sub}>
                {estado.status === 'carregando' ? 'Juntando seus registros...' : 'Veja o que você registrou e aprendeu, com a ajuda do Bróxis.'}
              </AppText>
            </View>
            <Image source={require('../../../../../assets/img/mascot/broxis-pensando.png')} style={styles.mascote} resizeMode="contain" />
          </View>
          <View style={styles.chips}>
            {CHIPS.map(({ id, rotulo }) => (
              <View key={id} style={styles.chip}>
                <View style={[styles.chipIcone, { backgroundColor: ACENTOS[id].suave }]}>
                  <Ionicons name={ACENTOS[id].icone} size={20} color={ACENTOS[id].cor} />
                </View>
                <AppText style={styles.chipTexto} numberOfLines={1}>{rotulo}</AppText>
              </View>
            ))}
          </View>
        </Pressable>
      )}

      <Pressable
        onPress={() => onPress()}
        accessibilityRole="button"
        accessibilityLabel="Ver minha jornada"
        style={({ pressed }) => [styles.botao, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
      >
        <AppText style={styles.botaoTexto}>Ver minha jornada</AppText>
        <Ionicons name="arrow-forward" size={16} color={colors.primaryDark} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { marginHorizontal: 16, marginBottom: 12, borderRadius: 24, backgroundColor: FUNDO, borderWidth: 2, borderColor: '#D5E8C2', padding: 16, overflow: 'hidden' },
  topo: { flexDirection: 'row', alignItems: 'flex-start' },
  rotulo: { fontSize: 11, fontFamily: typography.bold, color: colors.primaryShadow, letterSpacing: 0.8 },
  titulo: { fontSize: 24, fontFamily: typography.bold, color: colors.primaryDark, marginTop: 2 },
  sub: { fontSize: 13, lineHeight: 18, fontFamily: typography.semiBold, color: colors.trilhaChipTexto, marginTop: 4 },
  mascote: { width: 84, height: 100 },
  fala: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  balao: { flex: 1, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: TRILHO, paddingHorizontal: 12, paddingVertical: 10 },
  balaoTexto: { fontFamily: typography.medium, fontSize: 13, lineHeight: 19, color: colors.primaryDark },
  bloco: { marginTop: 12, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: TRILHO, paddingHorizontal: 12, paddingVertical: 8 },
  tiles: { flexDirection: 'row', gap: 8, marginTop: 8 },
  tile: { minHeight: 64, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: TRILHO, padding: 12, justifyContent: 'center' },
  tileLinha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tileTitulo: { fontFamily: typography.semiBold, fontSize: 12.5, color: '#1B4332' },
  tileSub: { fontFamily: typography.regular, fontSize: 12, lineHeight: 16, color: TEXTO_SUAVE, marginTop: 4 },
  chips: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  chip: { alignItems: 'center', flex: 1, gap: 6 },
  chipIcone: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  chipTexto: { fontSize: 12, fontFamily: typography.semiBold, color: colors.primaryDark },
  botao: { marginTop: 14, minHeight: 46, borderRadius: 23, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  botaoTexto: { fontSize: 15, fontFamily: typography.bold, color: colors.primaryDark },
});
