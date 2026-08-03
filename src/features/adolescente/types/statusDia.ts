// src/features/adolescente/types/statusDia.ts
import { DiaSemanaBase } from '../../../shared/utils/data';

export type StatusDia = 'futuro' | 'sem_registro' | 'parcial' | 'completo' | 'hoje';

export const CORES_STATUS_DIA: Record<StatusDia, string> = {
  futuro: '#D9E2E8',
  sem_registro: '#F3E3B8',
  parcial: '#D4E8A8',
  completo: '#3FA85C',
  hoje: '#FFFFFF',
};

// Atualizar os caminhos quando confirmar onde a pasta assets/broxis está de fato
export const IMAGENS_STATUS_DIA: Record<StatusDia, any> = {
  futuro: require('../../../../assets/img/mascot/broxis-dormindo.png'),
  sem_registro: require('../../../../assets/img/mascot/broxis-triste.png'),
  parcial: require('../../../../assets/img/mascot/broxis-neutro.png'),
  completo: require('../../../../assets/img/mascot/broxis-radiante.png'),
  hoje: require('../../../../assets/img/mascot/broxis-hoje.png'),
};

type ParametrosStatusDia = {
  data: string; // formato ISO (YYYY-MM-DD)
  hojeISO: string;
  temRegistroAgua?: boolean;
  temRegistroAlimentacao?: boolean;
  temRegistroAtividade?: boolean;
};

export function calcularStatusDia(params: ParametrosStatusDia): StatusDia {
  const { data, hojeISO, temRegistroAgua, temRegistroAlimentacao, temRegistroAtividade } = params;

  if (data === hojeISO) return 'hoje';
  if (data > hojeISO) return 'futuro';

  const totalRegistros = [temRegistroAgua, temRegistroAlimentacao, temRegistroAtividade].filter(Boolean).length;

  if (totalRegistros === 0) return 'sem_registro';
  if (totalRegistros < 3) return 'parcial';
  return 'completo';
}

// Único tipo DiaSemana do projeto: a base (label/numero/data) + o status calculado
export type DiaSemana = DiaSemanaBase & {
  status: StatusDia;
};