// src/shared/ui/LogoutButton.tsx
import React from 'react';
import { Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { AppText } from './AppText';
import { useSairDaConta } from '../hooks/useSairDaConta';

export function LogoutButton() {
  const { sair: handleSair, saindo } = useSairDaConta();

  return (
    <Pressable style={styles.botao} onPress={handleSair} disabled={saindo} accessibilityRole="button" accessibilityLabel="Sair da conta">
      {saindo ? (
        <ActivityIndicator color="#ffff" />
      ) : (
        <AppText style={styles.texto}>Sair</AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffff',
    backgroundColor: '#D14343',
    marginHorizontal: 20,
    marginTop: 24,
  },
  texto: {
    color: '#fff',
    fontWeight: 'bold',
  },
});