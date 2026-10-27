// Imagens opcionais dos alimentos dos jogos, guardadas no Supabase Storage
// (bucket público "jogos", pasta "alimentos/", um arquivo por id de alimento).
// Sem imagem enviada, o jogo usa o ícone padrão. Falhas aqui nunca quebram o jogo.
import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';

export const BUCKET_JOGOS = 'jogos';
const PASTA = 'alimentos';

export type MapaImagens = Record<string, string>; // id do alimento -> URL pública

let cache: MapaImagens | null = null;

export async function listarImagensJogo(forcar = false): Promise<MapaImagens> {
  if (cache && !forcar) return cache;
  const { data, error } = await supabase.storage.from(BUCKET_JOGOS).list(PASTA, { limit: 200 });
  if (error) throw error;
  const mapa: MapaImagens = {};
  for (const f of data ?? []) {
    if (!f.name || f.name.startsWith('.')) continue;
    const { data: pub } = supabase.storage.from(BUCKET_JOGOS).getPublicUrl(`${PASTA}/${f.name}`);
    // ?v= evita imagem velha no cache depois de trocar o arquivo
    mapa[f.name] = `${pub.publicUrl}?v=${encodeURIComponent(f.updated_at ?? f.created_at ?? '')}`;
  }
  cache = mapa;
  return mapa;
}

export async function enviarImagemJogo(alimentoId: string, uri: string, contentType = 'image/jpeg'): Promise<void> {
  const buffer = await (await fetch(uri)).arrayBuffer();
  const { error } = await supabase.storage
    .from(BUCKET_JOGOS)
    .upload(`${PASTA}/${alimentoId}`, buffer, { contentType, upsert: true, cacheControl: '3600' });
  if (error) throw error;
  cache = null;
}

export async function removerImagemJogo(alimentoId: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_JOGOS).remove([`${PASTA}/${alimentoId}`]);
  if (error) throw error;
  cache = null;
}

export function useImagensJogo(): MapaImagens {
  const [mapa, setMapa] = useState<MapaImagens>(cache ?? {});
  useEffect(() => {
    let ativo = true;
    listarImagensJogo().then((m) => { if (ativo) setMapa(m); }).catch(() => {});
    return () => { ativo = false; };
  }, []);
  return mapa;
}

// ---- Alimentos dos jogos (tabela public.jogo_alimentos) ----
import { ALIMENTOS_NOVA, AlimentoNova } from '../data/alimentosNova';

// Lê do banco; se falhar ou vier vazio (migration não rodou / offline), usa a lista embutida.
export async function listarAlimentosJogo(): Promise<AlimentoNova[]> {
  try {
    const { data, error } = await supabase
      .from('jogo_alimentos')
      .select('id,nome,icone,cor,grupo,dica')
      .eq('ativo', true)
      .order('ordem');
    if (error || !data || data.length < 4) return ALIMENTOS_NOVA;
    return data as AlimentoNova[];
  } catch {
    return ALIMENTOS_NOVA;
  }
}

// ---- Pares nutriente -> alimento (tabela public.jogo_pares_nutriente) ----
import { PARES_NUTRIENTE, ParNutriente } from '../data/paresNutriente';

export async function listarParesNutriente(): Promise<ParNutriente[]> {
  try {
    const { data, error } = await supabase
      .from('jogo_pares_nutriente')
      .select('id,nutriente,nome,icone,cor')
      .eq('ativo', true)
      .order('ordem');
    if (error || !data || data.length < 4) return PARES_NUTRIENTE;
    return data as ParNutriente[];
  } catch {
    return PARES_NUTRIENTE;
  }
}
