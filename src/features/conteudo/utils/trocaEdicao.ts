// src/features/conteudo/utils/trocaEdicao.ts
// Regras puras do formulário de alternativa (troca). Sem I/O, para testar.
export const MAX_FRASE = 240;
export const MIN_FRASE = 20;
export const MAX_DICA = 220;

export type DadosNovaTroca = {
  categoria: string | null;
  destinoId: string | null;
  origemId: string | null;
  frase: string;
  dica: string;
};

/** Mensagem do primeiro problema encontrado, ou null se o formulário está válido. */
export function validarTroca(d: Pick<DadosNovaTroca, 'frase' | 'dica'>): string | null {
  const frase = d.frase.trim();
  if (frase.length < MIN_FRASE) return `Escreva o que o adolescente ganha com a alternativa (pelo menos ${MIN_FRASE} letras).`;
  if (frase.length > MAX_FRASE) return `A justificativa passou de ${MAX_FRASE} caracteres.`;
  if (d.dica.trim().length > MAX_DICA) return `A dica passou de ${MAX_DICA} caracteres.`;
  return null;
}

export function validarNovaTroca(d: DadosNovaTroca): string | null {
  if (!d.categoria) return 'Escolha a categoria da alternativa.';
  if (!d.destinoId) return 'Escolha o alimento que entra no lugar (a alternativa).';
  if (d.origemId && d.origemId === d.destinoId) return 'O alimento de origem e o da alternativa não podem ser o mesmo.';
  return validarTroca(d);
}

/** Traduz o erro do banco (unique categoria+origem+destino) para uma frase de equipe. */
export function mensagemErroTroca(e: any): string {
  const msg: string = e?.message ?? '';
  if (e?.code === '23505' || /duplicate key|unique/i.test(msg)) return 'Já existe uma alternativa com esta categoria, origem e alimento. Edite a existente.';
  if (e?.code === '42501' || /row-level security/i.test(msg)) return 'Seu perfil não pode criar alternativas.';
  return msg || 'Não foi possível salvar.';
}
