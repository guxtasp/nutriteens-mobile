// src/features/adolescente/alimentacao/utils/filtrosAlimento.ts
// Filtros da busca de alimentos/pratos/receitas. Lógica pura (sem rede, sem React).
import type { ClassificacaoNova } from './regraFeedbackRefeicao';

/** minúsculas e sem acento: "Maçã" casa com "maca" */
export function normalizarTexto(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// ---------- alimentos e pratos ----------

export type FiltroAlimento = {
  nova: ClassificacaoNova | null;
  grupo: string | null;
};

export const FILTRO_ALIMENTO_VAZIO: FiltroAlimento = { nova: null, grupo: null };

type ItemFiltravel = { classificacao_nova: ClassificacaoNova; grupos_alimentares: string[] };

export function filtrarAlimentos<T extends ItemFiltravel>(lista: T[], filtro: FiltroAlimento): T[] {
  return lista.filter((item) => {
    if (filtro.nova && item.classificacao_nova !== filtro.nova) return false;
    if (filtro.grupo && !(item.grupos_alimentares ?? []).includes(filtro.grupo)) return false;
    return true;
  });
}

/** Grupos que aparecem de fato nos resultados — o filtro nunca oferece um grupo vazio. */
export function gruposDisponiveis<T extends Pick<ItemFiltravel, 'grupos_alimentares'>>(lista: T[]): string[] {
  const grupos = new Set<string>();
  lista.forEach((item) => (item.grupos_alimentares ?? []).forEach((g) => grupos.add(g)));
  return [...grupos].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/** "FRUTAS_E_VERDURAS" -> "Frutas e verduras" (quando o banco não tem um título amigável) */
export function rotuloDoGrupo(grupo: string, titulos?: Record<string, string>): string {
  if (titulos?.[grupo]) return titulos[grupo];
  const texto = grupo.replace(/_/g, ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function filtroAlimentoAtivo(f: FiltroAlimento): boolean {
  return f.nova !== null || f.grupo !== null;
}

// ---------- receitas ----------

export type Dificuldade = 'FACIL' | 'MEDIO' | 'DIFICIL';

export type FiltroReceita = {
  dificuldade: Dificuldade | null;
  /** tempo de preparo máximo, em minutos */
  tempoMaxMin: number | null;
};

export const FILTRO_RECEITA_VAZIO: FiltroReceita = { dificuldade: null, tempoMaxMin: null };

export const OPCOES_TEMPO_MIN = [15, 30, 45] as const;

export function filtrarReceitas<T extends { dificuldade: Dificuldade | string | null; tempo_preparo_min: number | null }>(
  lista: T[],
  filtro: FiltroReceita
): T[] {
  return lista.filter((r) => {
    if (filtro.dificuldade && r.dificuldade !== filtro.dificuldade) return false;
    // receita sem tempo informado não prova que cabe no limite: fica de fora
    if (filtro.tempoMaxMin !== null && (r.tempo_preparo_min === null || r.tempo_preparo_min > filtro.tempoMaxMin)) return false;
    return true;
  });
}

export function filtroReceitaAtivo(f: FiltroReceita): boolean {
  return f.dificuldade !== null || f.tempoMaxMin !== null;
}
