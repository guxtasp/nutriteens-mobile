export interface RefeicaoInfo {
  tipo: string; // bate com enum_tipo_refeicao no banco
  titulo: string;
  perguntaBroxis: string;
}

// Ordem seguida na tela: reflete a sequência natural do dia (Teixeira et al., 2024)
export const REFEICOES: RefeicaoInfo[] = [
  { tipo: 'CAFE_DA_MANHA', titulo: 'Café da manhã', perguntaBroxis: 'O que você comeu no café da manhã de ontem?' },
  { tipo: 'LANCHE_MANHA', titulo: 'Lanche da manhã', perguntaBroxis: 'Comeu alguma coisa no meio da manhã?' },
  { tipo: 'ALMOCO', titulo: 'Almoço', perguntaBroxis: 'E no almoço, o que você comeu?' },
  { tipo: 'LANCHE_TARDE', titulo: 'Lanche da tarde', perguntaBroxis: 'Beliscou alguma coisa à tarde?' },
  { tipo: 'JANTAR', titulo: 'Jantar', perguntaBroxis: 'No jantar, o que teve no seu prato?' },
  { tipo: 'CEIA', titulo: 'Ceia', perguntaBroxis: 'Antes de dormir, comeu ou bebeu alguma coisa?' },
];