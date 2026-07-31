import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface DotsIndicatorProps {
  total: number;
  currentIndex: number;
}

export function DotsIndicator({ total, currentIndex }: DotsIndicatorProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[styles.dot, index === currentIndex && styles.dotActive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    backgroundColor: 'transparent',
  },
  dotActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
});