// src/features/adolescente/home/hooks/useRetrospectivaAno.ts
//
// Busca a retrospectiva do ano UMA vez, só quando `ativo` vira true (o modal de aniversário
// foi para a tela). Na Home normal não faz nenhuma consulta.
import { useEffect, useRef, useState } from 'react';
import { buscarRetrospectivaAno } from '../services/retrospectivaAnoService';
import type { RetrospectivaAno } from '../../metricas/utils/retrospectivaSlides';

export function useRetrospectivaAno(userId: string | null, hojeISO: string | null, ativo: boolean): RetrospectivaAno | null {
  const [retrospectiva, setRetrospectiva] = useState<RetrospectivaAno | null>(null);
  const buscouRef = useRef(false);

  useEffect(() => {
    if (!ativo || !userId || !hojeISO || buscouRef.current) return;
    buscouRef.current = true;
    let vivo = true;
    buscarRetrospectivaAno(userId, hojeISO).then((r) => {
      if (vivo) setRetrospectiva(r);
    });
    return () => {
      vivo = false;
    };
  }, [ativo, userId, hojeISO]);

  return retrospectiva;
}
