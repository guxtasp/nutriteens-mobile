// src/features/adolescente/services/receitasService.ts
import { supabase } from '../../../lib/supabase';
import type { Alimento } from './alimentacaoService';
import type { ClassificacaoEbia } from '../../ebia/data/ebiaData';
import { valoresEbiaAceitaveis } from '../utils/ordemEbia';

export type ReceitaComAlimento = {
  id: string;
  titulo: string;
  modo_preparo: string;
  tempo_preparo_min: number | null;
  porcoes: number;
  dificuldade: 'FACIL' | 'MEDIO' | 'DIFICIL';
  foto_url: string | null;
  alimento_resultante: Alimento;
};

export type PassoReceita = {
  id: string;
  ordem: number;
  titulo: string;
  descricao: string;
  foto_url: string | null;
};

// mesmas colunas de sempre pro alimento embutido, sem nivel_maximo_ebia
const COLUNAS_ALIMENTO_EMBUTIDO =
  'id, nome, eh_prato_composto, classificacao_nova, acessivel_ebia, grupos_alimentares';

// pega os ids dos pratos (alimentos compostos) que estão dentro da escala EBIA
// do usuário — usado pra filtrar receitas sem precisar de filtro aninhado
async function idsPratosPermitidos(classificacao: ClassificacaoEbia): Promise<string[]> {
  const { data, error } = await supabase
    .from('alimentos')
    .select('id')
    .eq('eh_prato_composto', true)
    .in('nivel_maximo_ebia', valoresEbiaAceitaveis(classificacao));

  if (error) throw error;
  return (data ?? []).map((linha) => linha.id);
}

async function obterClassificacaoEbiaAtual(userId: string): Promise<ClassificacaoEbia> {
  const { data, error } = await supabase
    .from('profiles')
    .select('classificacao_ebia_atual')
    .eq('id', userId)
    .single();

  return !error && data?.classificacao_ebia_atual ? data.classificacao_ebia_atual : 'INSEGURANCA_GRAVE';
}

export async function listarReceitas(userId: string): Promise<ReceitaComAlimento[]> {
  const classificacao = await obterClassificacaoEbiaAtual(userId);
  const ids = await idsPratosPermitidos(classificacao);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('receitas')
    .select(`*, alimento_resultante:alimentos!receitas_alimento_resultante_id_fkey(${COLUNAS_ALIMENTO_EMBUTIDO})`)
    .in('alimento_resultante_id', ids)
    .order('titulo');

  if (error) throw error;
  return (data ?? []) as any;
}

export async function buscarReceitas(termo: string, userId: string): Promise<ReceitaComAlimento[]> {
  const classificacao = await obterClassificacaoEbiaAtual(userId);
  const ids = await idsPratosPermitidos(classificacao);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('receitas')
    .select(`*, alimento_resultante:alimentos!receitas_alimento_resultante_id_fkey(${COLUNAS_ALIMENTO_EMBUTIDO})`)
    .in('alimento_resultante_id', ids)
    .ilike('titulo', `%${termo.trim()}%`)
    .order('titulo');

  if (error) throw error;
  return (data ?? []) as any;
}

export async function buscarPassosDaReceita(receitaId: string): Promise<PassoReceita[]> {
  const { data, error } = await supabase
    .from('receita_passos')
    .select('*')
    .eq('receita_id', receitaId)
    .order('ordem');

  if (error) throw error;
  return data ?? [];
}