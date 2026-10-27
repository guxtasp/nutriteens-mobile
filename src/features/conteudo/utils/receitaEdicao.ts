// src/features/conteudo/utils/receitaEdicao.ts
// Regras do editor de receita (lógica pura): validação, payload para o banco e detecção de mudança.
// O banco valida de novo (conteudo_salvar_receita, migration_receita_atomica.sql).

export const DIFICULDADES = [
  { chave: 'FACIL', label: 'Fácil' },
  { chave: 'MEDIO', label: 'Médio' },
  { chave: 'DIFICIL', label: 'Difícil' },
] as const;

export const LIMITES_RECEITA = {
  titulo: { min: 3, max: 120 },
  modo: { min: 10, max: 4000 },
  tempo: { min: 1, max: 1440 },
  porcoes: { min: 1, max: 99 },
  ingredientes: 40,
  quantidade: 60,
  passos: 30,
  passoTitulo: 80,
  passoDescricao: 1500,
  url: 500,
} as const;

export type IngredienteEdicao = { alimentoId: string; nome: string; quantidade: string };
export type PassoReceitaEdicao = { titulo: string; descricao: string; fotoUrl: string };

export type ReceitaEmEdicao = {
  titulo: string;
  modo: string;
  tempo: string;
  porcoes: string;
  dificuldade: string;
  fotoUrl: string;
  ingredientes: IngredienteEdicao[];
  passos: PassoReceitaEdicao[];
};

const txt = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export function urlValida(v: string): boolean {
  const t = v.trim();
  return /^https?:\/\/\S+$/i.test(t) && t.length <= LIMITES_RECEITA.url;
}

function inteiroEntre(v: string, min: number, max: number): boolean {
  return /^\d+$/.test(v.trim()) && Number(v) >= min && Number(v) <= max;
}

export function validarReceita(r: ReceitaEmEdicao, ctx: { criando: boolean; pratoId?: string | null }): string[] {
  const erros: string[] = [];
  const L = LIMITES_RECEITA;
  if (ctx.criando && !ctx.pratoId) erros.push('Escolha o prato que esta receita produz.');
  const titulo = txt(r.titulo);
  if (titulo.length < L.titulo.min) erros.push(`Dê um título com pelo menos ${L.titulo.min} letras.`);
  if (titulo.length > L.titulo.max) erros.push(`O título passa de ${L.titulo.max} letras.`);
  const modo = txt(r.modo);
  if (modo.length < L.modo.min) erros.push('Escreva o modo de preparo (resumo, mínimo de 10 letras).');
  if (modo.length > L.modo.max) erros.push(`O modo de preparo passa de ${L.modo.max} letras.`);
  if (txt(r.tempo) !== '' && !inteiroEntre(r.tempo, L.tempo.min, L.tempo.max)) erros.push(`O tempo vai de ${L.tempo.min} a ${L.tempo.max} minutos.`);
  if (txt(r.porcoes) !== '' && !inteiroEntre(r.porcoes, L.porcoes.min, L.porcoes.max)) erros.push(`As porções vão de ${L.porcoes.min} a ${L.porcoes.max}.`);
  if (!DIFICULDADES.some((d) => d.chave === r.dificuldade)) erros.push('Escolha a dificuldade.');
  if (txt(r.fotoUrl) !== '' && !urlValida(r.fotoUrl)) erros.push('O link da foto deve começar com http:// ou https://.');

  if (r.ingredientes.length > L.ingredientes) erros.push(`No máximo ${L.ingredientes} ingredientes.`);
  const vistos = new Set<string>();
  r.ingredientes.forEach((i, k) => {
    const n = k + 1;
    if (!i.alimentoId) erros.push(`Ingrediente ${n}: escolha o alimento.`);
    if (txt(i.quantidade) === '') erros.push(`Ingrediente ${n}${i.nome ? ` (${i.nome})` : ''}: informe a quantidade.`);
    else if (txt(i.quantidade).length > L.quantidade) erros.push(`Ingrediente ${n}: a quantidade passa de ${L.quantidade} letras.`);
    if (i.alimentoId && vistos.has(i.alimentoId)) erros.push(`Ingrediente ${n}${i.nome ? ` (${i.nome})` : ''}: já está na lista.`);
    vistos.add(i.alimentoId);
  });

  if (r.passos.length > L.passos) erros.push(`No máximo ${L.passos} passos.`);
  r.passos.forEach((p, k) => {
    const n = k + 1;
    if (txt(p.titulo) === '' || txt(p.descricao) === '') erros.push(`Passo ${n}: precisa de título e descrição (ou remova o passo).`);
    if (txt(p.titulo).length > L.passoTitulo) erros.push(`Passo ${n}: o título passa de ${L.passoTitulo} letras.`);
    if (txt(p.descricao).length > L.passoDescricao) erros.push(`Passo ${n}: a descrição passa de ${L.passoDescricao} letras.`);
    if (txt(p.fotoUrl) !== '' && !urlValida(p.fotoUrl)) erros.push(`Passo ${n}: o link da foto deve começar com http:// ou https://.`);
  });
  return erros;
}

export type ReceitaPayload = {
  receita: { titulo: string; modo_preparo: string; tempo_preparo_min: number | null; porcoes: number | null; dificuldade: string; foto_url: string | null };
  ingredientes: { alimento_id: string; quantidade_texto: string }[];
  passos: { titulo: string; descricao: string; foto_url: string | null }[];
};

export function paraPayloadReceita(r: ReceitaEmEdicao): ReceitaPayload {
  const num = (v: string) => (txt(v) === '' ? null : Number(v));
  return {
    receita: {
      titulo: txt(r.titulo),
      modo_preparo: txt(r.modo),
      tempo_preparo_min: num(r.tempo),
      porcoes: num(r.porcoes),
      dificuldade: r.dificuldade,
      foto_url: txt(r.fotoUrl) || null,
    },
    // a ordem não é gravada (receita_ingredientes não tem coluna de ordem): mostra-se em ordem alfabética
    ingredientes: r.ingredientes.map((i) => ({ alimento_id: i.alimentoId, quantidade_texto: txt(i.quantidade) })),
    passos: r.passos.map((p) => ({ titulo: txt(p.titulo), descricao: txt(p.descricao), foto_url: txt(p.fotoUrl) || null })),
  };
}

/** Igual antes e depois = nada mudou (não chama o banco, não sobe versão). Ingredientes comparados sem ordem. */
export function assinaturaReceita(r: ReceitaEmEdicao): string {
  const p = paraPayloadReceita(r);
  return JSON.stringify({ ...p, ingredientes: [...p.ingredientes].sort((a, b) => a.alimento_id.localeCompare(b.alimento_id)) });
}

export function ordenarIngredientes<T extends { nome: string }>(lista: T[]): T[] {
  return [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export function moverPasso<T>(lista: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= lista.length) return lista;
  const nova = [...lista];
  [nova[i], nova[j]] = [nova[j], nova[i]];
  return nova;
}
