// src/shared/ui/LogoutButton.tsx
import React, { useState } from 'react';
import { Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { AppText } from './AppText';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

export function LogoutButton() {
  const { signOut } = useAuth();
  const [saindo, setSaindo] = useState(false);

  async function handleSair() {
    if (saindo) return;
    setSaindo(true);
    try {
      await signOut();
      // RootNavigator detecta a sessão nula e troca a stack sozinho
    } catch (err) {
      console.error('Erro ao sair:', err);
      setSaindo(false);
    }
  }

  return (
    <Pressable style={styles.botao} onPress={handleSair} disabled={saindo}>
      {saindo ? (
        <ActivityIndicator color="#D14343" />
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
    borderColor: '#D14343',
    marginHorizontal: 20,
    marginTop: 24,
  },
  texto: {
    color: '#D14343',
    fontWeight: '600',
  },
});