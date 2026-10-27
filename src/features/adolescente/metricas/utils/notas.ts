// src/features/adolescente/metricas/utils/notas.ts
//
// Observações sobre limites dos dados. Só aparecem quando a limitação pode de fato afetar
// o número mostrado. Tom informativo, sem culpa.
import type { MetricasCompletas } from '../types/metricas';

/**
 * Missão concluída = pontos já concedidos, e o servidor só concede no próprio dia. Se o app
 * não foi aberto naquele dia, a missão feita não vira "concluída". Só avisamos quando há
 * missão de dia anterior sem registro (hoje ainda pode ser cumprida).
 */
export function notaMissoes(m: MetricasCompletas): string | null {
  return m.atual.engajamento.missoesSemRegistroAntesDeHoje > 0
    ? 'Missões só aparecem como concluídas se o app registrou os pontos no mesmo dia. Se você fez alguma e ela não aparece, pode ser por isso.'
    : null;
}
