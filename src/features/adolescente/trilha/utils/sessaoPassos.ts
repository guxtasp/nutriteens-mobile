// src/features/adolescente/trilha/utils/sessaoPassos.ts
//
// Regras de uma sessão de nó (~10 passos), sem React/Supabase pra poder ser
// testada. Ver modelo-pedagogico-trilha.md (seções 3 a 5):
//  - passos SEM NOTA (cartao, enquete, meta, memoria, prato) só avançam; não entram na conta
//    de acertos
//  - passos PONTUADOS errados na 1ª tentativa voltam UMA vez no fim da
//    sessão; na 2ª tentativa a questão segue, certa ou errada (ninguém
//    fica preso, e não existe "vida" a perder)
//  - % de acertos = acertos na PRIMEIRA tentativa ÷ nº de questões pontuadas
// `memoria` é sem nota porque só termina quando todos os pares são achados:
// não existe "errar" o jogo, só demorar mais tentativas.
// `prato` também: só libera o CONTINUAR quando a missão está cumprida, então
// não existe prato "errado" — e dizer isso a um adolescente sobre a comida
// dele não é o tom do app.
export const FORMATOS_SEM_NOTA = ['cartao', 'enquete', 'meta', 'memoria', 'prato'];

export function ehPassoPontuado(formato: string): boolean {
  return !FORMATOS_SEM_NOTA.includes(formato);
}

export type PassoFila<Q> = { questao: Q; ehRetentativa: boolean };

export function montarFila<Q extends { formato: string }>(questoes: Q[]): PassoFila<Q>[] {
  return questoes.map((questao) => ({ questao, ehRetentativa: false }));
}

// Chamar logo depois de responder um passo PONTUADO. Devolve a fila nova
// (a original não é alterada).
export function filaAposResposta<Q extends { formato: string }>(
  fila: PassoFila<Q>[],
  indice: number,
  acertou: boolean
): PassoFila<Q>[] {
  const passo = fila[indice];
  if (!passo || acertou || passo.ehRetentativa || !ehPassoPontuado(passo.questao.formato)) return fila;
  return [...fila, { questao: passo.questao, ehRetentativa: true }];
}

export function contarPontuadas<Q extends { formato: string }>(questoes: Q[]): number {
  return questoes.filter((q) => ehPassoPontuado(q.formato)).length;
}