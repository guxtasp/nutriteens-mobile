// src/features/adolescente/home/utils/desafioBroxis.ts
//
// "Desafio do Bróxis" não é um sistema separado — é só uma forma de
// enquadrar o número de dias da sequência em metas visuais (7, 15, 30, 60
// dias) pra dar mais interesse em manter a sequência. O usuário já ganha XP
// pela sequência normalmente (ver celebracaoSequencia.ts); isso aqui não
// desbloqueia nem condiciona nada, é só a barra de progresso da tela.
//
// Regra: pega o menor nível da lista que ainda não foi alcançado. Ao bater
// um nível, o próximo dia já mostra o nível seguinte como meta. Depois do
// último nível (60), fica "preso" nele (não tem meta maior definida ainda).
const NIVEIS_DESAFIO = [7, 15, 30, 60] as const;

export type DesafioBroxis = {
  duracaoDias: (typeof NIVEIS_DESAFIO)[number];
  diaAtual: number;
};

export function calcularDesafioBroxis(sequenciaAtual: number): DesafioBroxis {
  const nivel = NIVEIS_DESAFIO.find((n) => sequenciaAtual < n) ?? NIVEIS_DESAFIO[NIVEIS_DESAFIO.length - 1];
  return { duracaoDias: nivel, diaAtual: Math.min(sequenciaAtual, nivel) };
}
