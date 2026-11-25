// src/features/adolescente/trocas/data/textosTestei.ts
//
// Opções e retornos do "Testei?" (HANDOFF_REBRAND, fase 3.3). Nenhum retorno julga: qualquer
// resposta vale o mesmo XP e todas agradecem por contar.
//
// ⚠️ PENDENTE DE REVISÃO DA NUTRICIONISTA.
import type { AvaliacaoTroca } from '../utils/avaliacaoTrocas';

export type RetornoTestei = {
  rotulo: string;
  /** Ionicons */
  icone: string;
  titulo: string;
  texto: string;
  cta: string;
  /** "Mais ou menos" mostra a dica da troca para dar outra chance. */
  mostraDica: boolean;
};

export const ORDEM_TESTEI: AvaliacaoTroca[] = ['CURTI', 'MEIO', 'NAO_ROLOU', 'NAO_TENHO'];

export const RETORNO_TESTEI: Record<AvaliacaoTroca, RetornoTestei> = {
  CURTI: {
    rotulo: 'Curti!',
    icone: 'heart-outline',
    titulo: 'Boa!',
    texto: 'Vou te mostrar mais ideias nessa linha. Essa fica marcada como uma das suas favoritas.',
    cta: 'VER IDEIAS PARECIDAS',
    mostraDica: false,
  },
  MEIO: {
    rotulo: 'Mais ou menos',
    icone: 'happy-outline',
    titulo: 'Gosto é gosto.',
    texto: 'Às vezes um jeito diferente de preparar muda tudo.',
    cta: 'VER OUTRA IDEIA',
    mostraDica: true,
  },
  NAO_ROLOU: {
    rotulo: 'Não rolou',
    icone: 'close-outline',
    titulo: 'Valeu por testar!',
    texto: 'Nem toda troca combina com todo mundo. Vou sugerir essa menos vezes.',
    cta: 'VER OUTRA IDEIA',
    mostraDica: false,
  },
  NAO_TENHO: {
    rotulo: 'Não tinha em casa',
    icone: 'home-outline',
    titulo: 'Tranquilo, nem sempre dá.',
    texto: 'Vou priorizar ideias mais fáceis de achar no seu dia a dia.',
    cta: 'VER OUTRA IDEIA',
    mostraDica: false,
  },
};

export const PERGUNTA_TESTEI = 'E aí, conseguiu testar?';
export const PERGUNTA_TESTEI_RESPONDIDA = 'Valeu por contar!';
export const APOIO_TESTEI = 'Conta pra mim, não vale nota.';
export const PRIVACIDADE_TESTEI = 'Só o Bróxis usa isso, ninguém mais vê.';
export const BANNER_GUARDADA = 'Guardei em "Minhas ideias pra testar". Daqui a 2 dias eu te pergunto como foi.';
