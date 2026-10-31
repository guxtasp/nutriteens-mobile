// Evolução semanal de um participante (RPC painel_participante_evolucao; só NUTRICIONISTA).
import { supabase } from '../../../lib/supabase';
import type { SemanaEvolucao } from '../utils/evolucao';

export type EbiaHistorico = { data: string; pontuacao: number | null; classificacao: string | null };
export type RecordatorioHistorico = { data: string; saudavel: number | null; naoSaudavel: number | null };
export type EvolucaoParticipante = { semanas: SemanaEvolucao[]; ebia: EbiaHistorico[]; recordatorios: RecordatorioHistorico[] };

export async function buscarEvolucao(id: string, semanas = 12): Promise<EvolucaoParticipante> {
  const { data, error } = await supabase.rpc('painel_participante_evolucao', { p_id: id, p_semanas: semanas });
  if (error) {
    if (/painel_participante_evolucao|schema cache|does not exist/i.test(error.message)) {
      throw new Error('A função de evolução ainda não existe no banco. Rode migration_painel_evolucao.sql no SQL Editor.');
    }
    throw error;
  }
  const r: any = data;
  return {
    semanas: (r?.semanas ?? []).map((s: any): SemanaEvolucao => ({
      inicio: s.inicio,
      diasComRegistro: Number(s.dias_com_registro ?? 0),
      refeicoes: Number(s.refeicoes ?? 0),
      aguaMediaMl: Number(s.agua_media_ml ?? 0),
      atividadeMin: Number(s.atividade_min ?? 0),
      itens: Number(s.itens ?? 0),
      itensUltra: Number(s.itens_ultra ?? 0),
      itensInNatura: Number(s.itens_in_natura ?? 0),
    })),
    ebia: (r?.ebia ?? []).map((e: any) => ({ data: e.data, pontuacao: e.pontuacao ?? null, classificacao: e.classificacao ?? null })),
    recordatorios: (r?.recordatorios ?? []).map((x: any) => ({ data: x.data, saudavel: x.saudavel ?? null, naoSaudavel: x.nao_saudavel ?? null })),
  };
}
