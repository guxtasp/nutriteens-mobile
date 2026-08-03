import { supabase } from '../../../lib/supabase';

export interface AlimentoCatalogo {
  id: string;
  nome: string;
}

// Busca do catálogo compartilhado só os alimentos cujo nome está na lista
// definida em alimentosPorRefeicao.ts para aquele tipo de refeição.
export async function buscarAlimentosPorNomes(nomes: string[]): Promise<AlimentoCatalogo[]> {
  const { data, error } = await supabase
    .from('alimentos')
    .select('id, nome')
    .in('nome', nomes);

  if (error || !data) return [];
  return data;
}

// Como o Recordatório agora é a primeira etapa da triagem (antes vinha depois
// da EBIA), é ele quem abre a avaliação nutricional "em aberto" do usuário —
// não existe mais a garantia de que ela já foi criada antes.
export async function obterOuCriarAvaliacaoNutricional(userId: string): Promise<string> {
  const { data: existente } = await supabase
    .from('avaliacoes_nutricionais')
    .select('id')
    .eq('user_id', userId)
    .eq('concluida', false)
    .maybeSingle();

  if (existente) return existente.id as string;

  const { data: nova, error } = await supabase
    .from('avaliacoes_nutricionais')
    .insert({ user_id: userId })
    .select('id')
    .single();

  if (error || !nova) throw error;
  return nova.id as string;
}

// Cria (ou recupera, se já existir) o recordatório de hoje/data de referência
// vinculado à avaliação nutricional em aberto do usuário.
export async function obterOuCriarRecordatorio(avaliacaoNutricionalId: string, dataReferencia: string) {
  const { data: existente } = await supabase
    .from('recordatorios_alimentares')
    .select('id')
    .eq('avaliacao_nutricional_id', avaliacaoNutricionalId)
    .eq('data_referencia', dataReferencia)
    .maybeSingle();

  if (existente) return existente.id as string;

  const { data: novo, error } = await supabase
    .from('recordatorios_alimentares')
    .insert({ avaliacao_nutricional_id: avaliacaoNutricionalId, data_referencia: dataReferencia })
    .select('id')
    .single();

  if (error || !novo) throw error;
  return novo.id as string;
}

// Salva a refeição e os alimentos marcados nela. Se a refeição para aquele
// recordatorio+tipo já existir, evita duplicar (upsert manual em 2 passos,
// já que refeicoes não tem UNIQUE(recordatorio_id, tipo) hoje).
export async function salvarRefeicao(
  recordatorioId: string,
  tipoRefeicao: string,
  alimentoIds: string[],
  realizada: boolean
) {
  const { data: existente } = await supabase
    .from('refeicoes')
    .select('id')
    .eq('recordatorio_id', recordatorioId)
    .eq('tipo', tipoRefeicao)
    .maybeSingle();

  const refeicaoId =
    existente?.id ??
    (
      await supabase
        .from('refeicoes')
        .insert({ recordatorio_id: recordatorioId, tipo: tipoRefeicao, realizada })
        .select('id')
        .single()
    ).data?.id;

  if (!refeicaoId) return;

  // limpa seleção anterior (caso o usuário volte e edite) e regrava
  await supabase.from('refeicao_alimentos').delete().eq('refeicao_id', refeicaoId);

  if (alimentoIds.length > 0) {
    await supabase.from('refeicao_alimentos').insert(
      alimentoIds.map((alimentoId) => ({ refeicao_id: refeicaoId, alimento_id: alimentoId }))
    );
  }
}

export async function marcarRecordatorioConcluido(recordatorioId: string) {
  await supabase.from('recordatorios_alimentares').update({ concluido: true }).eq('id', recordatorioId);
}