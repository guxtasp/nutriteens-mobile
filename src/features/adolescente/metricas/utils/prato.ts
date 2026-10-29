// src/features/adolescente/metricas/utils/prato.ts
//
// Geometria do "prato da semana": a mesma mistura do termômetro, vista como um prato
// dividido em fatias (SVG). Pura, para poder ser testada sem a tela.
import type { ClasseMistura } from './misturaNova';
import { CLASSES_MISTURA } from './misturaNova';

export type FatiaPrato = {
  chave: ClasseMistura;
  /** parte do prato, de 0 a 1 */
  fracao: number;
  /** graus, começando no topo e girando no sentido horário */
  inicio: number;
  fim: number;
  /** caminho SVG da fatia */
  d: string;
};

const f = (n: number) => n.toFixed(2);

/** Ponto do círculo a `graus` (0° = topo, sentido horário). */
export function pontoNoCirculo(cx: number, cy: number, r: number, graus: number) {
  const rad = ((graus - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function caminhoFatia(cx: number, cy: number, r: number, inicio: number, fim: number): string {
  const varre = fim - inicio;
  if (varre >= 359.99) {
    // uma fatia só = prato inteiro (um arco de 360° não desenha): dois meios arcos
    const topo = pontoNoCirculo(cx, cy, r, 0);
    const base = pontoNoCirculo(cx, cy, r, 180);
    return `M ${f(topo.x)} ${f(topo.y)} A ${r} ${r} 0 1 1 ${f(base.x)} ${f(base.y)} A ${r} ${r} 0 1 1 ${f(topo.x)} ${f(topo.y)} Z`;
  }
  const a = pontoNoCirculo(cx, cy, r, inicio);
  const b = pontoNoCirculo(cx, cy, r, fim);
  const grande = varre > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${f(a.x)} ${f(a.y)} A ${r} ${r} 0 ${grande} 1 ${f(b.x)} ${f(b.y)} Z`;
}

/** Só as partes com algum item viram fatia; sem itens, não há prato. */
export function fatiasPrato(valores: Record<ClasseMistura, number>, cx: number, cy: number, r: number): FatiaPrato[] {
  const total = CLASSES_MISTURA.reduce((s, c) => s + Math.max(0, valores[c]), 0);
  if (total <= 0) return [];
  let acumulado = 0;
  const fatias: FatiaPrato[] = [];
  for (const chave of CLASSES_MISTURA) {
    const v = Math.max(0, valores[chave]);
    if (v === 0) continue;
    const inicio = (acumulado / total) * 360;
    acumulado += v;
    const fim = (acumulado / total) * 360;
    fatias.push({ chave, fracao: v / total, inicio, fim, d: caminhoFatia(cx, cy, r, inicio, fim) });
  }
  return fatias;
}
