// src/features/adolescente/services/alimentacaoService.ts
import { supabase } from '../../../lib/supabase';
import { calcularFeedbackRefeicao, ClassificacaoNova } from '../utils/regraFeedbackRefeicao';

export type TipoRefeicao = 'CAFE_DA_MANHA' | 'LANCHE_MANHA' | 'ALMOCO' | 'LANCHE_TARDE' | 'JANTAR' | 'CEIA';

export type Alimento = {
  id: string;
  nome: string;
  eh_prato_composto: boolean;
  classificacao_nova: ClassificacaoNova;
  acessivel_ebia: boolean;
  grupos_alimentares: string[];
};

export async function criarAlimento(params: {
  nome: string;
  classificacaoNova: ClassificacaoNova;
  grupoAlimentar: string; // categoria escolhida na tela "O que é?"
}): Promise<Alimento> {
  const { data, error } = await supabase
    .from('alimentos')
    .insert({
      nome: params.nome.trim(),
      classificacao_nova: params.classificacaoNova,
      grupos_alimentares: [params.grupoAlimentar],
      eh_prato_composto: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// mesma lógica de "achar ou criar o dia" que já deve existir em aguaService —
// reaproveita a tabela registros_diarios; se você já tiver essa função lá,
// pode importar de lá em vez de duplicar aqui.
async function obterOuCriarRegistroDiarioId(userId: string, dataISO: string): Promise<string> {
  const { data: existente, error: erroSelect } = await supabase
    .from('registros_diarios')
    .select('id')
    .eq('user_id', userId)
    .eq('data', dataISO)
    .maybeSingle();

  if (erroSelect) throw erroSelect;
  if (existente) return existente.id;

  const { data: novo, error: erroInsert } = await supabase
    .from('registros_diarios')
    .insert({ user_id: userId, data: dataISO })
    .select('id')
    .single();

  if (erroInsert) throw erroInsert;
  return novo.id;
}

export async function registrarRefeicao(params: {
  userId: string;
  dataISO: string;
  tipo: TipoRefeicao;
  itens: { alimento: Alimento; quantidade: number }[];
}): Promise<{ refeicaoId: string; nivelQualidade: string; mensagemEducativa: string }> {
  const registroDiarioId = await obterOuCriarRegistroDiarioId(params.userId, params.dataISO);

  const agora = new Date();
  const horario = agora.toTimeString().slice(0, 8); // HH:MM:SS

  const { data: refeicao, error: erroRefeicao } = await supabase
    .from('refeicoes')
    .insert({
      registro_diario_id: registroDiarioId,
      tipo: params.tipo,
      realizada: true,
      horario_registro: horario,
    })
    .select('id')
    .single();

  if (erroRefeicao) throw erroRefeicao;

  const linhas = params.itens.map((item) => ({
    refeicao_id: refeicao.id,
    alimento_id: item.alimento.id,
    quantidade: item.quantidade,
  }));

  const { error: erroItens } = await supabase.from('refeicao_alimentos').insert(linhas);
  if (erroItens) throw erroItens;

  const classificacoes = params.itens.flatMap((item) =>
    Array(item.quantidade).fill(item.alimento.classificacao_nova)
  );
  const feedback = calcularFeedbackRefeicao(classificacoes);

  const { error: erroFeedback } = await supabase.from('feedbacks_nutricionais').insert({
    refeicao_id: refeicao.id,
    mensagem_educativa: feedback.mensagemEducativa,
    nivel_qualidade: feedback.nivelQualidade,
  });
  if (erroFeedback) throw erroFeedback;

  return {
    refeicaoId: refeicao.id,
    nivelQualidade: feedback.nivelQualidade,
    mensagemEducativa: feedback.mensagemEducativa,
  };
}
export async function buscarAlimentos(termo: string): Promise<Alimento[]> {
  if (!termo.trim()) return [];

  const { data, error } = await supabase
    .from('alimentos')
    .select('*')
    .ilike('nome', `%${termo.trim()}%`)
    .order('nome');

  if (error) throw error;
  return data ?? [];
}

export async function listarAlimentosIniciais(): Promise<Alimento[]> {
  const { data, error } = await supabase
    .from('alimentos')
    .select('*')
    .order('nome');

  if (error) throw error;
  return data ?? [];
}