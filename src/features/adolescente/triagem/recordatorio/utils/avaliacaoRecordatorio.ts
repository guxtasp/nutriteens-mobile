// src/features/adolescente/triagem/recordatorio/utils/avaliacaoRecordatorio.ts
//
// Avaliação do recordatório de 24h (o dia de ONTEM, que é completo — avaliar
// "hoje" não faz sentido porque o adolescente pode ainda não ter feito todas
// as refeições). Só o nutricionista vê o resultado; o adolescente não.
// Lógica PURA (sem Supabase/React Native) pra poder ser testada.
//
// A avaliação tem duas leituras do dia:
//  1. ultraprocessados: proporção dos itens (NOVA). É a medida direta de "a
//     alimentação é rica em ultraprocessados?" — os marcadores do Sisvan
//     dependem do grupo alimentar de cada item e deixam ultraprocessados de fora.
//  2. Sisvan: escores e marcadores, calculados em recordatorioService.ts
//     (calcularMarcadoresSisvan) e anexados ao resultado lá.
// Nutrientes (lacuna de ferro etc.) ficaram de fora de propósito: um único
// dia não mostra deficiência — essa leitura fica pros registros contínuos.
export type ClassificacaoNova = 'IN_NATURA' | 'PROCESSADO' | 'ULTRAPROCESSADO';

export type ItemAvaliacao = { classificacao_nova: ClassificacaoNova };

// Premissas (ajustáveis aqui):
export const LIMITE_ULTRA_ALTO = 0.5; // >= 50% já é "alto" no feedback das refeições do app
export const LIMITE_ULTRA_BAIXO = 0.25; // < 25% = baixo; entre os dois = moderado

export type NivelUltra = 'BAIXO' | 'MODERADO' | 'ALTO';

export type AvaliacaoRecordatorio = {
  versao: 2;
  refeicoes_realizadas: number;
  total_itens: number;
  ultraprocessados: { quantidade: number; proporcao: number | null; nivel: NivelUltra | null };
};

export function avaliarRecordatorio(itens: ItemAvaliacao[], refeicoesRealizadas: number): AvaliacaoRecordatorio {
  const total = itens.length;
  const quantidade = itens.filter((i) => i.classificacao_nova === 'ULTRAPROCESSADO').length;
  const proporcao = total === 0 ? null : quantidade / total;
  const nivel: NivelUltra | null =
    proporcao === null
      ? null
      : proporcao >= LIMITE_ULTRA_ALTO
        ? 'ALTO'
        : proporcao < LIMITE_ULTRA_BAIXO
          ? 'BAIXO'
          : 'MODERADO';

  return {
    versao: 2,
    refeicoes_realizadas: refeicoesRealizadas,
    total_itens: total,
    ultraprocessados: { quantidade, proporcao, nivel },
  };
}
