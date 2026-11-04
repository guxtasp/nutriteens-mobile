// src/features/adolescente/social/components/TurmaHero.tsx
//
// Topo da aba Turma: faixa verde com o Bróxis, uma frase acolhedora e dois números que só celebram
// (amigos e quantos já mantiveram a sequência hoje). Nunca mostra quem faltou.
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../../shared/ui/AppText';
import { BroxisMascot } from '../../../../shared/ui/BroxisMascot';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { buscarAmigosHoje } from '../services/feedService';
import type { AmigoSocial } from '../services/socialService';
import { turma } from '../theme/turma';
import { useTourAlvo } from '../../tour/TourContext';

type Props = {
  apelido: string | null;
  amigos: AmigoSocial[];
  refreshToken: number;
};

function frase(apelido: string | null, qtdAmigos: number, naSequencia: number): { titulo: string; sub: string } {
  const nome = apelido ? `, ${apelido}` : '';
  if (qtdAmigos === 0) return { titulo: `Oi${nome}!`, sub: 'Chame amigos e cresçam juntos. É mais fácil e mais divertido em turma.' };
  if (naSequencia === 0) return { titulo: `Oi${nome}!`, sub: 'O dia está só começando. Bora abrir o caminho pra turma?' };
  if (naSequencia === qtdAmigos) return { titulo: 'Turma on fire!', sub: 'Todo mundo manteve a sequência hoje. Que time!' };
  return { titulo: `Oi${nome}!`, sub: 'A turma já está em ação hoje. Bora se juntar?' };
}

export default function TurmaHero({ apelido, amigos, refreshToken }: Props) {
  const [hoje, setHoje] = useState<Record<string, boolean>>({});
  const refTour = useTourAlvo('turma-hero');

  useEffect(() => {
    let vivo = true;
    buscarAmigosHoje().then((r) => { if (vivo) setHoje(r); }).catch(() => undefined);
    return () => { vivo = false; };
  }, [refreshToken, amigos.length]);

  const qtd = amigos.length;
  const naSequencia = amigos.filter((a) => hoje[a.amizadeId] === true).length;
  const { titulo, sub } = frase(apelido, qtd, naSequencia);

  return (
    <View ref={refTour} collapsable={false} style={estilos.envoltorio}>
    <LinearGradient colors={[turma.heroDe, turma.heroPara]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.hero}>
      <View style={estilos.bolaGrande} pointerEvents="none" />
      <View style={estilos.bolaPequena} pointerEvents="none" />

      <View style={estilos.textos}>
        <AppText style={estilos.eyebrow}>TURMA</AppText>
        <AppText style={estilos.titulo} numberOfLines={1}>{titulo}</AppText>
        <AppText style={estilos.sub}>{sub}</AppText>

        <View style={estilos.chips}>
          <View style={estilos.chip} accessible accessibilityLabel={`${qtd} ${qtd === 1 ? 'amigo' : 'amigos'}`}>
            <Ionicons name="people" size={14} color={colors.white} />
            <AppText style={estilos.chipTexto}>{qtd} {qtd === 1 ? 'amigo' : 'amigos'}</AppText>
          </View>
          {qtd > 0 && (
            <View style={[estilos.chip, estilos.chipChama]} accessible accessibilityLabel={`${naSequencia} na sequência hoje`}>
              <Ionicons name="flame" size={14} color={turma.chama} />
              <AppText style={estilos.chipTexto}>{naSequencia} hoje</AppText>
            </View>
          )}
        </View>
      </View>

      <View style={estilos.mascote} pointerEvents="none">
        <BroxisMascot pose={naSequencia > 0 ? 'supercontente' : 'aceno'} size={104} entrance="nenhuma" showParticles={false} />
      </View>
    </LinearGradient>
    </View>
  );
}

const estilos = StyleSheet.create({
  // o espaço de baixo fica no envoltório: o destaque do tour pega só o cartão verde
  envoltorio: { marginBottom: 16 },
  hero: { borderRadius: 26, padding: 18, paddingRight: 112, minHeight: 150, overflow: 'hidden', borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.18)' },
  bolaGrande: { position: 'absolute', right: -40, top: -50, width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(255,255,255,0.08)' },
  bolaPequena: { position: 'absolute', right: 70, bottom: -34, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.07)' },
  textos: { gap: 3 },
  eyebrow: { fontFamily: typography.bold, fontSize: 11, letterSpacing: 1.2, color: 'rgba(255,255,255,0.7)' },
  titulo: { fontFamily: typography.bold, fontSize: 24, color: colors.white },
  sub: { fontFamily: typography.regular, fontSize: 13.5, lineHeight: 19, color: 'rgba(255,255,255,0.88)' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)' },
  chipChama: { backgroundColor: 'rgba(255,255,255,0.24)' },
  chipTexto: { fontFamily: typography.bold, fontSize: 12.5, color: colors.white },
  mascote: { position: 'absolute', right: 6, bottom: 0 },
});
