// RF016 — "onde encontrar": quais alimentos do catálogo são fonte de um nutriente.
//
// Regras (auditoria de vitaminas, Fase 3):
//  1. Vale o que está gravado em alimento_nutrientes. AUSENTE nunca vira fonte.
//  2. Coluna NULL em linha de origem confiável (TACO / revisada) = "não sabemos": NÃO herda do grupo.
//  3. Só há fallback por grupo quando NÃO há linha, ou a linha é INFERIDO_POR_GRUPO, e apenas
//     para alimento simples: IN_NATURA, não é prato composto e tem um único grupo alimentar.
//     (prato composto herdava o benefício de todos os grupos: pizza = "alto teor de cálcio")
//  4. O fallback desta página é mais conservador que o das missões (nutrientesPorGrupo.ts):
//     grupo é heterogêneo demais para afirmar ferro/zinco em CARNES_E_OVOS, nem "alto teor" em
//     FRUTAS/LEITE. As missões continuam usando alimentoEBoaFonte, sem mudança.
//  5. Ultraprocessados não entram. EBIA só ORDENA (acessíveis primeiro), nunca remove.
//  6. Ordem: acessíveis > com dado gravado > alto teor > nome A–Z > id.
import type { NutrienteChave, NivelNutriente } from '../../alimentacao/utils/nutrientesPorGrupo';

export type AlimentoCatalogo = {
  id: string;
  nome: string;
  classificacao_nova?: string;
  eh_prato_composto?: boolean | null;
  grupos_alimentares?: string[];
  alimento_nutrientes?: any; // objeto ou lista (depende do join) com a coluna do nutriente (+ fonte)
};

export type NivelFonte = 'FONTE' | 'ALTO_TEOR';
export type OrigemNivel = 'DADO' | 'GRUPO';
export type DetalheNivel = { nivel: NivelFonte; origem: OrigemNivel };

// Fallback por grupo SÓ desta página. O que não está aqui não é inferido.
const FALLBACK_PAGINA: Record<string, Partial<Record<NutrienteChave, NivelNutriente>>> = {
  OLEAGINOSAS_E_SEMENTES: { zinco: 'ALTO_TEOR', ferro: 'FONTE', magnesio: 'ALTO_TEOR' },
  LEGUMES_E_VERDURAS: { vitamina_a: 'FONTE', vitamina_c: 'FONTE' },
  FRUTAS: { vitamina_c: 'FONTE' },
  LEITE_E_DERIVADOS: { calcio: 'FONTE' },
  LEGUMINOSAS: { ferro: 'FONTE', zinco: 'FONTE' },
};

// fontes de linha gravada em que NULL significa "não sabemos" (e não "herde do grupo")
const ORIGENS_CONFIAVEIS = new Set(['TACO_4ED', 'REVISADO_NUTRICIONISTA']);

function linhaDe(a: AlimentoCatalogo): Record<string, any> | null {
  const bruto = a.alimento_nutrientes;
  const linha = Array.isArray(bruto) ? bruto[0] : bruto;
  return linha ?? null;
}

function podeUsarGrupo(a: AlimentoCatalogo): boolean {
  const grupos = a.grupos_alimentares ?? [];
  return a.classificacao_nova === 'IN_NATURA' && !a.eh_prato_composto && grupos.length === 1;
}

export function detalheDoNutriente(a: AlimentoCatalogo, coluna: NutrienteChave): DetalheNivel | null {
  const linha = linhaDe(a);
  const gravado = linha?.[coluna];
  if (gravado != null) {
    return gravado === 'FONTE' || gravado === 'ALTO_TEOR' ? { nivel: gravado, origem: 'DADO' } : null;
  }
  // linha confiável com a coluna em branco: "não sabemos", não herda do grupo
  if (linha && ORIGENS_CONFIAVEIS.has(linha.fonte ?? '')) return null;
  if (!podeUsarGrupo(a)) return null;

  const n = FALLBACK_PAGINA[a.grupos_alimentares![0]]?.[coluna];
  return n === 'FONTE' || n === 'ALTO_TEOR' ? { nivel: n, origem: 'GRUPO' } : null;
}

export function nivelDoNutriente(a: AlimentoCatalogo, coluna: NutrienteChave): NivelFonte | null {
  return detalheDoNutriente(a, coluna)?.nivel ?? null;
}

/** Fontes do nutriente, na ordem: acessíveis > dado gravado > alto teor > nome A–Z > id. Nunca remove por EBIA. */
export function selecionarFontes(
  alimentos: AlimentoCatalogo[],
  coluna: NutrienteChave,
  acessiveis: Set<string> | null, // null = sem triagem: todos contam como acessíveis
  limite = 12,
): AlimentoCatalogo[] {
  const num = (b: boolean) => (b ? 1 : 0);
  const acessivel = (id: string) => (acessiveis ? acessiveis.has(id) : true);
  const comNivel = alimentos
    .filter((a) => a.classificacao_nova !== 'ULTRAPROCESSADO')
    .map((a) => ({ a, d: detalheDoNutriente(a, coluna) }))
    .filter((x): x is { a: AlimentoCatalogo; d: DetalheNivel } => x.d !== null);

  return comNivel
    .sort((x, y) =>
      num(acessivel(y.a.id)) - num(acessivel(x.a.id)) ||
      num(y.d.origem === 'DADO') - num(x.d.origem === 'DADO') ||
      num(y.d.nivel === 'ALTO_TEOR') - num(x.d.nivel === 'ALTO_TEOR') ||
      x.a.nome.localeCompare(y.a.nome, 'pt-BR') ||
      x.a.id.localeCompare(y.a.id))
    .slice(0, limite)
    .map((x) => x.a);
}

/** Quais dos nutrientes têm pelo menos um alimento-fonte (para avisar "em breve" na lista). */
export function nutrientesComFonte(alimentos: AlimentoCatalogo[], chaves: NutrienteChave[]): Set<NutrienteChave> {
  const comFonte = new Set<NutrienteChave>();
  const validos = alimentos.filter((a) => a.classificacao_nova !== 'ULTRAPROCESSADO');
  for (const c of chaves) if (validos.some((a) => nivelDoNutriente(a, c) !== null)) comFonte.add(c);
  return comFonte;
}
