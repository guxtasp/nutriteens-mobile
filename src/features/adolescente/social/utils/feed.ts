// src/features/adolescente/social/utils/feed.ts
//
// Regras puras do feed social (sem React/Supabase). O que entra no feed e quem
// pode ver é decidido no BANCO (ver data/migration_social_feed.sql); aqui só
// convertemos a linha que volta, montamos os textos e calculamos a reação
// otimista. Sem texto livre: tudo é montado a partir de tipo + props.

export const REACOES = ['PARABENS', 'FORCA', 'BORA', 'FOGO'] as const;
export type Reacao = (typeof REACOES)[number];

export const REACAO_INFO: Record<Reacao, { emoji: string; rotulo: string }> = {
  PARABENS: { emoji: '👏', rotulo: 'Parabéns' },
  FORCA: { emoji: '💪', rotulo: 'Força' },
  BORA: { emoji: '🍎', rotulo: 'Bora' },
  FOGO: { emoji: '🔥', rotulo: 'Fogo' },
};

export const TIPOS_EVENTO = ['INSIGNIA', 'LICAO', 'FASE', 'SEQUENCIA', 'RECEITA', 'CHAMA_DUPLA'] as const;
export type TipoEventoFeed = (typeof TIPOS_EVENTO)[number];

export type ReacaoRecebida = { apelido: string; reacao: Reacao };

export type EventoFeed = {
  id: string;
  /** null nos eventos meus (não há amizade comigo mesmo) */
  amizadeId: string | null;
  apelido: string;
  avatar: string | null;
  tipo: TipoEventoFeed;
  props: Record<string, unknown>;
  criadoEm: Date;
  reacoes: Partial<Record<Reacao, number>>;
  minhaReacao: Reacao | null;
  ehMeu: boolean;
  /** só vem nos eventos meus */
  quemReagiu: ReacaoRecebida[];
};

/** Formato cru devolvido por `social_feed`. */
export type LinhaFeed = {
  evento_id: string;
  amizade_id: string | null;
  autor_apelido: string | null;
  autor_avatar: string | null;
  tipo: string;
  props: unknown;
  criado_em: string;
  reacoes: unknown;
  minha_reacao: string | null;
  eh_meu: boolean | null;
  quem_reagiu: unknown;
};

export function ehReacao(valor: unknown): valor is Reacao {
  return typeof valor === 'string' && (REACOES as readonly string[]).includes(valor);
}

function ehTipo(valor: unknown): valor is TipoEventoFeed {
  return typeof valor === 'string' && (TIPOS_EVENTO as readonly string[]).includes(valor);
}

function mapearContagem(bruto: unknown): Partial<Record<Reacao, number>> {
  const saida: Partial<Record<Reacao, number>> = {};
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return saida;
  for (const [chave, n] of Object.entries(bruto as Record<string, unknown>)) {
    if (ehReacao(chave) && typeof n === 'number' && n > 0) saida[chave] = Math.floor(n);
  }
  return saida;
}

function mapearQuemReagiu(bruto: unknown): ReacaoRecebida[] {
  if (!Array.isArray(bruto)) return [];
  return bruto.flatMap((r): ReacaoRecebida[] =>
    r && typeof r === 'object' && typeof r.apelido === 'string' && ehReacao(r.reacao)
      ? [{ apelido: r.apelido, reacao: r.reacao }]
      : []
  );
}

/** Eventos de tipo desconhecido (versão nova do banco) são ignorados, não quebram o app. */
export function mapearEventosFeed(linhas: LinhaFeed[]): EventoFeed[] {
  return linhas.flatMap((l): EventoFeed[] => {
    if (!ehTipo(l.tipo)) return [];
    const props =
      l.props && typeof l.props === 'object' && !Array.isArray(l.props) ? (l.props as Record<string, unknown>) : {};
    return [
      {
        id: l.evento_id,
        amizadeId: l.amizade_id,
        apelido: l.autor_apelido ?? 'Amigo',
        avatar: l.autor_avatar,
        tipo: l.tipo,
        props,
        criadoEm: new Date(l.criado_em),
        reacoes: mapearContagem(l.reacoes),
        minhaReacao: ehReacao(l.minha_reacao) ? l.minha_reacao : null,
        ehMeu: l.eh_meu === true,
        quemReagiu: mapearQuemReagiu(l.quem_reagiu),
      },
    ];
  });
}

function numero(valor: unknown, padrao: number): number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0 ? Math.floor(valor) : padrao;
}

function texto(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : null;
}

/** Frase do evento, sem o apelido (o card mostra o apelido em destaque antes). */
export function textoEvento(e: Pick<EventoFeed, 'tipo' | 'props'>): string {
  switch (e.tipo) {
    case 'INSIGNIA': {
      const nome = texto(e.props.nome);
      const categoria = e.props.categoria;
      if (!nome) return 'ganhou uma nova conquista';
      if (categoria === 'marco') return `chegou ao marco ${nome}`;
      if (categoria === 'insignia') return `ganhou a insígnia ${nome}`;
      return `desbloqueou a conquista ${nome}`;
    }
    case 'LICAO': {
      const n = numero(e.props.n, 1);
      return n === 1 ? 'concluiu uma lição hoje' : `concluiu ${n} lições hoje`;
    }
    case 'FASE': {
      const titulo = texto(e.props.titulo);
      return titulo ? `levou o Broxis para a fase ${titulo}` : 'fez o Broxis evoluir';
    }
    case 'SEQUENCIA':
      return `chegou a ${numero(e.props.dias, 1)} dias seguidos`;
    case 'RECEITA': {
      const n = numero(e.props.n, 1);
      return n === 1 ? 'fez uma receita saudável' : `fez ${n} receitas saudáveis hoje`;
    }
    case 'CHAMA_DUPLA':
      return 'começou uma Chama em Dupla';
  }
}

/** Nome do ícone (Ionicons) de cada tipo de evento. */
export function iconeEvento(tipo: TipoEventoFeed): string {
  switch (tipo) {
    case 'INSIGNIA':
      return 'ribbon';
    case 'LICAO':
      return 'book';
    case 'FASE':
      return 'sparkles';
    case 'SEQUENCIA':
    case 'CHAMA_DUPLA':
      return 'flame';
    case 'RECEITA':
      return 'restaurant';
  }
}

/** "agora", "há 5 min", "há 3 h", "ontem", "há 4 dias". */
export function tempoRelativo(data: Date, agora: Date = new Date()): string {
  const min = Math.floor((agora.getTime() - data.getTime()) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? 'ontem' : `há ${dias} dias`;
}

/**
 * Atualização otimista, igual à regra do banco (`social_reagir`): a mesma
 * reação de novo remove; outra reação troca; sem reação anterior, soma.
 */
export function aplicarReacao(e: EventoFeed, reacao: Reacao): EventoFeed {
  const reacoes = { ...e.reacoes };
  const anterior = e.minhaReacao;

  if (anterior) {
    const restante = (reacoes[anterior] ?? 1) - 1;
    if (restante > 0) reacoes[anterior] = restante;
    else delete reacoes[anterior];
  }
  if (anterior === reacao) return { ...e, reacoes, minhaReacao: null };

  reacoes[reacao] = (reacoes[reacao] ?? 0) + 1;
  return { ...e, reacoes, minhaReacao: reacao };
}

/** Total de reações de um evento. */
export function totalReacoes(e: Pick<EventoFeed, 'reacoes'>): number {
  return Object.values(e.reacoes).reduce<number>((soma, n) => soma + (n ?? 0), 0);
}
