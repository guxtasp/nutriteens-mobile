// src/features/adolescente/social/utils/chamaDupla.ts
//
// Tipos e textos da Chama em Dupla. A regra (dias, vidas, sincronia) mora no
// banco (data/migration_chama_dupla.sql); aqui só mapeamos e escrevemos mensagens.
// Regra crítica: nenhum texto aponta de quem foi a falha — sempre neutro.

export type SituacaoChama = 'ativa' | 'recebido' | 'enviado';
export type AvisoChama = 'VIDA_USADA' | 'ENCERRADA';

export type LinhaChamaDupla = {
  id: string;
  situacao: SituacaoChama;
  amizade_id: string;
  apelido: string | null;
  avatar: string | null;
  sequencia_atual: number;
  maior_sequencia: number;
  vidas_restantes: number;
  eu_fiz_hoje: boolean;
  dupla_fez_hoje: boolean;
  concluida_hoje: boolean;
  aviso: AvisoChama | null;
};

export type ChamaDupla = {
  id: string;
  situacao: SituacaoChama;
  amizadeId: string;
  apelido: string;
  avatar: string | null;
  sequenciaAtual: number;
  maiorSequencia: number;
  vidasRestantes: number;
  euFizHoje: boolean;
  duplaFezHoje: boolean;
  concluidaHoje: boolean;
  aviso: AvisoChama | null;
};

export type ResultadoConvite = 'enviado' | 'sem_amizade' | 'ja_existe' | 'ocupado' | 'limite';

export const TEXTO_INFO_CHAMA_DUPLA =
  'A Chama em Dupla é uma sequência que você mantém junto com um amigo. ' +
  'O dia só conta quando vocês dois cumprem o dia no app. ' +
  'Se um dia passar em branco, vocês podem usar até 3 vidas para manter a chama acesa. ' +
  'Sem vidas, a chama recomeça do zero — e vocês podem recomeçar juntos!';

export function mapearChamaDupla(l: LinhaChamaDupla): ChamaDupla {
  return {
    id: l.id,
    situacao: l.situacao,
    amizadeId: l.amizade_id,
    apelido: l.apelido ?? 'Amigo',
    avatar: l.avatar,
    sequenciaAtual: l.sequencia_atual,
    maiorSequencia: l.maior_sequencia,
    vidasRestantes: l.vidas_restantes,
    euFizHoje: l.eu_fiz_hoje,
    duplaFezHoje: l.dupla_fez_hoje,
    concluidaHoje: l.concluida_hoje,
    aviso: l.aviso,
  };
}

/** Aviso neutro: não diz quem perdeu o dia. */
export function mensagemAviso(aviso: AvisoChama, vidasRestantes: number): string {
  if (aviso === 'ENCERRADA') {
    return 'A sequência da dupla chegou ao fim! Que tal recomeçarem juntos hoje?';
  }
  const vidas = vidasRestantes === 1 ? '1 vida' : `${vidasRestantes} vidas`;
  return `Uma vida da dupla foi usada para manter a chama acesa. Ainda restam ${vidas}. Bora continuar juntos!`;
}

export function mensagemConvite(r: ResultadoConvite, apelido?: string): string {
  switch (r) {
    case 'enviado':
      return `Convite enviado${apelido ? ` para ${apelido}` : ''}! Agora é só esperar a resposta.`;
    case 'ja_existe':
      return 'Já existe um convite ou uma Chama em Dupla com esse amigo.';
    case 'ocupado':
      return 'Você ou esse amigo já está em uma Chama em Dupla.';
    case 'limite':
      return 'Você já tem 3 convites esperando resposta. Aguarde um pouco.';
    default:
      return 'Não foi possível convidar agora.';
  }
}

/** Texto de progresso de hoje, sempre positivo. */
export function textoProgressoHoje(c: ChamaDupla): string {
  if (c.concluidaHoje) return 'Chama de hoje garantida!';
  if (c.euFizHoje) return 'Você já fez a sua parte hoje. Falta a dupla completar.';
  if (c.duplaFezHoje) return 'A dupla já completou o dia. Falta só você!';
  return 'Vocês dois ainda podem acender a chama de hoje.';
}

// ---------------------------------------------------------------------------
// Central de Notificações (in-app) e lembrete de fim de dia
// ---------------------------------------------------------------------------

/** Hora (do aparelho) a partir da qual o lembrete "acender a sequência" aparece/dispara. */
export const HORA_LEMBRETE = 19;

export function textoLembreteFimDeDia(apelido: string): string {
  return `O dia está acabando! Venha acender a sequência com ${apelido}.`;
}

/** O lembrete de fim de dia já deve aparecer? (a partir das 19h do aparelho) */
export function ehHoraDoLembrete(agora: Date): boolean {
  return agora.getHours() >= HORA_LEMBRETE;
}

/**
 * Quando disparar o próximo lembrete local. Antes das 19h e dia ainda aberto: hoje às 19h.
 * Caso contrário: amanhã às 19h (o app reagenda toda vez que é aberto).
 */
export function proximoLembrete(agora: Date, concluidaHoje: boolean): Date {
  const alvo = new Date(agora);
  alvo.setHours(HORA_LEMBRETE, 0, 0, 0);
  if (concluidaHoje || alvo.getTime() <= agora.getTime()) alvo.setDate(alvo.getDate() + 1);
  return alvo;
}

/** Cor da chama (a mesma do perfil do amigo). */
export const COR_CHAMA = '#F0883E';

/** Conteúdo do InfoSheet padrão do app (mesmo formato de Alimentação e Água). */
export const INFO_CHAMA_DUPLA = {
  titulo: 'O que é a Chama em Dupla?',
  icone: 'flame' as const,
  explicacao: TEXTO_INFO_CHAMA_DUPLA,
  exemplo: 'Você e um amigo cumprem o dia: a chama da dupla ganha 1 dia. Um dia em branco gasta 1 das 3 vidas.',
};
