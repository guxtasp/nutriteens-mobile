// src/features/adolescente/trilha/utils/trilhoPontilhado.ts
//
// Pontinhos que ligam um nó ao próximo no caminho da trilha. Pura (só geometria), para
// poder ser testada sem a tela. Os pontos ficam sobre o segmento entre os dois nós,
// igualmente espaçados, sem encostar em nenhum deles.
export type Ponto = { x: number; y: number };

/**
 * @param de        centro do nó de origem
 * @param para      centro do nó de destino
 * @param afastaDe  distância a partir do centro de `de` onde NÃO se desenha (raio do nó + folga)
 * @param afastaPara idem para o nó de destino
 * @param espaco    distância desejada entre pontinhos
 */
export function pontosDoTrilho(de: Ponto, para: Ponto, afastaDe: number, afastaPara: number, espaco = 13): Ponto[] {
  const dx = para.x - de.x;
  const dy = para.y - de.y;
  const comprimento = Math.hypot(dx, dy);
  if (comprimento === 0) return [];

  const inicio = afastaDe;
  const fim = comprimento - afastaPara;
  const livre = fim - inicio;
  if (livre < espaco * 0.75) return []; // sem espaço para ao menos um pontinho

  const quantidade = Math.max(1, Math.round(livre / espaco));
  const ux = dx / comprimento;
  const uy = dy / comprimento;
  return Array.from({ length: quantidade }, (_, i) => {
    const t = inicio + ((i + 0.5) * livre) / quantidade;
    return { x: de.x + ux * t, y: de.y + uy * t };
  });
}
