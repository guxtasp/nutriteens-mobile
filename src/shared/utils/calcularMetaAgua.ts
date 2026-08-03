// src/shared/utils/calcularMetaAgua.ts

/**
 * Calcula a meta diária de consumo de água (em ml) para adolescentes,
 * com base no peso corporal.
 *
 * Referência científica:
 * Institute of Medicine (US) Panel on Dietary Reference Intakes for
 * Electrolytes and Water. Dietary Reference Intakes for Water, Potassium,
 * Sodium, Chloride, and Sulfate. Washington, DC: National Academies Press,
 * 2005. (Estabelece AI de ~2,3L/dia para 9-13 anos e ~2,8L/dia para 14-18 anos.)
 *
 * A regra de 40 ml/kg para jovens até 17 anos é a conversão prática mais
 * usada dessa recomendação em termos de peso corporal individual (adotada
 * em orientações nutricionais clínicas), e é consistente com os valores
 * de referência acima (ex.: ~70kg × 40ml = 2,8L, batendo com a faixa de
 * 14-18 anos do IOM).
 *
 * Faixa de segurança (clamp) para evitar metas irreais em caso de erro
 * de digitação do peso: mínimo 1500ml, máximo 3500ml.
 */
export function calcularMetaAguaMl(pesoKg: number): number {
  const ML_POR_KG = 40;
  const META_MINIMA_ML = 1500;
  const META_MAXIMA_ML = 3500;

  const metaBruta = pesoKg * ML_POR_KG;
  return Math.round(Math.min(Math.max(metaBruta, META_MINIMA_ML), META_MAXIMA_ML));
}