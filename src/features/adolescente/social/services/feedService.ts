// src/features/adolescente/social/services/feedService.ts
//
// Camada fina sobre as funções do feed no banco (ver
// data/migration_social_feed.sql). As tabelas do feed são fechadas: tudo passa
// por `supabase.rpc`, e o banco filtra por quem está logado.
import { supabase } from '../../../../lib/supabase';
import { registrarEvento } from '../../../../shared/analytics/analytics';
import { mapearEventosFeed, type EventoFeed, type LinhaFeed, type Reacao } from '../utils/feed';

export type StatusReacao = 'ok' | 'removida' | 'invalida' | 'indisponivel' | 'limite';

/** Eventos dos amigos aceitos (e meus), dos últimos 14 dias, do mais novo para o mais antigo. */
export async function buscarFeed(limite = 50): Promise<EventoFeed[]> {
  const { data, error } = await supabase.rpc('social_feed', { p_limite: limite });
  if (error) throw error;
  return mapearEventosFeed((data ?? []) as LinhaFeed[]);
}

/** null = ainda não perguntamos; true = compartilha; false = recusou. */
export async function buscarFeedVisivel(): Promise<boolean | null> {
  const { data, error } = await supabase.rpc('social_feed_visivel');
  if (error) throw error;
  const linha = (data as { visivel: boolean | null }[] | null)?.[0];
  return linha?.visivel ?? null;
}

/** Desligar apaga os eventos já publicados. Ligar exige apelido. */
export async function definirFeedVisivel(visivel: boolean): Promise<'ok' | 'sem_apelido'> {
  const { data, error } = await supabase.rpc('social_definir_feed_visivel', { p_visivel: visivel });
  if (error) throw error;
  return data === 'sem_apelido' ? 'sem_apelido' : 'ok';
}

/** Mesma reação de novo remove; outra reação troca. */
export async function reagirAoEvento(eventoId: string, reacao: Reacao): Promise<StatusReacao> {
  const { data, error } = await supabase.rpc('social_reagir', { p_evento_id: eventoId, p_reacao: reacao });
  if (error) throw error;
  if (data === 'ok') registrarEvento('reacao_enviada');
  return data as StatusReacao;
}

/** amizadeId -> manteve a sequência hoje (anel na faixa de amigos). */
export async function buscarAmigosHoje(): Promise<Record<string, boolean>> {
  const { data, error } = await supabase.rpc('social_amigos_hoje');
  if (error) throw error;
  const mapa: Record<string, boolean> = {};
  for (const l of (data ?? []) as { amizade_id: string; manteve_hoje: boolean | null }[]) {
    mapa[l.amizade_id] = l.manteve_hoje === true;
  }
  return mapa;
}
