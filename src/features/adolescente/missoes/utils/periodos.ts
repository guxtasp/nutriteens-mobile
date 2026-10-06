import { formatarDataISO } from '../../../../shared/utils/data';

export type Periodo = 'SEMANAL' | 'MENSAL';

export type IntervaloPeriodo = {
  inicio: string; // AAAA-MM-DD, inclusive
  fim: string; // AAAA-MM-DD, inclusive
  /** dias que ainda restam depois de hoje (0 = termina hoje) */
  diasRestantes: number;
};

function meiaNoite(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/** Semana = segunda a domingo (igual ao seletor de semana da Home). Mês = dia 1 ao último. */
export function intervaloDoPeriodo(periodo: Periodo, referencia: Date = new Date()): IntervaloPeriodo {
  const hoje = meiaNoite(referencia);
  let inicio: Date;
  let fim: Date;

  if (periodo === 'SEMANAL') {
    const deslocamento = hoje.getDay() === 0 ? -6 : 1 - hoje.getDay();
    inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() + deslocamento);
    fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
  } else {
    inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  }

  return {
    inicio: formatarDataISO(inicio),
    fim: formatarDataISO(fim),
    diasRestantes: Math.round((fim.getTime() - hoje.getTime()) / 86400000),
  };
}

export function textoPrazo(diasRestantes: number, periodo: Periodo): string {
  if (diasRestantes <= 0) return periodo === 'SEMANAL' ? 'Termina hoje' : 'Último dia do mês';
  return diasRestantes === 1 ? 'Termina amanhã' : `Faltam ${diasRestantes} dias`;
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function nomeDoMes(data: Date = new Date()): string {
  return MESES[data.getMonth()];
}

/** "26 DIAS" / "1 DIA" / "ÚLTIMO DIA" — contagem regressiva do banner */
export function textoContagem(diasRestantes: number): string {
  if (diasRestantes <= 0) return 'ÚLTIMO DIA';
  return diasRestantes === 1 ? '1 DIA' : `${diasRestantes} DIAS`;
}
