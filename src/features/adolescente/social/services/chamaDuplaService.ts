// src/features/adolescente/social/services/chamaDuplaService.ts
//
// Camada fina sobre as funções chama_dupla_* do banco (ver
// data/migration_chama_dupla.sql). O app não escreve direto na tabela.
import { supabase } from '../../../../lib/supabase';
import {
  ChamaDupla,
  LinhaChamaDupla,
  ResultadoConvite,
  mapearChamaDupla,
} from '../utils/chamaDupla';

export async function listarChamasDupla(): Promise<ChamaDupla[]> {
  const { data, error } = await supabase.rpc('chama_dupla_listar');
  if (error) {
    console.error('Erro ao listar Chama em Dupla:', error.message);
    throw error;
  }
  return ((data ?? []) as LinhaChamaDupla[]).map(mapearChamaDupla);
}

export async function convidarParaChamaDupla(amizadeId: string): Promise<ResultadoConvite> {
  const { data, error } = await supabase.rpc('chama_dupla_convidar', { p_amizade_id: amizadeId });
  if (error) {
    console.error('Erro ao convidar para Chama em Dupla:', error.message);
    throw error;
  }
  return data as ResultadoConvite;
}

export async function responderConviteChamaDupla(id: string, aceitar: boolean): Promise<boolean> {
  const { data, error } = await supabase.rpc('chama_dupla_responder', { p_id: id, p_aceitar: aceitar });
  if (error) throw error;
  return data === true;
}

/** Cancela convite enviado ou sai da dupla. */
export async function encerrarChamaDupla(id: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('chama_dupla_encerrar', { p_id: id });
  if (error) throw error;
  return data === true;
}

export async function marcarAvisoChamaVisto(id: string): Promise<void> {
  const { error } = await supabase.rpc('chama_dupla_aviso_visto', { p_id: id });
  if (error) console.error('Erro ao marcar aviso como visto:', error.message);
}

/** Chamada quando o dia de hoje contou para a sequência individual. Idempotente. */
export async function registrarDiaChamaDupla(): Promise<void> {
  const { error } = await supabase.rpc('chama_dupla_registrar_hoje');
  if (error) console.error('Erro ao registrar dia da Chama em Dupla:', error.message);
}
