import { useEffect, useState } from 'react';
import { supabase } from '../../../../../lib/supabase';
import { REFEICOES } from '../data/refeicoesData';
import {
  AlimentoCatalogo,
  buscarAlimentosPorTipoRefeicao,
  marcarRecordatorioConcluido,
  obterOuCriarAvaliacaoNutricional,
  obterOuCriarRecordatorio,
  salvarRefeicao,
} from '../services/recordatorioService';

interface UseRecordatorioRefeicaoParams {
  navigation: any;
  indice: number;
  recordatorioId?: string; // repassado via params depois da 1ª refeição, pra não recriar
}

export function useRecordatorioRefeicao({ navigation, indice, recordatorioId }: UseRecordatorioRefeicaoParams) {
  const [alimentos, setAlimentos] = useState<AlimentoCatalogo[]>([]);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [naoComeuNada, setNaoComeuNada] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const refeicao = REFEICOES[indice];
  const ehUltima = indice === REFEICOES.length - 1;

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setSelecionados(new Set());
    setNaoComeuNada(false);

    buscarAlimentosPorTipoRefeicao(refeicao.tipo).then((lista) => {
      if (ativo) {
        setAlimentos(lista);
        setCarregando(false);
      }
    });

    return () => {
      ativo = false;
    };
  }, [indice]);

  function alternarSelecao(alimentoId: string) {
    setNaoComeuNada(false);
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(alimentoId)) {
        novo.delete(alimentoId);
      } else {
        novo.add(alimentoId);
      }
      return novo;
    });
  }

  function marcarNaoComeuNada() {
    setSelecionados(new Set());
    setNaoComeuNada(true);
  }

  const podeAvancar = naoComeuNada || selecionados.size > 0;

  async function avancar() {
    if (!podeAvancar) return;
    setSalvando(true);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setSalvando(false);
      return;
    }

    const avaliacaoNutricionalId = await obterOuCriarAvaliacaoNutricional(userId);
    const hoje = new Date().toISOString().slice(0, 10);
    const idDoRecordatorio = recordatorioId ?? (await obterOuCriarRecordatorio(avaliacaoNutricionalId, hoje));

    await salvarRefeicao(idDoRecordatorio, refeicao.tipo, Array.from(selecionados), !naoComeuNada);

    if (!ehUltima) {
        setSalvando(false);
        navigation.push('RecordatorioRefeicao', { indice: indice + 1, recordatorioId: idDoRecordatorio });
        return;
    }

    await marcarRecordatorioConcluido(idDoRecordatorio);
    setSalvando(false);
    navigation.navigate('EbiaPergunta', { indice: 0 }); // próximo passo da triagem, definido em triagemStack.ts
  }

  return {
    refeicao,
    ehUltima,
    alimentos,
    selecionados,
    naoComeuNada,
    carregando,
    salvando,
    podeAvancar,
    alternarSelecao,
    marcarNaoComeuNada,
    avancar,
  };
}