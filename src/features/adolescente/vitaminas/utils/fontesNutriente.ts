// RF016 — "onde encontrar": quais alimentos do catálogo são fonte de um nutriente.
// Regras: vale o que está gravado em alimento_nutrientes; sem dado, cai no fallback por grupo
// (o mesmo das missões). Ultraprocessados não entram. EBIA só ORDENA (acessíveis primeiro).
import { inferirNutrientesPorGrupo, NutrienteChave } from '../../alimentacao/utils/nutrientesPorGrupo';

export type AlimentoCatalogo = {
  id: string;
  nome: string;
  classificacao_nova?: string;
  grupos_alimentares?: string[];
  alimento_nutrientes?: any; // objeto ou lista (depende do join) com a coluna do nutriente
};

export type NivelFonte = 'FONTE' | 'ALTO_TEOR';

export function nivelDoNutriente(a: AlimentoCatalogo, coluna: NutrienteChave): NivelFonte | null {
  const bruto = a.alimento_nutrientes;
  const linha = Array.isArray(bruto) ? bruto[0] : bruto;
  const gravado = linha?.[coluna];
  if (gravado != null) return gravado === 'FONTE' || gravado === 'ALTO_TEOR' ? gravado : null;

  let melhor: NivelFonte | null = null;
  for (const g of a.grupos_alimentares ?? []) {
    const n = inferirNutrientesPorGrupo(g)[coluna];
    if (n === 'ALTO_TEOR') return 'ALTO_TEOR';
    if (n === 'FONTE') melhor = 'FONTE';
  }
  return melhor;
}

/** Fontes do nutriente, na ordem: acessíveis > alto teor > nome A–Z > id. Nunca remove por EBIA. */
export function selecionarFontes(
  alimentos: AlimentoCatalogo[],
  coluna: NutrienteChave,
  acessiveis: Set<string> | null, // null = sem triagem: todos contam como acessíveis
  limite = 12,
): AlimentoCatalogo[] {
  const num = (b: boolean) => (b ? 1 : 0);
  const comNivel = alimentos
    .filter((a) => a.classificacao_nova !== 'ULTRAPROCESSADO')
    .map((a) => ({ a, nivel: nivelDoNutriente(a, coluna) }))
    .filter((x) => x.nivel !== null);

  return comNivel
    .sort((x, y) =>
      num(acessiveis ? acessiveis.has(y.a.id) : true) - num(acessiveis ? acessiveis.has(x.a.id) : true) ||
      num(y.nivel === 'ALTO_TEOR') - num(x.nivel === 'ALTO_TEOR') ||
      x.a.nome.localeCompare(y.a.nome, 'pt-BR') ||
      x.a.id.localeCompare(y.a.id))
    .slice(0, limite)
    .map((x) => x.a);
}
