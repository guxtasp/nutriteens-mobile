import { useState } from 'react';
import { supabase } from '../../../../../lib/supabase';
import { PERGUNTAS_EBIA, calcularPontuacaoEbia, classificarEbia } from '../data/ebiaData';
import { concluirOnboarding, salvarResultadoEbia } from '../services/ebiaService';

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

    // se for a última pergunta, calcula a pontuação e classificação final da EBIA, salva o resultado no banco e finaliza a triagem
    setSalvando(true);

    // calcula a pontuação e classificação final da EBIA usando as respostas do usuário
    const pontuacao = calcularPontuacaoEbia(respostas);
    const classificacao = classificarEbia(pontuacao);
    // salva o resultado da triagem no banco de dados usando o supabase, passando o id do usuário, as respostas, a pontuação e a classificação final da EBIA
    const { data: userData } = await supabase.auth.getUser();

    // se o usuário estiver logado, salva o resultado da triagem no banco de dados e conclui o onboarding, atualizando a sessão do usuário pra refletir a mudança de etapa_onboarding no banco
    if (userData.user) {
      await salvarResultadoEbia(userData.user.id, respostas, pontuacao, classificacao);
      await concluirOnboarding(userData.user.id);
      // avisa o RootNavigator que etapa_onboarding mudou no banco — sem isso
      // ele continua achando que ainda está em TRIAGEM (só reage a eventos
      // de auth, não a updates de tabela), e o AdolescenteNavigator manteria
      // TriagemIntro como raiz da stack pra sempre nessa sessão
      await supabase.auth.refreshSession(); // atualiza a sessão do usuário pra refletir a mudança de etapa_onboarding no banco, garantindo que o RootNavigator saiba que o usuário concluiu a triagem e deve ser redirecionado pro fluxo principal do app
    }

    setSalvando(false);

    // reset(), não navigate(): descarta toda a cadeia de triagem
    // (TriagemIntro → ... → EbiaPergunta) da stack. Sem isso, Home fica
    // empilhado EM CIMA da triagem inteira, e popToTop()/voltar da Trilha
    // te leva de volta pra dentro do fluxo de triagem em vez do Início.
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
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