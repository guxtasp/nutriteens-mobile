// src/features/admin/services/metricasAdminService.ts
import { supabase } from '../../../lib/supabase';

export interface MetricasApp {
  totalAdolescentes: number;
  novosUltimos7Dias: number;
  totalAlimentos: number;
  totalReceitas: number;
}

async function contar(
  tabela: string,
  filtros?: { coluna: string; valor: string }[],
  dataMinima?: string
): Promise<number> {
  let query = supabase.from(tabela).select('id', { count: 'exact', head: true });
  filtros?.forEach(({ coluna, valor }) => {
    query = query.eq(coluna, valor);
  });
  if (dataMinima) {
    query = query.gte('created_at', dataMinima);
  }
  const { count, error } = await query;
  if (error) {
    console.error(`Erro ao contar ${tabela}:`, error.message);
    return 0;
  }
  return count ?? 0;
}

export async function buscarMetricas(): Promise<MetricasApp> {
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
  const dataLimite = seteDiasAtras.toISOString();

  const [totalAdolescentes, novosUltimos7Dias, totalAlimentos, totalReceitas] = await Promise.all([
    contar('profiles', [{ coluna: 'papel', valor: 'ADOLESCENTE' }]),
    contar('profiles', [{ coluna: 'papel', valor: 'ADOLESCENTE' }], dataLimite),
    contar('alimentos'),
    contar('receitas'),
  ]);

  return { totalAdolescentes, novosUltimos7Dias, totalAlimentos, totalReceitas };
}