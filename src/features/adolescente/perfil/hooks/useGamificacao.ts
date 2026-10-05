import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { buscarFases, buscarInsignias, buscarXpTotal, Insignia } from '../services/gamificacaoService';
import { calcularEstadoFase, EstadoFase, FASES_PADRAO } from '../utils/fasesMascote';

export function useGamificacao() {
  const { userId } = useAuth();
  const [xpTotal, setXpTotal] = useState(0);
  const [estado, setEstado] = useState<EstadoFase>(calcularEstadoFase(0, FASES_PADRAO));
  const [insignias, setInsignias] = useState<Insignia[]>([]);
  const [carregando, setCarregando] = useState(true);

  // recarrega sempre que o perfil ganha foco (XP/insígnias mudam em outras telas)
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let ativo = true;
      (async () => {
        try {
          const [fases, xp, lista] = await Promise.all([
            buscarFases(),
            buscarXpTotal(userId),
            buscarInsignias(userId),
          ]);
          if (!ativo) return;
          setXpTotal(xp);
          setEstado(calcularEstadoFase(xp, fases));
          setInsignias(lista);
        } catch (e) {
          console.error('Erro ao carregar gamificação:', e);
        } finally {
          if (ativo) setCarregando(false);
        }
      })();
      return () => {
        ativo = false;
      };
    }, [userId]),
  );

  return { xpTotal, estado, insignias, carregando };
}
