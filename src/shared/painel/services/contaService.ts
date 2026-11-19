// src/shared/painel/services/contaService.ts
//
// Dados da própria conta de quem usa o painel (a tela de Configurações lia o
// Supabase direto). O RLS de profiles já limita a leitura à própria linha.
import { supabase } from '../../../lib/supabase';

export async function buscarNomeDaConta(usuarioId: string): Promise<string | null> {
  const { data, error } = await supabase.from('profiles').select('nome').eq('id', usuarioId).single();
  if (error) throw error;
  return (data?.nome as string | null) ?? null;
}
