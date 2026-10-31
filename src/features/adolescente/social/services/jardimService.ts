// src/features/adolescente/social/services/jardimService.ts
// Camada fina sobre as funções jardim_* (data/migration_social_jardim.sql).
import { supabase } from '../../../../lib/supabase';
import { existeRegistroNoDia } from '../../home/services/sequenciaService';
import { mapearJardins, type Jardim, type ResultadoConviteJardim, type TemaJardim } from '../utils/jardim';

export async function listarJardins(): Promise<Jardim[]> {
  const { data, error } = await supabase.rpc('jardim_listar');
  if (error) throw error;
  return mapearJardins(data);
}

export async function criarJardim(tema: TemaJardim): Promise<string> {
  const { data, error } = await supabase.rpc('jardim_criar', { p_tema: tema });
  if (error) throw error;
  return data as string;
}

export async function convidarParaJardim(jardimId: string, amizadeId: string): Promise<ResultadoConviteJardim> {
  const { data, error } = await supabase.rpc('jardim_convidar', { p_jardim: jardimId, p_amizade_id: amizadeId });
  if (error) throw error;
  return data as ResultadoConviteJardim;
}

export async function responderConviteJardim(jardimId: string, aceitar: boolean): Promise<boolean> {
  const { data, error } = await supabase.rpc('jardim_responder', { p_jardim: jardimId, p_aceitar: aceitar });
  if (error) throw error;
  return data === true;
}

export async function sairDoJardim(jardimId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('jardim_sair', { p_jardim: jardimId });
  if (error) throw error;
  return data === true;
}

/** Chamada quando o dia de hoje contou para a sequência. Idempotente; falha em silêncio. */
export async function regarJardinsHoje(): Promise<void> {
  const { error } = await supabase.rpc('jardim_regar_hoje');
  if (error) console.error('Erro ao regar o jardim:', error.message);
}

/**
 * Ao abrir o Jardim: se você já registrou algo HOJE (refeição, água ou atividade) mas o jardim ainda não
 * recebeu a regadinha (ex.: você registrou antes de criar o jardim, ou a Home ainda não foi aberta),
 * rega agora. Devolve true se hoje contou. Idempotente e silencioso em caso de erro.
 */
export async function regarJardinsSeHojeContou(userId: string, hojeISO: string): Promise<boolean> {
  try {
    const contou = await existeRegistroNoDia(userId, hojeISO);
    if (!contou) return false;
    const { error } = await supabase.rpc('jardim_regar_hoje');
    if (error) { console.error('Erro ao regar o jardim:', error.message); return false; }
    return true;
  } catch (e) {
    console.error('Erro ao conferir o dia para regar:', e);
    return false;
  }
}
