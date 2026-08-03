// src/features/ebia/hooks/useEbiaPergunta.ts
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { PERGUNTAS_EBIA, calcularPontuacaoEbia, classificarEbia } from '../data/ebiaData';
import { concluirOnboarding, salvarResultadoEbia } from '../services/ebiaService';

interface UseEbiaPerguntaParams {
  navigation: any;
  indice: number;
  respostasAnteriores: boolean[];
}

// Renomeado de useTriagemPergunta: a lógica é sobre a EBIA especificamente,
// não sobre "a triagem" como um todo — triagem é só quem decide a ordem
// (ver features/triagem/navigation/triagemStack.ts).
export function useEbiaPergunta({ navigation, indice, respostasAnteriores }: UseEbiaPerguntaParams) {
  const [selecionado, setSelecionado] = useState<boolean | null>(null);
  const [salvando, setSalvando] = useState(false);

  const pergunta = PERGUNTAS_EBIA[indice];
  const ehUltima = indice === PERGUNTAS_EBIA.length - 1;

 async function avancar() {
  if (selecionado === null) return;

  const respostas = [...respostasAnteriores, selecionado];

  if (!ehUltima) {
    navigation.push('EbiaPergunta', { indice: indice + 1, respostas });
    return;
  }

  setSalvando(true);

  const pontuacao = calcularPontuacaoEbia(respostas);
  const classificacao = classificarEbia(pontuacao);
  const { data: userData } = await supabase.auth.getUser();

  if (userData.user) {
    await salvarResultadoEbia(userData.user.id, respostas, pontuacao, classificacao);
    await concluirOnboarding(userData.user.id);
  }

  setSalvando(false);
  navigation.navigate('Home');
}

  return {
    pergunta,
    ehUltima,
    selecionado,
    setSelecionado,
    salvando,
    avancar,
  };
}