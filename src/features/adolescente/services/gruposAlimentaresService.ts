// src/features/adolescente/services/gruposAlimentaresService.ts
import { supabase } from '../../../lib/supabase';

export type GrupoAlimentarInfo = {
  grupo: string;
  titulo_amigavel: string;
  explicacao: string;
  exemplo: string;
  icone: string;
};

let cache: Record<string, GrupoAlimentarInfo> | null = null;

/** Busca todos os grupos uma vez e guarda em cache local (conteúdo estático, não muda em runtime) */
export async function buscarGruposAlimentaresInfo(): Promise<Record<string, GrupoAlimentarInfo>> {
  if (cache) return cache;

  const { data, error } = await supabase.from('grupos_alimentares_info').select('*');
  if (error) throw error;

  cache = {};
  (data ?? []).forEach((item) => {
    cache![item.grupo] = item;
  });
  return cache;
}