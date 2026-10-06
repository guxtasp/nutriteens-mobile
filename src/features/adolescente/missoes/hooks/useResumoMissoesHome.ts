import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { formatarDataISO } from '../../../../shared/utils/data';
import { calcularProgressoMissaoDoDia, MissaoDoDia } from '../../home/services/missaoService';
import { buscarMissoesDoPeriodo } from '../services/missoesPeriodicasService';
import type { Progresso } from '../utils/progresso';

export type ResumoMes = { feitas: number; total: number; diasRestantes: number };

/**
 * Dados do widget da Home. Carrega em segundo plano e NUNCA derruba a Home:
 * se algo falhar, o widget só mostra menos informação.
 */
export function useResumoMissoesHome(missao: MissaoDoDia | null) {
  const { userId } = useAuth();
  const [progresso, setProgresso] = useState<Progresso | null>(null);
  const [mes, setMes] = useState<ResumoMes | null>(null);
  const missaoId = missao?.id;

  useFocusEffect(
    useCallback(() => {
      if (!userId || !missao) return;
      let ativo = true;
      const hoje = formatarDataISO(new Date());

      calcularProgressoMissaoDoDia(userId, hoje, missao)
        .then((p) => ativo && setProgresso(p))
        .catch((e) => console.error('Widget de missões (hoje):', e));

      buscarMissoesDoPeriodo(userId, 'MENSAL')
        .then((r) => {
          if (!ativo) return;
          setMes({
            feitas: r.missoes.filter((m) => m.progresso.concluida).length,
            total: r.missoes.length,
            diasRestantes: r.intervalo.diasRestantes,
          });
        })
        .catch((e) => console.error('Widget de missões (mês):', e));

      return () => {
        ativo = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, missaoId]),
  );

  return { progresso, mes };
}
