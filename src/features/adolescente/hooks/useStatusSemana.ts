// src/features/adolescente/hooks/useStatusSemana.ts
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { useSemanaAtual } from './useSemanaAtual';
import { obterDiasQueContaramParaSequencia } from '../services/sequenciaService';
import { calcularStatusDia, DiaSemana } from '../types/statusDia';

export function useStatusSemana() {
  const { userId } = useAuth();
  const { dias, hojeISO } = useSemanaAtual();
  const [diasComStatus, setDiasComStatus] = useState<DiaSemana[]>(
    dias.map((dia) => ({ ...dia, status: calcularStatusDia({ data: dia.data, hojeISO, mantido: false }) }))
  );
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    try {
      const diasPassadosOuHoje = dias.filter((dia) => dia.data <= hojeISO).map((dia) => dia.data);
      const diasMantidos = await obterDiasQueContaramParaSequencia(userId, diasPassadosOuHoje);

      setDiasComStatus(
        dias.map((dia) => ({
          ...dia,
          status: calcularStatusDia({ data: dia.data, hojeISO, mantido: diasMantidos.has(dia.data) }),
        }))
      );
    } catch (erro) {
      console.error('Erro ao carregar status da semana:', erro);
    } finally {
      setCarregando(false);
    }
  }, [userId, dias, hojeISO]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  return { dias: diasComStatus, hojeISO, carregando };
}