import { useMemo } from 'react';
import { getSemanaAtual, formatarDataISO } from '../../../shared/utils/data';

export function useSemanaAtual() {
  const dias = useMemo(() => getSemanaAtual(), []);
  const hojeISO = useMemo(() => formatarDataISO(new Date()), []);
  return { dias, hojeISO };
}