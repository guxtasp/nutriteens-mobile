// src/shared/painel/utils/csv.ts
// Monta o texto de um CSV. Sem dependências de React Native (testável no jest).
export type Separador = ';' | ',';

// Texto que começa com = + - @ vira fórmula quando o CSV é aberto no Excel/Sheets
// ("injeção de fórmula"). Nomes de alimentos podem ser digitados por usuários, então
// qualquer TEXTO assim ganha um apóstrofo na frente. Números (tipo number) não são tocados.
const PERIGOSO = /^[=+\-@\t\r]/;

export function celulaCsv(valor: unknown, sep: Separador): string {
  if (valor === null || valor === undefined) return '';
  let t = typeof valor === 'number' || typeof valor === 'boolean' ? String(valor) : String(valor);
  if (typeof valor === 'string' && PERIGOSO.test(t)) t = `'${t}`;
  if (t.includes(sep) || t.includes('"') || t.includes('\n') || t.includes('\r')) {
    return `"${t.replace(/"/g, '""')}"`;
  }
  return t;
}

export function linhaCsv(valores: unknown[], sep: Separador): string {
  return valores.map((v) => celulaCsv(v, sep)).join(sep);
}

/** Cabeçalho + linhas, separadas por CRLF (padrão RFC 4180). */
export function montarCsv(colunas: string[], linhas: Record<string, unknown>[], sep: Separador = ';'): string {
  const corpo = linhas.map((l) => linhaCsv(colunas.map((c) => l[c]), sep));
  return [linhaCsv(colunas, sep), ...corpo].join('\r\n') + '\r\n';
}
