// src/features/adolescente/atividade-fisica/utils/filtrosAtividade.ts
// Filtro e ordem do catálogo de atividades. O catálogo (tabela `atividades`) só
// tem nome e duração padrão, então o filtro é por duração.

export type FaixaDuracao = 'ATE_20' | 'DE_21_A_40' | 'MAIS_40';
export type OrdemAtividade = 'NOME' | 'MAIS_CURTAS' | 'MAIS_LONGAS';

export const FAIXAS_DURACAO: { chave: FaixaDuracao; label: string }[] = [
  { chave: 'ATE_20', label: 'Até 20 min' },
  { chave: 'DE_21_A_40', label: '21 a 40 min' },
  { chave: 'MAIS_40', label: 'Mais de 40 min' },
];

export const ORDENS_ATIVIDADE: { chave: OrdemAtividade; label: string }[] = [
  { chave: 'NOME', label: 'A–Z' },
  { chave: 'MAIS_CURTAS', label: 'Mais curtas' },
  { chave: 'MAIS_LONGAS', label: 'Mais longas' },
];

export type FiltroAtividade = { faixa: FaixaDuracao | null; ordem: OrdemAtividade };

export const FILTRO_ATIVIDADE_VAZIO: FiltroAtividade = { faixa: null, ordem: 'NOME' };

export function naFaixa(minutos: number, faixa: FaixaDuracao): boolean {
  if (faixa === 'ATE_20') return minutos <= 20;
  if (faixa === 'DE_21_A_40') return minutos > 20 && minutos <= 40;
  return minutos > 40;
}

export function filtrarEOrdenarAtividades<T extends { nome: string; duracao_padrao_min: number }>(
  lista: T[],
  filtro: FiltroAtividade
): T[] {
  const filtradas = filtro.faixa ? lista.filter((a) => naFaixa(a.duracao_padrao_min, filtro.faixa!)) : [...lista];
  const porNome = (a: T, b: T) => a.nome.localeCompare(b.nome, 'pt-BR');
  if (filtro.ordem === 'MAIS_CURTAS') return filtradas.sort((a, b) => a.duracao_padrao_min - b.duracao_padrao_min || porNome(a, b));
  if (filtro.ordem === 'MAIS_LONGAS') return filtradas.sort((a, b) => b.duracao_padrao_min - a.duracao_padrao_min || porNome(a, b));
  return filtradas.sort(porNome);
}

export function filtroAtividadeAtivo(f: FiltroAtividade): boolean {
  return f.faixa !== null || f.ordem !== 'NOME';
}
