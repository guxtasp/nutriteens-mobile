// src/features/adolescente/metricas/types/estado.ts
import type { CartaoId } from '../utils/cartoesInfo';
import type { FeedbackBroxis } from '../utils/feedbackBroxis';
import type { MetricasCompletas } from './metricas';
import type { MelhorSemana } from '../utils/melhorPeriodo';
import type { Retrospectiva } from '../utils/retrospectiva';
import type { MisturaNova } from '../utils/misturaNova';

/** Estado que a tela recebe. A Fase 4 produz isto a partir dos dados reais. */
export type EstadoMetricas =
  | { status: 'carregando' }
  | { status: 'erro' }
  | {
      status: 'pronto';
      metricas: MetricasCompletas;
      feedbacks: Record<CartaoId, FeedbackBroxis>;
      melhores: MelhorSemana[];
      retrospectiva: Retrospectiva | null;
      /** termômetro da regra de ouro, na janela atual do período selecionado */
      mistura: MisturaNova;
    };

/** Nome amigável dos grupos alimentares (vem de `grupos_alimentares_info`). */
export type GruposInfo = Record<string, { titulo: string }>;

/** Contexto das dicas e sugestões. `restricao` vem da EBIA, mas só ajusta o tom: nunca é exibida. */
export type ApoioDetalhes = { restricao: boolean; alimentos: { nome: string; grupos: string[] }[] };
