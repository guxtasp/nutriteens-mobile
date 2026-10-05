import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import type { Insignia } from '../services/gamificacaoService';
import { ARTE_INSIGNIAS, EMOJI_PLACEHOLDER } from '../data/insigniasArte';

type Props = { insignia: Insignia; onPress: (i: Insignia) => void };

/**
 * Insígnia: ÚNICA categoria com arte exclusiva. A arte vem de data/insigniasArte.ts
 * (por código). Sem arte ainda -> <InsigniaPlaceholder />. Bloqueada -> "?".
 */
export function InsigniaTile({ insignia, onPress }: Props) {
  const arte = insignia.codigo ? ARTE_INSIGNIAS[insignia.codigo] : null;

  return (
    <Pressable onPress={() => onPress(insignia)} style={styles.wrap} accessibilityLabel={insignia.nome}>
      <View style={[styles.moldura, insignia.obtida ? styles.molduraObtida : styles.molduraBloqueada]}>
        {!insignia.obtida ? (
          <AppText style={styles.interrogacao}>?</AppText>
        ) : arte ? (
          <Image source={arte} style={styles.arte} resizeMode="contain" />
        ) : (
          <InsigniaPlaceholder codigo={insignia.codigo} />
        )}
        {insignia.nova && <View style={styles.pontoNovo} />}
      </View>
      <AppText numberOfLines={2} style={[styles.nome, !insignia.obtida && styles.nomeBloqueado]}>
        {insignia.obtida ? insignia.nome : 'Insígnia secreta'}
      </AppText>
    </Pressable>
  );
}

/** Espaço reservado para a ilustração final da insígnia. */
export function InsigniaPlaceholder({ codigo }: { codigo: string | null }) {
  return (
    <View style={styles.placeholder}>
      <AppText style={styles.placeholderEmoji}>{(codigo && EMOJI_PLACEHOLDER[codigo]) || '🏅'}</AppText>
      <AppText style={styles.placeholderRotulo}>ARTE</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 104, alignItems: 'center' },
  moldura: { width: 92, height: 104, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  molduraObtida: { backgroundColor: '#fff', borderColor: colors.warning },
  molduraBloqueada: { backgroundColor: '#fff', borderColor: colors.trilhaNoBloqueadoBorda },
  arte: { width: 76, height: 88 },
  placeholder: {
    width: 76,
    height: 88,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.warning,
    backgroundColor: '#FFF9E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: { fontSize: 34 },
  placeholderRotulo: { fontSize: 9, fontFamily: typography.bold, color: colors.warningShadow, marginTop: 2, letterSpacing: 1 },
  interrogacao: { fontSize: 34, fontFamily: typography.bold, color: colors.trilhaNoBloqueadoIcone },
  nome: { marginTop: 8, fontSize: 12, fontFamily: typography.bold, color: colors.primaryDark, textAlign: 'center' },
  nomeBloqueado: { color: colors.placeholder },
  pontoNovo: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.exercicioErro,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
