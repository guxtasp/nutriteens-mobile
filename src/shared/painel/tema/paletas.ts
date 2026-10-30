// src/shared/painel/tema/paletas.ts
//
// Paletas do painel Admin/Nutricionista: tema claro (branco) e tema escuro.
// A identidade é a mesma do app do adolescente (verde NutriTeens); só mudam
// as superfícies e os textos. Telas novas devem ler estas cores pelo hook
// useTemaPainel()/useEstilos() em vez de importar `painel` ou `colors` direto.
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
  superficieSuave: string; // blocos dentro de um card (chips de info, trilhos)
  linhaSuave: string; // divisórias e trilhos de gráficos

  // texto
  texto: string; // títulos e valores
  textoCorpo: string; // texto corrido
  textoSuave: string; // legendas e apoio

  // marca
  destaque: string; // verde de acento (barras, ícones ativos)
  destaqueSuave: string; // fundo de ícones
  botaoFundo: string; // botão principal
  botaoTexto: string;
  botaoSombra: string;

  // menu lateral / barra superior
  menuFundo: string;
  menuTexto: string;
  menuTextoAtivo: string;
  menuAtivoFundo: string;
  menuDivisor: string;
  menuMarcaTexto: string;

  // estados
  alerta: string;
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

  /** cores das séries dos gráficos (sem vermelho) */
  serie: string[];
}

const claro: TemaPainel = {
  nome: 'claro',
  fundo: '#F3F8F0',
  card: colors.white,
  cardBorda: colors.trilhaBalaoBorda,
  cardRaio: 18,
  superficieSuave: '#F0F5F1',
  linhaSuave: '#EEF0EF',

  texto: colors.primaryDark,
  textoCorpo: colors.textOnLight,
  textoSuave: '#6B7280',

  destaque: colors.primary,
  destaqueSuave: '#EAF5DE',
  botaoFundo: colors.primaryDark,
  botaoTexto: colors.white,
  botaoSombra: '#123024',

  menuFundo: colors.background,
  menuTexto: colors.textOnDarkMuted,
  menuTextoAtivo: colors.primaryDark,
  menuAtivoFundo: colors.primary,
  menuDivisor: 'rgba(255,255,255,0.12)',
  menuMarcaTexto: colors.white,

  alerta: colors.warning,
  alertaSuave: colors.warningSoft,
  erro: colors.error,
  info: colors.info,

  dicaFundo: '#F3F9EC',
  dicaBorda: '#CFE6B8',
  chipFundo: colors.white,
  chipBorda: '#D9D9D9',
  chipTexto: '#6B7280',
  chipAtivoFundo: colors.primaryDark,
  chipAtivoTexto: colors.white,

  placeholder: colors.placeholder,
  selos: {
    neutro: { fundo: '#EEF0EF', texto: '#4B4B4B' },
    ok: { fundo: '#EAF5DE', texto: colors.primaryDark },
    aviso: { fundo: colors.warningSoft, texto: colors.warningShadow },
    erro: { fundo: colors.exercicioErroSuave, texto: colors.error },
    info: { fundo: '#E3F1FB', texto: '#1D5F8A' },
  },

  serie: [colors.primary, colors.info, colors.warning, '#8B5CF6'],
};

const escuro: TemaPainel = {
  nome: 'escuro',
  fundo: '#0E1713',
  card: '#15221B',
  cardBorda: '#243A2F',
  cardRaio: 18,
  superficieSuave: '#1B2C23',
  linhaSuave: '#22352B',

  texto: '#E7F2EA',
  textoCorpo: '#D6E4DB',
  textoSuave: '#9DB3A6',

  destaque: colors.primary,
  destaqueSuave: 'rgba(139,207,74,0.16)',
  botaoFundo: colors.primary,
  botaoTexto: '#10241A',
  botaoSombra: colors.primaryShadow,

  menuFundo: '#0A120E',
  menuTexto: '#A9BDB0',
  menuTextoAtivo: '#10241A',
  menuAtivoFundo: colors.primary,
  menuDivisor: 'rgba(255,255,255,0.08)',
  menuMarcaTexto: '#E7F2EA',

  alerta: '#F5B13D',
  alertaSuave: 'rgba(245,166,35,0.18)',
  erro: '#FF7A70',
  info: '#7AB3FF',

  dicaFundo: '#162A1F',
  dicaBorda: '#2B4A38',
  chipFundo: '#15221B',
  chipBorda: '#2C4237',
  chipTexto: '#9DB3A6',
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
};

export const TEMAS: Record<NomeTema, TemaPainel> = { claro, escuro };
