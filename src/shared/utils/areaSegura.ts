// src/shared/utils/areaSegura.ts
//
// Conta única do espaço de baixo das partes fixas (rodapés, folhas, botões flutuantes). Por quê:
// o app é edge-to-edge no Android, então o inset de baixo varia de 0 (iPhone SE) a ~48 (Android
// com 3 botões). Um padding fixo de 24–36 ficava atrás da barra de 3 botões; só somar o inset
// deixava o elemento colado na barra. A regra: o maior entre o respiro original da peça e
// "inset + respiro acima da barra".
import { layout } from '../theme/layout';

export function respiroInferior(insetInferior: number, base: number, acimaDaBarra: number = layout.respiroAcimaDaBarra): number {
  const inset = Number.isFinite(insetInferior) && insetInferior > 0 ? insetInferior : 0;
  return Math.max(base, inset + acimaDaBarra);
}

/**
 * Mesma regra para o topo (barra de status, notch, Dynamic Island) em telas e modais de tela cheia
 * que desenham por baixo da barra (statusBarTranslucent): o maior entre o respiro original e
 * "inset de cima + respiro".
 */
export function respiroSuperior(insetSuperior: number, base: number, acimaDaBarra: number = layout.respiroAcimaDaBarra): number {
  return respiroInferior(insetSuperior, base, acimaDaBarra);
}
