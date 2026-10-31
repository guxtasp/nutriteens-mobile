// src/features/adolescente/social/components/TrofeuCard.tsx
//
// Troféu da temporada: título de hábito que a pessoa ganhou ao fim de um desafio em grupo.
// Não compara ninguém: as 1 a 3 estrelas mostram só os dias cumpridos DELA. Entra com um "pop" curto (desligado em
// "reduzir movimento"); na versão compacta (coleção) não anima.
import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { ATIVIDADE } from '../theme/turma';
import { DIAS_DESAFIO } from '../utils/desafioGrupo';
import { dataCurtaDoTrofeu, rotuloDoTrofeu, type Trofeu } from '../utils/trofeu';

type Props = { trofeu: Trofeu; compacto?: boolean };

export default function TrofeuCard({ trofeu, compacto = false }: Props) {
  const pop = useRef(new Animated.Value(compacto ? 1 : 0)).current;

  useEffect(() => {
    if (compacto) return;
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then((reduzir) => {
      if (!vivo) return;
      if (reduzir) { pop.setValue(1); return; }
      Animated.timing(pop, { toValue: 1, duration: 520, delay: 250, easing: Easing.out(Easing.back(1.8)), useNativeDriver: true }).start();
    });
    return () => { vivo = false; };
  }, [compacto, pop]);

  const data = dataCurtaDoTrofeu(trofeu.encerradoEm);
  const tam = compacto ? 44 : 60;

  return (
    <Animated.View
      accessible
      accessibilityLabel={rotuloDoTrofeu(trofeu)}
      style={[estilos.caixa, compacto && estilos.caixaCompacta, { opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }] }]}
    >
      <View style={[estilos.selo, { width: tam, height: tam, borderRadius: tam / 2 }]}>
        <Ionicons name="trophy" size={compacto ? 22 : 30} color={colors.white} />
        <View style={estilos.metrica}><Ionicons name={trofeu.icone as any} size={compacto ? 11 : 14} color={ATIVIDADE.desafio.cor} /></View>
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        {!compacto && <AppText style={estilos.rotulo}>Seu troféu da temporada</AppText>}
        <AppText style={[estilos.titulo, compacto && { fontSize: 14.5 }]} numberOfLines={1}>{trofeu.titulo}</AppText>
        <AppText style={estilos.sub} numberOfLines={compacto ? 1 : 2}>
          {trofeu.dias} de {DIAS_DESAFIO} dias · {trofeu.nomeDesafio}{compacto && data ? ` · ${data}` : ''}
        </AppText>
        {!compacto && <AppText style={estilos.frase}>{trofeu.frase}</AppText>}
      </View>

      <View style={estilos.estrelas} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {[1, 2, 3].map((n) => (
          <Ionicons key={n} name={n <= trofeu.nivel ? 'star' : 'star-outline'} size={compacto ? 13 : 16} color={n <= trofeu.nivel ? '#F2B705' : '#C9BFE6'} />
        ))}
      </View>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  caixa: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 20, backgroundColor: ATIVIDADE.desafio.fundo, borderWidth: 2, borderBottomWidth: 4, borderColor: '#D9CCF7' },
  caixaCompacta: { padding: 10, gap: 10, borderRadius: 16, borderWidth: 1.5, borderBottomWidth: 3 },
  selo: { backgroundColor: ATIVIDADE.desafio.cor, alignItems: 'center', justifyContent: 'center' },
  metrica: { position: 'absolute', right: -4, bottom: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white, borderWidth: 2, borderColor: '#D9CCF7', alignItems: 'center', justifyContent: 'center' },
  rotulo: { fontFamily: typography.bold, fontSize: 12, color: ATIVIDADE.desafio.cor },
  titulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark },
  sub: { fontFamily: typography.regular, fontSize: 12.5, lineHeight: 17, color: '#6B7B74' },
  frase: { fontFamily: typography.bold, fontSize: 13, lineHeight: 18, color: ATIVIDADE.desafio.cor, marginTop: 2 },
  estrelas: { flexDirection: 'row', gap: 1, alignSelf: 'flex-start' },
});
