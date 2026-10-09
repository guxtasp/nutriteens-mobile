import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { alturaDaCarta } from '../data/cartasArte';
import { rotuloPasso, type CartaGuia } from '../utils/cartas';
import { CartaArte } from './CartaArte';

type Props = { carta: CartaGuia; largura: number; onPress: (c: CartaGuia) => void };

/**
 * Carta pequena do álbum. Obtida: só a arte (ela já traz número e título). Bloqueada: cartão
 * cinza com cadeado, mesma proporção (o título aparece, o Guia é público).
 */
export function CartaTile({ carta, largura, onPress }: Props) {
  const altura = alturaDaCarta(largura);

  return (
    <Pressable
      onPress={() => onPress(carta)}
      style={({ pressed }) => [{ width: largura, height: altura }, pressed && styles.pressionada]}
      accessibilityRole="button"
      accessibilityLabel={
        carta.obtida
          ? `${rotuloPasso(carta.passo)}: ${carta.titulo}${carta.nova ? ', carta nova' : ''}`
          : `${rotuloPasso(carta.passo)}: ${carta.titulo}, bloqueada`
      }
    >
      {carta.obtida ? (
        <CartaArte codigo={carta.codigo} passo={carta.passo} largura={largura} versao="mini" />
      ) : (
        <View style={[styles.bloqueada, { width: largura, height: altura, borderRadius: largura * 0.09 }]}>
          <AppText style={styles.passoBloqueado}>{rotuloPasso(carta.passo).toUpperCase()}</AppText>
          <View style={styles.cadeado}>
            <Ionicons name="lock-closed" size={largura * 0.2} color={colors.trilhaNoBloqueadoIcone} />
          </View>
          <AppText numberOfLines={3} style={styles.tituloBloqueado}>
            {carta.titulo}
          </AppText>
        </View>
      )}

      {carta.nova && (
        <View style={styles.pilulaNova}>
          <AppText style={styles.pilulaTexto}>NOVA</AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressionada: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  bloqueada: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: '#F4F5F4',
    borderWidth: 3,
    borderColor: colors.trilhaNoBloqueadoBorda,
  },
  passoBloqueado: { fontSize: 11, fontFamily: typography.bold, color: colors.placeholder, letterSpacing: 1 },
  cadeado: {
    width: '52%',
    aspectRatio: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.trilhaNoBloqueadoFace,
  },
  tituloBloqueado: { fontSize: 12, fontFamily: typography.bold, color: colors.placeholder, textAlign: 'center' },
  pilulaNova: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: colors.exercicioErro,
    borderWidth: 2,
    borderColor: '#fff',
  },
  pilulaTexto: { fontSize: 10, fontFamily: typography.bold, color: '#fff', letterSpacing: 0.6 },
});
