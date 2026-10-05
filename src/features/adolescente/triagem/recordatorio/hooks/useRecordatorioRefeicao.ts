import { useEffect, useState } from 'react';
import { supabase } from '../../../../../lib/supabase';
import { REFEICOES } from '../data/refeicoesData';
import { ontemLocalISO } from '../utils/dataReferencia';
import { useMessageBanner } from '../../../../../shared/hooks/useMessageBanner';
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
  const { message, type, showMessage, clearMessage } = useMessageBanner();

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
    if (!podeAvancar || salvando) return;
    setSalvando(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        showMessage('Sua sessão expirou. Entre de novo para continuar.', 'error');
        return;
      }

      const avaliacaoNutricionalId = await obterOuCriarAvaliacaoNutricional(userId);
      // o Broxis pergunta sobre ONTEM — a data gravada tem que ser a mesma
      const dataReferencia = ontemLocalISO();
      const idDoRecordatorio =
        recordatorioId ?? (await obterOuCriarRecordatorio(avaliacaoNutricionalId, dataReferencia));

      await salvarRefeicao(idDoRecordatorio, refeicao.tipo, Array.from(selecionados), !naoComeuNada);

      if (!ehUltima) {
        navigation.push('RecordatorioRefeicao', { indice: indice + 1, recordatorioId: idDoRecordatorio });
        return;
      }

      await marcarRecordatorioConcluido(idDoRecordatorio);
      navigation.navigate('EbiaPergunta', { indice: 0 }); // próximo passo da triagem, definido em triagemStack.ts
    } catch (e) {
      console.error('Erro ao salvar o recordatório:', e);
      showMessage('Não conseguimos salvar agora. Confira a conexão e tente de novo.', 'error');
    } finally {
      setSalvando(false);
    }
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
    message,
    type,
    clearMessage,
  };
}