export interface RefeicaoInfo {
  tipo: string;
  titulo: string;
  perguntaBroxis: string;
}

export const REFEICOES: RefeicaoInfo[] = [
  { tipo: 'CAFE_DA_MANHA', titulo: 'Café da manhã', perguntaBroxis: 'O que você comeu no café da manhã de ontem?' },
  { tipo: 'LANCHE_MANHA', titulo: 'Lanche da manhã', perguntaBroxis: 'E no lanche da manhã de ontem, você comeu alguma coisa?' },
  { tipo: 'ALMOCO', titulo: 'Almoço', perguntaBroxis: 'E no almoço de ontem, o que você comeu?' },
  { tipo: 'LANCHE_TARDE', titulo: 'Lanche da tarde', perguntaBroxis: 'Ontem à tarde, você beliscou alguma coisa?' },
  { tipo: 'JANTAR', titulo: 'Jantar', perguntaBroxis: 'No jantar de ontem, o que teve no seu prato?' },
  { tipo: 'CEIA', titulo: 'Ceia', perguntaBroxis: 'Ontem, antes de dormir, você comeu ou bebeu alguma coisa?' },
];