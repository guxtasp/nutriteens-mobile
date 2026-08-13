// src/shared/ui/InfoButton.tsx
import React from 'react';
import { Pressable, StyleSheet, PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Tamanho = 'pequeno' | 'medio';

type Props = PressableProps & {
  tamanho?: Tamanho;
  corFundo?: string;
};

export function InfoButton({ tamanho = 'pequeno', corFundo = '#8BC34A', style, ...props }: Props) {
  const tamanhoPx = tamanho === 'pequeno' ? 32 : 40;
  const iconePx = tamanho === 'pequeno' ? 16 : 20;

  return (
    <Pressable
      hitSlop={8}
      style={[
        styles.base,
        { width: tamanhoPx, height: tamanhoPx, borderRadius: tamanhoPx / 2, backgroundColor: corFundo },
        style as any,
      ]}
      {...props}
    >
      <Ionicons name="information" size={iconePx} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});