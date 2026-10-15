// Animações do módulo de vitaminas. Respeitam "reduzir movimento" do sistema.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Easing, useReducedMotion } from 'react-native-reanimated';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { vit } from '../ui/tokens';

/** Círculo pequeno da lista: "respira" de leve e dá um pulinho quando o card é tocado. */
export function SimboloLista({ simbolo, fase, pressionado }: { simbolo: string; fase: number; pressionado: boolean }) {
  const reduzir = useReducedMotion();
  return (
    <MotiView
      animate={{ scale: pressionado ? 1.25 : 1, rotate: pressionado ? '-12deg' : '0deg' }}
      transition={{ type: 'spring', damping: 8, stiffness: 220 }}
    >
      <MotiView
        from={{ scale: 1 }}
        animate={{ scale: reduzir ? 1 : 1.08 }}
        transition={{
          type: 'timing', duration: 1400, delay: fase, loop: !reduzir, repeatReverse: true,
          easing: Easing.inOut(Easing.ease),
        }}
        style={styles.simbolo}
      >
        <AppText style={styles.simboloTexto}>{simbolo}</AppText>
      </MotiView>
    </MotiView>
  );
}

const BRILHOS = [0, 120, 240];

/** Hero da página do nutriente: flutua, solta ondas e tem brilhos orbitando. */
export function HeroNutriente({ simbolo }: { simbolo: string }) {
  const reduzir = useReducedMotion();
  const [pulso, setPulso] = React.useState(0);
  return (
    <View style={styles.heroArea} onTouchEnd={() => setPulso((p) => p + 1)}>
      {!reduzir && [0, 1].map((i) => (
        <MotiView
          key={`onda${i}`}
          from={{ scale: 1, opacity: 0.45 }}
          animate={{ scale: 1.9, opacity: 0 }}
          transition={{ type: 'timing', duration: 2200, delay: i * 1100, loop: true, repeatReverse: false, easing: Easing.out(Easing.quad) }}
          style={styles.onda}
          pointerEvents="none"
        />
      ))}

      {!reduzir && (
        <MotiView
          from={{ rotate: '0deg' }}
          animate={{ rotate: '360deg' }}
          transition={{ type: 'timing', duration: 9000, loop: true, repeatReverse: false, easing: Easing.linear }}
          style={styles.orbita}
          pointerEvents="none"
        >
          {BRILHOS.map((g) => (
            <View key={g} style={[styles.brilhoPos, { transform: [{ rotate: `${g}deg` }] }]}>
              <MotiView
                from={{ scale: 0.6, opacity: 0.5 }}
                animate={{ scale: 1.2, opacity: 1 }}
                transition={{ type: 'timing', duration: 900, delay: g * 3, loop: true, repeatReverse: true }}
                style={styles.brilho}
              />
            </View>
          ))}
        </MotiView>
      )}

      <MotiView
        from={{ opacity: 0, scale: 0.4, rotate: '-25deg' }}
        animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
        transition={{ type: 'spring', damping: 9, stiffness: 120 }}
      >
        <MotiView
          from={{ translateY: 0 }}
          animate={{ translateY: reduzir ? 0 : -8 }}
          transition={{ type: 'timing', duration: 1600, loop: !reduzir, repeatReverse: true, easing: Easing.inOut(Easing.sin) }}
        >
          {/* toque no círculo = pulinho */}
          <MotiView
            key={pulso}
            from={{ scale: pulso > 0 ? 0.85 : 1 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 5, stiffness: 200 }}
            style={styles.hero}
          >
            <AppText style={styles.heroTexto}>{simbolo}</AppText>
          </MotiView>
        </MotiView>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  simbolo: { width: 38, height: 38, borderRadius: 19, backgroundColor: vit.fundoSuave, alignItems: 'center', justifyContent: 'center' },
  simboloTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  heroArea: { width: 160, height: 160, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  onda: { position: 'absolute', width: 84, height: 84, borderRadius: 42, backgroundColor: vit.destaque },
  orbita: { position: 'absolute', width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  brilhoPos: { position: 'absolute', width: 150, height: 150, alignItems: 'center' },
  brilho: { width: 12, height: 12, borderRadius: 6, backgroundColor: vit.fundoDestaque, borderWidth: 2, borderColor: vit.destaque },
  hero: { width: 84, height: 84, borderRadius: 42, backgroundColor: vit.destaque, alignItems: 'center', justifyContent: 'center' },
  heroTexto: { fontFamily: typography.bold, fontSize: 30, color: vit.texto },
});
