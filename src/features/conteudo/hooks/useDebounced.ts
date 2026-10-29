// src/features/conteudo/hooks/useDebounced.ts
// Devolve `valor` só depois de `ms` sem mudar: a prévia ao vivo acompanha a digitação
// sem remontar a cada tecla.
import { useEffect, useState } from 'react';

export function useDebounced<T>(valor: T, ms = 300): T {
  const [atual, setAtual] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setAtual(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return atual;
}