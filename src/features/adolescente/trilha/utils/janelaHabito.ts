// src/features/adolescente/trilha/utils/janelaHabito.ts
//
// A lição "Prática Real" procura registros dentro de uma janela de horas
// (ex.: 24h). Os registros ficam em `registros_diarios.data`, que é gravada com
// a data LOCAL do aparelho (formatarDataISO). Por isso o início da janela
// também precisa ser calculado em data local: o antigo
// `toISOString().slice(0, 10)` devolvia a data em UTC, que no Brasil (UTC-3)
// já vira o dia seguinte depois das 21h — e o registro feito agora há pouco
// ficava de fora ("já registrei, mas a lição diz que não").
import { formatarDataISO } from '../../../../shared/utils/data';

/** Primeiro dia (YYYY-MM-DD, fuso do aparelho) que entra na janela de `janelaHoras`. */
export function dataInicioJanela(janelaHoras: number, agora: Date = new Date()): string {
  const diasParaChecar = Math.max(1, Math.ceil(janelaHoras / 24));
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - (diasParaChecar - 1));
  return formatarDataISO(inicio);
}
