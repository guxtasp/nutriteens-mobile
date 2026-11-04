// src/features/adolescente/tour/tourGeometria.ts
//
// Contas do destaque (buraco no escurecido) e do cartão. Puro, sem React Native.

export type Retangulo = { x: number; y: number; largura: number; altura: number };
export type Tamanho = { largura: number; altura: number };

/** Aumenta o retângulo em `margem` por lado; com `limites`, nunca sai da tela. */
export function inflar(r: Retangulo, margem: number, limites?: Tamanho): Retangulo {
  let x = r.x - margem;
  let y = r.y - margem;
  let largura = r.largura + margem * 2;
  let altura = r.altura + margem * 2;
  if (limites) {
    const x2 = Math.min(limites.largura, x + largura);
    const y2 = Math.min(limites.altura, y + altura);
    x = Math.max(0, x);
    y = Math.max(0, y);
    largura = Math.max(0, x2 - x);
    altura = Math.max(0, y2 - y);
  }
  return { x, y, largura, altura };
}

/** O cartão vai para o lado com mais espaço livre (empate: abaixo). */
export function escolherLado(alvo: Retangulo, alturaTela: number): 'abaixo' | 'acima' {
  const abaixo = alturaTela - (alvo.y + alvo.altura);
  const acima = alvo.y;
  return abaixo >= acima ? 'abaixo' : 'acima';
}

/** Interpolação linear entre dois retângulos (t de 0 a 1). */
export function misturar(de: Retangulo, para: Retangulo, t: number): Retangulo {
  const m = (a: number, b: number) => a + (b - a) * t;
  return { x: m(de.x, para.x), y: m(de.y, para.y), largura: m(de.largura, para.largura), altura: m(de.altura, para.altura) };
}

const n = (v: number) => Math.round(v * 100) / 100;

/**
 * Caminho SVG (fill-rule evenodd) da tela inteira com um buraco de cantos arredondados:
 * pintar esse caminho escurece tudo MENOS o alvo.
 */
export function caminhoSpotlight(tela: Tamanho, alvo: Retangulo | null, raio: number): string {
  const fora = `M0,0 H${n(tela.largura)} V${n(tela.altura)} H0 Z`;
  if (!alvo || alvo.largura <= 0 || alvo.altura <= 0) return fora;
  const { x, y, largura: w, altura: h } = alvo;
  const r = Math.max(0, Math.min(raio, w / 2, h / 2));
  const buraco =
    `M${n(x + r)},${n(y)} H${n(x + w - r)} Q${n(x + w)},${n(y)} ${n(x + w)},${n(y + r)} ` +
    `V${n(y + h - r)} Q${n(x + w)},${n(y + h)} ${n(x + w - r)},${n(y + h)} H${n(x + r)} ` +
    `Q${n(x)},${n(y + h)} ${n(x)},${n(y + h - r)} V${n(y + r)} Q${n(x)},${n(y)} ${n(x + r)},${n(y)} Z`;
  return `${fora} ${buraco}`;
}
