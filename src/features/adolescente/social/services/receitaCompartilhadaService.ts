// src/features/adolescente/social/services/receitaCompartilhadaService.ts
//
// Camada fina sobre as funções receita_compartilhar* do banco
// (ver data/migration_receita_compartilhada.sql).
import { supabase } from '../../../../lib/supabase';
import type { ReceitaRecebida, ResultadoEnvioReceita } from '../utils/receitaCompartilhada';

export async function compartilharReceita(amizadeId: string, receitaId: string): Promise<ResultadoEnvioReceita> {
  const { data, error } = await supabase.rpc('receita_compartilhar', {
    p_amizade_id: amizadeId,
    p_receita_id: receitaId,
  });
  if (error) throw error;
  return data as ResultadoEnvioReceita;
}

export async function listarReceitasRecebidas(): Promise<ReceitaRecebida[]> {
  const { data, error } = await supabase.rpc('receita_compartilhada_listar');
  if (error) throw error;
  return ((data ?? []) as any[]).map((l) => ({
    id: l.id,
    receitaId: l.receita_id,
    titulo: l.titulo,
    remetente: l.remetente,
  }));
}
