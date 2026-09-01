// Perguntas adaptadas para linguagem de adolescente, com base na escala de
// insegurança alimentar validada por Coelho et al. (2015, Rev. Nutr.) para
// público adolescente brasileiro. Ordem mantém a severidade crescente do
// instrumento original. Revisar redação final com o time antes de publicar.
export interface PerguntaEbia {
  id: number;
  texto: string;
}

export const PERGUNTAS_EBIA: PerguntaEbia[] = [
  {
    id: 1,
    texto:
      'Nos últimos meses, faltou dinheiro em casa e por isso vocês comeram sempre a mesma coisa, sem fruta, verdura, feijão ou carne?',
  },
  {
    id: 2,
    texto: 'Alguma vez a comida acabou em casa e não deu pra comprar mais na hora?',
  },
  {
    id: 3,
    texto:
      'Você já teve que comer menos ou pular uma refeição porque não tinha dinheiro pra comida em casa?',
  },
  {
    id: 4,
    texto: 'Teve dia que você comeu bem menos do que precisava, porque não tinha dinheiro suficiente pra comida?',
  },
  {
    id: 5,
    texto:
      'Alguma vez você sentiu fome e não conseguiu comer, porque não tinha comida suficiente em casa?',
  },
];

export type ClassificacaoEbia =
  | 'SEGURANCA_ALIMENTAR'
  | 'INSEGURANCA_LEVE'
  | 'INSEGURANCA_MODERADA'
  | 'INSEGURANCA_GRAVE';

export function calcularPontuacaoEbia(respostas: boolean[]): number {
  return respostas.filter(Boolean).length;
}

export function classificarEbia(pontuacao: number): ClassificacaoEbia {
  if (pontuacao === 0) return 'SEGURANCA_ALIMENTAR';
  if (pontuacao <= 2) return 'INSEGURANCA_LEVE';
  if (pontuacao <= 4) return 'INSEGURANCA_MODERADA';
  return 'INSEGURANCA_GRAVE';
}