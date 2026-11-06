// src/features/adolescente/home/utils/snapshotHome.ts
//
// "Último estado conhecido" da Home para abrir sem internet. Regra pura (sem React,
// sem storage): decide se uma cópia gravada antes ainda pode ser mostrada hoje.
//
// Nunca é fonte de verdade: assim que a rede volta, a Home recarrega e substitui tudo.
import type { MissaoDoDia } from '../services/missaoService';

export type SnapshotHome = {
  /** dia (AAAA-MM-DD) em que a cópia foi gravada */
  gravadoEm: string;
  missao: MissaoDoDia | null;
  missaoConcluida: boolean;
  sequenciaAtual: number;
  maiorSequencia: number;
  xpTotal: number;
  diaDeHojeMantido: boolean;
  /** dias da semana que contaram para a sequência */
  diasMantidos: string[];
};

/**
 * - gravada hoje: vale inteira;
 * - gravada ontem COM o dia mantido: a sequência ainda está viva hoje, então o número vale,
 *   mas a missão (que era de ontem) e o "hoje mantido" não valem;
 * - qualquer outro caso: não dá para afirmar a sequência sem a rede → null
 *   (a tela mostra o aviso "não deu para carregar", sem inventar número).
 */
export function aproveitarSnapshotHome(
  snapshot: SnapshotHome | null,
  hoje: string,
  ontem: string,
): SnapshotHome | null {
  if (!snapshot || typeof snapshot.gravadoEm !== 'string') return null;
  if (snapshot.gravadoEm === hoje) return snapshot;
  if (snapshot.gravadoEm === ontem && snapshot.diaDeHojeMantido) {
    return { ...snapshot, missao: null, missaoConcluida: false, diaDeHojeMantido: false };
  }
  return null;
}
