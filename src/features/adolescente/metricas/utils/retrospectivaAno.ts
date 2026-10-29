// src/features/adolescente/metricas/utils/retrospectivaAno.ts
//
// "Seu ano com o Bróxis" (fase 3 da ideia 8): janela de contagem e totais brutos. A montagem
// dos slides fica em retrospectivaSlides.ts. Lógica pura (sem React nem Supabase), testável.

export type TotaisAno = {
  refeicoes: number;
  licoes: number;
  atividades: number;
  insignias: number;
};

export type JanelaAno = {
  /** AAAA-MM-DD, primeiro dia contado */
  inicio: string;
  /** AAAA-MM-DD, hoje */
  fim: string;
  /** true quando a janela cobre (quase) um ano inteiro de uso */
  anoCompleto: boolean;
};

const FORMATO = /^(\d{4})-(\d{2})-(\d{2})/;
const MS_DIA = 24 * 60 * 60 * 1000;
const DIAS_PARA_ANO_COMPLETO = 360;

function partes(iso: string): { a: number; m: number; d: number } | null {
  const x = FORMATO.exec(iso);
  return x ? { a: Number(x[1]), m: Number(x[2]), d: Number(x[3]) } : null;
}

const doisDigitos = (n: number) => String(n).padStart(2, '0');
const utc = (a: number, m: number, d: number) => Math.round(Date.UTC(a, m - 1, d) / MS_DIA);

/**
 * Janela de contagem: do mesmo dia do ano passado até hoje, mas nunca antes da criação da
 * conta (quem usa o app há 3 meses recebe "a jornada até aqui", não um "ano" inflado).
 * 29/02 vira 28/02 no ano anterior não bissexto. Datas inválidas → null.
 */
export function janelaDoAno(hojeISO: string, criadaEmISO?: string | null): JanelaAno | null {
  const h = partes(hojeISO);
  if (!h) return null;

  const base = new Date(Date.UTC(h.a - 1, h.m - 1, h.d));
  // 29/02 sem equivalente no ano anterior "rola" para 01/03: volta para 28/02
  const rolou = base.getUTCMonth() !== h.m - 1;
  const inicioAnoPassado = rolou
    ? `${h.a - 1}-02-28`
    : `${base.getUTCFullYear()}-${doisDigitos(base.getUTCMonth() + 1)}-${doisDigitos(base.getUTCDate())}`;

  const c = criadaEmISO ? partes(criadaEmISO) : null;
  const criada = c ? `${c.a}-${doisDigitos(c.m)}-${doisDigitos(c.d)}` : null;
  const inicio = criada && criada > inicioAnoPassado ? criada : inicioAnoPassado;
  if (inicio > hojeISO) return null;

  const i = partes(inicio)!;
  const dias = utc(h.a, h.m, h.d) - utc(i.a, i.m, i.d);
  return { inicio, fim: hojeISO, anoCompleto: dias >= DIAS_PARA_ANO_COMPLETO };
}
