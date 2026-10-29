// src/features/adolescente/home/utils/escalaCartao.ts
//
// Fator de escala do conteúdo do cartão final (CartaoStory) conforme a altura da tela. O cartão
// tem mascote + título + mensagem + até 4 linhas de resumo + logo, o que passa de ~670 de altura,
// e os botões ficam por cima da faixa de baixo. Em telas altas (>= 900) o fator é 1 (nada muda);
// em telas mais baixas o conteúdo encolhe, até 0,7, para a logo nunca ficar atrás dos botões.
export function escalaDoCartao(altura: number): number {
  return Math.max(0.7, Math.min(1, (altura - 500) / 400));
}
