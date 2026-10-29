// src/features/conteudo/utils/blocosReceita.ts
// Lógica PURA do editor de receita em blocos e da prévia ao vivo: o RASCUNHO (o que está na tela,
// ainda sem salvar) vira os dados que a ficha do adolescente mostra. Campo incompleto nunca quebra
// a prévia: aparece com um texto de aviso.
import { LIMITES_RECEITA, ordenarIngredientes, urlValida, type IngredienteEdicao, type PassoReceitaEdicao, type ReceitaEmEdicao } from './receitaEdicao';
import { COR_CATEGORIA } from './blocos';

/** Cores dos blocos da receita: ingredientes em verde, passos em laranja. */
export const COR_RECEITA = { ingrediente: COR_CATEGORIA.pergunta, passo: COR_CATEGORIA.semNota } as const;

const ROTULO_DIFICULDADE: Record<string, string> = { FACIL: 'Fácil', MEDIO: 'Médio', DIFICIL: 'Difícil' };
const TAMANHO_RESUMO = 80;

const txt = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export const passoIncompleto = (p: PassoReceitaEdicao): boolean => txt(p.titulo) === '' || txt(p.descricao) === '';
export const ingredienteIncompleto = (i: IngredienteEdicao): boolean => !i.alimentoId || txt(i.quantidade) === '';

/** Linha única do bloco recolhido. */
export function resumoDoPasso(p: PassoReceitaEdicao): string {
  const base = txt(p.titulo) || txt(p.descricao).replace(/\s+/g, ' ');
  if (!base) return '(vazio)';
  return base.length > TAMANHO_RESUMO ? `${base.slice(0, TAMANHO_RESUMO - 1)}…` : base;
}

export type PassoAoVivo = { titulo: string; descricao: string; fotoUrl: string | null; incompleto: boolean };

export type FichaAoVivo = {
  titulo: string;
  fotoUrl: string | null;
  tempoMin: number | null;
  porcoes: number;
  dificuldade: string;
  modo: string;
  /** "2 xícaras de arroz", em ordem alfabética pelo nome (como o app mostra) */
  ingredientes: { texto: string; incompleto: boolean }[];
  passos: PassoAoVivo[];
};

const inteiro = (v: string, min: number, max: number): number | null =>
  /^\d+$/.test(txt(v)) && Number(v) >= min && Number(v) <= max ? Number(v) : null;

export function paraFichaAoVivo(r: ReceitaEmEdicao): FichaAoVivo {
  const L = LIMITES_RECEITA;
  return {
    titulo: txt(r.titulo) || 'Sem título',
    fotoUrl: urlValida(r.fotoUrl) ? txt(r.fotoUrl) : null,
    tempoMin: inteiro(r.tempo, L.tempo.min, L.tempo.max),
    porcoes: inteiro(r.porcoes, L.porcoes.min, L.porcoes.max) ?? 1,
    dificuldade: ROTULO_DIFICULDADE[r.dificuldade] ?? 'Fácil',
    modo: txt(r.modo),
    ingredientes: ordenarIngredientes(r.ingredientes.map((i) => ({ ...i, nome: i.nome || 'alimento' }))).map((i) => ({
      texto: `${txt(i.quantidade) || '…'} de ${i.nome.toLowerCase()}`,
      incompleto: ingredienteIncompleto(i),
    })),
    passos: r.passos.map((p) => ({
      titulo: txt(p.titulo) || '(sem título)',
      descricao: txt(p.descricao) || '(sem descrição)',
      fotoUrl: urlValida(p.fotoUrl) ? txt(p.fotoUrl) : null,
      incompleto: passoIncompleto(p),
    })),
  };
}
