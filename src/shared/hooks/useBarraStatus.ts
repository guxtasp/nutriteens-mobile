// src/shared/hooks/useBarraStatus.ts
//
// Cor dos ícones da barra de status por tela. Por que não <StatusBar> direto: numa pilha de
// navegação a tela de baixo continua montada, então um <StatusBar style="light"> do Onboarding
// continuava valendo no Login (fundo branco). Aqui o estilo vale só enquanto a tela está em foco e
// volta ao padrão do app (ícones escuros, tema claro) ao sair dela.
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { setStatusBarStyle } from 'expo-status-bar';

/** 'escura' = ícones escuros (fundo claro, padrão do app); 'clara' = ícones claros (fundo escuro). */
export function useBarraStatus(estilo: 'escura' | 'clara'): void {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(estilo === 'clara' ? 'light' : 'dark');
      return () => setStatusBarStyle('dark');
    }, [estilo]),
  );
}
