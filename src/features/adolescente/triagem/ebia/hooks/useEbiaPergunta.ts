import { useState } from 'react';
import { supabase } from '../../../../../lib/supabase';
import { PERGUNTAS_EBIA, calcularPontuacaoEbia, classificarEbia } from '../data/ebiaData';
import { concluirOnboarding, fecharAvaliacaoNutricional, salvarResultadoEbia } from '../services/ebiaService';
import { useMessageBanner } from '../../../../../shared/hooks/useMessageBanner';

// Renomeado de useTriagemPergunta: a lógica é sobre a EBIA especificamente,
// não sobre "a triagem" como um todo — triagem é só quem decide a ordem

// esses dados serão utilizados pra salvar o resultado da triagem no banco, e também pra calcular a pontuação e classificação final da EBIA
interface UseEbiaPerguntaParams {
  navigation: any; // objeto de navegação do React Navigation, usado pra avançar pra próxima pergunta ou finalizar a triagem
  indice: number; // índice da pergunta atual (0 a 4), usado pra buscar a pergunta correta do array PERGUNTAS_EBIA
  respostasAnteriores: boolean[]; // array de respostas anteriores (true/false), usado pra calcular a pontuação final da EBIA quando a última pergunta for respondida
}

// Renomeado de useTriagemPergunta: a lógica é sobre a EBIA especificamente,
// não sobre "a triagem" como um todo — triagem é só quem decide a ordem
// (ver features/triagem/navigation/triagemStack.ts).
export function useEbiaPergunta({ navigation, indice, respostasAnteriores }: UseEbiaPerguntaParams) {
  const [selecionado, setSelecionado] = useState<boolean | null>(null); // armazena a resposta selecionada (true/false) pra pergunta atual
  const { message, type, showMessage, clearMessage } = useMessageBanner();
  const [salvando, setSalvando] = useState(false); // armazena se o resultado da triagem está sendo salvo no banco, usado pra mostrar um indicador de carregamento e evitar múltiplos cliques no botão "Avançar"

  const pergunta = PERGUNTAS_EBIA[indice]; // armazena a pergunta atual (objeto com id e texto) buscada do array PERGUNTAS_EBIA, usado pra exibir o texto da pergunta na tela 
  const ehUltima = indice === PERGUNTAS_EBIA.length - 1; // armazena se a pergunta atual é a última do questionário, usado pra decidir se o botão "Avançar" deve levar pra próxima pergunta ou finalizar a triagem 

  async function avancar() { // função chamada quando o usuário clica no botão "Avançar", usada pra salvar a resposta atual e avançar pra próxima pergunta ou finalizar a triagem
    if (selecionado === null) return;

    // adiciona a resposta atual ao array de respostas anteriores, criando um novo array de respostas que será usado pra calcular a pontuação final da EBIA quando a última pergunta for respondida
    const respostas = [...respostasAnteriores, selecionado];

    // se não for a última pergunta, navega pra próxima pergunta passando o índice da próxima pergunta e o array de respostas atualizadas
    if (!ehUltima) {
      navigation.push('EbiaPergunta', { indice: indice + 1, respostas });
      return;
    }

    // se for a última pergunta, calcula a pontuação e classificação final da EBIA, salva tudo e finaliza a triagem
    if (salvando) return;
    setSalvando(true);

    try {
      const pontuacao = calcularPontuacaoEbia(respostas);
      const classificacao = classificarEbia(pontuacao);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        showMessage('Sua sessão expirou. Entre de novo para continuar.', 'error');
        return;
      }
      const userId = userData.user.id;

      // cada passo lança erro se falhar; o adolescente fica nesta tela e pode
      // tocar de novo (ver a ordem e a idempotência em ebiaService.ts)
      const avaliacaoNutricionalId = await salvarResultadoEbia(userId, respostas, pontuacao, classificacao);
      await concluirOnboarding(userId);
      await fecharAvaliacaoNutricional(avaliacaoNutricionalId);

      // avisa o RootNavigator que etapa_onboarding mudou no banco — sem isso
      // ele continua achando que ainda está em TRIAGEM (só reage a eventos
      // de auth, não a updates de tabela)
      const { error: erroSessao } = await supabase.auth.refreshSession();
      if (erroSessao) throw erroSessao;

      // reset(), não navigate(): descarta toda a cadeia de triagem da stack.
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (e) {
      console.error('Erro ao salvar a EBIA:', e);
      showMessage('Não conseguimos salvar suas respostas. Confira a conexão e toque em finalizar de novo.', 'error');
    } finally {
      setSalvando(false);
    }
  }

  return {
    pergunta,
    ehUltima,
    selecionado,
    setSelecionado,
    salvando,
    avancar,
    message,
    type,
    clearMessage,
  };
}