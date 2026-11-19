// src/shared/painel/utils/mensagemErro.ts
//
// Traduz a mensagem técnica de um erro (Postgres/PostgREST/rede) para um texto que diz
// o que aconteceu e o que fazer (heurística 9 de Nielsen). A mensagem original não some:
// a tela pode mostrá-la como "detalhe técnico", útil para a equipe ao relatar o problema.
// Mensagens que já foram escritas para pessoas (ex.: "Rode a migration X") passam direto.

export type ErroAmigavel = {
  titulo: string;
  texto: string;
  /** mensagem original, para mostrar recolhida; null quando ela já é o próprio texto */
  detalhe: string | null;
};

const REDE = /network request failed|failed to fetch|networkerror|timeout|tempo esgotado|sem conex/i;
const PERMISSAO = /42501|permission denied|acesso negado|not authorized|row-level security|sem permiss/i;
const SESSAO = /jwt expired|invalid jwt|refresh token|not authenticated|sess[aã]o expirada/i;
const ESTRUTURA = /PGRST202|could not find the function|schema cache|does not exist|42883|42P01/i;
const DUPLICADO = /23505|duplicate key|already exists/i;
const REFERENCIA = /23503|foreign key|violates foreign/i;
const VALIDACAO = /23514|check constraint|22P02|invalid input syntax|23502|not-null/i;

/** Sinais de mensagem técnica (banco, rede, JavaScript), que nunca deve ir crua para a tela. */
const TECNICA = /PGRST|\b\d{5}\b|violates|relation "|column "|syntax|null value|denied|constraint "|TypeError|undefined|JSON|Error:|\bcode\b/i;

/** Texto já pensado para pessoas: frase terminada em pontuação e sem jargão técnico. */
function pareceAmigavel(msg: string): boolean {
  return /[.!?)]$/.test(msg.trim()) && !TECNICA.test(msg);
}

export function erroAmigavel(mensagem: string | null | undefined): ErroAmigavel {
  const msg = (mensagem ?? '').trim();
  const detalhe = msg || null;

  if (REDE.test(msg)) {
    return { titulo: 'Sem conexão com o servidor', texto: 'Verifique a internet e toque em "Tentar de novo".', detalhe };
  }
  if (SESSAO.test(msg)) {
    return { titulo: 'Sua sessão expirou', texto: 'Saia e entre de novo na sua conta para continuar.', detalhe };
  }
  if (PERMISSAO.test(msg)) {
    return {
      titulo: 'Sem permissão para esta ação',
      texto: 'O seu perfil não pode ver ou alterar estes dados. Se precisar, fale com a administração.',
      detalhe,
    };
  }
  if (ESTRUTURA.test(msg) && !pareceAmigavel(msg)) {
    return {
      titulo: 'Recurso ainda não configurado',
      texto: 'O banco de dados precisa de uma atualização (migration) para esta tela funcionar. Avise a equipe técnica.',
      detalhe,
    };
  }
  if (DUPLICADO.test(msg)) {
    return { titulo: 'Este item já existe', texto: 'Já há um cadastro com esses dados. Confira a lista antes de criar outro.', detalhe };
  }
  if (REFERENCIA.test(msg)) {
    return { titulo: 'Item em uso', texto: 'Este item está ligado a outros registros e não pode ser alterado ou excluído assim.', detalhe };
  }
  if (VALIDACAO.test(msg)) {
    return { titulo: 'Dados inválidos', texto: 'Algum campo está vazio ou em formato inválido. Revise e tente de novo.', detalhe };
  }
  if (msg && pareceAmigavel(msg)) {
    return { titulo: 'Não foi possível concluir', texto: msg, detalhe: null };
  }
  return {
    titulo: 'Não foi possível carregar',
    texto: 'Algo inesperado aconteceu. Tente de novo em instantes.',
    detalhe,
  };
}
