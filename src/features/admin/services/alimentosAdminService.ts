import { supabase } from '../../../lib/supabase';

export type ClassificacaoNova = 'IN_NATURA' | 'INGREDIENTE_CULINARIO' | 'PROCESSADO' | 'ULTRAPROCESSADO';
export type GrupoAlimentar =
  | 'CEREAIS_E_TUBERCULOS' | 'LEGUMES_E_VERDURAS' | 'FRUTAS' | 'LEITE_E_DERIVADOS'
  | 'CARNES_E_OVOS' | 'LEGUMINOSAS' | 'OLEAGINOSAS_E_SEMENTES' | 'OLEOS_E_GORDURAS'
  | 'ACUCARES_E_DOCES' | 'BEBIDAS';

export interface Alimento {
  id: string;
  nome: string;
  eh_prato_composto: boolean;
  classificacao_nova: ClassificacaoNova;
  acessivel_ebia: boolean;
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
  const { error } = await supabase.from('alimentos').insert(alimento);
  if (error) throw error;
}

export async function atualizarAlimento(id: string, alimento: Omit<Alimento, 'id'>) {
  const { error } = await supabase.from('alimentos').update(alimento).eq('id', id);
  if (error) throw error;
}

export async function excluirAlimento(id: string) {
  const { error } = await supabase.from('alimentos').delete().eq('id', id);
  if (error) throw error;
}