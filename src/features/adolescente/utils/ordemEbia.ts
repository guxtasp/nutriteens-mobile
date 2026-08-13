// src/features/adolescente/utils/ordemEbia.ts
import type { ClassificacaoEbia } from '../../ebia/data/ebiaData';

// Ordem de severidade crescente — mesma ordem usada em `classificarEbia()`
// (ebiaData.ts): quanto mais perguntas "sim", mais severa a insegurança.
//
// Por que isso existe: o filtro de acessibilidade de alimentos
// (alimentacaoService.ts / receitasService.ts) usava `.gte('nivel_maximo_ebia', classificacao)`
// no Supabase, comparando as strings direto no banco. Isso só dá o resultado
// certo se a coluna for um ENUM do Postgres com esta ordem exata declarada —
// se for `text` puro, o Postgres compara alfabeticamente, e a ordem
// alfabética (GRAVE, LEVE, MODERADA, SEGURANCA_ALIMENTAR) NÃO bate com a
// ordem de severidade real (SEGURANCA_ALIMENTAR, LEVE, MODERADA, GRAVE) —
// 'LEVE' vem antes de 'MODERADA' alfabeticamente, então o filtro esconderia
// ou mostraria alimentos errados sem dar nenhum erro visível.
//
// Como não dá pra confirmar hoje se a coluna é enum ou texto, a solução é
// não depender de comparação de intervalo no banco: como o domínio é
// pequeno e fixo (4 valores), resolvemos client-side com uma lista
// explícita de valores aceitáveis e usamos `.in(...)` em vez de `.gte(...)`.
// Funciona igual não importa como a coluna foi criada.
const ORDEM_EBIA: ClassificacaoEbia[] = [
  'SEGURANCA_ALIMENTAR',
  'INSEGURANCA_LEVE',
  'INSEGURANCA_MODERADA',
  'INSEGURANCA_GRAVE',
];

// Um alimento é acessível pro adolescente se `nivel_maximo_ebia` do alimento
// for igual ou mais severo que a classificação dele (ex: um adolescente em
// INSEGURANCA_MODERADA pode ver alimentos cadastrados como aceitáveis pra
// MODERADA ou GRAVE, nunca só os de LEVE/SEGURANCA_ALIMENTAR).
export function valoresEbiaAceitaveis(classificacao: ClassificacaoEbia): ClassificacaoEbia[] {
  const indice = ORDEM_EBIA.indexOf(classificacao);
  // classificação desconhecida (não deveria acontecer, mas por segurança
  // trata como o nível mais severo — mesma decisão já usada em
  // alimentacaoService.ts pro fallback de "ainda não fez a triagem")
  if (indice === -1) return [...ORDEM_EBIA];
  return ORDEM_EBIA.slice(indice);
}

export { ORDEM_EBIA };
