// src/features/adolescente/social/services/moderacaoService.ts
// Situação de moderação da própria conta (restrição ativa e aviso ainda não visto).
// Dados vêm de social_minha_situacao / social_aviso_visto (migration_painel_moderacao_acoes.sql).
import { supabase } from '../../../../lib/supabase';
import { mapearSituacao, type SituacaoModeracao } from '../utils/moderacao';

export async function buscarSituacaoModeracao(): Promise<SituacaoModeracao> {
  const { data, error } = await supabase.rpc('social_minha_situacao');
  if (error) throw error;
  return mapearSituacao(data);
}

export async function marcarAvisoVisto(id: string): Promise<void> {
  const { error } = await supabase.rpc('social_aviso_visto', { p_id: id });
  if (error) throw error;
}
