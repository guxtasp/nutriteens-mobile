// src/shared/hooks/useReduzirMovimento.ts
//
// true quando o aparelho está com "reduzir movimento" (iOS) / "remover animações" (Android).
// OU quando a pessoa ligou "Reduzir animações" na tela Acessibilidade do próprio app.
// Use para pular animações decorativas e em repetição (confete, brilho, bolhas, lágrimas).
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useAcessibilidade } from './useAcessibilidade';

export function useReduzirMovimento(): boolean {
  const [reduzirSistema, setReduzir] = useState(false);
  const { reduzirAnimacoes } = useAcessibilidade();

  useEffect(() => {
    let ativo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => ativo && setReduzir(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => ativo && setReduzir(v));
    return () => {
      ativo = false;
      sub.remove();
    };
  }, []);

  return reduzirSistema || reduzirAnimacoes;
}
