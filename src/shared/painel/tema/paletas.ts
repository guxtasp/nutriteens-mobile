// src/shared/painel/tema/paletas.ts
//
// Paletas do painel Admin/Nutricionista: tema claro e tema escuro.
// A identidade continua sendo o verde NutriTeens, mas o painel é uma ferramenta de
// trabalho de adultos: superfícies neutras, bordas finas, menu verde-tinta e o verde-lima
// reservado para preenchimentos (barras, selos, item ativo). Texto e ícones sobre fundo
// claro usam `destaqueTexto`/`alertaTexto`, que passam no contraste WCAG AA (>= 4,5:1);
// o lima e o âmbar puros ficam abaixo de 2:1 sobre branco e não servem para texto.
// Telas devem ler estas cores por useTemaPainel()/useEstilos(), nunca importar hex direto.
import { colors } from '../../theme/colors';

export type NomeTema = 'claro' | 'escuro';
export type TomSelo = 'neutro' | 'ok' | 'aviso' | 'erro' | 'info';
export type CoresSelo = { fundo: string; texto: string };

export interface TemaPainel {
  nome: NomeTema;

  // superfícies
  fundo: string; // fundo da página
  card: string;
  cardBorda: string;
  cardRaio: number;
  /** espessura padrão de borda de cards, campos e chips */
  borda: number;
  superficieSuave: string; // blocos dentro de um card (chips de info, trilhos)
  linhaSuave: string; // divisórias e trilhos de gráficos
  /** borda de campos de formulário (>= 3:1 contra o card, WCAG 1.4.11) */
  campoBorda: string;

  // texto
  texto: string; // títulos e valores
  textoCorpo: string; // texto corrido
  textoSuave: string; // legendas e apoio

  // marca
  destaque: string; // verde-lima: preenchimentos (barras, sparkline, item ativo)
  destaqueTexto: string; // verde legível para texto e ícones sobre o card
  destaqueSuave: string; // fundo de ícones
  botaoFundo: string; // botão principal
  botaoTexto: string;
  botaoSombra: string;

  // menu lateral / barra superior
  menuFundo: string;
  menuTexto: string;
  menuTextoAtivo: string;
  menuIconeAtivo: string;
  menuAtivoFundo: string;
  menuDivisor: string;
  menuMarcaTexto: string;
  menuSecao: string; // títulos dos grupos do menu

  // estados
  alerta: string; // âmbar de preenchimento (contador, borda de alerta)
  alertaTexto: string; // âmbar legível para texto e ícones
  alertaSuave: string;
  erro: string;
  info: string;

  // dicas ("Entendi") e chips de filtro
  dicaFundo: string;
  dicaBorda: string;
  chipFundo: string;
  chipBorda: string;
  chipTexto: string;
  chipAtivoFundo: string;
  chipAtivoTexto: string;

  // campos de texto
  placeholder: string;

  /** selos/etiquetas por tom (neutro, ok, aviso, erro, info) */
  selos: Record<TomSelo, CoresSelo>;

  /** cores das séries dos gráficos (sem vermelho; todas >= 3:1 contra o card) */
  serie: string[];

  /**
   * Rampa ORDINAL de um só tom (verde da marca), do menor para o maior uso: estágios de engajamento
   * e mapas de calor. Validada com o script da skill dataviz (--ordinal) contra o card de cada tema:
   * monotônica, passos visíveis e a ponta fraca >= 2:1 contra o fundo. No escuro, os passos são
   * próprios (o menor uso se aproxima do fundo), não uma inversão automática.
   */
  rampaUso: [string, string, string, string];
  /** categoria à parte da rampa ("novos"): azul, separado de todos os verdes (ΔE > 20, inclusive daltonismo) */
  corNovos: string;
}

const claro: TemaPainel = {
  nome: 'claro',
  fundo: '#F4F6F5',
  card: colors.white,
  cardBorda: '#E1E7E4',
  cardRaio: 14,
  borda: 1,
  superficieSuave: '#F1F5F3',
  linhaSuave: '#EBEFED',
  campoBorda: '#7E8E86',

  texto: '#0F2A21',
  textoCorpo: '#1F2A26',
  textoSuave: '#56665F',

  destaque: colors.primary,
  destaqueTexto: '#1F7A4D',
  destaqueSuave: '#E8F4DF',
  botaoFundo: colors.primaryDark,
  botaoTexto: colors.white,
  botaoSombra: '#0B1F17',

  menuFundo: '#0F2A21',
  menuTexto: '#B9C8C0',
  menuTextoAtivo: colors.white,
  menuIconeAtivo: colors.primary,
  menuAtivoFundo: 'rgba(139,207,74,0.16)',
  menuDivisor: 'rgba(255,255,255,0.10)',
  menuMarcaTexto: colors.white,
  menuSecao: '#86A094',

  alerta: colors.warning,
  alertaTexto: '#8A5A00',
  alertaSuave: '#FDF1DC',
  erro: '#B42318',
  info: '#1D5F8A',

  dicaFundo: '#F3F9EC',
  dicaBorda: '#CFE6B8',
  chipFundo: colors.white,
  chipBorda: '#C9D3CE',
  chipTexto: '#46554E',
  chipAtivoFundo: colors.primaryDark,
  chipAtivoTexto: colors.white,

  placeholder: '#7A8981',
  selos: {
    neutro: { fundo: '#EEF1EF', texto: '#3F4B45' },
    ok: { fundo: '#E8F4DF', texto: '#1E5C3A' },
    aviso: { fundo: '#FDF1DC', texto: '#7A4F00' },
    erro: { fundo: '#FDE7E5', texto: '#9F1F15' },
    info: { fundo: '#E3F1FB', texto: '#1D5F8A' },
  },

  serie: ['#3F9142', '#2F6FB5', '#B87308', '#7C5CC4'],
  rampaUso: ['#7EBC7B', '#55A653', '#2A8443', '#0B4F24'],
  corNovos: '#2F6FB5',
};

const escuro: TemaPainel = {
  nome: 'escuro',
  fundo: '#0C1511',
  card: '#14201A',
  cardBorda: '#243A2F',
  cardRaio: 14,
  borda: 1,
  superficieSuave: '#1A2A22',
  linhaSuave: '#22352B',
  campoBorda: '#5A7568',

  texto: '#E7F2EA',
  textoCorpo: '#D6E4DB',
  textoSuave: '#A3B8AB',

  destaque: colors.primary,
  destaqueTexto: '#A8E06E',
  destaqueSuave: 'rgba(139,207,74,0.16)',
  botaoFundo: colors.primary,
  botaoTexto: '#10241A',
  botaoSombra: colors.primaryShadow,

  menuFundo: '#08100C',
  menuTexto: '#A9BDB0',
  menuTextoAtivo: '#E7F2EA',
  menuIconeAtivo: colors.primary,
  menuAtivoFundo: 'rgba(139,207,74,0.14)',
  menuDivisor: 'rgba(255,255,255,0.08)',
  menuMarcaTexto: '#E7F2EA',
  menuSecao: '#7A9284',

  alerta: '#F5B13D',
  alertaTexto: '#F5B13D',
  alertaSuave: 'rgba(245,166,35,0.18)',
  erro: '#FF8A80',
  info: '#8CBFFF',

  dicaFundo: '#162A1F',
  dicaBorda: '#2B4A38',
  chipFundo: '#14201A',
  chipBorda: '#35503F',
  chipTexto: '#A3B8AB',
  chipAtivoFundo: colors.primary,
  chipAtivoTexto: '#10241A',

  placeholder: '#7F978A',
  selos: {
    neutro: { fundo: '#22352B', texto: '#C3D3C9' },
    ok: { fundo: 'rgba(139,207,74,0.18)', texto: '#A8E06E' },
    aviso: { fundo: 'rgba(245,166,35,0.18)', texto: '#F5B13D' },
    erro: { fundo: 'rgba(255,122,112,0.16)', texto: '#FF9A92' },
    info: { fundo: 'rgba(122,179,255,0.16)', texto: '#9CC4FF' },
  },

  serie: ['#8BCF4A', '#60A5FA', '#FBBF24', '#A78BFA'],
  rampaUso: ['#3A8746', '#55A85A', '#7FC877', '#B4E6A0'],
  corNovos: '#60A5FA',
};

export const TEMAS: Record<NomeTema, TemaPainel> = { claro, escuro };
