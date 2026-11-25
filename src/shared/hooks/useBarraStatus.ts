// src/shared/hooks/useBarraStatus.ts
//
// Cor dos ícones da barra de status por tela. Por que não <StatusBar> direto: numa pilha de
// navegação a tela de baixo continua montada, então um <StatusBar style="light"> do Onboarding
// continuava valendo no Login (fundo branco). Aqui o estilo vale só enquanto a tela está em foco e
// volta ao padrão do app (ícones escuros, tema claro) quando ela sai.
//
// Detalhes:
//  - funciona também FORA da navegação (ex.: SemConexaoScreen, que o RootNavigator mostra antes do
//    NavigationContainer): aí vale enquanto o componente estiver montado;
//  - a ordem entre o "blur" da tela que sai e o "focus" da que entra não é garantida; por isso só
//    quem aplicou o estilo por último pode devolvê-lo ao padrão (`dono`).
import { useContext, useEffect } from 'react';
import { NavigationContext } from '@react-navigation/native';
import { setStatusBarStyle } from 'expo-status-bar';

export type EstiloBarraStatus = 'escura' | 'clara';

let sequencia = 0;
let dono = 0;

function aplicar(estilo: EstiloBarraStatus): number {
  const id = ++sequencia;
  dono = id;
  setStatusBarStyle(estilo === 'clara' ? 'light' : 'dark');
  return id;
}

function devolver(id: number): void {
  if (dono === id) setStatusBarStyle('dark');
}

/** 'escura' = ícones escuros (fundo claro, padrão do app); 'clara' = ícones claros (fundo escuro). */
export function useBarraStatus(estilo: EstiloBarraStatus): void {
  const navigation = useContext(NavigationContext);

  useEffect(() => {
    if (!navigation) {
      const id = aplicar(estilo);
      return () => devolver(id);
    }
    let id = navigation.isFocused() ? aplicar(estilo) : 0;
    const tirarFoco = navigation.addListener('focus', () => {
      id = aplicar(estilo);
    });
    const tirarBlur = navigation.addListener('blur', () => devolver(id));
    return () => {
      tirarFoco();
      tirarBlur();
      devolver(id);
    };
  }, [navigation, estilo]);
}
