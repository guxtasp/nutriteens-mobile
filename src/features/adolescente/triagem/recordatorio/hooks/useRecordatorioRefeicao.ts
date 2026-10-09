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
  const [alimentos, setAlimentos] = useState<AlimentoCatalogo[]>([]); // lista de alimentos do catálogo, filtrada por tipo de refeição
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set()); // IDs dos alimentos selecionados pelo usuário
  const [naoComeuNada, setNaoComeuNada] = useState(false); // flag para indicar que o usuário marcou que não comeu nada na refeição
  const [carregando, setCarregando] = useState(true); // flag para indicar que os alimentos estão sendo carregados
  const [salvando, setSalvando] = useState(false); // flag para indicar que os dados estão sendo salvos
  const { message, type, showMessage, clearMessage } = useMessageBanner(); // hook para exibir mensagens de erro ou sucesso

  const refeicao = REFEICOES[indice]; // refeição atual, baseada no índice passado como parâmetro
  const ehUltima = indice === REFEICOES.length - 1; // flag para indicar se é a última refeição da triagem

  useEffect(() => {
    let ativo = true; // flag para evitar atualização de estado após o componente ser desmontado
    setCarregando(true); // inicia o carregamento dos alimentos
    setSelecionados(new Set()); // limpa os alimentos selecionados
    setNaoComeuNada(false); // limpa a flag de "não comeu nada"

    buscarAlimentosPorTipoRefeicao(refeicao.tipo).then((lista) => { // busca os alimentos do catálogo filtrados pelo tipo de refeição
      if (ativo) { // verifica se o componente ainda está montado antes de atualizar o estado
        setAlimentos(lista); // atualiza a lista de alimentos
        setCarregando(false); // finaliza o carregamento
      }
    });

    return () => { // função de limpeza do useEffect, chamada quando o componente é desmontado
      ativo = false; // marca o componente como desmontado para evitar atualizações de estado
    }; 
  }, [indice]); // o useEffect é reexecutado sempre que o índice da refeição muda, garantindo que os alimentos corretos sejam carregados para cada refeição.

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