// Quantos pedidos de cadastro do scanner esperam a equipe. null = carregando ou sem acesso (nunca quebra a tela).
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { contarSolicitacoes } from '../services/solicitacoesService';

export function usePendentesScanner(ativo = true): number | null {
  const [n, setN] = useState<number | null>(null);
  useFocusEffect(useCallback(() => {
    if (!ativo) return;
    let vivo = true;
    contarSolicitacoes().then((v) => { if (vivo) setN(v); }).catch((e) => console.error('Scanner: contagem indisponível:', e));
    return () => { vivo = false; };
  }, [ativo]));
  return n;
}
