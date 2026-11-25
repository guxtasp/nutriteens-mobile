// src/features/adolescente/vitaminas/data/perguntasNutriente.ts
//
// Dados do "Teste rápido" de vitaminas e minerais (HANDOFF_REBRAND, fase 4.3). As perguntas são
// montadas em utils/testeRapido.ts a partir destes dados e de nutrientesInfo.ts.
//
// A fonte "certa" de cada nutriente foi tirada da própria `dica` de nutrientesInfo.ts (o app não
// afirma nada novo). As outras opções são itens com quase nenhum micronutriente; o retorno do
// "Quase!" nunca fala mal delas: só aponta a fonte certa.
//
// ⚠️ PENDENTE DE REVISÃO DA NUTRICIONISTA (fontes e opções).
import type { NutrienteChave } from '../../alimentacao/utils/nutrientesPorGrupo';

/** Liga/desliga o teste rápido inteiro (cartão no detalhe + tela). */
export const TESTE_RAPIDO_ATIVO = true;

/** Só os 13 micronutrientes (proteína e fibra não têm página). */
export type ChaveMicronutriente = Exclude<NutrienteChave, 'proteina' | 'fibra'>;

/** A vitamina D vem principalmente do sol, como diz a própria dica: a opção certa reflete isso. */
export const FONTE_CERTA: Record<ChaveMicronutriente, string> = {
  vitamina_a: 'Cenoura',
  vitamina_c: 'Laranja',
  vitamina_d: 'Pegar sol (com cuidado)',
  tiamina: 'Feijão',
  riboflavina: 'Leite',
  niacina: 'Amendoim',
  piridoxina: 'Banana',
  calcio: 'Iogurte',
  ferro: 'Feijão',
  magnesio: 'Castanhas',
  fosforo: 'Ovo',
  potassio: 'Banana',
  zinco: 'Carne',
};

/** Itens com quase nenhuma vitamina ou mineral (mesmos para todos os nutrientes). */
export const OUTRAS_OPCOES_FONTE = ['Açúcar', 'Água', 'Óleo de cozinha'] as const;

/** Opções da pergunta "vitamina ou mineral?". */
export const OPCOES_TIPO = ['Vitamina', 'Mineral', 'Proteína', 'Fibra'] as const;

export const TITULO_ACERTO = 'Isso aí!';
export const TITULO_QUASE = 'Quase!';
export const APOIO_TESTE = 'Toque numa opção. Não vale nota, é só pra lembrar.';
