// src/features/adolescente/social/services/cartinhaService.ts
//
// Camada fina sobre as funções cartinha_* do banco (data/migration_social_cartinhas.sql).
import { supabase } from '../../../../lib/supabase';
import {
  mapearCaixa,
  mapearEnviadasHoje,
  mapearJuntos,
  mapearRepetidas,
  normalizarResultadoEnvio,
  normalizarResultadoPresente,
  type AmigoJuntos,
  type CaixaCartinhas,
  type Repetidas,
  type ResultadoPresente,
  type ResultadoEnvioCartinha,
  type ResumoEnviadasHoje,
  type TipoCartinha,
} from '../utils/cartinhas';

export async function enviarCartinha(amizadeId: string, tipo: TipoCartinha): Promise<ResultadoEnvioCartinha> {
  const { data, error } = await supabase.rpc('cartinha_enviar', { p_amizade_id: amizadeId, p_tipo: tipo });
  if (error) throw error;
  return normalizarResultadoEnvio(data);
}

export async function buscarCaixaCartinhas(): Promise<CaixaCartinhas> {
  const { data, error } = await supabase.rpc('cartinha_caixa');
  if (error) throw error;
  return mapearCaixa(data);
}

export async function buscarEnviadasHoje(): Promise<ResumoEnviadasHoje> {
  const { data, error } = await supabase.rpc('cartinha_enviadas_hoje');
  if (error) throw error;
  return mapearEnviadasHoje(data);
}

/** Some com o aviso de "novas". Falha em silêncio: é só enfeite. */
export async function marcarCartinhasVistas(): Promise<void> {
  const { error } = await supabase.rpc('cartinha_marcar_vistas');
  if (error) console.warn('Erro ao marcar cartinhas como vistas:', error.message);
}

export async function definirAceitaLembretes(aceita: boolean): Promise<boolean> {
  const { data, error } = await supabase.rpc('cartinha_definir_lembretes', { p_aceita: aceita });
  if (error) throw error;
  return data !== false;
}

/** Amigos com quem você fez junto hoje (os dois mantiveram a sequência). */
export async function buscarJuntosHoje(): Promise<AmigoJuntos[]> {
  const { data, error } = await supabase.rpc('cartinha_juntos_hoje');
  if (error) throw error;
  return mapearJuntos(data);
}

export async function buscarRepetidas(): Promise<Repetidas> {
  const { data, error } = await supabase.rpc('cartinha_repetidas');
  if (error) throw error;
  return mapearRepetidas(data);
}

export async function presentearCartinha(amizadeId: string, tipo: TipoCartinha): Promise<ResultadoPresente> {
  const { data, error } = await supabase.rpc('cartinha_presentear', { p_amizade_id: amizadeId, p_tipo: tipo });
  if (error) throw error;
  return normalizarResultadoPresente(data);
}
