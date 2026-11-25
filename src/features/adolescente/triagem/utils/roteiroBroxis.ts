// src/features/adolescente/triagem/utils/roteiroBroxis.ts
//
// Regras puras da conversa com o Bróxis: o que ele fala ao entrar num nó (seguindo os
// encadeamentos), quanto tempo "digita" cada mensagem e a checagem do grafo do roteiro.
import {
  NO_FINAL,
  NO_INICIAL,
  ROTEIRO_BROXIS,
  type IdNoRoteiro,
  type MensagemRoteiro,
  type NoRoteiro,
  type OpcaoRoteiro,
} from '../data/roteiroBroxis';

export type Fala = { mensagens: MensagemRoteiro[]; opcoes: OpcaoRoteiro[]; final: boolean };

/** Junta as mensagens do nó e dos que vêm encadeados por `seguir`, até chegar em respostas ou no fim. */
export function falaDoNo(id: IdNoRoteiro, roteiro: Record<IdNoRoteiro, NoRoteiro> = ROTEIRO_BROXIS): Fala {
  const mensagens: MensagemRoteiro[] = [];
  const visitados = new Set<IdNoRoteiro>();
  let atual: IdNoRoteiro | undefined = id;
  let ultimo: NoRoteiro = roteiro[id];
  while (atual && !visitados.has(atual)) {
    visitados.add(atual);
    ultimo = roteiro[atual];
    mensagens.push(...ultimo.mensagens);
    atual = ultimo.seguir;
  }
  return { mensagens, opcoes: ultimo.opcoes, final: !!ultimo.final };
}

/** Pausa entre uma mensagem e a próxima. */
export const PAUSA_ENTRE_MENSAGENS_MS = 200;
/** Com "reduzir movimento": sem animação dos pontinhos e espera curta. */
export const DIGITACAO_REDUZIDA_MS = 300;
/** Cartões não têm texto para "digitar". */
export const DIGITACAO_CARTAO_MS = 900;

/** Tempo de "digitando…" antes de uma mensagem: min(1500, 500 + 14 × caracteres). */
export function tempoDigitacao(mensagem: MensagemRoteiro, reduzirMovimento: boolean): number {
  if (reduzirMovimento) return DIGITACAO_REDUZIDA_MS;
  if (mensagem.tipo === 'cartao') return DIGITACAO_CARTAO_MS;
  return Math.min(1500, 500 + 14 * mensagem.texto.length);
}

export type ProblemaRoteiro = { tipo: 'proximo_inexistente' | 'no_orfao' | 'sem_saida' | 'ciclo'; no: string };

/**
 * Confere o grafo: todo `proximo`/`seguir` existe, todo nó é alcançável a partir do início e
 * todo caminho termina no nó final (sem beco sem saída nem ciclo).
 */
export function validarRoteiro(
  roteiro: Record<string, NoRoteiro> = ROTEIRO_BROXIS,
  inicio: string = NO_INICIAL,
  fim: string = NO_FINAL,
): ProblemaRoteiro[] {
  const problemas: ProblemaRoteiro[] = [];
  const saidas = (no: NoRoteiro): string[] => [...no.opcoes.map((o) => o.proximo), ...(no.seguir ? [no.seguir] : [])];

  for (const [id, no] of Object.entries(roteiro)) {
    for (const destino of saidas(no)) {
      if (!roteiro[destino]) problemas.push({ tipo: 'proximo_inexistente', no: id });
    }
    if (id !== fim && saidas(no).length === 0) problemas.push({ tipo: 'sem_saida', no: id });
  }

  const alcancaveis = new Set<string>();
  const pilha = [inicio];
  while (pilha.length) {
    const id = pilha.pop()!;
    if (alcancaveis.has(id) || !roteiro[id]) continue;
    alcancaveis.add(id);
    pilha.push(...saidas(roteiro[id]));
  }
  for (const id of Object.keys(roteiro)) {
    if (!alcancaveis.has(id)) problemas.push({ tipo: 'no_orfao', no: id });
  }

  // ciclo: busca em profundidade com marcação de "no caminho atual"
  const estado = new Map<string, 'visitando' | 'feito'>();
  const visitar = (id: string): void => {
    if (!roteiro[id] || estado.get(id) === 'feito') return;
    if (estado.get(id) === 'visitando') {
      problemas.push({ tipo: 'ciclo', no: id });
      return;
    }
    estado.set(id, 'visitando');
    saidas(roteiro[id]).forEach(visitar);
    estado.set(id, 'feito');
  };
  visitar(inicio);

  return problemas;
}

/** Todos os caminhos (sequência de nós) do início até um nó sem saída. */
export function caminhosDoRoteiro(
  roteiro: Record<string, NoRoteiro> = ROTEIRO_BROXIS,
  inicio: string = NO_INICIAL,
): string[][] {
  const caminhos: string[][] = [];
  const andar = (id: string, caminho: string[]) => {
    const no = roteiro[id];
    if (!no || caminho.includes(id)) return;
    const atual = [...caminho, id];
    const proximos = [...no.opcoes.map((o) => o.proximo), ...(no.seguir ? [no.seguir] : [])];
    if (!proximos.length) caminhos.push(atual);
    proximos.forEach((p) => andar(p, atual));
  };
  andar(inicio, []);
  return caminhos;
}
