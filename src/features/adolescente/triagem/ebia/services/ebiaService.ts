// src/features/ebia/services/ebiaService.ts
import { supabase } from '../../../../../lib/supabase';
import { ClassificacaoEbia, PERGUNTAS_EBIA } from '../data/ebiaData';

// Função para salvar o resultado da triagem EBIA no banco de dados
export async function salvarResultadoEbia(
  userId: string,
  respostas: boolean[],
  pontuacao: number,
  classificacao: ClassificacaoEbia
) {
  await supabase
    .from('avaliacoes_ebia') // Atualiza a avaliação EBIA existente
    .update({ pontuacao_total: pontuacao, classificacao }) // Atualiza a pontuação total e a classificação
    .eq('user_id', userId); // Atualiza a avaliação EBIA do usuário específico

  await supabase.from('respostas_ebia').insert( // Insere as respostas da triagem EBIA no banco de dados
    respostas.map((resposta, i) => ({ // Cria um objeto para cada resposta, associando o ID do usuário, o ID da pergunta e a resposta
      user_id: userId,
      pergunta_id: PERGUNTAS_EBIA[i].id,
      resposta,
    }))
  );
}

// Função para concluir o onboarding do usuário, atualizando a etapa_onboarding no banco de dados
export async function concluirOnboarding(userId: string) {
  await supabase
    .from('profiles') // Atualiza o perfil do usuário
    .update({ etapa_onboarding: 'CONCLUIDO' }) // Define a etapa_onboarding como 'CONCLUIDO'
    .eq('id', userId);
}