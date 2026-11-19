// src/shared/painel/services/jornadaService.ts
//
// Uso progressivo do app (migration_analytics_jornada.sql):
//  - analytics_jornada: agregado (Admin e Nutricionista); nenhum id sai do banco.
//  - painel_participante_jornada: de UM adolescente, só dados de USO (sem alimentação nem saúde).
import { supabase } from '../../../lib/supabase';
import type { Intervalo } from '../periodo';

export type Recurso = 'registro' | 'trilha' | 'desafio' | 'receita' | 'social' | 'scanner' | 'trocas';

export type SemanaEstagios = { inicio: string; novos: number; frequentes: number; ocasionais: number; pausa: number; inativos: number };
export type Coorte = { semana: string; tamanho: number; retencao: (number | null)[] };
export type AdocaoRecurso = { recurso: Recurso; pontos: { semana: number; elegiveis: number; pct: number | null }[] };
export type CelulaHorario = { dia: number; faixa: number; pessoas: number | null; eventos: number | null };

export interface AnalyticsJornada {
  semanas: number;
  estagios: SemanaEstagios[];
  coortes: Coorte[];
  adocao: AdocaoRecurso[];
  horarios: CelulaHorario[];
  pessoas_periodo: number;
  progresso_trilhas: { faixa: string; pessoas: number }[];
  total_adolescentes: number;
  minimo_pessoas: number;
}

export type DiaCalendario = { data: string; acoes: number; registro: boolean; licoes: number; antes_do_cadastro: boolean };
export type UsoRecurso = { recurso: Recurso; dias: number; dias_12_semanas: number; primeiro: string | null; ultimo: string | null };
export type ChaveMarco = 'cadastro' | 'onboarding' | 'triagem' | 'primeiro_registro' | 'primeira_licao' | 'primeiro_desafio' | 'primeira_trilha' | 'primeira_amizade';

export interface JornadaParticipante {
  inicio: string;
  cadastro: string;
  calendario: DiaCalendario[];
  recursos: UsoRecurso[];
  marcos: { chave: ChaveMarco; data: string | null }[];
  periodos: { madrugada: number; manha: number; tarde: number; noite: number };
}

function erroMigration(nome: string, e: { message: string; code?: string }): Error {
  if (new RegExp(`${nome}|schema cache|does not exist`, 'i').test(e.message)) {
    return new Error(`A função ${nome} ainda não existe no banco. Rode migration_analytics_jornada.sql no SQL Editor.`);
  }
  if (e.code === '42501') return new Error('Seu perfil não tem permissão para ver estes dados.');
  return new Error(e.message);
}

export async function buscarJornada({ inicio, fim }: Intervalo): Promise<AnalyticsJornada> {
  const { data, error } = await supabase.rpc('analytics_jornada', { p_inicio: inicio, p_fim: fim });
  if (error) throw erroMigration('analytics_jornada', error);
  return data as AnalyticsJornada;
}

export async function buscarJornadaParticipante(id: string): Promise<JornadaParticipante> {
  const { data, error } = await supabase.rpc('painel_participante_jornada', { p_id: id });
  if (error) throw erroMigration('painel_participante_jornada', error);
  return data as JornadaParticipante;
}
