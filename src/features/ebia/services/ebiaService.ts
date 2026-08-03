// src/features/ebia/services/ebiaService.ts
import { supabase } from '../../../lib/supabase';
import { ClassificacaoEbia, PERGUNTAS_EBIA } from '../data/ebiaData';

export async function salvarResultadoEbia(
  userId: string,
  respostas: boolean[],
  pontuacao: number,
  classificacao: ClassificacaoEbia
) {
  await supabase
    .from('avaliacoes_ebia')
    .update({ pontuacao_total: pontuacao, classificacao })
    .eq('user_id', userId);

  await supabase.from('respostas_ebia').insert(
    respostas.map((resposta, i) => ({
      user_id: userId,
      pergunta_id: PERGUNTAS_EBIA[i].id,
      resposta,
    }))
  );
}

export async function concluirOnboarding(userId: string) {
  await supabase
    .from('profiles')
    .update({ etapa_onboarding: 'CONCLUIDO' })
    .eq('id', userId);
}