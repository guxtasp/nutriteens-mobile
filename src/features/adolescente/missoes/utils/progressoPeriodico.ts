// Cálculo do progresso das missões SEMANAIS e MENSAIS a partir dos registros
// do período. Lógica pura: o serviço busca os dados e entrega aqui.
import { criarProgresso, Progresso, UNIDADES } from './progresso';
import type { Periodo } from './periodos';
import { alimentoEBoaFonte, type NutrienteChave } from '../../alimentacao/utils/nutrientesPorGrupo';

export type MetricaPeriodica =
  | 'DIAS_AGUA_META' // dias em que bateu a meta de água
  | 'DIAS_ATIVIDADE_META' // dias com minutos de atividade >= meta diária
  | 'DIAS_COM_REGISTRO' // dias com qualquer registro (água, refeição, atividade)
  | 'DIAS_FONTE_NUTRIENTE' // dias com boa fonte de um nutriente (parametros.nutriente)
  | 'REFEICOES_SEM_ULTRAPROCESSADO'
  | 'MINUTOS_ATIVIDADE'
  | 'LICOES' // lições concluídas no período
  | 'MISSOES_DIARIAS'; // missões do dia cumpridas no período

export type DefinicaoPeriodica = {
  codigo: string;
  periodo: Periodo;
  titulo: string;
  descricao: string;
  icone: string | null;
  metrica: MetricaPeriodica;
  alvo: number;
  parametros: Record<string, any>;
  pontos: number;
};

/** Resumo de UM dia de registros. */
export type DiaResumo = {
  data: string;
  aguaMl: number;
  atividadeMin: number;
  temRegistro: boolean;
  refeicoesSemUltra: number;
  /** nutriente -> teve ao menos um alimento FONTE/ALTO_TEOR nesse dia */
  fontes: Record<string, boolean>;
};

export type ContextoPeriodico = {
  metaAguaMl: number;
  alvoAtividadeMinDia: number;
  licoes: number;
  missoesDiariasCumpridas: number;
};

/** Transforma a linha crua de registros_diarios (com joins) em DiaResumo. */
export function resumirDia(raw: any, nutrientes: string[]): DiaResumo {
  const agua = (raw.registros_agua ?? []).reduce((s: number, r: any) => s + (r.quantidade_ml ?? 0), 0);
  const ativ = (raw.registros_atividade_fisica ?? []).reduce((s: number, r: any) => s + (r.duracao_minutos ?? 0), 0);
  const refeicoes: any[] = raw.refeicoes ?? [];

  const fontes: Record<string, boolean> = {};
  for (const n of nutrientes) {
    fontes[n] = refeicoes.some((r) =>
      (r.refeicao_alimentos ?? []).some((i: any) => alimentoEBoaFonte(i.alimentos, n as NutrienteChave)),
    );
  }

  const semUltra = refeicoes.filter(
    (r) =>
      (r.refeicao_alimentos ?? []).length > 0 &&
      (r.refeicao_alimentos ?? []).every((i: any) => i.alimentos?.classificacao_nova !== 'ULTRAPROCESSADO'),
  ).length;

  return {
    data: raw.data,
    aguaMl: agua,
    atividadeMin: ativ,
    temRegistro: agua > 0 || ativ > 0 || refeicoes.length > 0,
    refeicoesSemUltra: semUltra,
    fontes,
  };
}

export function calcularProgressoPeriodico(
  def: DefinicaoPeriodica,
  dias: DiaResumo[],
  ctx: ContextoPeriodico,
): Progresso {
  switch (def.metrica) {
    case 'DIAS_AGUA_META':
      return criarProgresso(dias.filter((d) => d.aguaMl >= ctx.metaAguaMl).length, def.alvo, UNIDADES.dia);
    case 'DIAS_ATIVIDADE_META': {
      const minimo = Number(def.parametros.minutos_dia) || ctx.alvoAtividadeMinDia;
      return criarProgresso(dias.filter((d) => d.atividadeMin >= minimo).length, def.alvo, UNIDADES.dia);
    }
    case 'DIAS_COM_REGISTRO':
      return criarProgresso(dias.filter((d) => d.temRegistro).length, def.alvo, UNIDADES.dia);
    case 'DIAS_FONTE_NUTRIENTE': {
      const nutriente = String(def.parametros.nutriente ?? '');
      return criarProgresso(dias.filter((d) => d.fontes[nutriente]).length, def.alvo, UNIDADES.dia);
    }
    case 'REFEICOES_SEM_ULTRAPROCESSADO':
      return criarProgresso(dias.reduce((s, d) => s + d.refeicoesSemUltra, 0), def.alvo, UNIDADES.refeicao);
    case 'MINUTOS_ATIVIDADE':
      return criarProgresso(dias.reduce((s, d) => s + d.atividadeMin, 0), def.alvo, UNIDADES.min);
    case 'LICOES':
      return criarProgresso(ctx.licoes, def.alvo, UNIDADES.licao);
    case 'MISSOES_DIARIAS':
      return criarProgresso(ctx.missoesDiariasCumpridas, def.alvo, UNIDADES.missao);
    default:
      return criarProgresso(0, def.alvo, UNIDADES.dia);
  }
}
