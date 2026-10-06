// src/features/conteudo/services/conteudoService.ts
// Leitura de apoio para a revisão de conteúdo (papel atual e lição completa).
// A leitura passa por funções do banco, que liberam o conteúdo completo, em qualquer
// status, só para Admin e Nutricionista.
import { supabase } from '../../../lib/supabase';
import type { Papel } from '../utils/regrasAprovacao';
import type { QuestaoRevisao } from '../utils/descreverQuestao';

export type LicaoParaRevisao = {
  id: string;
  titulo: string;
  tipo: string;
  xpRecompensa: number;
  texto: string | null;
  questoes: (QuestaoRevisao & { id: string })[];
};

export async function obterPapelAtual(): Promise<Papel | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase.from('profiles').select('papel').eq('id', auth.user.id).single();
  if (error) {
    console.error('Erro ao ler papel:', error.message);
    return null;
  }
  return data.papel as Papel;
}

export async function buscarLicaoParaRevisao(licaoId: string): Promise<LicaoParaRevisao> {
  const { data, error } = await supabase.rpc('conteudo_licao_detalhe', { p_licao_id: licaoId });
  if (error) throw error;
  const l: any = data;
  return {
    id: l.id,
    titulo: l.titulo,
    tipo: String(l.tipo),
    xpRecompensa: l.xp,
    texto: l.texto ?? null,
    questoes: (l.questoes ?? []).map((q: any) => ({
      id: q.id,
      enunciado: q.enunciado,
      formato: q.formato ?? 'multipla_escolha',
      dadosExtra: q.dados_extra ?? {},
      opcoes: q.opcoes ?? [],
    })),
  };
}
