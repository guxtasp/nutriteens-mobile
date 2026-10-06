// src/shared/painel/painelTheme.ts
//
// Tokens do painel Admin/Nutricionista. Tudo parte das cores/tipografia do app
// do adolescente (shared/theme) — aqui só entram medidas e superfícies extras.
import { colors } from '../theme/colors';

export const painel = {
  // breakpoints (largura da janela)
  bpRail: 700, // >= 700: menu lateral só com ícones (tablet)
  bpSidebar: 1024, // >= 1024: menu lateral completo (desktop/web)
  larguraSidebar: 248,
  larguraRail: 76,
  conteudoMax: 1200,

  // superfícies
  fundo: '#F3F8F0', // tom bem claro da cor primária do app
  card: colors.white,
  cardBorda: colors.trilhaBalaoBorda,
  cardRaio: 18, // mesmo raio dos cards do adolescente
  textoSuave: '#6B7280',
  linhaSuave: '#EEF0EF',

  // paleta de séries dos gráficos (verde do app + complementares sem vermelho)
  serie: [colors.primary, colors.info, colors.warning, '#8B5CF6'] as string[],
} as const;

export type ModoPainel = 'celular' | 'tablet' | 'desktop';

export function modoPorLargura(largura: number): ModoPainel {
  if (largura >= painel.bpSidebar) return 'desktop';
  if (largura >= painel.bpRail) return 'tablet';
  return 'celular';
}
