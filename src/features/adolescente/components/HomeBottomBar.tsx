// src/features/adolescente/components/HomeBottomBar.tsx
import React, { useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';

type Props = { onAbrirMenu: () => void; menuAberto: boolean };

export default function HomeBottomBar({ onAbrirMenu, menuAberto }: Props) {
  const rotacao = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(rotacao, {
      toValue: menuAberto ? 1 : 0,
      friction: 6,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, [menuAberto]);

  const rotate = rotacao.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={styles.barra}>
      <Pressable style={styles.itemInicio}>
        <Ionicons name="home" size={18} color={colors.primaryDark} />
        <AppText style={styles.textoInicio}>Início</AppText>
      </Pressable>

      <Pressable style={styles.item}>
        <Ionicons name="book-outline" size={20} color="#fff" />
      </Pressable>

      <Pressable style={styles.fab} onPress={onAbrirMenu}>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="add" size={22} color={colors.primaryDark} />
        </Animated.View>
      </Pressable>

      <Pressable style={styles.item}>
        <Ionicons name="people-outline" size={20} color="#fff" />
      </Pressable>

      <Pressable style={styles.item}>
        <Ionicons name="restaurant-outline" size={20} color="#fff" />
      </Pressable>

      <Pressable style={styles.item}>
        <Ionicons name="menu-outline" size={25} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryDark,
    borderRadius: 30,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  itemInicio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  textoInicio: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  item: { padding: 2 },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});