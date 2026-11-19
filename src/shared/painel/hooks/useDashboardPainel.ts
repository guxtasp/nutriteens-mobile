// src/shared/painel/hooks/useDashboardPainel.ts
import { useCallback, useEffect, useState } from 'react';
import { PainelDashboard, buscarDashboard } from '../services/dashboardService';

export function useDashboardPainel(dias: number) {
  const [dados, setDados] = useState<PainelDashboard | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  // hora da última carga bem-sucedida, mostrada no topo do dashboard
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);
    buscarDashboard(dias)
      .then((d) => {
        if (!ativo) return;
        setDados(d);
        setAtualizadoEm(new Date());
      })
      .catch((e: unknown) => ativo && setErro(e instanceof Error ? e.message : 'Erro desconhecido'))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [dias, tentativa]);

  const recarregar = useCallback(() => setTentativa((t) => t + 1), []);
  return { dados, carregando, erro, recarregar, atualizadoEm };
}
