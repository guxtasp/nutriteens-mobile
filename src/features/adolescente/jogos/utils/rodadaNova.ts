// Regras puras do jogo "Classificar NOVA" (testáveis, sem React).
import { ALIMENTOS_NOVA, AlimentoNova, GrupoNova } from '../data/alimentosNova';

const GRUPOS: GrupoNova[] = ['IN_NATURA', 'INGREDIENTE_CULINARIO', 'PROCESSADO', 'ULTRAPROCESSADO'];

// Embaralhamento Fisher-Yates; `rand` injetável para teste.
export function embaralhar<T>(lista: T[], rand: () => number = Math.random): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Sorteia `n` alimentos garantindo ao menos 1 de cada grupo (se n >= 4),
// para a pessoa sempre treinar as 4 categorias.
export function sortearRodada(n = 8, rand: () => number = Math.random, base: AlimentoNova[] = ALIMENTOS_NOVA): AlimentoNova[] {
  const total = Math.min(n, base.length);
  const escolhidos: AlimentoNova[] = [];
  if (total >= GRUPOS.length) {
    for (const g of GRUPOS) {
      const doGrupo = embaralhar(base.filter((a) => a.grupo === g), rand);
      if (doGrupo[0]) escolhidos.push(doGrupo[0]);
    }
  }
  const restantes = embaralhar(base.filter((a) => !escolhidos.includes(a)), rand);
  return embaralhar([...escolhidos, ...restantes.slice(0, total - escolhidos.length)], rand);
}

export function acertou(alimento: AlimentoNova, escolha: GrupoNova): boolean {
  return alimento.grupo === escolha;
}
