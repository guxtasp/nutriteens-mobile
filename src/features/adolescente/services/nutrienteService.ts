// src/features/adolescente/services/nutrienteService.ts
import { supabase } from '../../../lib/supabase';
import type { LacunaNutriente } from '../utils/regraFeedbackRefeicao';
import { formatarDataISO } from '../../../shared/utils/data';

// metas semanais aproximadas (RDA adolescente 10-15a × 7 dias) — só sinal
// direcional pro feedback/missão, não é prescrição nutricional.
//
// vitamina_d foi removida: a tabela TACO (fonte do seed) não mede vitamina D
// em nenhuma linha do dataset, então `alimento_nutrientes.vitamina_d_mcg` fica
// sempre null pra todo mundo — o acumulado semanal sempre dava 0 e o déficit
// sempre batia 100%, fazendo "vitamina D" aparecer como lacuna pra todo
// adolescente, todo dia, sem relação nenhuma com o que ele realmente comeu.
// Se quiser reativar, precisa de outra fonte de dado pra essa coluna antes.
export const META_SEMANAL: Record<LacunaNutriente['nutriente'], { coluna: string; minimo: number; rotulo: string; sugestao: string }> = {
  vitamina_c: { coluna: 'vitamina_c_mg', minimo: 45 * 7, rotulo: 'vitamina C', sugestao: 'uma fruta cítrica, como laranja ou acerola' },
  ferro:      { coluna: 'ferro_mg',      minimo: 10 * 7, rotulo: 'ferro',      sugestao: 'feijão, carne vermelha ou folhas verde-escuras' },
  calcio:     { coluna: 'calcio_mg',     minimo: 1000 * 7, rotulo: 'cálcio',   sugestao: 'leite, iogurte ou queijo' },
  vitamina_a: { coluna: 'vitamina_a_mcg',minimo: 600 * 7, rotulo: 'vitamina A', sugestao: 'cenoura, manga ou folhas verde-escuras' },
  zinco:      { coluna: 'zinco_mg',      minimo: 8 * 7,  rotulo: 'zinco',      sugestao: 'carnes, ovos ou castanhas' },
};

// soma o nutriente acumulado nos últimos 7 dias, tratando 1 "quantidade" do
// carrinho como 1 porção ≈ 100g/100ml (padrão da TACO) — aproximação conhecida,
// já que não temos gramagem real por item.
export async function acumuladoSemanal(userId: string, coluna: string): Promise<number> {
  const hoje = new Date();
  const seteDiasAtras = new Date(hoje);
  seteDiasAtras.setDate(hoje.getDate() - 6);

  const { data, error } = await supabase
    .from('registros_diarios')
    .select(`
      id,
      refeicoes (
        refeicao_alimentos (
          quantidade,
          alimentos ( alimento_nutrientes ( ${coluna} ) )
        )
      )
    `)
    .eq('user_id', userId)
    .gte('data', formatarDataISO(seteDiasAtras))
    .lte('data', formatarDataISO(hoje));

  if (error) throw error;

  let total = 0;
  for (const dia of data ?? []) {
    for (const refeicao of (dia as any).refeicoes ?? []) {
      for (const item of refeicao.refeicao_alimentos ?? []) {
        const valorPor100g = item.alimentos?.alimento_nutrientes?.[coluna];
        if (typeof valorPor100g === 'number') total += valorPor100g * item.quantidade;
      }
    }
  }
  return total;
}

// só reporta UMA lacuna (a de maior déficit), pra não empilhar vários pedidos
// na mesma mensagem/missão
export async function detectarLacunaNutriente(userId: string): Promise<LacunaNutriente | null> {
  let piorDeficit = -Infinity;
  let piorNutriente: LacunaNutriente | null = null;

  for (const [chave, meta] of Object.entries(META_SEMANAL)) {
    const acumulado = await acumuladoSemanal(userId, meta.coluna);
    const deficit = 1 - acumulado / meta.minimo;

    if (deficit > 0.3 && deficit > piorDeficit) {
      piorDeficit = deficit;
      piorNutriente = { nutriente: chave as LacunaNutriente['nutriente'], rotulo: meta.rotulo, sugestao: meta.sugestao };
    }
  }
  return piorNutriente;
}