// src/shared/painel/periodo.ts
// Intervalo de datas do Analytics (7/30/90 dias ou personalizado, dias civis locais).
export type Intervalo = { inicio: string; fim: string }; // "YYYY-MM-DD"

const p2 = (n: number) => String(n).padStart(2, '0');
export const paraISO = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

export function ultimosDias(dias: number, hoje: Date = new Date()): Intervalo {
  const ini = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (dias - 1));
  return { inicio: paraISO(ini), fim: paraISO(hoje) };
}

/** "05/10/2026" -> "2026-10-05"; null se inválida (inclui 31/02). */
export function parseDataBR(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!m) return null;
  const [d, mes, a] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(a, mes - 1, d);
  if (dt.getFullYear() !== a || dt.getMonth() !== mes - 1 || dt.getDate() !== d) return null;
  return `${a}-${p2(mes)}-${p2(d)}`;
}

/** Máscara enquanto digita: "05102026" -> "05/10/2026". */
export function mascaraDataBR(texto: string): string {
  const n = texto.replace(/\D/g, '').slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
}

export function validarIntervalo(inicio: string | null, fim: string | null, hoje: Date = new Date()): string | null {
  if (!inicio || !fim) return 'Use o formato DD/MM/AAAA.';
  if (fim < inicio) return 'A data final precisa ser depois da inicial.';
  if (fim > paraISO(hoje)) return 'A data final não pode ser no futuro.';
  const dias = (new Date(fim).getTime() - new Date(inicio).getTime()) / 86400000;
  if (dias > 365) return 'O período máximo é de 365 dias.';
  return null;
}
