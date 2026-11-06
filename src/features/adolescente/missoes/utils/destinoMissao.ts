// src/features/adolescente/missoes/utils/destinoMissao.ts
//
// Para onde o card de uma missão leva e em que estado ela está. Regra pura (sem React):
// o card só mostra "ir para" quando existe um lugar onde a missão pode ser cumprida.
import type { MetricaPeriodica } from './progressoPeriodico';

export type RotaMissao = 'ConsumoAgua' | 'AtividadeFisica' | 'TipoRefeicao' | 'Trilha';

export type DestinoMissao = { rota: RotaMissao; rotulo: string };

const AGUA: DestinoMissao = { rota: 'ConsumoAgua', rotulo: 'Registrar água' };
const ATIVIDADE: DestinoMissao = { rota: 'AtividadeFisica', rotulo: 'Registrar atividade' };
const REFEICAO: DestinoMissao = { rota: 'TipoRefeicao', rotulo: 'Registrar refeição' };
const LICAO: DestinoMissao = { rota: 'Trilha', rotulo: 'Ir para a trilha' };

/** Missão do dia: `tipo` vem do catálogo (missoes_catalogo.tipo). Tipo desconhecido = sem atalho. */
export function destinoMissaoDiaria(tipo: string): DestinoMissao | null {
  switch (tipo) {
    case 'AGUA_ML':
      return AGUA;
    case 'ATIVIDADE_MIN':
      return ATIVIDADE;
    case 'ALIMENTO_NATURAL_QTD':
    case 'REFEICAO_SEM_ULTRAPROCESSADO':
    case 'NUTRIENTE_LACUNA':
      return REFEICAO;
    default:
      return null;
  }
}

/** Missão semanal/mensal: pela métrica que ela mede. */
export function destinoMissaoPeriodica(metrica: MetricaPeriodica | string): DestinoMissao | null {
  switch (metrica) {
    case 'DIAS_AGUA_META':
      return AGUA;
    case 'DIAS_ATIVIDADE_META':
    case 'MINUTOS_ATIVIDADE':
    case 'DIAS_PASSOS_META':
      return ATIVIDADE;
    case 'DIAS_COM_REGISTRO':
    case 'DIAS_FONTE_NUTRIENTE':
    case 'REFEICOES_SEM_ULTRAPROCESSADO':
    case 'DIAS_VARIEDADE_GRUPOS':
    case 'REFEICOES_REGISTRADAS':
      return REFEICAO;
    case 'LICOES':
      return LICAO;
    default:
      // MISSOES_DIARIAS (soma das diárias) e qualquer métrica nova: sem atalho único
      return null;
  }
}

export type EstadoMissao = 'concluida' | 'em_andamento' | 'nao_iniciada';

export function estadoDaMissao(progresso: { concluida: boolean; atual: number }): EstadoMissao {
  if (progresso.concluida) return 'concluida';
  return progresso.atual > 0 ? 'em_andamento' : 'nao_iniciada';
}

export const ROTULO_ESTADO: Record<EstadoMissao, string> = {
  concluida: 'Concluída',
  em_andamento: 'Em andamento',
  nao_iniciada: 'Ainda não iniciada',
};
