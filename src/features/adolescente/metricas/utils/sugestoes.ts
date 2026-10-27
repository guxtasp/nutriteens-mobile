// src/features/adolescente/metricas/utils/sugestoes.ts
//
// Sugestões de alimentos para os grupos que ainda não apareceram no período.
// A EBIA NUNCA aparece na tela: ela só (a) filtra o catálogo no serviço, deixando apenas
// alimentos acessíveis ao nível do adolescente, e (b) ajusta o tom das dicas (restricaoRecursos).
import type { ClassificacaoEbia } from '../../triagem/ebia/data/ebiaData';
import { hashTexto } from './feedbackBroxis';

export type AlimentoSugestao = { nome: string; grupos: string[] };
export type SugestaoGrupo = { grupo: string; alimentos: string[] };

/**
 * Tom das dicas: com insegurança moderada ou grave (ou sem triagem, por precaução) as dicas
 * falam em "o que já está disponível" e nunca sugerem adquirir algo.
 */
export function restricaoRecursos(c: ClassificacaoEbia | null | undefined): boolean {
  return c == null || c === 'INSEGURANCA_MODERADA' || c === 'INSEGURANCA_GRAVE';
}

/** Grupos que existem no catálogo sugerível e não apareceram no período (ordem estável). */
export function gruposAusentes(presentes: string[], alimentos: AlimentoSugestao[]): string[] {
  const jaTem = new Set(presentes);
  const todos = new Set<string>();
  alimentos.forEach((a) => a.grupos.forEach((g) => todos.add(g)));
  return Array.from(todos).filter((g) => !jaTem.has(g)).sort();
}

/**
 * Até `maxGrupos` grupos ausentes, com até `porGrupo` alimentos cada. A escolha varia com a
 * semente (muda por dia, mas não a cada render) e um alimento não se repete entre grupos.
 */
export function selecionarSugestoes(
  alimentos: AlimentoSugestao[], presentes: string[], semente: string, porGrupo = 3, maxGrupos = 3,
): SugestaoGrupo[] {
  const ausentes = gruposAusentes(presentes, alimentos)
    .sort((a, b) => hashTexto(`${semente}|${a}`) - hashTexto(`${semente}|${b}`) || a.localeCompare(b));
  const usados = new Set<string>();
  const saida: SugestaoGrupo[] = [];
  for (const grupo of ausentes) {
    const nomes = alimentos
      .filter((a) => a.grupos.includes(grupo) && !usados.has(a.nome))
      .map((a) => a.nome)
      .sort((x, y) => hashTexto(`${semente}|${grupo}|${x}`) - hashTexto(`${semente}|${grupo}|${y}`) || x.localeCompare(y))
      .slice(0, porGrupo);
    if (!nomes.length) continue;
    nomes.forEach((n) => usados.add(n));
    saida.push({ grupo, alimentos: nomes });
    if (saida.length >= maxGrupos) break;
  }
  return saida;
}
