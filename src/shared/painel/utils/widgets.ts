// src/shared/painel/utils/widgets.ts
// Contas dos widgets do dashboard. Funções puras (testáveis no jest): tudo é
// calculado a partir dos números que a RPC painel_dashboard já devolve.

export const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const;

export function somar(valores: number[]): number {
  return valores.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
}

/**
 * Variação (%) da segunda metade do período em relação à primeira.
 * null quando há poucos dias ou quando a primeira metade é zero e a segunda não
 * (percentual sem sentido).
 */
export function tendenciaPct(valores: number[]): number | null {
  if (valores.length < 4) return null;
  const meio = Math.floor(valores.length / 2);
  const antes = somar(valores.slice(0, meio));
  const depois = somar(valores.slice(valores.length - meio));
  if (antes === 0) return depois === 0 ? 0 : null;
  return Math.round(((depois - antes) / antes) * 1000) / 10;
}

/** "+12%", "−8%", "0%" */
export function formatarVariacao(pct: number): string {
  if (pct === 0) return '0%';
  const n = Math.abs(pct).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  return `${pct > 0 ? '+' : '−'}${n}%`;
}

/** 0 = segunda ... 6 = domingo, a partir de "YYYY-MM-DD" (sem depender do fuso). */
export function indiceDiaSemana(iso: string): number | null {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!a || !m || !d) return null;
  const dia = new Date(Date.UTC(a, m - 1, d)).getUTCDay(); // 0 = domingo
  return (dia + 6) % 7;
}

/** Média de `valores` por dia da semana (Seg..Dom). Dia da semana sem nenhuma data no período vale 0. */
export function mediaPorDiaSemana(dias: string[], valores: number[]): number[] {
  const soma = new Array<number>(7).fill(0);
  const qtd = new Array<number>(7).fill(0);
  dias.forEach((iso, i) => {
    const idx = indiceDiaSemana(iso);
    if (idx === null) return;
    soma[idx] += valores[i] ?? 0;
    qtd[idx] += 1;
  });
  return soma.map((s, i) => (qtd[i] === 0 ? 0 : Math.round((s / qtd[i]) * 10) / 10));
}

/** parte/total em %, de 0 a 100. null quando o total é zero. */
export function taxaPercentual(parte: number, total: number): number | null {
  if (!(total > 0)) return null;
  return Math.max(0, Math.min(100, Math.round((parte / total) * 100)));
}

export function saudacao(hora: number): string {
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

export type TrilhaConclusao = { titulo: string; iniciadas: number; concluidas: number; pct: number | null };

/** Trilhas com % de conclusão (concluídas ÷ iniciadas). Mais iniciadas primeiro. */
export function conclusaoPorTrilha(trilhas: { titulo: string; iniciadas: number; concluidas: number }[]): TrilhaConclusao[] {
  return trilhas
    .map((t) => ({ ...t, pct: taxaPercentual(t.concluidas, t.iniciadas) }))
    .sort((a, b) => b.iniciadas - a.iniciadas || a.titulo.localeCompare(b.titulo, 'pt-BR'));
}
