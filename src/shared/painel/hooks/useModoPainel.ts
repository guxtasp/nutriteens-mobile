// src/shared/painel/hooks/useModoPainel.ts
import { useWindowDimensions } from 'react-native';
import { ModoPainel, modoPorLargura } from '../painelTheme';

export function useModoPainel(): { modo: ModoPainel; largura: number } {
  const { width } = useWindowDimensions();
  return { modo: modoPorLargura(width), largura: width };
}
