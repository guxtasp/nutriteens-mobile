// src/features/adolescente/social/components/JardimEntradaCard.tsx
//
// Cartão da aba Turma que leva ao Jardim do grupo. Mostra o jardim de verdade (planta, estágio e se você já
// regou hoje); sem jardim, convida a plantar o primeiro. Só celebra: nunca cobra quem não regou.
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { listarJardins } from '../services/jardimService';
import { estagioDoJardim, euRegueiHoje, nomeDoEstagio, type Jardim } from '../utils/jardim';
import PlantaJardim from './PlantaJardim';

type Props = { onPress: () => void };

const CEU: Record<string, [string, string]> = {
  BROCOLIS: ['#DCD2FF', '#F4FBE9'],
  GIRASSOL: ['#BFE3FF', '#FFF7D6'],
  TOMATEIRO: ['#FFE0DC', '#FFF6EA'],
  LARANJEIRA: ['#CDEFE9', '#FFF3DD'],
  HORTA: ['#FFD9E6', '#F2FBE4'],
};

export default function JardimEntradaCard({ onPress }: Props) {
  const [jardins, setJardins] = useState<Jardim[] | null>(null);

  useFocusEffect(useCallback(() => {
    let vivo = true;
    listarJardins().then((j) => { if (vivo) setJardins(j); }).catch(() => { if (vivo) setJardins(null); });
    return () => { vivo = false; };
  }, []));

  const ativos = (jardins ?? []).filter((j) => j.situacao === 'ativo');
  const convites = (jardins ?? []).filter((j) => j.situacao === 'convidado').length;
  const principal = ativos[0] ?? null;
  const estagio = principal ? estagioDoJardim(principal.pontos).indice : 0;

  let titulo = 'Jardim do grupo';
  let sub = 'Plante com os amigos. Cada registro rega a planta, e ela nunca murcha.';
  let acao = 'COMEÇAR';
  if (principal) {
    const regou = euRegueiHoje(principal);
    sub = `${nomeDoEstagio(principal.tema, estagio)} • ${principal.pontos} ${principal.pontos === 1 ? 'regadinha' : 'regadinhas'}`;
    acao = regou ? 'ABRIR' : 'REGAR';
    titulo = regou ? 'Você já regou hoje' : 'Hoje ainda dá para regar';
  } else if (convites > 0) {
    titulo = convites === 1 ? 'Você tem um convite de jardim' : `Você tem ${convites} convites de jardim`;
    sub = 'Toque para ver e entrar.';
    acao = 'VER';
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. ${sub}`}
      style={({ pressed }) => [estilos.pressable, pressed && { transform: [{ translateY: 2 }] }]}
    >
      <LinearGradient colors={CEU[principal?.tema ?? 'BROCOLIS']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.cartao}>
        <View style={estilos.planta}>
          <PlantaJardim tema={principal?.tema ?? 'BROCOLIS'} estagio={principal ? estagio : 3} tamanho={72} animar={false} />
        </View>
        <View style={estilos.textos}>
          <AppText style={estilos.rotulo}>JARDIM DO GRUPO</AppText>
          <AppText style={estilos.titulo} numberOfLines={2}>{titulo}</AppText>
          <AppText style={estilos.sub} numberOfLines={2}>{sub}</AppText>
        </View>
        <View style={estilos.pilula}>
          <AppText style={estilos.pilulaTexto}>{acao}</AppText>
          <Ionicons name="chevron-forward" size={14} color={colors.primaryDark} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pressable: { marginBottom: 14, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: '#E4E9E6' },
  cartao: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 100, borderRadius: 22 },
  planta: { width: 76, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, gap: 1 },
  rotulo: { fontFamily: typography.bold, fontSize: 10.5, letterSpacing: 0.8, color: '#5A6B64' },
  titulo: { fontFamily: typography.bold, fontSize: 15.5, lineHeight: 20, color: colors.primaryDark },
  sub: { fontFamily: typography.regular, fontSize: 12.5, lineHeight: 17, color: '#4B5B54' },
  pilula: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 34, paddingLeft: 12, paddingRight: 8, borderRadius: 17, backgroundColor: colors.primary, borderBottomWidth: 3, borderBottomColor: colors.primaryShadow },
  pilulaTexto: { fontFamily: typography.bold, fontSize: 12, letterSpacing: 0.4, color: colors.primaryDark },
});
