// src/features/adolescente/social/utils/amizades.ts
//
// Regras puras da amizade (sem Supabase, sem React) — fáceis de testar.

export type SituacaoAmizade = 'amigo' | 'recebido' | 'enviado';
export type RelacaoComPerfil = 'nenhuma' | 'enviado' | 'recebido' | 'amigos';

export type ResultadoPedido =
  | 'enviado'
  | 'aceito_automaticamente'
  | 'ja_amigos'
  | 'ja_enviado'
  | 'limite_pedidos'
  | 'codigo_invalido';

export interface LinhaAmizade {
  amizadeId: string;
  outroId: string;
  nome: string;
  situacao: SituacaoAmizade;
  desde: string;
}

export interface AmizadesSeparadas {
  amigos: LinhaAmizade[];
  recebidos: LinhaAmizade[];
  enviados: LinhaAmizade[];
}

const PADRAO_CODIGO = /^(?:NT)?-?(\d{1,6})$/;

/**
 * Aceita "NT-000123", "nt123", "NT 123" ou só "123" e devolve "NT-000123".
 * Devolve null se não parecer um código (o app nem chama o banco).
 */
export function normalizarCodigo(entrada: string): string | null {
  const limpo = entrada.replace(/\s+/g, '').toUpperCase();
  const achou = PADRAO_CODIGO.exec(limpo);
  if (!achou) return null;
  const numero = achou[1];
  if (Number(numero) === 0) return null;
  return `NT-${numero.padStart(6, '0')}`;
}

export function primeiroNome(nome: string | null | undefined): string {
  return nome?.trim().split(/\s+/)[0] || 'Alguém';
}

/** Divide a lista do banco nos três grupos que a tela usa. */
export function separarAmizades(linhas: LinhaAmizade[]): AmizadesSeparadas {
  return {
    amigos: linhas.filter((l) => l.situacao === 'amigo'),
    recebidos: linhas.filter((l) => l.situacao === 'recebido'),
    enviados: linhas.filter((l) => l.situacao === 'enviado'),
  };
}

/** Tom acolhedor, sem cobrança. A mensagem de código inválido é genérica de propósito. */
export function mensagemResultadoPedido(resultado: ResultadoPedido, nome?: string): string {
  const quem = nome ? primeiroNome(nome) : 'essa pessoa';
  switch (resultado) {
    case 'enviado':
      return `Pedido enviado! Quando ${quem} aceitar, vocês viram amigos.`;
    case 'aceito_automaticamente':
      return `${quem} também queria te adicionar. Agora vocês são amigos!`;
    case 'ja_amigos':
      return `Você e ${quem} já são amigos.`;
    case 'ja_enviado':
      return `Você já enviou um pedido para ${quem}. É só esperar a resposta.`;
    case 'limite_pedidos':
      return 'Você já tem muitos pedidos esperando resposta. Espere alguns serem respondidos.';
    case 'codigo_invalido':
    default:
      return 'Não encontramos ninguém com esse código. Confira e tente de novo.';
  }
}

/** Só estes botões fazem sentido para cada relação (a tela não decide regra). */
export function acoesPossiveis(relacao: RelacaoComPerfil): Array<'enviar' | 'aceitar' | 'cancelar' | 'remover'> {
  switch (relacao) {
    case 'nenhuma':
      return ['enviar'];
    case 'recebido':
      return ['aceitar'];
    case 'enviado':
      return ['cancelar'];
    case 'amigos':
      return ['remover'];
  }
}
