// src/features/adolescente/metricas/types/estado.ts
import type { CartaoId } from '../utils/cartoesInfo';
import type { FeedbackBroxis } from '../utils/feedbackBroxis';
import type { MetricasCompletas } from './metricas';

/** Estado que a tela recebe. A Fase 4 produz isto a partir dos dados reais. */
export type EstadoMetricas =
  | { status: 'carregando' }
  | { status: 'erro' }
  | { status: 'pronto'; metricas: MetricasCompletas; feedbacks: Record<CartaoId, FeedbackBroxis> };

/** Nome amigável dos grupos alimentares (vem de `grupos_alimentares_info`). */
export type GruposInfo = Record<string, { titulo: string }>;
