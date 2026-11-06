// src/features/adolescente/trilha/utils/conclusaoLocal.ts
//
// Lição concluída SEM internet: o caminho guardado no aparelho precisa refletir isso
// para a próxima lição liberar na hora. Regra pura (sem storage). O servidor continua
// sendo a fonte de verdade: assim que a conclusão é enviada, o caminho é recarregado.
import { statusDasLicoes } from './sequenciaTrilhas';

type NoMinimo = { id: string; status: 'concluida' | 'atual' | 'bloqueada' };

/** Devolve os nós com a lição marcada como concluída e o desbloqueio recalculado. Lição desconhecida ou bloqueada: não muda nada. */
export function aplicarConclusaoLocal<N extends NoMinimo>(nos: N[], licaoId: string): N[] {
  const alvo = nos.find((n) => n.id === licaoId);
  if (!alvo || alvo.status === 'bloqueada') return nos;

  const concluidas = new Set(nos.filter((n) => n.status === 'concluida').map((n) => n.id));
  concluidas.add(licaoId);
  const status = statusDasLicoes(nos.map((n) => n.id), concluidas);
  return nos.map((n, i) => ({ ...n, status: status[i] }));
}
