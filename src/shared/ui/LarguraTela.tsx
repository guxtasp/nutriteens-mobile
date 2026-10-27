// src/shared/ui/LarguraTela.tsx
// Largura "da tela" para componentes que desenham pela largura disponível (mapa da trilha,
// memória, prato). No app é sempre a largura da janela. Dentro de uma moldura de celular (prévia
// do painel, em tela larga) o provedor informa a largura da moldura, para o conteúdo não ser
// desenhado para a janela inteira e ficar cortado.
import React, { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';

const LarguraTelaContext = createContext<number | null>(null);

export function LarguraTelaProvider({ largura, children }: { largura: number; children: React.ReactNode }) {
  return <LarguraTelaContext.Provider value={largura}>{children}</LarguraTelaContext.Provider>;
}

/** Largura a usar para dimensionar o conteúdo: a da moldura, se houver; senão a da janela. */
export function useLarguraTela(): number {
  const doProvedor = useContext(LarguraTelaContext);
  const { width } = useWindowDimensions();
  return doProvedor ?? width;
}
