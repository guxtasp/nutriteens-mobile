// src/features/adolescente/types/statusDia.ts
import { DiaSemanaBase } from '../../../shared/utils/data';

export type StatusDia = 'futuro' | 'hoje_pendente' | 'hoje_mantido' | 'mantido' | 'nao_mantido';

export const CORES_STATUS_DIA: Record<StatusDia, string> = {
  futuro: '#D9E2E8',
  hoje_pendente: '#F3E3B8',
  hoje_mantido: '#3FA85C',
  mantido: '#3FA85C',
  nao_mantido: '#E8A8A8',
};

export const IMAGENS_STATUS_DIA: Record<StatusDia, any> = {
  futuro: require('../../../../assets/img/mascot/broxis-dormindo.png'),
  hoje_pendente: require('../../../../assets/img/mascot/broxis-hoje.png'),
  hoje_mantido: require('../../../../assets/img/mascot/broxis-radiante.png'),
  mantido: require('../../../../assets/img/mascot/broxis-radiante.png'),
  nao_mantido: require('../../../../assets/img/mascot/broxis-triste.png'),
};

type ParametrosStatusDia = {
  data: string; // formato ISO (YYYY-MM-DD)
  hojeISO: string;
  mantido: boolean; // true se o dia contou pra sequência (missão cumprida OU teve registro)
};

export function calcularStatusDia({ data, hojeISO, mantido }: ParametrosStatusDia): StatusDia {
  if (data > hojeISO) return 'futuro';
  if (data === hojeISO) return mantido ? 'hoje_mantido' : 'hoje_pendente';
  return mantido ? 'mantido' : 'nao_mantido';
}

export type DiaSemana = DiaSemanaBase & { status: StatusDia };