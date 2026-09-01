import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';

type Props = {
  quantidade: number;
  onPress: () => void;
};

export default function CarrinhoBar({ quantidade, onPress }: Props) {
  const insets = useSafeAreaInsets();
  if (quantidade === 0) return null;

  return (
    <Pressable
      style={[styles.barraCarrinho, { paddingBottom: 4 + insets.bottom }]}
      onPress={onPress}
      android_ripple={{ color: '#00000010' }}
    >
      <View style={styles.handle} />
      <View style={styles.barraCarrinhoConteudo}>
        <View style={styles.badge}>
          <AppText style={styles.badgeTexto}>Atividade</AppText>
          <View style={styles.contador}>
            <AppText style={styles.contadorTexto}>{quantidade}</AppText>
          </View>
        </View>
        <View style={styles.hoje}>
          <AppText style={styles.hojeTexto}>Hoje</AppText>
          <Ionicons name="chevron-up" size={18} color={colors.primaryDark} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  barraCarrinho: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0a1c27',
    alignSelf: 'center',
    marginBottom: 12,
  },
  barraCarrinhoConteudo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  contador: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#8BC34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorTexto: { fontFamily: typography.bold, fontSize: 11, color: '#fff' },
  hoje: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hojeTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
});