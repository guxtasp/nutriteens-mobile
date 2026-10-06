// src/shared/painel/services/dashboardService.ts
//
// Todos os números dos dashboards vêm de UMA RPC agregada (painel_dashboard),
// protegida no banco por papel (ADMINISTRADOR/NUTRICIONISTA). Admin e
// nutricionista não leem as tabelas dos adolescentes diretamente: o RLS por
// dono continua valendo e só agregados saem do banco.
import { supabase } from '../../../lib/supabase';

export interface PainelDashboard {
  periodo_dias: number;
  inicio: string;
  kpis: {
    adolescentes: number;
    ativos: number;
    novos: number;
    nutricionistas: number;
    conteudos_publicados: number;
    conteudos_aguardando: number;
    trilhas_ativas: number;
    desafios_ativos: number;
  };
  serie_uso: { dia: string; usuarios: number; registros: number }[];
  recursos: { recurso: string; total: number }[];
  serie_desafios: { dia: string; iniciados: number; concluidos: number }[];
  trilhas: { titulo: string; iniciadas: number; concluidas: number }[];
  recentes: { tipo: 'alimentacao' | 'agua' | 'atividade'; codigo: string | null; quando: string }[];
  atividades: { tipo: 'cadastro' | 'revisao'; titulo: string; quando: string }[];
}

export async function buscarDashboard(dias: number): Promise<PainelDashboard> {
  const { data, error } = await supabase.rpc('painel_dashboard', { p_dias: dias });
  if (error) {
    if (/painel_dashboard|schema cache|does not exist/i.test(error.message)) {
      throw new Error('A função painel_dashboard ainda não existe no banco. Rode a migration migration_painel_dashboard.sql no SQL Editor.');
    }
    if (error.code === '42501') throw new Error('Seu usuário não tem permissão para ver este painel.');
    throw new Error(error.message);
  }
  return data as PainelDashboard;
}
