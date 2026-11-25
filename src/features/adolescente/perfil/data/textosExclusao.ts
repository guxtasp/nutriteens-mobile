// src/features/adolescente/perfil/data/textosExclusao.ts
//
// Textos do fluxo "Apagar meus dados" (HANDOFF_REBRAND, fase 5). Ficam juntos para a revisão
// (LGPD/orientadora) olhar um arquivo só.

export const FALA_APAGAR = 'Essa decisão é sua e tá tudo bem. Só quero te mostrar antes o que acontece.';

export const ITENS_APAGADOS: ReadonlyArray<{ titulo: string; detalhe: string }> = [
  { titulo: 'Sua conta e seu login', detalhe: 'nome, e-mail, data de nascimento' },
  { titulo: 'Tudo que você registrou', detalhe: 'refeições, água, atividade, peso e respostas iniciais' },
  { titulo: 'Seu progresso', detalhe: 'XP, sequência, cartas, insígnias e ideias guardadas' },
  { titulo: 'Sua Turma', detalhe: 'amizades e receitas que você compartilhou' },
];

// PENDENTE: confirmar com a orientadora se dado anônimo já usado na pesquisa continua no estudo.
export const AVISO_IRREVERSIVEL_TITULO = 'Não dá pra desfazer.';
export const AVISO_IRREVERSIVEL =
  'O que já virou dado anônimo da pesquisa (sem seu nome) pode continuar no estudo.';

export const TITULO_CONFIRMAR = 'Segure o botão pra apagar sua conta e seus dados';
export const APOIO_CONFIRMAR = 'Leva 2 segundos. Se soltar antes, nada acontece.';
export const ROTULO_SEGURAR = 'SEGURE PARA APAGAR';
export const ROTULO_SEGURANDO = 'APAGANDO… SOLTE PRA CANCELAR';
export const ROTULO_TOCAR = 'APAGAR MINHA CONTA';

export const ERRO_SEM_INTERNET = 'Precisa de internet pra apagar. Tenta quando estiver conectado.';
export const ERRO_GENERICO = 'Não deu pra apagar agora. Tenta de novo daqui a pouco.';

export const PRONTO_TITULO = 'Pronto, tudo apagado.';
export const PRONTO_TEXTO = 'Foi bom te acompanhar. Se quiser voltar, é só criar uma conta nova.';
export const CONTATO_PESQUISA = 'maria.villela@ufv.br';
