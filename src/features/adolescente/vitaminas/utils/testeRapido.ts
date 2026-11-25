// src/features/adolescente/vitaminas/utils/testeRapido.ts
//
// Regras puras da lista de vitaminas (abas) e do "Teste rápido" (3 perguntas por nutriente,
// sem nota). As perguntas usam só os textos que o app já tem (nutrientesInfo + perguntasNutriente).
import { NUTRIENTES_INFO, type NutrienteInfo } from '../data/nutrientesInfo';
import {
  FONTE_CERTA,
  OPCOES_TIPO,
  OUTRAS_OPCOES_FONTE,
  type ChaveMicronutriente,
} from '../data/perguntasNutriente';

export type AbaNutrientes = 'TODOS' | 'VITAMINA' | 'MINERAL';

export function filtrarNutrientes(lista: NutrienteInfo[], aba: AbaNutrientes): NutrienteInfo[] {
  return aba === 'TODOS' ? lista : lista.filter((n) => n.tipo === aba);
}

/** "Vitamina A" -> "vitamina A"; "Cálcio" -> "cálcio" (para usar no meio da frase). */
export function nomeEmFrase(nome: string): string {
  return nome.charAt(0).toLowerCase() + nome.slice(1);
}

/** "da vitamina A" / "do ferro". */
export function deNutriente(n: Pick<NutrienteInfo, 'nome' | 'tipo'>): string {
  return `${n.tipo === 'VITAMINA' ? 'da' : 'do'} ${nomeEmFrase(n.nome)}`;
}

export type PerguntaTeste = {
  id: string;
  enunciado: string;
  opcoes: string[];
  certa: string;
  /** Mostrado depois de responder (acerto ou não). */
  explicacao: string;
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/** Embaralha sempre do mesmo jeito para a mesma semente (teste estável e previsível). */
export function embaralhar<T>(itens: readonly T[], semente: string): T[] {
  const copia = [...itens];
  let h = hash(semente);
  for (let i = copia.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** As 3 perguntas do teste de um nutriente; null se a chave não tiver página. */
export function perguntasDoNutriente(chave: string, lista: NutrienteInfo[] = NUTRIENTES_INFO): PerguntaTeste[] | null {
  const n = lista.find((x) => x.chave === chave);
  const fonte = FONTE_CERTA[chave as ChaveMicronutriente];
  if (!n || !fonte) return null;
  const de = deNutriente(n);

  // 1. superpoder: as outras opções são superpoderes de outros nutrientes (sem repetir texto)
  const outrosPoderes = embaralhar(
    [...new Set(lista.filter((x) => x.chave !== n.chave && x.superpoder !== n.superpoder).map((x) => x.superpoder))],
    `${n.chave}:poderes`,
  ).slice(0, 3);
  const superpoder: PerguntaTeste = {
    id: `${n.chave}:superpoder`,
    enunciado: `Qual é o superpoder ${de}?`,
    opcoes: embaralhar([n.superpoder, ...outrosPoderes], `${n.chave}:1`),
    certa: n.superpoder,
    explicacao: `O superpoder ${de} é: ${n.superpoder}.`,
  };

  // 2. onde encontrar (a fonte certa vem da própria dica do nutriente)
  const ondeEncontrar: PerguntaTeste = {
    id: `${n.chave}:fonte`,
    enunciado: n.chave === 'vitamina_d' ? `O que ajuda o corpo a ter vitamina D?` : `Qual desses é uma boa fonte ${de}?`,
    opcoes: embaralhar([fonte, ...OUTRAS_OPCOES_FONTE], `${n.chave}:2`),
    certa: fonte,
    explicacao: n.dica,
  };

  // 3. vitamina ou mineral
  const certaTipo = n.tipo === 'VITAMINA' ? 'Vitamina' : 'Mineral';
  const tipo: PerguntaTeste = {
    id: `${n.chave}:tipo`,
    enunciado: `${n.nome} é o quê?`,
    opcoes: embaralhar([...OPCOES_TIPO], `${n.chave}:3`),
    certa: certaTipo,
    explicacao: `${n.nome} é ${n.tipo === 'VITAMINA' ? 'uma vitamina' : 'um mineral'}.`,
  };

  return [superpoder, ondeEncontrar, tipo];
}

export type EstadoOpcao = 'neutra' | 'certa' | 'escolhidaOutra';

/**
 * Como pintar cada opção depois da resposta: a certa sempre fica verde e a escolhida (se não era
 * a certa) fica amarela. Nunca "errado".
 */
export function estadoDaOpcao(opcao: string, certa: string, escolhida: string | null): EstadoOpcao {
  if (escolhida === null) return 'neutra';
  if (opcao === certa) return 'certa';
  if (opcao === escolhida) return 'escolhidaOutra';
  return 'neutra';
}
