// src/shared/painel/formatadores.ts
export function formatarNumero(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString('pt-BR');
}

/** "2026-10-05" -> "05/10" */
export function diaCurto(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}`;
}

/** Texto relativo curto: "agora", "há 5 min", "há 3 h", "há 2 d", ou data. */
export function tempoRelativo(iso: string, agora: Date = new Date()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const min = Math.max(0, Math.round((agora.getTime() - t) / 60000));
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `há ${d} d`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

/** ISO -> "05/10/2026"; vazio vira "—". */
export function dataCurta(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
}

/** "Nunca acessou" quando não há data; senão texto relativo. */
export function ultimoAcessoTexto(iso: string | null | undefined): string {
  return iso ? tempoRelativo(iso) : 'Nunca acessou';
}
