// src/shared/painel/hooks/useAnalyticsPainel.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buscarAnalytics,
  buscarEficacia,
  buscarHabitosEscola,
  type EficaciaAnalytics,
  type HabitosEscolaAnalytics,
  type PainelAnalytics,
} from '../services/analyticsService';
import type { Intervalo } from '../periodo';

export function useAnalyticsPainel(intervalo: Intervalo) {
  const [dados, setDados] = useState<PainelAnalytics | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [eficacia, setEficacia] = useState<EficaciaAnalytics | null>(null);
  const [erroEficacia, setErroEficacia] = useState<string | null>(null);
  const [habitosEscola, setHabitosEscola] = useState<HabitosEscolaAnalytics | null>(null);
  const [erroHabitosEscola, setErroHabitosEscola] = useState<string | null>(null);
  const reqRef = useRef(0);

  const carregar = useCallback(async () => {
    const req = ++reqRef.current; // ignora respostas de períodos antigos
    setCarregando(true);
    // a eficácia é independente: se a função nova ainda não existe, o resto do Analytics continua funcionando
    buscarEficacia({ inicio: intervalo.inicio, fim: intervalo.fim })
      .then((e) => { if (req === reqRef.current) { setEficacia(e); setErroEficacia(null); } })
      .catch((e: any) => { if (req === reqRef.current) { setEficacia(null); setErroEficacia(e?.message ?? 'Não foi possível carregar a eficácia.'); } });
    // também independente: sem a função nova no banco, só esses dois widgets mostram o aviso
    buscarHabitosEscola({ inicio: intervalo.inicio, fim: intervalo.fim })
      .then((h) => { if (req === reqRef.current) { setHabitosEscola(h); setErroHabitosEscola(null); } })
      .catch((e: any) => { if (req === reqRef.current) { setHabitosEscola(null); setErroHabitosEscola(e?.message ?? 'Não foi possível carregar hábitos e escolas.'); } });
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

  return { dados, carregando, erro, eficacia, erroEficacia, habitosEscola, erroHabitosEscola, recarregar: carregar };
}
