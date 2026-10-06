// src/shared/painel/services/analyticsService.ts
// Analytics agregado (RPC analytics_painel): nenhum id de usuário sai do banco.
import { supabase } from '../../../lib/supabase';
import type { Intervalo } from '../periodo';

export interface PainelAnalytics {
  periodo: { inicio: string; fim: string; dias: number };
  kpis: { usuarios_ativos: number; sessoes: number; eventos: number; cadastros: number };
  serie: {
    dia: string; usuarios: number; sessoes: number; eventos: number;
    desafios_iniciados: number; desafios_concluidos: number;
    trilhas_iniciadas: number; trilhas_concluidas: number; licoes: number; receitas: number;
  }[];
  uso: { recurso: string; eventos: number; usuarios: number }[];
  por_evento: Record<string, number>;
  top_trilhas: { titulo: string; iniciadas: number; concluidas: number }[];
  top_receitas: { titulo: string; visualizadas: number; concluidas: number }[];
  abandono: { tipo: 'licao' | 'receita'; abandonos: number; concluidos: number }[];
  funil_onboarding: { etapa: string; usuarios: number }[];
  funil_uso: { etapa: string; usuarios: number }[];
}

export async function buscarAnalytics({ inicio, fim }: Intervalo): Promise<PainelAnalytics> {
  const { data, error } = await supabase.rpc('analytics_painel', { p_inicio: inicio, p_fim: fim });
  if (error) {
    if (/analytics_painel|schema cache|does not exist/i.test(error.message)) {
      throw new Error('A função analytics_painel ainda não existe no banco. Rode migration_analytics_eventos.sql no SQL Editor.');
    }
    if (error.code === '42501') throw new Error('Seu usuário não tem permissão para ver o Analytics.');
    throw new Error(error.message);
  }
  return data as PainelAnalytics;
}

/** taxa 0–100; null quando não há base */
export function taxaAbandono(abandonos: number, concluidos: number): number | null {
  const base = abandonos + concluidos;
  return base === 0 ? null : Math.round((abandonos / base) * 100);
}
