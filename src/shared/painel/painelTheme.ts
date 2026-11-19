// src/shared/painel/painelTheme.ts
//
// Medidas do Design System do painel Admin/Nutricionista (as cores ficam em
// tema/paletas.ts, porque mudam com o tema claro/escuro). Componentes novos
// devem usar `espaco`, `fonte` e os breakpoints daqui em vez de números soltos.
import { TEMAS } from './tema/paletas';

export const painel = {
  // breakpoints (largura da janela)
  bpRail: 700, // >= 700: menu lateral compacto com ícone + rótulo curto (tablet)
  bpSidebar: 1024, // >= 1024: menu lateral completo (desktop/web)
  larguraSidebar: 256,
  larguraRail: 92,
  conteudoMax: 1240,

  // Compatibilidade: telas antigas ainda leem estas superfícies fixas (tema claro).
  fundo: TEMAS.claro.fundo,
  card: TEMAS.claro.card,
  cardBorda: TEMAS.claro.cardBorda,
  cardRaio: TEMAS.claro.cardRaio,
  textoSuave: TEMAS.claro.textoSuave,
  linhaSuave: TEMAS.claro.linhaSuave,
  serie: TEMAS.claro.serie,
} as const;

/** Espaçamentos (múltiplos de 4). */
export const espaco = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Escala tipográfica do painel (tamanhos em pt; a família é a Sora do app). */
export const fonte = {
  tituloPagina: 24,
  tituloPaginaCelular: 20,
  tituloSecao: 16,
  corpo: 14,
  apoio: 13,
  legenda: 12,
  selo: 11,
  kpi: 28,
} as const;

/** Altura mínima de alvos de toque (WCAG 2.5.5 / diretriz de 44 pt do projeto). */
export const ALVO_TOQUE = 44;

export type ModoPainel = 'celular' | 'tablet' | 'desktop';

export function modoPorLargura(largura: number): ModoPainel {
  if (largura >= painel.bpSidebar) return 'desktop';
  if (largura >= painel.bpRail) return 'tablet';
  return 'celular';
}

/** Respiro lateral do conteúdo por modo: o celular aproveita a tela, o desktop respira. */
export function paddingConteudo(modo: ModoPainel): number {
  if (modo === 'desktop') return espaco.xxl;
  if (modo === 'tablet') return espaco.xl;
  return espaco.lg;
}
