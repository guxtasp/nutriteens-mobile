// src/features/adolescente/triagem/ebia/services/ebiaService.ts
//
// Fecha a triagem. Ordem pensada pra poder TENTAR DE NOVO sem duplicar nada
// se algum passo falhar no meio (o adolescente fica na tela e toca de novo):
//   1. salvarResultadoEbia      — avaliacoes_ebia (upsert), respostas_ebia
//                                  (só insere se ainda não existem) e
//                                  profiles.classificacao_ebia_atual
//   2. concluirOnboarding       — etapa_onboarding = 'CONCLUIDO'
//   3. fecharAvaliacaoNutricional — por ÚLTIMO: depois de fechada, a próxima
//                                  chamada abriria uma avaliação nova e vazia
// Todas lançam erro em vez de engolir — o chamador mostra a mensagem.
import { supabase } from '../../../../../lib/supabase';
import type { ClassificacaoEbia } from '../data/ebiaData';
import { montarRespostasEbia } from '../utils/montarRespostas';
// a avaliação nutricional "em aberto" é aberta pelo Recordatório (1ª etapa da
// triagem); a EBIA se pendura na mesma, em vez de criar outra
import { obterOuCriarAvaliacaoNutricional } from '../../recordatorio/services/recordatorioService';
import { registrarEvento } from '../../../../../shared/analytics/analytics';

// Devolve o id da avaliação nutricional usada, pra fecharAvaliacaoNutricional.
export async function salvarResultadoEbia(
  userId: string,
  respostas: boolean[],
  pontuacao: number,
  classificacao: ClassificacaoEbia
): Promise<string> {
  const avaliacaoNutricionalId = await obterOuCriarAvaliacaoNutricional(userId);

  // avaliacao_nutricional_id é UNIQUE em avaliacoes_ebia → upsert idempotente
  const { data: ebia, error: erroEbia } = await supabase
    .from('avaliacoes_ebia')
    .upsert(
      {
        avaliacao_nutricional_id: avaliacaoNutricionalId,
        pontuacao_total: pontuacao,
        classificacao,
        concluido: true,
      },
      { onConflict: 'avaliacao_nutricional_id' }
    )
    .select('id')
    .single();
  if (erroEbia || !ebia) throw erroEbia ?? new Error('avaliacoes_ebia não retornou o id');

  // as 5 respostas entram num único INSERT (atômico): se já existem, uma
  // tentativa anterior chegou até aqui e não precisa repetir
  const { count, error: erroContagem } = await supabase
    .from('respostas_ebia')
    .select('id', { count: 'exact', head: true })
    .eq('avaliacao_ebia_id', ebia.id);
  if (erroContagem) throw erroContagem;

  if (!count) {
    const { error: erroRespostas } = await supabase
      .from('respostas_ebia')
      .insert(montarRespostasEbia(ebia.id as string, respostas));
    if (erroRespostas) throw erroRespostas;
  }

  // é daqui que o feedback das refeições e o filtro de alimentos/receitas leem
  const { error: erroPerfil } = await supabase
    .from('profiles')
    .update({ classificacao_ebia_atual: classificacao })
    .eq('id', userId);
  if (erroPerfil) throw erroPerfil;

  return avaliacaoNutricionalId;
}

export async function concluirOnboarding(userId: string) {
  const { error } = await supabase.from('profiles').update({ etapa_onboarding: 'CONCLUIDO' }).eq('id', userId);
  if (error) throw error;
  registrarEvento('onboarding_concluido', undefined, { userId });
}

// periodo_tempo fica de fora de propósito: é um enum cujos valores o app não
// conhece — definir o que cada um significa é decisão de produto.
export async function fecharAvaliacaoNutricional(avaliacaoNutricionalId: string) {
  const { error } = await supabase
    .from('avaliacoes_nutricionais')
    .update({ concluida: true, atualizado_em: new Date().toISOString() })
    .eq('id', avaliacaoNutricionalId);
  if (error) throw error;
  registrarEvento('triagem_concluida');
}
