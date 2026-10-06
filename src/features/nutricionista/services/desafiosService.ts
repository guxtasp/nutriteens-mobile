// src/features/nutricionista/services/desafiosService.ts
// Catálogo de desafios (missões diárias e periódicas). Admin e Nutricionista consultam e
// podem ativar/desativar; o banco confere o papel.
import { supabase } from '../../../lib/supabase';

export interface DesafioDiario {
  ref: string;
  tipo: string;
  titulo: string;
  descricao: string;
  pontos: number;
  ativa: boolean;
  sorteada: number;
  concluida: number;
}
export interface DesafioPeriodico {
  ref: string;
  periodo: 'SEMANAL' | 'MENSAL';
  titulo: string;
  descricao: string;
  metrica: string;
  alvo: number;
  pontos: number;
  ativa: boolean;
  resgatada: number;
}

export async function listarDesafios(): Promise<{ diarios: DesafioDiario[]; periodicos: DesafioPeriodico[] }> {
  const { data, error } = await supabase.rpc('painel_desafios_listar');
  if (error) throw error;
  const r: any = data ?? {};
  return {
    diarios: (r.diarios ?? []).map((d: any) => ({
      ref: d.ref, tipo: d.tipo, titulo: d.titulo, descricao: d.descricao, pontos: d.pontos,
      ativa: !!d.ativa, sorteada: Number(d.sorteada ?? 0), concluida: Number(d.concluida ?? 0),
    })),
    periodicos: (r.periodicos ?? []).map((d: any) => ({
      ref: d.ref, periodo: d.periodo, titulo: d.titulo, descricao: d.descricao, metrica: d.metrica,
      alvo: d.alvo, pontos: d.pontos, ativa: !!d.ativa, resgatada: Number(d.resgatada ?? 0),
    })),
  };
}

export async function definirDesafioAtivo(origem: 'DIARIO' | 'PERIODICO', ref: string, ativa: boolean): Promise<void> {
  const { error } = await supabase.rpc('painel_desafio_definir_ativo', { p_origem: origem, p_ref: ref, p_ativa: ativa });
  if (error) throw error;
}

export const METRICA_LABEL: Record<string, string> = {
  DIAS_AGUA_META: 'dias batendo a meta de água',
  DIAS_ATIVIDADE_META: 'dias batendo a meta de atividade',
  DIAS_COM_REGISTRO: 'dias com registro',
  DIAS_FONTE_NUTRIENTE: 'dias com fonte do nutriente',
  REFEICOES_SEM_ULTRAPROCESSADO: 'refeições sem ultraprocessado',
  MINUTOS_ATIVIDADE: 'minutos de atividade',
  LICOES: 'lições concluídas',
  MISSOES_DIARIAS: 'desafios diários concluídos',
};
