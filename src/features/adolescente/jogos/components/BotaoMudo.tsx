// Botão de ligar/desligar o som dos jogos (acessibilidade e preferência de cada pessoa).
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/theme/colors';

export default function BotaoMudo({ mudo, onPress }: { mudo: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={mudo ? 'Ligar o som do jogo' : 'Desligar o som do jogo'}
      style={styles.botao}
    >
      <Ionicons name={mudo ? 'volume-mute' : 'volume-high'} size={20} color={colors.primaryDark} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2F3D3', alignItems: 'center', justifyContent: 'center' },
});
