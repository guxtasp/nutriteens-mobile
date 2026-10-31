// src/features/adolescente/social/components/PodioTurma.tsx
//
// Pódio do Desafio em grupo (só no modo PODIO). Três degraus em relevo, 1º no meio, com o avatar de cada pessoa em
// cima. Regras de cuidado (ver utils/desafioGrupo.ts → montarPalco):
//   • vale por DIAS CUMPRIDOS contra a meta pessoal de cada um (nunca volume, peso ou corpo);
//   • empate divide o degrau; ninguém aparece em "último lugar" (quem tem 0 dia fica só na lista de membros);
//   • o único momento de movimento é a subida dos degraus (3º → 2º → 1º); no fim do desafio, confete uma vez por
//     aparelho. "Reduzir movimento" desliga a subida e o confete.
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfettiCannon from 'react-native-confetti-cannon';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { feedbackConquista } from '../../../../shared/audio/feedback';
import { AvatarSocialView } from './AvatarSocialView';
import { ATIVIDADE, MEDALHA } from '../theme/turma';
import { DIAS_DESAFIO, montarPalco, textoDoPodio, type DegrauPalco, type DesafioGrupo, type LinhaPodio } from '../utils/desafioGrupo';

type Props = { d: DesafioGrupo; acabou: boolean };

const ALTURA_DEGRAU: Record<1 | 2 | 3, number> = { 1: 104, 2: 78, 3: 58 };
const ATRASO_MS: Record<1 | 2 | 3, number> = { 3: 0, 2: 260, 1: 560 };
const COR_CONFETE = ['#F2B705', '#7A5BD6', '#4AA3F0', '#8BCF4A', '#D6568A'];

const dias = (n: number) => `${n} ${n === 1 ? 'dia' : 'dias'}`;

function rotuloAcessivel(degraus: DegrauPalco[], resto: LinhaPodio[], acabou: boolean): string {
  const partes = degraus.map((g) => `${g.posicao}º lugar, ${g.pessoas.map((p) => (p.eu ? 'você' : p.apelido)).join(' e ')}, ${dias(g.dias)}`);
  const extra = resto.map((p) => `${p.posicao}º, ${p.eu ? 'você' : p.apelido}, ${dias(p.dias)}`);
  return `${acabou ? 'Pódio final' : 'Pódio da turma até agora'}. ${[...partes, ...extra].join('. ')}.`;
}

function Pessoa({ p, posicao }: { p: LinhaPodio; posicao: 1 | 2 | 3 }) {
  return (
    <View style={estilos.pessoa}>
      <View style={[estilos.anel, p.eu && estilos.anelEu]}>
        <AvatarSocialView avatar={p.avatar} size="small" />
        <View style={[estilos.selo, { backgroundColor: MEDALHA[posicao].cor }]}>
          <Ionicons name="medal" size={11} color={colors.primaryDark} />
        </View>
      </View>
      <AppText style={[estilos.nome, p.eu && { color: ATIVIDADE.desafio.cor }]} numberOfLines={1}>{p.eu ? 'Você' : p.apelido}</AppText>
    </View>
  );
}

export default function PodioTurma({ d, acabou }: Props) {
  const palco = montarPalco(d);
  const tem = palco.degraus.length > 0;
  const subida = useRef({ 1: new Animated.Value(0), 2: new Animated.Value(0), 3: new Animated.Value(0) }).current;
  const [confete, setConfete] = useState(false);

  // Subida dos degraus: uma vez, ao aparecer o pódio. Sem movimento, já nasce no lugar.
  useEffect(() => {
    if (!tem) return;
    let vivo = true;
    const rodando: Animated.CompositeAnimation[] = [];
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then((reduzir) => {
      if (!vivo) return;
      ([1, 2, 3] as const).forEach((pos) => {
        if (reduzir) { subida[pos].setValue(1); return; }
        const a = Animated.timing(subida[pos], { toValue: 1, duration: 520, delay: ATRASO_MS[pos], easing: Easing.out(Easing.back(1.3)), useNativeDriver: true });
        rodando.push(a);
        a.start();
      });
    });
    return () => { vivo = false; rodando.forEach((a) => a.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tem]);

  // Confete: só quando o desafio acabou, uma vez por aparelho e por desafio.
  useEffect(() => {
    if (!tem || !acabou) return;
    let vivo = true;
    const chave = `desafio:podio:${d.id}`;
    Promise.all([AsyncStorage.getItem(chave).catch(() => 'x'), AccessibilityInfo.isReduceMotionEnabled().catch(() => true)]).then(([visto, reduzir]) => {
      if (!vivo || visto) return;
      void AsyncStorage.setItem(chave, '1').catch(() => undefined);
      feedbackConquista();
      if (!reduzir) setConfete(true);
    });
    return () => { vivo = false; };
  }, [tem, acabou, d.id]);

  if (!tem) return null;

  const por = (pos: 1 | 2 | 3) => palco.degraus.find((g) => g.posicao === pos);
  const ordem = [por(2), por(1), por(3)].filter((g): g is DegrauPalco => !!g);
  const frase = textoDoPodio(palco, acabou);

  return (
    <View style={estilos.caixa} accessible accessibilityLabel={rotuloAcessivel(palco.degraus, palco.resto, acabou)}>
      {confete && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ConfettiCannon count={80} origin={{ x: Dimensions.get('window').width / 2, y: -10 }} fadeOut autoStart explosionSpeed={320} fallSpeed={2600} colors={COR_CONFETE} />
        </View>
      )}

      <View style={estilos.topo}>
        <AppText style={estilos.titulo}>{acabou ? 'Pódio final' : 'Pódio da turma'}</AppText>
        <AppText style={estilos.miudo}>dias cumpridos, cada um na sua meta</AppText>
      </View>

      <View style={estilos.palco}>
        {ordem.map((g) => {
          const v = subida[g.posicao];
          return (
            <Animated.View
              key={g.posicao}
              style={[estilos.coluna, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [56, 0] }) }] }]}
            >
              <View style={estilos.pessoas}>
                {g.pessoas.map((p) => <Pessoa key={p.apelido + (p.eu ? 'eu' : '')} p={p} posicao={g.posicao} />)}
              </View>
              <View style={[estilos.degrau, { height: ALTURA_DEGRAU[g.posicao], backgroundColor: MEDALHA[g.posicao].cor, borderBottomColor: MEDALHA[g.posicao].relevo }]}>
                <AppText style={estilos.numeral}>{g.posicao}º</AppText>
                <AppText style={estilos.diasDegrau}>{g.dias}/{DIAS_DESAFIO}</AppText>
              </View>
            </Animated.View>
          );
        })}
      </View>

      {palco.resto.length > 0 && (
        <View style={estilos.resto}>
          {palco.resto.map((p) => (
            <View key={p.apelido + (p.eu ? 'eu' : '')} style={[estilos.linhaResto, p.eu && { backgroundColor: ATIVIDADE.desafio.fundo }]}>
              <AppText style={estilos.posicaoResto}>{p.posicao}º</AppText>
              <AvatarSocialView avatar={p.avatar} size="small" />
              <AppText style={estilos.nomeResto} numberOfLines={1}>{p.eu ? 'Você' : p.apelido}</AppText>
              <AppText style={estilos.diasResto}>{p.dias}/{DIAS_DESAFIO}</AppText>
            </View>
          ))}
        </View>
      )}

      {!!frase && <AppText style={estilos.frase}>{frase}</AppText>}
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { gap: 12, paddingVertical: 4 },
  topo: { gap: 1 },
  titulo: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  miudo: { fontFamily: typography.regular, fontSize: 12, lineHeight: 16, color: '#6B7B74' },
  palco: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 6, paddingTop: 6 },
  coluna: { flex: 1, maxWidth: 124, alignItems: 'stretch', justifyContent: 'flex-end', gap: 6 },
  pessoas: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end', gap: 6 },
  pessoa: { alignItems: 'center', gap: 3, maxWidth: 92 },
  anel: { padding: 2, borderRadius: 26, borderWidth: 2, borderColor: 'transparent' },
  anelEu: { borderColor: ATIVIDADE.desafio.cor },
  selo: { position: 'absolute', right: -3, bottom: -3, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
  nome: { fontFamily: typography.bold, fontSize: 12.5, color: colors.primaryDark, maxWidth: 88 },
  degrau: { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, borderBottomWidth: 4, alignItems: 'center', justifyContent: 'center', gap: 1 },
  numeral: { fontFamily: typography.bold, fontSize: 28, lineHeight: 32, color: colors.primaryDark },
  diasDegrau: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark, opacity: 0.8 },
  resto: { gap: 2 },
  linhaResto: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 14 },
  posicaoResto: { width: 26, fontFamily: typography.bold, fontSize: 13, color: '#6B7B74' },
  nomeResto: { flex: 1, fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  diasResto: { fontFamily: typography.bold, fontSize: 14, color: ATIVIDADE.desafio.cor },
  frase: { fontFamily: typography.bold, fontSize: 13.5, lineHeight: 18, color: ATIVIDADE.desafio.cor },
});
