// src/features/adolescente/trocas/utils/avaliacaoTrocas.ts
//
// Regras puras do ciclo "guardar → testar → contar como foi" (HANDOFF_REBRAND, fase 3) e das
// taxas mostradas à nutricionista. Sem I/O, para testar.
//
// Princípios: a avaliação nunca vira ranking, nunca aparece para amigos e não muda o XP
// (qualquer resposta vale o mesmo). Ela só reordena sugestões (ver ordenarTrocas) e ajuda a
// equipe a reescrever o que não funciona.
import { semDestinoRepetido, type CategoriaTroca, type Troca } from './trocas';

export type AvaliacaoTroca = 'CURTI' | 'MEIO' | 'NAO_ROLOU' | 'NAO_TENHO';
export type RespostaTroca = 'TENTAR' | AvaliacaoTroca;

export const AVALIACOES: readonly AvaliacaoTroca[] = ['CURTI', 'MEIO', 'NAO_ROLOU', 'NAO_TENHO'];

export type RespostaRegistrada = { trocaId: string; resposta: RespostaTroca; criadoEm: string };

/** Depois de quantos dias o Bróxis pergunta "e aí, testou?". */
export const DIAS_PARA_PERGUNTAR = 2;

const DIA_MS = 24 * 60 * 60 * 1000;

export function ehAvaliacao(r: RespostaTroca): r is AvaliacaoTroca {
  return r !== 'TENTAR';
}

export type TrocaGuardada = { trocaId: string; guardadaEm: string };

/**
 * "Minhas ideias pra testar": trocas cujo último "QUERO TESTAR" ainda não teve resposta depois.
 * Mais recentes primeiro.
 */
export function trocasGuardadas(respostas: RespostaRegistrada[]): TrocaGuardada[] {
  const porTroca = new Map<string, { tentar?: number; avaliada?: number }>();
  for (const r of respostas) {
    const t = Date.parse(r.criadoEm);
    if (Number.isNaN(t)) continue;
    const e = porTroca.get(r.trocaId) ?? {};
    if (r.resposta === 'TENTAR') e.tentar = Math.max(e.tentar ?? -Infinity, t);
    else e.avaliada = Math.max(e.avaliada ?? -Infinity, t);
    porTroca.set(r.trocaId, e);
  }
  const guardadas: TrocaGuardada[] = [];
  for (const [trocaId, e] of porTroca) {
    if (e.tentar === undefined) continue;
    if (e.avaliada !== undefined && e.avaliada >= e.tentar) continue;
    guardadas.push({ trocaId, guardadaEm: new Date(e.tentar).toISOString() });
  }
  return guardadas.sort((a, b) => b.guardadaEm.localeCompare(a.guardadaEm));
}

/** Dias inteiros desde `iso` (0 = menos de 24 h). */
export function diasDesde(iso: string, agora: Date): number {
  return Math.max(0, Math.floor((agora.getTime() - Date.parse(iso)) / DIA_MS));
}

/** Trocas adiadas com "me lembra amanhã": trocaId -> ISO até quando não perguntar. */
export type Adiamentos = Record<string, string>;

/**
 * Guardadas há pelo menos DIAS_PARA_PERGUNTAR dias e não adiadas. A mais antiga primeiro
 * (é a que está esperando há mais tempo).
 */
export function trocasParaPerguntar(
  respostas: RespostaRegistrada[],
  agora: Date,
  adiamentos: Adiamentos = {},
): (TrocaGuardada & { dias: number })[] {
  return trocasGuardadas(respostas)
    .map((g) => ({ ...g, dias: diasDesde(g.guardadaEm, agora) }))
    .filter((g) => g.dias >= DIAS_PARA_PERGUNTAR)
    .filter((g) => {
      const ate = adiamentos[g.trocaId];
      return !ate || Date.parse(ate) <= agora.getTime();
    })
    .sort((a, b) => a.guardadaEm.localeCompare(b.guardadaEm));
}

/** "Me lembra amanhã": volta a perguntar a partir da meia-noite do dia seguinte (hora do aparelho). */
export function adiarAteAmanha(agora: Date): string {
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1).toISOString();
}

/** Tira adiamentos vencidos ou de trocas que já não estão guardadas (o armazenamento não cresce). */
export function limparAdiamentos(adiamentos: Adiamentos, guardadas: string[], agora: Date): Adiamentos {
  const ativas = new Set(guardadas);
  const saida: Adiamentos = {};
  for (const [id, ate] of Object.entries(adiamentos)) {
    if (ativas.has(id) && Date.parse(ate) > agora.getTime()) saida[id] = ate;
  }
  return saida;
}

function hashTexto(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Ideia do dia: a mesma o dia inteiro (determinística pela data `AAAA-MM-DD`) e muda no dia
 * seguinte. Só entre as trocas recebidas (o banco só manda as publicadas). Prefere destinos
 * acessíveis e o que não teve "não rolou" recente, sem excluir: se não houver, usa todas.
 */
export function escolherIdeiaDoDia(trocas: Troca[], data: string): Troca | null {
  if (trocas.length === 0) return null;
  const unicas = semDestinoRepetido([...trocas].sort((a, b) => a.id.localeCompare(b.id)));
  const preferidas = unicas.filter((t) => t.destinoAcessivel && !t.naoRolouRecente);
  const base = preferidas.length > 0 ? preferidas : unicas;
  return base[hashTexto(data) % base.length];
}

/** Próxima carta do baralho, circular. */
export function proximaCarta(indice: number, total: number): number {
  return total <= 0 ? 0 : (indice + 1) % total;
}

// ---- Painel da nutricionista (revisão de conteúdo) -------------------------------------------

/** Contagens agregadas de pessoas (nenhum id sai do banco). */
export type ResumoAvaliacaoTroca = {
  trocaId: string;
  categoria: CategoriaTroca;
  guardaram: number;
  curti: number;
  meio: number;
  naoRolou: number;
  naoTenho: number;
};

/** Abaixo disso a taxa não aparece: com pouca gente, ela engana (e poderia identificar alguém). */
export const MINIMO_PARA_TAXA = 5;

export type TaxasAvaliacao = {
  /** Testou de fato (curti/meio/não rolou) sobre quem guardou. */
  testei: number | null;
  /** Curtiu sobre quem testou de fato. */
  curti: number | null;
  testaram: number;
};

const pct = (parte: number, todo: number, minimo: number) => (todo >= minimo ? Math.round((100 * parte) / todo) : null);

export function taxasAvaliacao(r: Omit<ResumoAvaliacaoTroca, 'trocaId' | 'categoria'>, minimo = MINIMO_PARA_TAXA): TaxasAvaliacao {
  const testaram = r.curti + r.meio + r.naoRolou;
  return { testei: pct(testaram, r.guardaram, minimo), curti: pct(r.curti, testaram, minimo), testaram };
}

export function somarCategoria(linhas: ResumoAvaliacaoTroca[], categoria: CategoriaTroca): Omit<ResumoAvaliacaoTroca, 'trocaId'> {
  const total = { categoria, guardaram: 0, curti: 0, meio: 0, naoRolou: 0, naoTenho: 0 };
  for (const l of linhas) {
    if (l.categoria !== categoria) continue;
    total.guardaram += l.guardaram;
    total.curti += l.curti;
    total.meio += l.meio;
    total.naoRolou += l.naoRolou;
    total.naoTenho += l.naoTenho;
  }
  return total;
}
