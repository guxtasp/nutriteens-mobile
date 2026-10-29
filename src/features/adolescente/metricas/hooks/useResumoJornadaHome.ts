// src/features/adolescente/metricas/hooks/useResumoJornadaHome.ts
//
// Dados do widget da Home. Carrega em segundo plano e NUNCA derruba a Home: em erro, o
// widget mostra a versão estática. Se já havia dados e a recarga falha, mantém os dados.
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { formatarDataISO } from '../../../../shared/utils/data';
import { CENARIO_DEMO } from '../utils/demo';
import { buscarDadosMetricasRecentes } from '../services/metricasService';
import type { DadosBrutos } from '../types/metricas';
import { calcularMetricas } from '../utils/calcularMetricas';
import { gerarDadosDemo } from '../utils/dadosDemo';
import { calcularMisturaNova } from '../utils/misturaNova';
import { montarResumoHome, type ResumoHomeDados } from '../utils/resumoHome';

/** 7 dias do resumo + 7 anteriores para a comparação do Bróxis */
const DIAS_HOME = 14;

export type EstadoResumoHome =
  | { status: 'carregando' }
  | { status: 'erro' }
  | { status: 'pronto'; resumo: ResumoHomeDados };

function resumoDe(dados: DadosBrutos, userId: string): ResumoHomeDados {
  const m = calcularMetricas(dados, 'semana');
  return montarResumoHome(m, userId, calcularMisturaNova(dados, m.atual.janela));
}

export function useResumoJornadaHome(): EstadoResumoHome {
  const { userId } = useAuth();
  const [estado, setEstado] = useState<EstadoResumoHome>({ status: 'carregando' });

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      // modo demonstração (só em desenvolvimento): dados fictícios, sem consulta ao banco
      if (__DEV__ && CENARIO_DEMO) {
        setEstado({ status: 'pronto', resumo: resumoDe(gerarDadosDemo(CENARIO_DEMO, formatarDataISO(new Date())), userId) });
        return;
      }
      let ativo = true;
      buscarDadosMetricasRecentes(userId, DIAS_HOME)
        .then((dados) => {
          if (ativo) setEstado({ status: 'pronto', resumo: resumoDe(dados, userId) });
        })
        .catch((e) => {
          console.warn('Resumo da jornada (Home):', e);
          if (ativo) setEstado((atual) => (atual.status === 'pronto' ? atual : { status: 'erro' }));
        });
      return () => { ativo = false; };
    }, [userId]),
  );

  return estado;
}
