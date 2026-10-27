// src/features/adolescente/metricas/hooks/useMetricas.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import type { ApoioDetalhes, EstadoMetricas, GruposInfo } from '../types/estado';
import type { DadosBrutos, TipoPeriodo } from '../types/metricas';
import { derivarEstado } from '../utils/estadoMetricas';
import { formatarDataISO } from '../../../../shared/utils/data';
import { CENARIO_DEMO } from '../utils/demo';
import { gerarDadosDemo } from '../utils/dadosDemo';
import { buscarApoioDetalhes, buscarDadosMetricas, buscarGruposInfoMetricas } from '../services/metricasService';

/**
 * Carrega os dados uma vez por visita à tela (e recarrega ao voltar a ela), e calcula
 * localmente. Trocar Semana/Mês só recalcula. Se a recarga falhar com dados já na tela,
 * mantém os dados e não pisca erro.
 */
export function useMetricas() {
  const { userId } = useAuth();
  const [periodo, setPeriodo] = useState<TipoPeriodo>('semana');
  const [dados, setDados] = useState<DadosBrutos | null>(null);
  const [erro, setErro] = useState(false);
  const [gruposInfo, setGruposInfo] = useState<GruposInfo>({});
  const [apoio, setApoio] = useState<ApoioDetalhes | undefined>(undefined);
  const tem = useRef(false);
  const requisicao = useRef(0);

  const carregar = useCallback(async () => {
    if (!userId) return;
    const minha = ++requisicao.current; // ignora respostas antigas
    // modo demonstração (só em desenvolvimento): dados fictícios, sem consulta ao banco
    if (__DEV__ && CENARIO_DEMO) {
      tem.current = true;
      setDados(gerarDadosDemo(CENARIO_DEMO, formatarDataISO(new Date())));
      setErro(false);
      return;
    }
    if (!tem.current) setErro(false);
    try {
      const d = await buscarDadosMetricas(userId);
      if (minha !== requisicao.current) return;
      tem.current = true;
      setDados(d);
      setErro(false);
    } catch (e) {
      console.error('Métricas:', e);
      if (minha === requisicao.current && !tem.current) setErro(true);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));
  useEffect(() => { buscarGruposInfoMetricas().then(setGruposInfo); }, []);
  // catálogo de sugestões: carrega uma vez; a escolha por período é local
  useEffect(() => { if (userId) buscarApoioDetalhes(userId).then(setApoio); }, [userId]);

  const tentarNovamente = useCallback(() => {
    tem.current = false;
    setDados(null);
    carregar();
  }, [carregar]);

  const estado: EstadoMetricas = useMemo(() => derivarEstado(dados, erro, periodo, userId ?? ''), [dados, erro, periodo, userId]);

  return { estado, periodo, setPeriodo, tentarNovamente, gruposInfo, apoio, semente: userId ?? '' };
}
