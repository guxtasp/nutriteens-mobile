// src/features/adolescente/receitas-ingredientes/utils/gruposIngredientes.ts
// Arruma TODOS os ingredientes do catálogo em 4 grupos simples ("Frutas e verduras", "Proteínas e
// laticínios"...) para a primeira tela de "Receitas com o que tenho". Lógica pura, sem React.
//
// Cada atalho ("Arroz") junta todas as variações do catálogo cuja primeira palavra é ela
// ("Arroz, integral, cozido"; "Arroz, tipo 1, cru"...), então marcar "Arroz" vale para todas.
import { normalizarTexto } from '../../alimentacao/utils/filtrosAlimento';
import { INGREDIENTES_COMUNS, type IngredienteCasa } from './combinarReceitas';

export type GrupoCasa = 'FRUTAS_VERDURAS' | 'PROTEINAS_LATICINIOS' | 'CEREAIS_PAES' | 'TEMPEROS_BASICOS';

export const GRUPOS_CASA: { chave: GrupoCasa; titulo: string }[] = [
  { chave: 'FRUTAS_VERDURAS', titulo: 'Frutas e verduras' },
  { chave: 'PROTEINAS_LATICINIOS', titulo: 'Proteínas e laticínios' },
  { chave: 'CEREAIS_PAES', titulo: 'Cereais, massas e pães' },
  { chave: 'TEMPEROS_BASICOS', titulo: 'Temperos e básicos' },
];

/** De qual grupo da tela é cada grupo alimentar do catálogo. O que não está aqui cai em "Temperos e básicos". */
const GRUPO_ALIMENTAR_PARA_GRUPO_CASA: Record<string, GrupoCasa> = {
  FRUTAS: 'FRUTAS_VERDURAS',
  LEGUMES_E_VERDURAS: 'FRUTAS_VERDURAS',
  CARNES_E_OVOS: 'PROTEINAS_LATICINIOS',
  LEGUMINOSAS: 'PROTEINAS_LATICINIOS',
  LEITE_E_DERIVADOS: 'PROTEINAS_LATICINIOS',
  OLEAGINOSAS_E_SEMENTES: 'PROTEINAS_LATICINIOS',
  CEREAIS_E_TUBERCULOS: 'CEREAIS_PAES',
};

export type AtalhoIngrediente = {
  /** mesmo formato da despensa: id do primeiro alimento + todos os ids que o atalho cobre */
  id: string;
  nome: string;
  ids: string[];
  grupo: GrupoCasa;
  /** está na lista de ingredientes do dia a dia (aparece primeiro dentro do grupo) */
  comum: boolean;
};

const palavras = (nome: string) => normalizarTexto(nome).split(/[^a-z0-9]+/).filter(Boolean);
const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Grupo da tela para uma lista de grupos alimentares: vale o da maioria das variações (empate: o primeiro). */
export function grupoCasaDe(gruposAlimentares: string[][]): GrupoCasa {
  const votos = new Map<GrupoCasa, number>();
  gruposAlimentares.forEach((lista) => {
    // um alimento com vários grupos (pão de queijo) vota uma vez, no primeiro grupo que a tela conhece
    const g = lista.map((x) => GRUPO_ALIMENTAR_PARA_GRUPO_CASA[x]).find(Boolean) ?? 'TEMPEROS_BASICOS';
    votos.set(g, (votos.get(g) ?? 0) + 1);
  });
  let melhor: GrupoCasa = 'TEMPEROS_BASICOS';
  let max = 0;
  votos.forEach((n, g) => {
    if (n > max) {
      max = n;
      melhor = g;
    }
  });
  return melhor;
}

/**
 * Todos os atalhos, por grupo. Dentro de cada grupo: primeiro os ingredientes do dia a dia (na ordem
 * de INGREDIENTES_COMUNS), depois o resto em ordem alfabética. A ordem não muda quando o usuário marca
 * um ingrediente, para os botões não "pularem" sob o dedo.
 */
export function agruparIngredientes(
  universo: IngredienteCasa[],
  comuns: readonly string[] = INGREDIENTES_COMUNS,
  maxIds = 60
): Record<GrupoCasa, AtalhoIngrediente[]> {
  const porPalavra = new Map<string, IngredienteCasa[]>();
  universo.forEach((i) => {
    const p = palavras(i.nome)[0];
    if (!p) return;
    const lista = porPalavra.get(p) ?? [];
    lista.push(i);
    porPalavra.set(p, lista);
  });

  const ordemComum = new Map(comuns.map((c, k) => [normalizarTexto(c), k]));
  const todos: AtalhoIngrediente[] = [];
  porPalavra.forEach((variacoes, palavra) => {
    const ids = variacoes.map((v) => v.id).slice(0, maxIds);
    // "feijão" da lista de comuns mantém o acento; os demais usam a primeira palavra do nome no catálogo
    const doCatalogo = (variacoes[0].nome.split(/[\s,]+/)[0] ?? palavra).toLowerCase();
    const comum = comuns.find((c) => normalizarTexto(c) === palavra);
    todos.push({
      id: ids[0],
      nome: capitalizar(comum ?? doCatalogo),
      ids,
      grupo: grupoCasaDe(variacoes.map((v) => v.grupos ?? [])),
      comum: ordemComum.has(palavra),
    });
  });

  const ordenar = (a: AtalhoIngrediente, b: AtalhoIngrediente) => {
    const oa = ordemComum.get(normalizarTexto(a.nome));
    const ob = ordemComum.get(normalizarTexto(b.nome));
    if (oa !== undefined && ob !== undefined) return oa - ob;
    if (oa !== undefined) return -1;
    if (ob !== undefined) return 1;
    return a.nome.localeCompare(b.nome, 'pt-BR');
  };

  const resultado: Record<GrupoCasa, AtalhoIngrediente[]> = {
    FRUTAS_VERDURAS: [],
    PROTEINAS_LATICINIOS: [],
    CEREAIS_PAES: [],
    TEMPEROS_BASICOS: [],
  };
  todos.sort(ordenar).forEach((a) => resultado[a.grupo].push(a));
  return resultado;
}

const idsDaDespensa = (despensa: IngredienteCasa[]) => new Set(despensa.flatMap((d) => d.ids ?? [d.id]));

/** O atalho está "marcado" se qualquer ingrediente da despensa coincide com algum alimento dele. */
export function atalhoNaDespensa(atalho: AtalhoIngrediente, despensa: IngredienteCasa[]): boolean {
  const tenho = idsDaDespensa(despensa);
  return atalho.ids.some((id) => tenho.has(id));
}

/** Quantos atalhos do grupo já estão marcados (o "3" de "3 de 14"). */
export function contarMarcados(atalhos: AtalhoIngrediente[], despensa: IngredienteCasa[]): number {
  const tenho = idsDaDespensa(despensa);
  return atalhos.filter((a) => a.ids.some((id) => tenho.has(id))).length;
}

/** Marca o atalho (se não estava) ou desmarca (se estava), devolvendo a nova despensa. */
export function alternarAtalho(atalho: AtalhoIngrediente, despensa: IngredienteCasa[]): IngredienteCasa[] {
  if (atalhoNaDespensa(atalho, despensa)) {
    const doAtalho = new Set(atalho.ids);
    return despensa.filter((d) => !(d.ids ?? [d.id]).some((id) => doAtalho.has(id)));
  }
  return [...despensa, { id: atalho.id, nome: atalho.nome, ids: atalho.ids }];
}
