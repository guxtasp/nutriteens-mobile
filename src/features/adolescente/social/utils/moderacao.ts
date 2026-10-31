// src/features/adolescente/social/utils/moderacao.ts
// Textos e regras puras do aviso de moderação (ECA Digital). O texto é fixo de propósito:
// não cita quem denunciou nem o motivo, e o tom é de cuidado, sem culpa.

export type TipoAviso = 'ADVERTENCIA' | 'RESTRICAO';
export type AvisoModeracao = { id: string; tipo: TipoAviso; restritoAte: Date | null; criadoEm: Date };
export type SituacaoModeracao = { restritoAte: Date | null; aviso: AvisoModeracao | null };

/** Erro que o banco devolve quando a conta está restrita no social. */
export function ehErroRestricaoSocial(erro: unknown): boolean {
  const msg = (erro as { message?: string } | null)?.message ?? '';
  return msg.includes('SOCIAL_RESTRITO');
}

export function formatarDataRestricao(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function textoAviso(tipo: TipoAviso, restritoAte: Date | null): { titulo: string; corpo: string } {
  if (tipo === 'RESTRICAO' && restritoAte) {
    return {
      titulo: 'Seu espaço de amigos deu uma pausa',
      corpo:
        `Recebemos um alerta sobre como as conversas e pedidos estavam acontecendo. ` +
        `Até ${formatarDataRestricao(restritoAte)} você não consegue enviar ou aceitar pedidos de amizade, reagir, convidar para a Chama Dupla nem enviar receitas. ` +
        `O resto do app continua igual. Se ficou com dúvida, fale com um adulto de confiança ou com a equipe do NutriTeens.`,
    };
  }
  return {
    titulo: 'Um recado da equipe',
    corpo:
      'Recebemos um alerta sobre o seu uso do espaço de amigos. Lembre de tratar todo mundo com respeito e de só falar com quem você conhece. ' +
      'Se alguma coisa te deixar desconfortável, você pode bloquear ou denunciar a qualquer momento.',
  };
}

export function mapearSituacao(bruto: any): SituacaoModeracao {
  const data = (v: unknown) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? new Date(v) : null);
  const a = bruto?.aviso;
  const restritoAte = data(bruto?.restrito_ate);
  return {
    restritoAte: restritoAte && restritoAte.getTime() > Date.now() ? restritoAte : null,
    aviso:
      a && a.id && (a.tipo === 'ADVERTENCIA' || a.tipo === 'RESTRICAO')
        ? { id: String(a.id), tipo: a.tipo, restritoAte: data(a.restrito_ate), criadoEm: data(a.criado_em) ?? new Date() }
        : null,
  };
}
