// src/features/adolescente/receitas-ingredientes/utils/passosReceita.ts
// Passos do "Cozinhar passo a passo" e tempo de espera de cada passo. Lógica pura, sem React.

export type PassoCozinha = {
  /** título do passo; null quando o passo foi montado a partir do texto corrido do modo de preparo */
  titulo: string | null;
  descricao: string;
  foto_url: string | null;
};

type PassoDoBanco = { titulo: string; descricao: string; foto_url: string | null };

/** Passos cadastrados (receita_passos) viram passos de cozinha; sem nenhum, usa o modo de preparo. */
export function montarPassos(doBanco: PassoDoBanco[], modoPreparo: string): PassoCozinha[] {
  if (doBanco.length > 0) {
    return doBanco.map((p) => ({ titulo: p.titulo || null, descricao: p.descricao, foto_url: p.foto_url }));
  }
  return passosDoTexto(modoPreparo);
}

/**
 * Quebra o modo de preparo em passos: uma linha = um passo; se for um parágrafo só, uma frase = um passo.
 * Evita lookbehind no regex (nem todo motor de JS do celular aceita).
 */
export function passosDoTexto(texto: string | null | undefined): PassoCozinha[] {
  const limpo = (texto ?? '').trim();
  if (!limpo) return [];
  const linhas = limpo
    .split(/\r?\n+/)
    .map((l) => l.replace(/^\s*(?:\d+\s*[.)-]|[-•*])\s*/, '').trim())
    .filter(Boolean);
  const pedacos = linhas.length > 1 ? linhas : (limpo.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [limpo]).map((f) => f.trim()).filter(Boolean);
  return pedacos.map((descricao) => ({ titulo: null, descricao, foto_url: null }));
}

/**
 * Minutos que o passo pede para esperar ("deixe cozinhar por 10 minutos", "de 5 a 8 min" -> 8),
 * ou null se o texto não fala de tempo. Só reconhece minutos (e "1 hora"/"meia hora").
 */
export function minutosDoPasso(texto: string): number | null {
  const t = texto.toLowerCase();
  const faixa = t.match(/(\d+)\s*(?:a|à|-|ou)\s*(\d+)\s*(?:min|minutos?)\b/);
  if (faixa) return Number(faixa[2]);
  const min = t.match(/(\d+)\s*(?:min|minutos?)\b/);
  if (min) return Number(min[1]);
  if (/meia hora/.test(t)) return 30;
  const hora = t.match(/(\d+)\s*horas?\b/);
  if (hora) return Number(hora[1]) * 60;
  if (/\buma hora\b/.test(t)) return 60;
  return null;
}

/** 125 -> "02:05" */
export function formatarRelogio(segundos: number): string {
  const s = Math.max(0, Math.round(segundos));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
