// Animações do módulo de vitaminas. Respeitam "reduzir movimento" do sistema.
// Calmas de propósito: nada de mola ou pulo em loop. A lista fica parada (só reage ao toque) e o
// herói entra suave e solta uma onda lenta; movimento demais na tela incomodava.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Easing, useReducedMotion } from 'react-native-reanimated';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { vit } from '../ui/tokens';

/** Círculo pequeno da lista: parado; cresce um pouquinho enquanto o card está sendo tocado. */
export function SimboloLista({ simbolo, pressionado }: { simbolo: string; fase?: number; pressionado: boolean }) {
  const reduzir = useReducedMotion();
  return (
    <MotiView
      animate={{ scale: pressionado && !reduzir ? 1.08 : 1 }}
      transition={{ type: 'timing', duration: 150 }}
      style={styles.simbolo}
    >
      <AppText style={styles.simboloTexto}>{simbolo}</AppText>
    </MotiView>
  );
}

/** Herói da página do nutriente: entra suave e solta uma onda lenta atrás. */
export function HeroNutriente({ simbolo }: { simbolo: string }) {
  const reduzir = useReducedMotion();
  return (
    <View style={styles.heroArea}>
      {!reduzir && (
        <MotiView
          from={{ scale: 1, opacity: 0.35 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ type: 'timing', duration: 2800, loop: true, repeatReverse: false, easing: Easing.out(Easing.quad) }}
          style={styles.onda}
          pointerEvents="none"
        />
      )}
      <MotiView
        from={reduzir ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 320, easing: Easing.out(Easing.quad) }}
        style={styles.hero}
      >
        <AppText style={styles.heroTexto}>{simbolo}</AppText>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  simbolo: { width: 38, height: 38, borderRadius: 19, backgroundColor: vit.fundoSuave, alignItems: 'center', justifyContent: 'center' },
  simboloTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  heroArea: { width: 140, height: 140, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  onda: { position: 'absolute', width: 84, height: 84, borderRadius: 42, backgroundColor: vit.destaque },
  hero: { width: 84, height: 84, borderRadius: 42, backgroundColor: vit.destaque, alignItems: 'center', justifyContent: 'center' },
  heroTexto: { fontFamily: typography.bold, fontSize: 30, color: vit.texto },
});
