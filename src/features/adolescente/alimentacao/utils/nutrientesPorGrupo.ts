// src/features/adolescente/alimentacao/utils/nutrientesPorGrupo.ts
//
// Quando o alimento vem do catálogo curado, quem preenche
// alimento_nutrientes é o nutricionista (formulário do admin / Table
// Editor). Quando é o PRÓPRIO ADOLESCENTE que cadastra
// (NovoAlimentoFormScreen), ninguém preenche nada — sem essa
// inferência, o alimento nasceria sem nenhum dado nutricional.
//
// Em vez de perguntar mais uma coisa pro adolescente no cadastro, damos
// um valor padrão a partir da categoria que ele já escolhe (as mesmas
// 10 opções de `CATEGORIAS` no NovoAlimentoFormScreen.tsx). É uma
// aproximação por GRUPO, não do alimento específico — ex: dentro de
// "Legumes e Verduras" tem folha verde-escura (rica em vitamina A) e tem
// pepino (não é) — mas ainda assim é bem melhor que não ter dado nenhum,
// e fica marcado como inferência, revisável depois por um nutricionista.
//
// Duas escalas, ver migracao_alimento_nutrientes_categorico.sql:
// - NivelNutriente (AUSENTE/FONTE/ALTO_TEOR): vitaminas, minerais,
//   proteína, fibra — sempre um benefício a destacar.
// - NivelAtencao (BAIXO/MODERADO/ALTO): sódio, carboidrato, gordura
//   total — quantidade neutra, não é "fonte de" nada.
//
// Só preenchemos o que temos confiança razoável em afirmar; o que não
// está listado aqui fica NULL (= "não sabemos"), nunca AUSENTE/BAIXO —
// não é uma negativa confirmada, só não inferimos nada. Por isso a
// lista de inferências por grupo é deliberadamente curta: sódio em
// particular varia demais com sal/tempero adicionado pra dar pra
// inferir só pelo grupo alimentar (mesmo problema de BEBIDAS, que já
// ficava de fora antes).
export type NivelNutriente = 'AUSENTE' | 'FONTE' | 'ALTO_TEOR';
export type NivelAtencao = 'BAIXO' | 'MODERADO' | 'ALTO';

export type NutrienteChave =
  | 'vitamina_a' | 'vitamina_c' | 'vitamina_d'
  | 'tiamina' | 'riboflavina' | 'niacina' | 'piridoxina'
  | 'calcio' | 'ferro' | 'magnesio' | 'fosforo' | 'potassio' | 'zinco'
  | 'proteina' | 'fibra';

export type NutrienteAtencaoChave = 'sodio' | 'carboidrato' | 'lipideos';

const NUTRIENTES_POR_GRUPO: Record<string, Partial<Record<NutrienteChave, NivelNutriente>>> = {
  OLEAGINOSAS_E_SEMENTES: { zinco: 'ALTO_TEOR', ferro: 'FONTE', magnesio: 'ALTO_TEOR', proteina: 'FONTE' },
  LEGUMES_E_VERDURAS: { vitamina_a: 'FONTE', vitamina_c: 'FONTE' },
  FRUTAS: { vitamina_c: 'ALTO_TEOR' },
  CARNES_E_OVOS: { ferro: 'ALTO_TEOR', zinco: 'FONTE', proteina: 'ALTO_TEOR' },
  LEITE_E_DERIVADOS: { calcio: 'ALTO_TEOR', proteina: 'FONTE' },
  LEGUMINOSAS: { ferro: 'FONTE', zinco: 'FONTE', proteina: 'FONTE', fibra: 'FONTE' },
  CEREAIS_E_TUBERCULOS: {},
  OLEOS_E_GORDURAS: {},
  ACUCARES_E_DOCES: {},
  BEBIDAS: {}, // varia demais (suco natural x refrigerante) pra ter um padrão único
};

// só dois casos onde o grupo praticamente DEFINE a quantidade, sem
// depender de tempero/preparo — por isso essa lista é ainda mais curta
// que a de cima
const NUTRIENTES_ATENCAO_POR_GRUPO: Record<string, Partial<Record<NutrienteAtencaoChave, NivelAtencao>>> = {
  OLEOS_E_GORDURAS: { lipideos: 'ALTO' },
  ACUCARES_E_DOCES: { carboidrato: 'ALTO' },
};

/** Retorna só as colunas (escala de benefício) que temos confiança em inferir pro grupo — nunca preenche as outras com AUSENTE. */
export function inferirNutrientesPorGrupo(grupoAlimentar: string): Partial<Record<NutrienteChave, NivelNutriente>> {
  return NUTRIENTES_POR_GRUPO[grupoAlimentar] ?? {};
}

// ---------------------------------------------------------------------------
// Alimento com MAIS DE UM grupo (bolo, biscoito recheado, nuggets...)
//
// Junta as inferências de cada grupo ficando com o maior nível de cada
// nutriente. Só que, numa mistura, o ingrediente está diluído: o ovo do bolo
// não faz do bolo um "alto teor" de proteína. Por isso, com 2 grupos ou mais:
//   - benefício: ALTO_TEOR vira FONTE (nunca prometemos mais que "fonte");
//   - atenção:   ALTO vira MODERADO (o grupo deixa de DEFINIR a quantidade).
// Com 1 grupo o resultado é idêntico ao de inferirNutrientesPorGrupo.
// ---------------------------------------------------------------------------
const RANK_BENEFICIO: Record<NivelNutriente, number> = { AUSENTE: 0, FONTE: 1, ALTO_TEOR: 2 };
const RANK_ATENCAO: Record<NivelAtencao, number> = { BAIXO: 0, MODERADO: 1, ALTO: 2 };

export function inferirNutrientesPorGrupos(grupos: string[]): Partial<Record<NutrienteChave, NivelNutriente>> {
  const unicos = Array.from(new Set(grupos));
  const resultado: Partial<Record<NutrienteChave, NivelNutriente>> = {};
  for (const g of unicos) {
    for (const [coluna, nivel] of Object.entries(inferirNutrientesPorGrupo(g)) as [NutrienteChave, NivelNutriente][]) {
      const atual = resultado[coluna];
      if (!atual || RANK_BENEFICIO[nivel] > RANK_BENEFICIO[atual]) resultado[coluna] = nivel;
    }
  }
  if (unicos.length > 1) {
    for (const coluna of Object.keys(resultado) as NutrienteChave[]) {
      if (resultado[coluna] === 'ALTO_TEOR') resultado[coluna] = 'FONTE';
    }
  }
  return resultado;
}

export function inferirAtencaoPorGrupos(grupos: string[]): Partial<Record<NutrienteAtencaoChave, NivelAtencao>> {
  const unicos = Array.from(new Set(grupos));
  const resultado: Partial<Record<NutrienteAtencaoChave, NivelAtencao>> = {};
  for (const g of unicos) {
    for (const [coluna, nivel] of Object.entries(inferirAtencaoPorGrupo(g)) as [NutrienteAtencaoChave, NivelAtencao][]) {
      const atual = resultado[coluna];
      if (!atual || RANK_ATENCAO[nivel] > RANK_ATENCAO[atual]) resultado[coluna] = nivel;
    }
  }
  if (unicos.length > 1) {
    for (const coluna of Object.keys(resultado) as NutrienteAtencaoChave[]) {
      if (resultado[coluna] === 'ALTO') resultado[coluna] = 'MODERADO';
    }
  }
  return resultado;
}

const NIVEIS_BOA_FONTE = new Set<string>(['FONTE', 'ALTO_TEOR']);

/**
 * "Esse alimento é boa fonte de <nutriente>?" — usado pelas missões.
 *
 * 1º vale o que está gravado em alimento_nutrientes (nutricionista ou
 * inferência já salva). Só quando NÃO há dado (linha ausente ou coluna
 * NULL = "não sabemos") caímos na inferência pelo grupo alimentar.
 *
 * Por que existe: alimento cadastrado pelo adolescente precisa gravar a
 * inferência em alimento_nutrientes, mas se a RLS bloquear esse INSERT
 * (erro 42501) o alimento nasce sem nenhuma linha — e a missão "Reforce
 * proteína" nunca contava, mesmo ele registrando ovo/carne. Com este
 * fallback a missão funciona independente do estado da RLS.
 */
export function alimentoEBoaFonte(alimento: any, coluna: NutrienteChave): boolean {
  const bruto = alimento?.alimento_nutrientes;
  const linha = Array.isArray(bruto) ? bruto[0] : bruto;
  const nivelGravado = linha?.[coluna];
  if (nivelGravado != null) return NIVEIS_BOA_FONTE.has(nivelGravado);

  const grupos: string[] = alimento?.grupos_alimentares ?? [];
  return grupos.some((g) => NIVEIS_BOA_FONTE.has(inferirNutrientesPorGrupo(g)[coluna] ?? ''));
}

/** Mesma ideia, mas pra escala de atenção (sódio/carboidrato/gordura) — deliberadamente quase vazia, ver comentário acima. */
export function inferirAtencaoPorGrupo(grupoAlimentar: string): Partial<Record<NutrienteAtencaoChave, NivelAtencao>> {
  return NUTRIENTES_ATENCAO_POR_GRUPO[grupoAlimentar] ?? {};
}

/**
 * Nutrientes que PELO MENOS UM alimento do catálogo consegue cumprir (mesma regra das missões: alimentoEBoaFonte).
 * Serve para não sugerir missão/feedback de um nutriente que ninguém consegue atingir (ex.: vitamina D sem dado).
 */
export function nutrientesAlcancaveis(alimentos: any[], chaves: NutrienteChave[]): Set<NutrienteChave> {
  const ok = new Set<NutrienteChave>();
  for (const c of chaves) if (alimentos.some((a) => alimentoEBoaFonte(a, c))) ok.add(c);
  return ok;
}
