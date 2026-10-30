// src/features/adolescente/home/utils/posicaoChapeu.ts
//
// Onde fica o chapéu de festa sobre o avatar (um círculo de diâmetro `d`, com o Bróxis dentro).
// O chapéu (assets/img/aniversario/chapeu-festa.png) é um quadrado com o cone inclinado; a
// "base" do cone está em ~(52%, 84%) da imagem. A conta põe essa base em cima do cabelo do
// Bróxis (~60% da largura, ~30% da altura do avatar), já considerando que o giro (rotate) do
// React Native acontece em torno do centro do quadrado.
export const CHAPEU_BASE_X = 0.52;
export const CHAPEU_BASE_Y = 0.84;

export type PosicaoChapeu = { largura: number; esquerda: number; topo: number; giroGraus: number };

export function posicaoChapeu(d: number, giroGraus = 18): PosicaoChapeu {
  const largura = d * 0.46;
  const alvoX = d * 0.6;
  const alvoY = d * 0.3;

  const th = (giroGraus * Math.PI) / 180;
  // base do cone em relação ao centro do quadrado, depois do giro
  const x = (CHAPEU_BASE_X - 0.5) * largura;
  const y = (CHAPEU_BASE_Y - 0.5) * largura;
  const xr = x * Math.cos(th) - y * Math.sin(th);
  const yr = x * Math.sin(th) + y * Math.cos(th);

  return {
    largura: Math.round(largura),
    esquerda: Math.round(alvoX - xr - largura / 2),
    topo: Math.round(alvoY - yr - largura / 2),
    giroGraus,
  };
}
