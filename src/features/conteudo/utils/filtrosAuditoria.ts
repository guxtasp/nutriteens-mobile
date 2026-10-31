// src/features/conteudo/utils/filtrosAuditoria.ts
// Filtros e agrupamento da Auditoria. Funções puras.
export type PeriodoAuditoria = 'TUDO' | 'HOJE' | '7D' | '30D';

export type FiltrosAuditoria = { acao: string; autor: string; periodo: PeriodoAuditoria; busca: string };
export const FILTROS_AUDITORIA_VAZIOS: FiltrosAuditoria = { acao: 'TODAS', autor: 'TODOS', periodo: 'TUDO', busca: '' };

type RegMinimo = { acao: string; atorNome: string | null; titulo: string | null; motivo: string | null; criadoEm: string };

export const SEM_ATOR = 'Sistema';
export const nomeAtor = (r: { atorNome: string | null }) => r.atorNome?.trim() || SEM_ATOR;

const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Chave do dia no fuso do aparelho (AAAA-MM-DD). */
export function chaveDia(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function rotuloDia(chave: string, agora: Date = new Date()): string {
  const [a, m, d] = chave.split('-').map(Number);
  const dia = new Date(a, m - 1, d);
  const base = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const diff = Math.round((base.getTime() - dia.getTime()) / 86400000);
  const data = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${a}`;
  if (diff === 0) return `Hoje · ${data}`;
  if (diff === 1) return `Ontem · ${data}`;
  return data;
}

function inicioDoPeriodo(p: PeriodoAuditoria, agora: Date): number | null {
  if (p === 'TUDO') return null;
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  if (p === '7D') inicio.setDate(inicio.getDate() - 6);
  if (p === '30D') inicio.setDate(inicio.getDate() - 29);
  return inicio.getTime();
}

export function filtrarAuditoria<T extends RegMinimo>(lista: T[], f: FiltrosAuditoria, agora: Date = new Date()): T[] {
  const termo = norm(f.busca);
  const desde = inicioDoPeriodo(f.periodo, agora);
  return lista.filter((r) => {
    if (f.acao !== 'TODAS' && r.acao !== f.acao) return false;
    if (f.autor !== 'TODOS' && nomeAtor(r) !== f.autor) return false;
    if (desde !== null && Date.parse(r.criadoEm) < desde) return false;
    if (termo && !norm(`${r.titulo ?? ''} ${r.motivo ?? ''}`).includes(termo)) return false;
    return true;
  });
}

/** Agrupa por dia, do mais recente para o mais antigo (a ordem interna da lista é mantida). */
export function agruparPorDia<T extends { criadoEm: string }>(lista: T[]): { dia: string; itens: T[] }[] {
  const mapa = new Map<string, T[]>();
  for (const r of lista) {
    const k = chaveDia(r.criadoEm);
    (mapa.get(k) ?? mapa.set(k, []).get(k)!).push(r);
  }
  return Array.from(mapa.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([dia, itens]) => ({ dia, itens }));
}

export const valoresUnicos = (xs: string[]) => Array.from(new Set(xs)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
