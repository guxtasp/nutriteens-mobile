// src/features/adolescente/receitas-ingredientes/utils/combinarReceitas.ts
// Regras do "Receitas com o que tenho" (RF023 a RF029). Lógica pura: recebe as
// receitas e os ingredientes do usuário e devolve a ordem e o que tem/falta.
import { normalizarTexto } from '../../alimentacao/utils/filtrosAlimento';

export type IngredienteReceita = {
  alimentoId: string;
  nome: string;
  /** "2 colheres", "1 xícara"... (vem de receita_ingredientes; pratos não têm) */
  quantidadeTexto: string | null;
};

export type IngredienteCasa = { id: string; nome: string };

type Dif = 'FACIL' | 'MEDIO' | 'DIFICIL' | string | null;

export type ReceitaBase = {
  id: string;
  titulo: string;
  dificuldade: Dif;
  ingredientes: IngredienteReceita[];
};

export type ReceitaPontuada<T extends ReceitaBase> = {
  receita: T;
  tenho: IngredienteReceita[];
  faltam: IngredienteReceita[];
};

const PESO_DIFICULDADE: Record<string, number> = { FACIL: 0, MEDIO: 1, DIFICIL: 2 };
const pesoDificuldade = (d: Dif) => (d && d in PESO_DIFICULDADE ? PESO_DIFICULDADE[d] : 3);

const porTitulo = <T extends ReceitaBase>(a: ReceitaPontuada<T>, b: ReceitaPontuada<T>) =>
  a.receita.titulo.localeCompare(b.receita.titulo, 'pt-BR');

/** Separa os ingredientes da receita em "você já tem" e "falta". */
export function pontuar<T extends ReceitaBase>(receita: T, idsCasa: ReadonlySet<string>): ReceitaPontuada<T> {
  const tenho: IngredienteReceita[] = [];
  const faltam: IngredienteReceita[] = [];
  receita.ingredientes.forEach((i) => (idsCasa.has(i.alimentoId) ? tenho : faltam).push(i));
  return { receita, tenho, faltam };
}

/**
 * RF026: receitas com pelo menos 1 ingrediente em comum, da que mais combina para a que menos combina.
 * Desempate: a que menos falta, depois a mais fácil, depois ordem alfabética.
 */
export function receitasQueCombinam<T extends ReceitaBase>(receitas: T[], ingredientesCasa: IngredienteCasa[]): ReceitaPontuada<T>[] {
  const ids = new Set(ingredientesCasa.map((i) => i.id));
  return receitas
    .map((r) => pontuar(r, ids))
    .filter((p) => p.tenho.length >= 1)
    .sort(
      (a, b) =>
        b.tenho.length - a.tenho.length ||
        a.faltam.length - b.faltam.length ||
        pesoDificuldade(a.receita.dificuldade) - pesoDificuldade(b.receita.dificuldade) ||
        porTitulo(a, b)
    );
}

/** RF028: sem ingrediente nenhum informado, todas as receitas, da mais fácil para a mais difícil. */
export function todasPorDificuldade<T extends ReceitaBase>(receitas: T[]): ReceitaPontuada<T>[] {
  return receitas
    .map((r) => pontuar(r, new Set<string>()))
    .sort((a, b) => pesoDificuldade(a.receita.dificuldade) - pesoDificuldade(b.receita.dificuldade) || porTitulo(a, b));
}

/**
 * RF029: o usuário não gostou de nenhuma sugestão. Mostra as demais receitas (as que não tinham
 * nenhum ingrediente em comum), começando pelas que pedem menos ingredientes que ele não tem.
 */
export function outrasReceitas<T extends ReceitaBase>(receitas: T[], ingredientesCasa: IngredienteCasa[]): ReceitaPontuada<T>[] {
  const ids = new Set(ingredientesCasa.map((i) => i.id));
  return receitas
    .map((r) => pontuar(r, ids))
    .filter((p) => p.tenho.length === 0)
    .sort(
      (a, b) =>
        a.faltam.length - b.faltam.length ||
        pesoDificuldade(a.receita.dificuldade) - pesoDificuldade(b.receita.dificuldade) ||
        porTitulo(a, b)
    );
}

/**
 * RF025: autocomplete só com ingredientes que existem nas receitas (base pré-cadastrada),
 * então todo ingrediente escolhido pode, de fato, combinar com alguma receita.
 * Começa-com vem antes de contém; quem já está na despensa não é sugerido de novo.
 */
export function sugerirIngredientes(
  universo: IngredienteCasa[],
  termo: string,
  jaTenho: IngredienteCasa[],
  limite = 8
): IngredienteCasa[] {
  const t = normalizarTexto(termo);
  if (!t) return [];
  const tenho = new Set(jaTenho.map((i) => i.id));
  const candidatos = universo.filter((i) => !tenho.has(i.id) && normalizarTexto(i.nome).includes(t));
  const comeca = (i: IngredienteCasa) => (normalizarTexto(i.nome).startsWith(t) ? 0 : 1);
  return candidatos
    .sort((a, b) => comeca(a) - comeca(b) || a.nome.localeCompare(b.nome, 'pt-BR'))
    .slice(0, limite);
}

/** Todos os ingredientes distintos usados nas receitas. */
export function universoDeIngredientes(receitas: ReceitaBase[]): IngredienteCasa[] {
  const mapa = new Map<string, IngredienteCasa>();
  receitas.forEach((r) => r.ingredientes.forEach((i) => mapa.set(i.alimentoId, { id: i.alimentoId, nome: i.nome })));
  return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

/**
 * Une os ingredientes de `receita_ingredientes` (com quantidade em texto) e de `prato_ingredientes`
 * (do prato resultante). A equipe hoje edita os do prato, então os dois lados valem; se um
 * ingrediente aparece nos dois, fica a versão com quantidade.
 */
export function unirIngredientes(daReceita: IngredienteReceita[], doPrato: IngredienteReceita[]): IngredienteReceita[] {
  const mapa = new Map<string, IngredienteReceita>();
  doPrato.forEach((i) => mapa.set(i.alimentoId, i));
  daReceita.forEach((i) => mapa.set(i.alimentoId, i));
  return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
