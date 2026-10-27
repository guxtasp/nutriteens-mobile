// src/features/adolescente/metricas/utils/textoTermometro.ts
//
// Fala do Bróxis no termômetro da regra de ouro. Tom de exploração: sem "falta", sem
// cobrança, sem nota. `evitarCobranca` vem da EBIA (só calibra o tom; a EBIA nunca é exibida).
// TEXTOS: rascunho, precisam de revisão da nutricionista antes de ir para os usuários.
import type { TipoPeriodo } from '../types/metricas';
import type { EstadoTermometro } from './misturaNova';
import { escolher, type FeedbackBroxis } from './feedbackBroxis';

const AMBITO: Record<TipoPeriodo, string> = { semana: 'dessa semana', mes: 'desse mês' };

export function textoTermometro(
  estado: EstadoTermometro,
  opcoes: { evitarCobranca: boolean; periodo: TipoPeriodo; semente: string },
): FeedbackBroxis {
  const { evitarCobranca, periodo, semente } = opcoes;
  const ambito = AMBITO[periodo];
  // `cartao` só identifica o visual do balão; o termômetro não é um CartaoId próprio
  const base = { cartao: 'alimentacao' as const };

  switch (estado) {
    case 'sem_dados':
      return {
        ...base, pose: 'curioso',
        texto: 'Ainda não tenho refeições suficientes para mostrar a mistura. Registrando mais algumas, ela aparece aqui.',
        proximoPasso: { tipo: 'registrar_refeicao', texto: 'Registre uma refeição de hoje.' },
      };
    case 'mais_natural':
      return {
        ...base, pose: 'orgulhoso',
        texto: escolher([
          `Nas refeições que você registrou, a maior parte ${ambito} foi de comida in natura ou feita em casa. É a regra de ouro do Guia em ação!`,
          `A maior parte do que você registrou ${ambito} foi in natura ou preparado em casa. Isso combina com a regra de ouro do Guia.`,
        ], semente),
        proximoPasso: null,
      };
    case 'mistura':
      return {
        ...base, pose: 'apresentando',
        texto: escolher([
          `Foi uma mistura de alimentos in natura, processados e industrializados ${ambito}. A regra de ouro do Guia é ir preferindo os in natura quando der.`,
          `Você registrou de tudo um pouco ${ambito}: in natura, processados e industrializados. Quando der, escolher um in natura já é um bom passo.`,
        ], semente),
        proximoPasso: null,
      };
    case 'mais_industrializado':
      return {
        ...base, pose: 'calmo',
        texto: evitarCobranca
          ? `Teve mais itens industrializados ${ambito}. Tudo bem, o que importa é ir ajustando aos poucos, sem pressa.`
          : `Teve bastante alimento industrializado ${ambito}. Que tal tentar trocar um deles por algo in natura nas próximas refeições?`,
        proximoPasso: null,
      };
  }
}
