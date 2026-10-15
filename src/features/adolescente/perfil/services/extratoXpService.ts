// src/features/adolescente/perfil/services/extratoXpService.ts
import { supabase } from '../../../../lib/supabase';
import type { LancamentoXp } from '../utils/extratoXp';

export const TAMANHO_PAGINA_EXTRATO = 30;

export type PaginaExtrato = {
  itens: LancamentoXp[];
  /** true quando pode haver mais lançamentos mais antigos */
  temMais: boolean;
};

/**
 * Lançamentos de XP do usuário (RLS garante que só vêm os dele), do mais novo para o mais antigo.
 * `antesDe` = `criadoEm` do último item já carregado (paginação por cursor).
 */
export async function buscarExtratoXp(
  userId: string,
  antesDe?: string,
  limite: number = TAMANHO_PAGINA_EXTRATO,
): Promise<PaginaExtrato> {
  let consulta = supabase
    .from('xp_lancamentos')
    .select('id, origem, quantidade, descricao, criado_em')
    .eq('usuario_id', userId)
    .order('criado_em', { ascending: false })
    .order('id', { ascending: false })
    .limit(limite);
  if (antesDe) consulta = consulta.lt('criado_em', antesDe);

  const { data, error } = await consulta;
  if (error) throw error;

  const itens: LancamentoXp[] = (data ?? []).map((r: any) => ({
    id: r.id,
    origem: r.origem,
    quantidade: r.quantidade,
    descricao: r.descricao ?? null,
    criadoEm: r.criado_em,
  }));
  return { itens, temMais: itens.length === limite };
}
