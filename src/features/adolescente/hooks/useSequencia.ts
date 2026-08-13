// src/features/adolescente/hooks/useSequencia.ts
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { sincronizarSequencia } from '../services/sequenciaService';

export function useSequencia() {
  const { userId } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [sequenciaAtual, setSequenciaAtual] = useState(0);
  const [maiorSequencia, setMaiorSequencia] = useState(0);
  const [diaDeHojeMantido, setDiaDeHojeMantido] = useState(false);

  const carregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    try {
      const status = await sincronizarSequencia(userId);
      setSequenciaAtual(status.sequenciaAtual);
      setMaiorSequencia(status.maiorSequencia);
      setDiaDeHojeMantido(status.diaDeHojeMantido);
    } catch (erro) {
      console.error('Erro ao sincronizar sequência:', erro);
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  // sincroniza toda vez que a Home ganha foco — cobre tanto "abriu o app hoje
  // pela primeira vez" quanto "acabou de registrar algo e voltou pra Home"
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  return { carregando, sequenciaAtual, maiorSequencia, diaDeHojeMantido };
}