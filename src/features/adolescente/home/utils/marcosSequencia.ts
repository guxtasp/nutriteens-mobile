// src/features/adolescente/home/utils/marcosSequencia.ts
//
// Marcos da sequência (insígnia → medalha → troféu) e numeração da semana ("dia 1, 2, 3 da sequência").
// Só leitura sobre a sequência que o app já calcula: não concede XP nem condiciona nada.
// Tom sem culpa: marco não atingido mostra "faltam N dias", nunca "você falhou".

export type NivelConquista = 'INSIGNIA' | 'MEDALHA' | 'TROFEU';

/** Mesmos níveis do "Desafio do Bróxis" (7, 15, 30, 60) mais o troféu de 100 dias. */
export const DIAS_MARCOS = [7, 15, 30, 60, 100] as const;

export type MarcoSequencia = {
  dias: number;
  nivel: NivelConquista;
  /** a sequência atual ou o recorde já chegou lá */
  atingido: boolean;
  /** dias que faltam a partir da sequência atual (0 se já atingido) */
  faltam: number;
};

export function nivelDoMarco(dias: number): NivelConquista {
  if (dias >= 100) return 'TROFEU';
  if (dias >= 30) return 'MEDALHA';
  return 'INSIGNIA';
}

export function rotuloNivel(nivel: NivelConquista): string {
  return nivel === 'TROFEU' ? 'Troféu' : nivel === 'MEDALHA' ? 'Medalha' : 'Insígnia';
}

export function marcosDaSequencia(sequenciaAtual: number, maiorSequencia: number): MarcoSequencia[] {
  const melhor = Math.max(sequenciaAtual, maiorSequencia, 0);
  return DIAS_MARCOS.map((dias) => ({
    dias,
    nivel: nivelDoMarco(dias),
    atingido: melhor >= dias,
    faltam: Math.max(0, dias - Math.max(sequenciaAtual, 0)),
  }));
}

/**
 * Número do dia dentro da sequência atual para cada dia da semana (ou null).
 * A sequência termina no último dia mantido da semana (hoje, ou ontem se hoje ainda não contou);
 * dias mantidos contíguos para trás recebem sequenciaAtual, sequenciaAtual-1, ...
 * Dias mantidos de uma sequência antiga (antes de uma quebra) ou não mantidos ficam null.
 */
export function numerarSemana(mantidos: boolean[], sequenciaAtual: number): (number | null)[] {
  const resultado: (number | null)[] = mantidos.map(() => null);
  if (sequenciaAtual <= 0) return resultado;
  let ultimo = -1;
  mantidos.forEach((m, i) => { if (m) ultimo = i; });
  if (ultimo < 0) return resultado;
  let n = sequenciaAtual;
  for (let i = ultimo; i >= 0 && mantidos[i] && n >= 1; i--, n--) resultado[i] = n;
  return resultado;
}
