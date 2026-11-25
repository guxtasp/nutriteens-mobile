// src/shared/hooks/useRespiroInferior.ts
//
// Espaço de baixo de uma peça fixa (rodapé, folha, botão flutuante) já somando a barra do sistema.
// `base` é o respiro que a peça tinha antes (vale em aparelhos sem barra). Ver utils/areaSegura.ts.
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { respiroInferior } from '../utils/areaSegura';

export function useRespiroInferior(base: number): number {
  const insets = useSafeAreaInsets();
  return respiroInferior(insets.bottom, base);
}
