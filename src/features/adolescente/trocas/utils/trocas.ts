// Regras puras do módulo Comer / trocas (RF015). Sem I/O, para testar.
// Princípio: EBIA ordena, nunca exclui — nada aqui remove troca por causa dela.
import type { ClassificacaoNova } from '../../alimentacao/utils/regraFeedbackRefeicao';

export type CategoriaTroca =
  | 'REFRIGERANTE_BEBIDA' | 'DOCE' | 'EMBUTIDO' | 'LANCHE' | 'REFEICAO' | 'BISCOITO' | 'SALGADINHO';
// ordem da tela "Sugestões alimentares" (protótipo)
export const CATEGORIAS_TROCA: CategoriaTroca[] = ['REFRIGERANTE_BEBIDA', 'DOCE', 'EMBUTIDO', 'LANCHE', 'REFEICAO', 'BISCOITO', 'SALGADINHO'];

export const ROTULO_CATEGORIA: Record<CategoriaTroca, string> = {
  REFRIGERANTE_BEBIDA: 'Bebidas',
  DOCE: 'Doces',
  EMBUTIDO: 'Embutidos',
  LANCHE: 'Lanches',
  REFEICAO: 'Refeições',
  BISCOITO: 'Biscoitos',
  SALGADINHO: 'Salgadinhos',
};
// frase de chamada do cartão da categoria
export const CHAMADA_CATEGORIA: Record<CategoriaTroca, string> = {
  REFRIGERANTE_BEBIDA: 'Bateu vontade de refri? Experimente estas trocas!',
  DOCE: 'Tá com vontade de doce? Veja alternativas deliciosas, saudáveis e rápidas!',
  EMBUTIDO: 'Antes de escolher um embutido, confira estas opções!',
  LANCHE: 'Hora do lanche? Que tal experimentar algo diferente?',
  REFEICAO: 'Vai montar uma refeição? Confira estas combinações!',
  BISCOITO: 'Quer um biscoito? Confira opções mais nutritivas!',
  SALGADINHO: 'Bateu vontade de salgadinho? Veja opções crocantes e leves!',
};
// "O que muda": por que o item de pacote desta categoria vale uma troca. Texto neutro, sem
// julgar quem comeu e sem caloria. (Conteúdo educativo: a nutricionista deve revisar.)
export const CONTEXTO_CATEGORIA: Record<CategoriaTroca, string> = {
  REFRIGERANTE_BEBIDA: 'Refrigerante e suco de caixinha têm muito açúcar adicionado e quase nenhum nutriente. Uma latinha tem açúcar equivalente a cerca de 9 colheres de chá.',
  DOCE: 'Bala, chocolate e doce de pacote são feitos de açúcar, gordura e aditivos. Dão um pico rápido de energia e a fome volta logo.',
  EMBUTIDO: 'Salsicha, presunto e mortadela têm bastante sal e conservantes (como o nitrito), e quase nenhuma fibra.',
  LANCHE: 'Lanche de pacote é rápido, mas costuma ter pouca fibra e pouca proteína, e a fome volta cedo.',
  REFEICAO: 'Prato pronto e tempero em cubo trazem muito sal e aditivos. Comida feita em casa deixa o tempero na sua mão.',
  BISCOITO: 'Biscoito de pacote, principalmente o recheado, junta açúcar, gordura e aromatizantes, e sacia pouco.',
  SALGADINHO: 'Salgadinho de pacote tem muito sal, gordura e realçadores de sabor pensados para dar vontade de comer mais.',
};

// usado em "em vez de ___, que tal" (retorno da refeição). Só as categorias de item.
export const NOME_CURTO_CATEGORIA: Record<CategoriaTroca, string> = {
  REFRIGERANTE_BEBIDA: 'refrigerante',
  DOCE: 'doce',
  EMBUTIDO: 'embutido',
  LANCHE: 'lanche',
  REFEICAO: 'refeição',
  BISCOITO: 'biscoito',
  SALGADINHO: 'salgadinho',
};
// Lanche e Refeição são categorias de "ideia" (não classificam alimentos do catálogo):
// aparecem só na tela de sugestões, nunca no retorno da refeição.

export type Troca = {
  id: string;
  categoria: CategoriaTroca;
  origemId: string | null;
  origemNome: string | null;
  destinoId: string;
  destinoNome: string;
  tiposRefeicao: string[];      // vazio = qualquer refeição
  frase: string;
  rapida: boolean;
  ordem: number;
  destinoAcessivel: boolean;    // já calculado no banco; nunca exibir
  destinoRecente: boolean;
  respondidaRecente: boolean;
  dica?: string | null;         // "como fazer": passo prático curto
  nutrientes?: string[];        // colunas de alimento_nutrientes em que o destino é FONTE/ALTO_TEOR
};

// colunas de alimento_nutrientes -> rótulo exibido. A ordem é a de prioridade na tela.
const ROTULO_NUTRIENTE: Record<string, string> = {
  proteina: 'proteína', fibra: 'fibra', calcio: 'cálcio', ferro: 'ferro', zinco: 'zinco',
  magnesio: 'magnésio', vitamina_c: 'vitamina C', vitamina_a: 'vitamina A', vitamina_d: 'vitamina D',
};

/** Até `max` rótulos legíveis (ex.: "cálcio"), só dos nutrientes que conhecemos. */
export function rotulosNutrientes(chaves: string[] | undefined | null, max = 3): string[] {
  const set = new Set(chaves ?? []);
  return Object.keys(ROTULO_NUTRIENTE).filter((k) => set.has(k)).slice(0, max).map((k) => ROTULO_NUTRIENTE[k]);
}

export type ItemCategorizavel = {
  id: string;
  nome: string;
  categoriaTroca?: CategoriaTroca | null;
  classificacaoNova: ClassificacaoNova;
  grupos: string[];
};

const LANCHES = ['LANCHE_MANHA', 'LANCHE_TARDE'];

/** Valor do catálogo manda; sem valor, fallback por grupo (só ultraprocessados). */
export function categoriaDoAlimento(a: Pick<ItemCategorizavel, 'categoriaTroca' | 'classificacaoNova' | 'grupos'>): CategoriaTroca | null {
  if (a.categoriaTroca) return a.categoriaTroca;
  if (a.classificacaoNova !== 'ULTRAPROCESSADO') return null;
  if (a.grupos.includes('BEBIDAS')) return 'REFRIGERANTE_BEBIDA';
  if (a.grupos.includes('ACUCARES_E_DOCES')) return 'DOCE';
  if (a.grupos.includes('CARNES_E_OVOS')) return 'EMBUTIDO';
  return null;
}

type Contexto = { origemIds?: string[]; tipoRefeicao?: string };

const num = (b: boolean) => (b ? 1 : 0);

/** Ordem do RF015 §4. Devolve cópia; nunca remove itens. */
export function ordenarTrocas(trocas: Troca[], ctx: Contexto = {}): Troca[] {
  const origens = new Set(ctx.origemIds ?? []);
  const ehLanche = !!ctx.tipoRefeicao && LANCHES.includes(ctx.tipoRefeicao);
  const especifica = (t: Troca) => t.origemId !== null && origens.has(t.origemId);
  const combina = (t: Troca) => !ctx.tipoRefeicao || t.tiposRefeicao.length === 0 || t.tiposRefeicao.includes(ctx.tipoRefeicao);

  return [...trocas].sort((a, b) =>
    num(b.destinoAcessivel) - num(a.destinoAcessivel) ||
    num(especifica(b)) - num(especifica(a)) ||
    num(combina(b)) - num(combina(a)) ||
    num(b.destinoRecente) - num(a.destinoRecente) ||
    (ehLanche ? num(b.rapida) - num(a.rapida) : 0) ||
    a.destinoNome.localeCompare(b.destinoNome, 'pt-BR') ||
    a.id.localeCompare(b.id)
  );
}

export type OpcaoTroca = { id: string; destinoNome: string; frase: string; rapida: boolean; dica?: string | null; nutrientes?: string[] };

/** Remove destinos repetidos (mantém a primeira, que é a mais bem ordenada). */
export function semDestinoRepetido(trocas: Troca[]): Troca[] {
  const vistos = new Set<string>();
  return trocas.filter((t) => (vistos.has(t.destinoId) ? false : (vistos.add(t.destinoId), true)));
}

/**
 * Retorno da refeição: pega a categoria da melhor troca e devolve VÁRIAS opções dela
 * (até `limite`), na mesma ordem do RF015, pulando as respondidas nos últimos 3 dias.
 */
export function escolherTrocasRefeicao(
  trocas: Troca[],
  itens: { id: string; nome: string; categoria: CategoriaTroca | null }[],
  tipoRefeicao: string,
  limite = 4,
): { categoria: CategoriaTroca; origemNome: string; opcoes: OpcaoTroca[] } | null {
  const ids = itens.map((i) => i.id);
  const cats = new Set(itens.map((i) => i.categoria).filter((c): c is CategoriaTroca => !!c));
  const candidatas = trocas.filter(
    (t) => !t.respondidaRecente && ((t.origemId !== null && ids.includes(t.origemId)) || (t.origemId === null && cats.has(t.categoria))),
  );
  const ordenadas = ordenarTrocas(candidatas, { origemIds: ids, tipoRefeicao });
  if (ordenadas.length === 0) return null;
  const categoria = ordenadas[0].categoria;
  const daCategoria = semDestinoRepetido(ordenadas.filter((t) => t.categoria === categoria)).slice(0, limite);
  const origemNome =
    ordenadas[0].origemNome ?? itens.find((i) => i.categoria === categoria)?.nome ?? NOME_CURTO_CATEGORIA[categoria];
  return {
    categoria,
    origemNome,
    opcoes: daCategoria.map((t) => ({ id: t.id, destinoNome: t.destinoNome, frase: t.frase, rapida: t.rapida, dica: t.dica ?? null, nutrientes: t.nutrientes ?? [] })),
  };
}
