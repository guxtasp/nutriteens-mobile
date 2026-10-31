// src/features/admin/services/acessosDadosService.ts
// Registro de quem abriu os dados de participantes (LGPD, D4). Só ADMINISTRADOR (RPC painel_acessos_dados_listar).
import { supabase } from '../../../lib/supabase';

export type AcessoDados = { id: string; criadoEm: string; recurso: string; leitor: string; leitorPapel: string; participante: string };

export async function listarAcessosDados(limite = 100): Promise<{ total30d: number; registros: AcessoDados[] }> {
  const { data, error } = await supabase.rpc('painel_acessos_dados_listar', { p_limite: limite });
  if (error) {
    if (/painel_acessos_dados_listar|schema cache|does not exist/i.test(error.message)) {
      throw new Error('O registro de acessos ainda não existe no banco. Rode migration_painel_lgpd.sql no SQL Editor.');
    }
    throw error;
  }
  const r: any = data;
  return {
    total30d: Number(r?.total_30d ?? 0),
    registros: (r?.registros ?? []).map((x: any): AcessoDados => ({
      id: x.id, criadoEm: x.criado_em, recurso: x.recurso, leitor: x.leitor, leitorPapel: x.leitor_papel, participante: x.participante,
    })),
  };
}
