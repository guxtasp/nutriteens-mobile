// src/shared/utils/dataNascimento.ts
//
// Conversões entre o texto "DD/MM/AAAA" do campo e o Date do seletor nativo do celular.
const ANOS_PARA_TRAS = 100;
const IDADE_INICIAL = 14; // adolescentes: o seletor abre por volta dessa idade quando o campo está vazio

export function formatarDataBR(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** "DD/MM/AAAA" -> Date, ou null se estiver incompleta/inválida. */
export function lerDataBR(texto: string): Date | null {
  const m = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const dia = +m[1];
  const mes = +m[2] - 1;
  const ano = +m[3];
  const d = new Date(ano, mes, dia);
  if (d.getFullYear() !== ano || d.getMonth() !== mes || d.getDate() !== dia) return null;
  return d;
}

/** Data em que o seletor abre: a já digitada (se válida e não futura) ou ~14 anos atrás. */
export function dataInicialDoSeletor(texto: string, hoje: Date = new Date()): Date {
  const digitada = lerDataBR(texto);
  if (digitada && digitada <= hoje) return digitada;
  return new Date(hoje.getFullYear() - IDADE_INICIAL, 0, 1);
}

export function limitesDoSeletor(hoje: Date = new Date()): { minimo: Date; maximo: Date } {
  return { minimo: new Date(hoje.getFullYear() - ANOS_PARA_TRAS, 0, 1), maximo: hoje };
}
