import { supabase } from '../../../lib/supabase';

export type ClassificacaoNova = 'IN_NATURA' | 'INGREDIENTE_CULINARIO' | 'PROCESSADO' | 'ULTRAPROCESSADO';
export type GrupoAlimentar =
  | 'CEREAIS_E_TUBERCULOS' | 'LEGUMES_E_VERDURAS' | 'FRUTAS' | 'LEITE_E_DERIVADOS'
  | 'CARNES_E_OVOS' | 'LEGUMINOSAS' | 'OLEAGINOSAS_E_SEMENTES' | 'OLEOS_E_GORDURAS'
  | 'ACUCARES_E_DOCES' | 'BEBIDAS';

export type ClassificacaoEbia = 'SEGURANCA_ALIMENTAR' | 'INSEGURANCA_LEVE' | 'INSEGURANCA_MODERADA' | 'INSEGURANCA_GRAVE';

export interface Alimento {
  id: string;
  nome: string;
  eh_prato_composto: boolean;
  classificacao_nova: ClassificacaoNova;
  acessivel_ebia: boolean;
  // até qual severidade de insegurança alimentar o item continua aparecendo
  // pro adolescente na busca — uso interno, nunca exposto no app dele
  nivel_maximo_ebia: ClassificacaoEbia;
  grupos_alimentares: GrupoAlimentar[];
}

export async function listarAlimentos(): Promise<Alimento[]> {
  const { data, error } = await supabase.from('alimentos').select('*').order('nome');
  if (error) {
    console.error('Erro ao listar alimentos:', error.message);
    return [];
  }
  return data ?? [];
}

export async function criarAlimento(alimento: Omit<Alimento, 'id'>) {
  const { data, error } = await supabase.from('alimentos').insert(alimento).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarAlimento(id: string, alimento: Omit<Alimento, 'id'>) {
  const { error } = await supabase.from('alimentos').update(alimento).eq('id', id);
  if (error) throw error;
}

export async function excluirAlimento(id: string) {
  const { error } = await supabase.from('alimentos').delete().eq('id', id);
  if (error) throw error;
}

export type IngredientePrato = {
  ingrediente_id: string;
  proporcao: number;
  nome?: string; // preenchido ao buscar, pra exibir na lista
};

export async function buscarIngredientesDoPrato(pratoId: string): Promise<IngredientePrato[]> {
  const { data, error } = await supabase
    .from('prato_ingredientes')
    .select('ingrediente_id, proporcao, alimentos!prato_ingredientes_ingrediente_id_fkey(nome)')
    .eq('prato_id', pratoId);

  if (error) throw error;
  return (data ?? []).map((linha: any) => ({
    ingrediente_id: linha.ingrediente_id,
    proporcao: linha.proporcao,
    nome: linha.alimentos?.nome,
  }));
}

export async function salvarIngredientesDoPrato(
  pratoId: string,
  ingredientes: { ingrediente_id: string; proporcao: number }[]
): Promise<void> {
  const { error } = await supabase.rpc('substituir_ingredientes_prato', {
    p_prato_id: pratoId,
    p_ingredientes: ingredientes,
  });
  if (error) throw error;
}

export async function buscarAlimentosParaSelecao(termo: string): Promise<Alimento[]> {
  if (!termo.trim()) return [];
  const { data, error } = await supabase
    .from('alimentos')
    .select('*')
    .ilike('nome', `%${termo.trim()}%`)
    .order('nome')
    .limit(15);
  if (error) throw error;
  return data ?? [];
}

// ---- Receitas ----
export type Receita = {
  id: string;
  alimento_resultante_id: string;
  titulo: string;
  modo_preparo: string;
  tempo_preparo_min: number | null;
  porcoes: number;
  dificuldade: 'FACIL' | 'MEDIO' | 'DIFICIL';
  foto_url: string | null;
};

export async function buscarReceitaDoAlimento(alimentoId: string): Promise<Receita | null> {
  const { data, error } = await supabase
    .from('receitas')
    .select('*')
    .eq('alimento_resultante_id', alimentoId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function salvarReceita(params: {
  id?: string;
  alimentoResultanteId: string;
  titulo: string;
  modoPreparo: string;
  tempoPreparoMin: number | null;
  porcoes: number;
  dificuldade: 'FACIL' | 'MEDIO' | 'DIFICIL';
  fotoUrl?: string | null;
}): Promise<string> {
  const payload = {
    alimento_resultante_id: params.alimentoResultanteId,
    titulo: params.titulo,
    modo_preparo: params.modoPreparo,
    tempo_preparo_min: params.tempoPreparoMin,
    porcoes: params.porcoes,
    dificuldade: params.dificuldade,
    foto_url: params.fotoUrl ?? null,
  };

  if (params.id) {
    const { error } = await supabase.from('receitas').update(payload).eq('id', params.id);
    if (error) throw error;
    return params.id;
  }
  const { data, error } = await supabase.from('receitas').insert(payload).select('id').single();
  if (error) throw error;
  return data.id;
}

// ---- Passos da receita (guia dinâmico, tipo GuiaAtividadeSheet) ----
export type PassoReceita = {
  id?: string;
  ordem: number;
  titulo: string;
  descricao: string;
  foto_url: string | null;
};

export async function listarPassosDaReceita(receitaId: string): Promise<PassoReceita[]> {
  const { data, error } = await supabase
    .from('receita_passos')
    .select('*')
    .eq('receita_id', receitaId)
    .order('ordem');
  if (error) throw error;
  return data ?? [];
}

export async function salvarPassosDaReceita(
  receitaId: string,
  passos: { ordem: number; titulo: string; descricao: string; foto_url?: string | null }[]
): Promise<void> {
  const { error } = await supabase.rpc('substituir_passos_receita', {
    p_receita_id: receitaId,
    p_passos: passos.map((p) => ({ ...p, foto_url: p.foto_url ?? null })),
  });
  if (error) throw error;
}