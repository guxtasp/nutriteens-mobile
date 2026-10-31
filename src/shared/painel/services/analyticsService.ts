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

// ---------- eficácia (retenção e hábitos, só agregados) ----------

export interface EficaciaAnalytics {
  retencao: { dia: number; elegiveis: number; retidos: number }[];
  habitos: { inicio: string; pessoas: number; dias_com_registro_medio: number | null; pct_ultraprocessados: number | null; pct_in_natura: number | null }[];
  sem_registro_7d: number;
  minimo_pessoas: number;
}

export async function buscarEficacia({ inicio, fim }: Intervalo): Promise<EficaciaAnalytics> {
  const { data, error } = await supabase.rpc('analytics_eficacia', { p_inicio: inicio, p_fim: fim });
  if (error) {
    if (/analytics_eficacia|schema cache|does not exist/i.test(error.message)) {
      throw new Error('A função analytics_eficacia ainda não existe no banco. Rode migration_painel_evolucao.sql no SQL Editor.');
    }
    throw new Error(error.message);
  }
  return data as EficaciaAnalytics;
}

/** Retenção em % (0–100); null quando ninguém é elegível ainda (a coorte é nova demais). */
export function taxaRetencao(retidos: number, elegiveis: number): number | null {
  return elegiveis > 0 ? Math.round((100 * retidos) / elegiveis) : null;
}

// ---------- hábitos mais registrados e engajamento por escola (só agregados) ----------

export interface HabitosEscolaAnalytics {
  /** pessoas/registros vêm null quando o hábito teve de 1 a 4 pessoas (poucos dados) */
  habitos: { chave: string; rotulo: string; pessoas: number | null; registros: number | null }[];
  por_tipo_escola: (GrupoEngajamento & { tipo: string })[];
  por_escola: (GrupoEngajamento & { escola: string })[];
  minimo_pessoas: number;
}

export interface GrupoEngajamento {
  cadastrados: number;
  ativos: number | null;
  pct_ativos: number | null;
  dias_com_registro_medio: number | null;
}

export async function buscarHabitosEscola({ inicio, fim }: Intervalo): Promise<HabitosEscolaAnalytics> {
  const { data, error } = await supabase.rpc('analytics_habitos_escola', { p_inicio: inicio, p_fim: fim });
  if (error) {
    if (/analytics_habitos_escola|schema cache|does not exist/i.test(error.message)) {
      throw new Error('A função analytics_habitos_escola ainda não existe no banco. Rode migration_painel_analytics_extra.sql no SQL Editor.');
    }
    throw new Error(error.message);
  }
  return data as HabitosEscolaAnalytics;
}

const ROTULO_TIPO_ESCOLA: Record<string, string> = {
  PUBLICA: 'Pública',
  PRIVADA: 'Privada',
  FILANTROPICA: 'Filantrópica',
  NAO_INFORMADO: 'Não informado',
};

export function rotuloTipoEscola(tipo: string): string {
  return ROTULO_TIPO_ESCOLA[tipo] ?? tipo;
}
