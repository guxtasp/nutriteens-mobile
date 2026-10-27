// Regras puras do jogo de memória Nutriente x Alimento (sem React).
import type { ParNutriente } from '../data/paresNutriente';
import { embaralhar } from './rodadaNova';

export type Carta =
  | { uid: string; tipo: 'NUTRIENTE'; nutriente: string }
  | { uid: string; tipo: 'ALIMENTO'; nutriente: string; par: ParNutriente };

// Monta o baralho: `n` nutrientes diferentes, 1 alimento sorteado de cada, 2 cartas por nutriente.
export function montarBaralho(pares: ParNutriente[], n: number, rand: () => number = Math.random): Carta[] {
  const porNutriente = new Map<string, ParNutriente[]>();
  for (const p of pares) porNutriente.set(p.nutriente, [...(porNutriente.get(p.nutriente) ?? []), p]);
  const escolhidos = embaralhar([...porNutriente.keys()], rand).slice(0, n);
  const cartas: Carta[] = [];
  for (const nut of escolhidos) {
    const par = embaralhar(porNutriente.get(nut)!, rand)[0];
    cartas.push({ uid: `n_${nut}`, tipo: 'NUTRIENTE', nutriente: nut });
    cartas.push({ uid: `a_${par.id}`, tipo: 'ALIMENTO', nutriente: nut, par });
  }
  return embaralhar(cartas, rand);
}

// É par quando as duas são do mesmo nutriente e de tipos diferentes.
export function formamPar(a: Carta, b: Carta): boolean {
  return a.uid !== b.uid && a.nutriente === b.nutriente && a.tipo !== b.tipo;
}
