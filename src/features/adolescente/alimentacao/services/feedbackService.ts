// src/features/adolescente/services/feedbackService.ts
import { supabase } from '../../../../lib/supabase';
import { gerarFeedbackRefeicao, ItemRefeicaoFeedback, FeedbackRefeicao } from '../utils/regraFeedbackRefeicao';
import type { ClassificacaoEbia } from '../../triagem/ebia/data/ebiaData';
// a lógica de "qual nutriente está em falta na semana" mora só em nutrienteService.ts —
// aqui só consome, pra não ter duas cópias divergindo (era o bug: essa cópia continuava
// usando vitamina_d, que nunca tem dado vindo da TACO, e ficava sempre "em falta")
import { detectarLacunaNutriente } from './nutrienteService';

let cacheEbia: { userId: string; valor: ClassificacaoEbia } | null = null;

async function obterClassificacaoEbia(userId: string): Promise<ClassificacaoEbia> {
  if (cacheEbia?.userId === userId) return cacheEbia.valor;
  const { data, error } = await supabase.from('profiles').select('classificacao_ebia_atual').eq('id', userId).single();
  const valor: ClassificacaoEbia = !error && data?.classificacao_ebia_atual ? data.classificacao_ebia_atual : 'INSEGURANCA_GRAVE';
  cacheEbia = { userId, valor };
  return valor;
}

export async function gerarEPersistirFeedback(params: {
  userId: string;
  refeicaoId: string;
  itens: ItemRefeicaoFeedback[];
}): Promise<FeedbackRefeicao> {
  const [classificacaoEbia, lacunaNutrienteSemana] = await Promise.all([
    obterClassificacaoEbia(params.userId),
    detectarLacunaNutriente(params.userId),
  ]);

  // classificacaoEbia entra só como modificador de TOM dentro de
  // gerarFeedbackRefeicao (evitarCobranca) — nunca é exposta como um bloco
  // pro adolescente, mantendo a decisão de produto já tomada antes (EBIA
  // não vira "resultado" visível na UI dele).
  const feedback = gerarFeedbackRefeicao({
    itens: params.itens,
    classificacaoEbia,
    lacunaNutrienteSemana,
  });

  // mensagem_educativa é NOT NULL no schema (public.feedbacks_nutricionais) —
  // preenchendo com um resumo derivado das dimensões (bug antigo: ficava vazia
  // e o insert quebrava em silêncio, travando o botão "Registrar").
  //
  // feedback_deficiencia: reaproveita a coluna já existente pra guardar o texto
  // da missão de nutriente (antes guardava o texto de EBIA, que não deveria
  // ter sido exposto como avaliação — ver regraFeedbackRefeicao.ts). Fica null
  // quando não há missão essa semana.
  const { error } = await supabase.from('feedbacks_nutricionais').insert({
    refeicao_id: params.refeicaoId,
    mensagem_educativa: `${feedback.processamento} ${feedback.melhoria}`,
    nivel_qualidade: feedback.nivelQualidade,
    dimensao_principal: feedback.dimensaoPrincipal,
    feedback_processamento: feedback.processamento,
    feedback_nutricional: feedback.nutricional,
    // string vazia em vez de null: não sei se essa coluna também é NOT NULL
    // no seu schema (foi o mesmo tipo de bug que quebrou mensagem_educativa) —
    // se ela aceitar null tranquilamente, pode trocar por `?? null`.
    feedback_deficiencia: feedback.missao?.texto ?? '',
    feedback_melhoria: feedback.melhoria,
  });
  if (error) throw error;

  return feedback;
}
