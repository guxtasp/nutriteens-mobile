// src/shared/painel/hooks/useAnalyticsPainel.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { buscarAnalytics, type PainelAnalytics } from '../services/analyticsService';
import type { Intervalo } from '../periodo';

export function useAnalyticsPainel(intervalo: Intervalo) {
  const [dados, setDados] = useState<PainelAnalytics | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const reqRef = useRef(0);

  const carregar = useCallback(async () => {
    const req = ++reqRef.current; // ignora respostas de períodos antigos
    setCarregando(true);
    try {
      const r = await buscarAnalytics({ inicio: intervalo.inicio, fim: intervalo.fim });
      if (req !== reqRef.current) return;
      setDados(r);
      setErro(null);
    } catch (e: any) {
      if (req !== reqRef.current) return;
      setErro(e?.message ?? 'Não foi possível carregar o analytics.');
    } finally {
      if (req === reqRef.current) setCarregando(false);
    }
  }, [intervalo.inicio, intervalo.fim]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { dados, carregando, erro, recarregar: carregar };
}
