// src/features/adolescente/social/utils/cartinhas.ts
//
// Regras puras das Cartinhas entre amigos (sem Supabase, sem React).
// O banco (data/migration_social_cartinhas.sql) guarda só o TIPO; a frase, o ícone e as cores ficam aqui.
// Sem texto livre, sem referência a peso, corpo, ranking ou cobrança.

export type TipoCartinha = 'PARABENS' | 'ORGULHO' | 'FORCA' | 'VALEU' | 'ABRACO' | 'BORA' | 'AGUA' | 'FRUTA';

export type DefinicaoCartinha = {
  tipo: TipoCartinha;
  titulo: string;
  /** o que o destinatário lê: "{remetente} te mandou: titulo" + esta frase curta */
  frase: string;
  /** nome de ícone do Ionicons */
  icone: string;
  cor: string;
  fundo: [string, string];
  /** lembrete gentil: tem travas a mais no banco e pode ser desligado por quem recebe */
  lembrete: boolean;
};

export const LIMITE_DIARIO = 5;
export const LEMBRETES_POR_SEMANA = 2;

export const CARTINHAS: DefinicaoCartinha[] = [
  { tipo: 'PARABENS', titulo: 'Parabéns!', frase: 'Você mandou bem.', icone: 'ribbon', cor: '#B07A12', fundo: ['#FFF1C9', '#FFE19A'], lembrete: false },
  { tipo: 'ORGULHO', titulo: 'Orgulho de você', frase: 'Tô torcendo por você.', icone: 'heart', cor: '#C2477D', fundo: ['#FFE0EC', '#FFC4DB'], lembrete: false },
  { tipo: 'FORCA', titulo: 'Bora com força', frase: 'Um passo de cada vez.', icone: 'rocket', cor: '#2F7FC4', fundo: ['#DCEEFE', '#B9DCFB'], lembrete: false },
  { tipo: 'VALEU', titulo: 'Valeu por tudo', frase: 'Você faz a turma melhor.', icone: 'happy', cor: '#3E8E2F', fundo: ['#DDF1CF', '#BFE4A8'], lembrete: false },
  { tipo: 'ABRACO', titulo: 'Um abraço', frase: 'Pra alegrar o seu dia.', icone: 'sunny', cor: '#D9731A', fundo: ['#FFE9D2', '#FFD3A6'], lembrete: false },
  { tipo: 'BORA', titulo: 'Bora juntos hoje?', frase: 'Quando der, a gente acende a chama.', icone: 'flame', cor: '#D9731A', fundo: ['#FFEBD6', '#FFCF9E'], lembrete: true },
  { tipo: 'AGUA', titulo: 'Hora da aguinha', frase: 'Um golinho já ajuda.', icone: 'water', cor: '#2F7FC4', fundo: ['#DCF0FF', '#B5DDFA'], lembrete: true },
  { tipo: 'FRUTA', titulo: 'Que tal uma fruta?', frase: 'Escolhe a sua favorita.', icone: 'nutrition', cor: '#7A55C9', fundo: ['#EBE3FF', '#D5C7FA'], lembrete: true },
];

const POR_TIPO = new Map(CARTINHAS.map((c) => [c.tipo, c]));

export function definicaoDaCartinha(tipo: string): DefinicaoCartinha | null {
  return POR_TIPO.get(tipo as TipoCartinha) ?? null;
}

export const CARTINHAS_CELEBRAR = CARTINHAS.filter((c) => !c.lembrete);
export const CARTINHAS_LEMBRETE = CARTINHAS.filter((c) => c.lembrete);

// ---------- envio ----------

export type ResultadoEnvioCartinha = 'enviada' | 'sem_amizade' | 'tipo_invalido' | 'ja_enviada' | 'limite' | 'calma';

/** Mensagem curta depois de enviar. Nunca revela se o amigo desligou lembretes nem se registrou o dia. */
export function mensagemEnvioCartinha(r: ResultadoEnvioCartinha, apelido: string): string {
  switch (r) {
    case 'enviada':
      return `Cartinha enviada para ${apelido}!`;
    case 'ja_enviada':
      return `Você já mandou uma cartinha para ${apelido} hoje. Amanhã tem mais!`;
    case 'limite':
      return `Você já mandou ${LIMITE_DIARIO} cartinhas hoje. Amanhã você manda mais!`;
    case 'calma':
      return `${apelido} já recebeu seus lembretes dessa semana. Que tal mandar um parabéns?`;
    case 'sem_amizade':
      return 'Não deu para enviar essa cartinha.';
    default:
      return 'Algo deu errado. Tente de novo daqui a pouco.';
  }
}

const RESULTADOS: ResultadoEnvioCartinha[] = ['enviada', 'sem_amizade', 'tipo_invalido', 'ja_enviada', 'limite', 'calma'];

export function normalizarResultadoEnvio(valor: unknown): ResultadoEnvioCartinha {
  return RESULTADOS.includes(valor as ResultadoEnvioCartinha) ? (valor as ResultadoEnvioCartinha) : 'sem_amizade';
}

// ---------- caixa ----------

export type CartinhaRecebida = {
  id: string;
  tipo: TipoCartinha;
  remetente: string;
  avatar: string | null;
  criadaEm: Date;
  nova: boolean;
  /** veio como presente de uma repetida (Fizemos juntos) */
  presente: boolean;
};

export type CaixaCartinhas = { aceitaLembretes: boolean; itens: CartinhaRecebida[] };

/** Mapeia o retorno de cartinha_caixa(), descartando tipos que o app não conhece. */
export function mapearCaixa(dados: unknown): CaixaCartinhas {
  const d = (dados ?? {}) as { aceita_lembretes?: unknown; itens?: unknown };
  const brutos = Array.isArray(d.itens) ? d.itens : [];
  const itens: CartinhaRecebida[] = [];
  for (const b of brutos as any[]) {
    const def = definicaoDaCartinha(String(b?.tipo ?? ''));
    if (!def || !b?.id) continue;
    const quando = new Date(b.criado_em);
    itens.push({
      id: String(b.id),
      tipo: def.tipo,
      remetente: typeof b.remetente === 'string' && b.remetente ? b.remetente : 'Um amigo',
      avatar: typeof b.avatar === 'string' ? b.avatar : null,
      criadaEm: Number.isNaN(quando.getTime()) ? new Date(0) : quando,
      nova: b.vista === false,
      presente: b.presente === true,
    });
  }
  return { aceitaLembretes: d.aceita_lembretes !== false, itens };
}

export type ResumoEnviadasHoje = { total: number; amizades: string[] };

export function mapearEnviadasHoje(dados: unknown): ResumoEnviadasHoje {
  const d = (dados ?? {}) as { total?: unknown; amizades?: unknown };
  const amizades = Array.isArray(d.amizades) ? (d.amizades as unknown[]).filter((x): x is string => typeof x === 'string') : [];
  return { total: typeof d.total === 'number' ? d.total : amizades.length, amizades };
}

export function contarNovas(itens: CartinhaRecebida[]): number {
  return itens.filter((i) => i.nova).length;
}

/** "Ana te mandou uma cartinha" — o título da cartinha aparece ao lado, na arte. */
export function textoRecebida(c: Pick<CartinhaRecebida, 'remetente'>): string {
  return `${c.remetente} te mandou uma cartinha`;
}

/** Aviso do cartão da Turma. Só celebra: sem cartinhas, convida a mandar a primeira. */
export function resumoDoCartao(novas: number, total: number): { titulo: string; sub: string } {
  if (novas > 0) {
    return {
      titulo: novas === 1 ? 'Você tem 1 cartinha nova' : `Você tem ${novas} cartinhas novas`,
      sub: 'Toque para abrir.',
    };
  }
  if (total > 0) return { titulo: 'Suas cartinhas', sub: 'Veja o que seus amigos mandaram.' };
  return { titulo: 'Cartinhas', sub: 'Mande um carinho para um amigo. Uma por dia para cada um.' };
}

/** "hoje", "ontem" ou "há 3 dias" (a caixa guarda só 14 dias). */
export function quandoRecebida(data: Date, agora: Date = new Date()): string {
  const inicio = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dias = Math.round((inicio(agora) - inicio(data)) / 86_400_000);
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'ontem';
  return `há ${dias} dias`;
}

// ---------- Fizemos juntos + presente de repetida (Fase 3B) ----------

export type AmigoJuntos = { amizadeId: string; presenteado: boolean };

/** Mapeia cartinha_juntos_hoje(): só amigos com quem você fez junto hoje. */
export function mapearJuntos(dados: unknown): AmigoJuntos[] {
  if (!Array.isArray(dados)) return [];
  return (dados as any[])
    .filter((d) => typeof d?.amizade_id === 'string')
    .map((d) => ({ amizadeId: d.amizade_id as string, presenteado: d.presenteado === true }));
}

export type Repetidas = Partial<Record<TipoCartinha, number>>;

/** Mapeia cartinha_repetidas(): só tipos de celebrar com pelo menos 1 disponível. */
export function mapearRepetidas(dados: unknown): Repetidas {
  const saida: Repetidas = {};
  if (!dados || typeof dados !== 'object') return saida;
  for (const [tipo, qtd] of Object.entries(dados as Record<string, unknown>)) {
    const def = definicaoDaCartinha(tipo);
    if (def && !def.lembrete && typeof qtd === 'number' && qtd > 0) saida[def.tipo] = Math.floor(qtd);
  }
  return saida;
}

export function totalRepetidas(r: Repetidas): number {
  return Object.values(r).reduce<number>((soma, n) => soma + (n ?? 0), 0);
}

export type ResultadoPresente = 'enviada' | 'sem_amizade' | 'tipo_invalido' | 'nao_juntos' | 'sem_repetida' | 'ja_presenteou';

const RESULTADOS_PRESENTE: ResultadoPresente[] = ['enviada', 'sem_amizade', 'tipo_invalido', 'nao_juntos', 'sem_repetida', 'ja_presenteou'];

export function normalizarResultadoPresente(valor: unknown): ResultadoPresente {
  return RESULTADOS_PRESENTE.includes(valor as ResultadoPresente) ? (valor as ResultadoPresente) : 'sem_amizade';
}

export function mensagemPresente(r: ResultadoPresente, apelido: string): string {
  switch (r) {
    case 'enviada':
      return `Presente enviado para ${apelido}!`;
    case 'ja_presenteou':
      return `Você já deu um presente para ${apelido} hoje. Amanhã tem mais!`;
    case 'sem_repetida':
      return 'Essa cartinha ainda não está repetida.';
    case 'nao_juntos':
      return `O presente aparece quando você e ${apelido} mantêm a sequência no mesmo dia.`;
    default:
      return 'Não deu para enviar o presente.';
  }
}

/** Título do cartão "Fizemos juntos". Só existe quando há alguém: sem amigos juntos o cartão nem aparece. */
export function resumoJuntos(qtd: number): { titulo: string; sub: string } {
  return {
    titulo: 'Fizemos juntos hoje!',
    sub: qtd === 1 ? 'Você e 1 amigo mantiveram a sequência hoje.' : `Você e ${qtd} amigos mantiveram a sequência hoje.`,
  };
}
