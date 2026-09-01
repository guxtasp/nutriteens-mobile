// src/features/adolescente/services/nutrienteService.ts
import { supabase } from '../../../../lib/supabase';
import type { LacunaNutriente } from '../utils/regraFeedbackRefeicao';
import type { NutrienteChave } from '../utils/nutrientesPorGrupo';
import { formatarDataISO } from '../../../../shared/utils/data';

// alimento_nutrientes guarda um nível categórico (AUSENTE / FONTE /
// ALTO_TEOR) em vez de mg/mcg exatos — decisão tomada porque nem todo
// alimento tem dado numérico completo e confiável (ver migração
// migracao_alimento_nutrientes_categorico.sql). Por isso a lógica de
// "lacuna da semana" é CONTAGEM DE DIAS com pelo menos uma boa fonte vs.
// um mínimo de dias — acha o nutriente pior coberto sem precisar de
// valor numérico exato.
//
// Lista ampliada (era só vitamina_c/ferro/calcio/vitamina_a/zinco, os 5
// que o código já lia antes da conversão). Curadoria pensada pro que
// mais importa NESSA fase — adolescência é pico de crescimento ósseo e
// muscular, e é quando mais aparece deficiência de ferro (em especial
// pós-menarca):
//   - cálcio, vitamina D, magnésio: formação óssea (o pico de massa
//     óssea acontece na adolescência, é a "janela" que não volta)
//   - ferro, zinco: crescimento e maior prevalência de deficiência
//     nessa faixa etária
//   - vitamina A, vitamina C: imunidade e ficam fáceis de cobrir com
//     fruta/vegetal, bom pra missão “de baixo esforço”
//   - proteína, fibra: os dois macros que valem destacar como
//     benefício (diferente de carboidrato/gordura, que são neutros —
//     ver alimento_nutrientes/AlimentoFormScreen)
//
// Ficaram de fora por enquanto (dá pra incluir depois se fizer
// sentido): as vitaminas do complexo B (tiamina/riboflavina/niacina/
// piridoxina) e fósforo/potássio — geralmente bem cobertos pela dieta
// brasileira típica (inclusive em excesso, no caso do fósforo em
// ultraprocessado), então rotacioná-los como "missão" traria menos
// valor prático que os 9 abaixo. Sódio/carboidrato/gordura não entram
// aqui de propósito: são a escala de ATENÇÃO (ver
// nutrientesPorGrupo.ts), o oposto de uma lacuna — não faz sentido
// "convidar a comer mais sódio".
export const META_SEMANAL: Partial<Record<NutrienteChave, { coluna: NutrienteChave; minimoDias: number; rotulo: string; sugestao: string }>> = {
  vitamina_a: { coluna: 'vitamina_a', minimoDias: 3, rotulo: 'vitamina A', sugestao: 'cenoura, manga ou folhas verde-escuras' },
  vitamina_c: { coluna: 'vitamina_c', minimoDias: 3, rotulo: 'vitamina C', sugestao: 'uma fruta cítrica, como laranja ou acerola' },
  vitamina_d: { coluna: 'vitamina_d', minimoDias: 3, rotulo: 'vitamina D', sugestao: 'ovo, peixe ou um pouquinho de sol' },
  calcio:     { coluna: 'calcio',     minimoDias: 3, rotulo: 'cálcio',     sugestao: 'leite, iogurte ou queijo' },
  ferro:      { coluna: 'ferro',      minimoDias: 3, rotulo: 'ferro',      sugestao: 'feijão, carne vermelha ou folhas verde-escuras' },
  zinco:      { coluna: 'zinco',      minimoDias: 3, rotulo: 'zinco',      sugestao: 'carnes, ovos ou castanhas' },
  magnesio:   { coluna: 'magnesio',   minimoDias: 3, rotulo: 'magnésio',   sugestao: 'castanhas, sementes ou feijão' },
  proteina:   { coluna: 'proteina',   minimoDias: 4, rotulo: 'proteína',   sugestao: 'carne, ovo, feijão ou leite' },
  fibra:      { coluna: 'fibra',      minimoDias: 4, rotulo: 'fibra',      sugestao: 'frutas com casca, feijão ou verduras' },
  // as demais chaves de NutrienteChave (B1/B2/B3/B6, fósforo, potássio)
  // ficam de fora do rodízio de missão semanal de propósito — ver
  // justificativa no comentário acima do tipo.
};

const NIVEIS_QUE_CONTAM = new Set(['FONTE', 'ALTO_TEOR']);

// conta em quantos dos últimos 7 dias o usuário comeu pelo menos um
// alimento marcado como boa fonte (FONTE ou ALTO_TEOR) daquele nutriente
export async function diasComBoaFonteNaSemana(userId: string, coluna: NutrienteChave): Promise<number> {
  const hoje = new Date();
  const seteDiasAtras = new Date(hoje);
  seteDiasAtras.setDate(hoje.getDate() - 6);

  const { data, error } = await supabase
    .from('registros_diarios')
    .select(`
      data,
      refeicoes (
        refeicao_alimentos (
          alimentos ( alimento_nutrientes ( ${coluna} ) )
        )
      )
    `)
    .eq('user_id', userId)
    .gte('data', formatarDataISO(seteDiasAtras))
    .lte('data', formatarDataISO(hoje));

  if (error) throw error;

  let diasComFonte = 0;
  for (const dia of data ?? []) {
    const teveFonteNesseDia = ((dia as any).refeicoes ?? []).some((refeicao: any) =>
      (refeicao.refeicao_alimentos ?? []).some((item: any) => {
        const nivel = item.alimentos?.alimento_nutrientes?.[coluna];
        return NIVEIS_QUE_CONTAM.has(nivel);
      })
    );
    if (teveFonteNesseDia) diasComFonte += 1;
  }
  return diasComFonte;
}

// só reporta UMA lacuna (a de menos dias com boa fonte, proporcionalmente
// ao mínimo exigido — assim um nutriente com minimoDias maior, como
// proteína/fibra, não "ganha" injustamente só por pedir mais dias), pra
// não empilhar vários pedidos na mesma mensagem/missão
export async function detectarLacunaNutriente(userId: string): Promise<LacunaNutriente | null> {
  let piorFolga = Infinity; // dias - minimoDias: quanto mais negativo, pior a lacuna
  let piorNutriente: LacunaNutriente | null = null;

  for (const [chave, meta] of Object.entries(META_SEMANAL) as [NutrienteChave, NonNullable<(typeof META_SEMANAL)[NutrienteChave]>][]) {
    const dias = await diasComBoaFonteNaSemana(userId, meta.coluna);
    const folga = dias - meta.minimoDias;

    if (folga < 0 && folga < piorFolga) {
      piorFolga = folga;
      piorNutriente = { nutriente: chave, rotulo: meta.rotulo, sugestao: meta.sugestao };
    }
  }
  return piorNutriente;
}
