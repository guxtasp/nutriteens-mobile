// src/features/adolescente/components/ChatFab.tsx
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/theme/colors';

export default function ChatFab({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable style={styles.botao} onPress={onPress}>
      <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    position: 'absolute',
    right: 16,
    bottom: 96, // fica acima da barra inferior
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});