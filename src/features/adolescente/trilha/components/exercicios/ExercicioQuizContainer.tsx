// src/features/adolescente/trilha/components/exercicios/ExercicioQuizContainer.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../../../../../shared/ui/AppText';
import { AppButton } from '../../../../../shared/ui/AppButton';
import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';
import type { QuestaoQuiz, ParAssocie } from '../../services/trilhaService';
import BarraProgresso from './BarraProgresso';
import MascoteFala, { EnunciadoSimples } from './MascoteFala';
import FeedbackExercicio from './FeedbackExercicio';
import MultiplaEscolha from './MultiplaEscolha';
import VerdadeiroFalso from './VerdadeiroFalso';
import BancoDePalavras, { FraseComLacuna } from './CompletarFrase';
import Ordene from './Ordene';
import Associe from './Associe';
import Classifique from './Classifique';
import CartaoConteudo from './CartaoConteudo';
import { contarPontuadas, ehPassoPontuado, filaAposResposta, montarFila } from '../../utils/sessaoPassos';

type Props = {
  questoes: QuestaoQuiz[];
  // chamado depois que a última questão é respondida e o usuário aperta
  // continuar — quem chama decide o que significa "concluído" (ex.:
  // LicaoDetalheScreen chama concluirLicaoComProgresso e navega pra tela de
  // conclusão certa: Lição, Módulo ou Trilha completa)
  onConcluirTodas: (acertos: number, total: number) => void;
};

// resposta genérica: string (multipla_escolha/verdadeiro_falso/completar),
// string[] (ordene), ou Record<string,string> (associe/classifique). Cada
// formato só usa o pedaço de estado que faz sentido pra ele — reseta tudo
// junto a cada troca de questão, então nunca vaza resposta de uma questão
// pra outra.
type RespostaMapa = Record<string, string>;

/**
 * Orquestra a sequência de exercícios de uma lição de quiz (Treino ou
 * Revisão, ver modelo-pedagogico-trilha.md): 1 tela por questão, com barra
 * de progresso, mascote com o enunciado, o componente do formato certo
 * (`questao.formato`), e o feedback ao responder. Só avança pra próxima
 * questão depois que o usuário vê o feedback e aperta continuar — nunca
 * concede XP por questão individual, só ao fechar a lição inteira (isso
 * é responsabilidade de quem usa esse container, via `onConcluirTodas`).
 *
 * Sessão de ~10 passos (ver modelo-pedagogico-trilha.md): além dos 6 formatos
 * pontuados, roda 3 passos SEM NOTA — `cartao` (ensino), `enquete` e `meta`
 * (escolha sem certo/errado, com mensagem neutra). Questão pontuada errada
 * na 1ª tentativa volta UMA vez no fim (ver utils/sessaoPassos.ts).
 *
 * Pontuação: cada questão vale certo/errado inteiro (bate com a tabela do
 * modelo-pedagogico-trilha.md — "compara a ordem toda"/"por par"/"por
 * item" descreve o FEEDBACK visual durante a questão, não uma pontuação
 * fracionada; pra contar em `acertos/total` a questão só é considerada
 * certa se TUDO nela estiver certo).
 */
export default function ExercicioQuizContainer({ questoes, onConcluirTodas }: Props) {
  // fila de passos: cresce quando uma questão errada é reapresentada
  const [fila, setFila] = useState(() => montarFila(questoes));
  const [indice, setIndice] = useState(0);
  const [respondido, setRespondido] = useState(false);
  // acertos na PRIMEIRA tentativa (retentativa não conta)
  const [acertos, setAcertos] = useState(0);

  // multipla_escolha / verdadeiro_falso / completar
  const [selecionada, setSelecionada] = useState<string | null>(null);
  // ordene
  const [respostaOrdene, setRespostaOrdene] = useState<string[]>([]);
  // associe / classifique
  const [respostaMapa, setRespostaMapa] = useState<RespostaMapa>({});

  const passo = fila[indice];
  const questao = passo?.questao;

  if (!questao) {
    return <AppText style={styles.vazio}>Esse quiz ainda não tem perguntas cadastradas.</AppText>;
  }

  const semNota = !ehPassoPontuado(questao.formato);
  const opcaoCorreta = questao.opcoes.find((o) => o.correta);
  const opcaoEscolhida = questao.opcoes.find((o) => o.id === selecionada);
  const pares: ParAssocie[] = questao.dadosExtra?.pares ?? [];
  const categorias: string[] = questao.dadosExtra?.categorias ?? [];

  function podeResponder(): boolean {
    switch (questao.formato) {
      case 'cartao':
        return true;
      case 'ordene':
        return questao.opcoes.length > 0 && respostaOrdene.length === questao.opcoes.length;
      case 'associe':
        return pares.length > 0 && pares.every((p) => !!respostaMapa[p.id]);
      case 'classifique':
        return questao.opcoes.length > 0 && questao.opcoes.every((o) => !!respostaMapa[o.id]);
      default:
        return !!selecionada;
    }
  }

  function calcularAcertou(): boolean {
    switch (questao.formato) {
      case 'ordene': {
        const idsCorretos = questao.opcoes.map((o) => o.id); // já vêm ordenadas por `ordem`
        return (
          idsCorretos.length === respostaOrdene.length &&
          idsCorretos.every((id, i) => id === respostaOrdene[i])
        );
      }
      case 'associe':
        return pares.length > 0 && pares.every((p) => respostaMapa[p.id] === p.id);
      case 'classifique':
        return questao.opcoes.length > 0 && questao.opcoes.every((o) => respostaMapa[o.id] === o.categoria);
      default:
        return selecionada === opcaoCorreta?.id;
    }
  }

  function handleSelecionar(opcaoId: string) {
    if (respondido) return;
    setSelecionada(opcaoId);
  }

  function handleResponder() {
    if (!podeResponder()) return;
    const acertou = calcularAcertou();
    if (acertou && !passo.ehRetentativa) setAcertos((a) => a + 1);
    // errou na 1ª tentativa → a questão volta uma vez no fim da fila
    setFila((f) => filaAposResposta(f, indice, acertou));
    setRespondido(true);
  }

  function handleContinuar() {
    const proximoIndice = indice + 1;
    if (proximoIndice >= fila.length) {
      // `acertos` e `fila` aqui já refletem a questão atual: handleResponder
      // chamou setAcertos/setFila/setRespondido juntos, então o React já
      // re-renderizou antes desse handleContinuar (criado de novo a cada
      // render) ser chamado. Passos sem nota não mexem em nenhum dos dois.
      onConcluirTodas(acertos, contarPontuadas(questoes));
      return;
    }
    setIndice(proximoIndice);
    setSelecionada(null);
    setRespostaOrdene([]);
    setRespostaMapa({});
    setRespondido(false);
  }

  function renderExercicio() {
    switch (questao.formato) {
      case 'verdadeiro_falso':
        return (
          <VerdadeiroFalso
            opcoes={questao.opcoes}
            selecionada={selecionada}
            respondido={respondido}
            onSelecionar={handleSelecionar}
          />
        );
      case 'completar':
        return (
          <BancoDePalavras
            opcoes={questao.opcoes}
            selecionada={selecionada}
            respondido={respondido}
            onSelecionar={handleSelecionar}
          />
        );
      case 'ordene':
        return (
          <Ordene
            opcoes={questao.opcoes}
            resposta={respostaOrdene}
            respondido={respondido}
            onMudar={setRespostaOrdene}
          />
        );
      case 'associe':
        return (
          <Associe pares={pares} resposta={respostaMapa} respondido={respondido} onMudar={setRespostaMapa} />
        );
      case 'classifique':
        return (
          <Classifique
            opcoes={questao.opcoes}
            categorias={categorias}
            resposta={respostaMapa}
            respondido={respondido}
            onMudar={setRespostaMapa}
          />
        );
      case 'enquete':
      case 'meta':
        // escolha sem certo/errado: `respondido` fica sempre false, então a
        // opção tocada só ganha o destaque neutro de seleção
        return (
          <MultiplaEscolha
            opcoes={questao.opcoes}
            selecionada={selecionada}
            respondido={false}
            onSelecionar={handleSelecionar}
          />
        );
      case 'multipla_escolha':
      default:
        return (
          <MultiplaEscolha
            opcoes={questao.opcoes}
            selecionada={selecionada}
            respondido={respondido}
            onSelecionar={handleSelecionar}
          />
        );
    }
  }

  const mensagemNeutra = semNota && !!selecionada ? questao.dadosExtra?.feedback : null;

  return (
    <View style={styles.container}>
      <BarraProgresso atual={indice + 1} total={fila.length} />

      {passo.ehRetentativa && <AppText style={styles.retentativa}>Vamos tentar de novo! 💪</AppText>}

      {questao.formato === 'cartao' ? (
        <CartaoConteudo titulo={questao.enunciado} texto={questao.dadosExtra?.texto} />
      ) : (
        <>
          <MascoteFala>
            {questao.formato === 'completar' ? (
              <FraseComLacuna enunciado={questao.enunciado} opcaoEscolhida={opcaoEscolhida} />
            ) : (
              <EnunciadoSimples texto={questao.enunciado} />
            )}
          </MascoteFala>

          {renderExercicio()}
        </>
      )}

      {!!mensagemNeutra && (
        <View style={styles.mensagemNeutra}>
          <AppText style={styles.mensagemNeutraTexto}>{mensagemNeutra}</AppText>
        </View>
      )}

      {!respondido && (
        <View style={styles.rodape}>
          <AppButton
            label="CONTINUAR"
            backgroundColor={colors.primary}
            textColor={colors.white}
            shadowColor={colors.primaryShadow}
            fullWidth
            disabled={!podeResponder()}
            onPress={semNota ? handleContinuar : handleResponder}
          />
        </View>
      )}

      {respondido && (
        <FeedbackExercicio
          acertou={calcularAcertou()}
          explicacao={questao.dadosExtra?.explicacao}
          onContinuar={handleContinuar}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  rodape: { marginTop: 32 },
  retentativa: {
    fontFamily: typography.bold,
    fontSize: 13,
    color: colors.primaryDark,
    textAlign: 'center',
    marginTop: 12,
  },
  mensagemNeutra: {
    marginTop: 4,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#EEF6E8',
  },
  mensagemNeutraTexto: {
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  vazio: {
    fontFamily: typography.regular,
    fontSize: 15,
    color: colors.textOnLight,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
});
