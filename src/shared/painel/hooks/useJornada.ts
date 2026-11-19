// src/shared/painel/hooks/useJornada.ts
// Carrega a jornada agregada (analytics_jornada) para o período do Analytics. Independente do
// resto da tela: sem a migration nova no banco, só a aba Jornada mostra o aviso.
import { useCallback, useEffect, useRef, useState } from 'react';
import { buscarJornada, type AnalyticsJornada } from '../services/jornadaService';
import type { Intervalo } from '../periodo';

export function useJornada(intervalo: Intervalo, ativo: boolean) {
  const [dados, setDados] = useState<AnalyticsJornada | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const req = useRef(0);

  const carregar = useCallback(async () => {
    const n = ++req.current; // ignora respostas de períodos antigos
    setCarregando(true);
    try {
      const r = await buscarJornada(intervalo);
      if (n !== req.current) return;
      setDados(r);
      setErro(null);
    } catch (e: any) {
      if (n !== req.current) return;
      setErro(e?.message ?? 'Não foi possível carregar a jornada.');
    } finally {
      if (n === req.current) setCarregando(false);
    }
  }, [intervalo.inicio, intervalo.fim]);

  // só busca quando a aba está aberta (a consulta é mais pesada que as outras)
  useEffect(() => {
    if (ativo) carregar();
  }, [ativo, carregar]);

  return { dados, carregando, erro, recarregar: carregar };
}
