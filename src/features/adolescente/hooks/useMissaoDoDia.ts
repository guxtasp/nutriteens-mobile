// src/features/adolescente/hooks/useMissaoDoDia.ts
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { formatarDataISO } from '../../../shared/utils/data';
import { obterOuAtribuirMissaoDoDia, avaliarMissaoDoDia, type MissaoDoDia } from '../services/missaoService';

export function useMissaoDoDia() {
  const { userId } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [missao, setMissao] = useState<MissaoDoDia | null>(null);
  const [concluida, setConcluida] = useState(false);

  const carregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    try {
      const hoje = formatarDataISO(new Date());
      const missaoDoDia = await obterOuAtribuirMissaoDoDia(userId, hoje);
      const foiConcluida = await avaliarMissaoDoDia(userId, hoje, missaoDoDia);
      setMissao(missaoDoDia);
      setConcluida(foiConcluida);
    } catch (erro) {
      console.error('Erro ao carregar missão do dia:', erro);
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  return { carregando, missao, concluida };
}