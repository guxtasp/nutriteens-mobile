// src/features/adolescente/services/receitasService.ts
import { supabase } from '../../../../lib/supabase';
import type { Alimento } from './alimentacaoService';
import type { ClassificacaoEbia } from '../../triagem/ebia/data/ebiaData';
import { valoresEbiaAceitaveis } from '../../triagem/ebia/utils/ordemEbia';

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
  try {
    // mesma chave do alimentacaoService: o nível real vale também sem internet
    return await comCache<ClassificacaoEbia>(`ebia:${userId}`, async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('classificacao_ebia_atual')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data?.classificacao_ebia_atual ?? 'INSEGURANCA_GRAVE';
    });
  } catch {
    return 'INSEGURANCA_GRAVE';
  }
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
/** Ingrediente já formatado para a tela de detalhe da receita. */
export type IngredienteReceita = { nome: string; quantidade: string };

// Ingredientes com quantidade (receita_ingredientes). Se a receita não tem nenhum
// cadastrado, cai nos ingredientes do prato resultante (prato_ingredientes), que é o
// que a equipe edita no painel — assim a seção nunca fica vazia à toa.
export async function buscarIngredientesDaReceita(receitaId: string, pratoId?: string | null): Promise<IngredienteReceita[]> {
  const { data, error } = await supabase
    .from('receita_ingredientes')
    .select('quantidade_texto, alimentos(nome)')
    .eq('receita_id', receitaId);
  if (error) throw error;

  let lista: IngredienteReceita[] = ((data ?? []) as any[])
    .map((i) => ({ nome: i.alimentos?.nome ?? '', quantidade: i.quantidade_texto ?? '' }))
    .filter((i) => i.nome);

  if (lista.length === 0 && pratoId) {
    const { data: doPrato, error: erroPrato } = await supabase
      .from('prato_ingredientes')
      .select('alimentos!prato_ingredientes_ingrediente_id_fkey(nome)')
      .eq('prato_id', pratoId);
    if (erroPrato) throw erroPrato;
    lista = ((doPrato ?? []) as any[]).map((i) => ({ nome: i.alimentos?.nome ?? '', quantidade: '' })).filter((i) => i.nome);
  }
  return lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export async function buscarReceitaPorId(receitaId: string): Promise<ReceitaComAlimento | null> {
  const { data, error } = await supabase
    .from('receitas')
    .select(`*, alimento_resultante:alimentos!receitas_alimento_resultante_id_fkey(${COLUNAS_ALIMENTO_EMBUTIDO})`)
    .eq('id', receitaId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as any;
}

// ---------------------------------------------------------------------
// "Receitas com o que tenho" (RF023 a RF029): receitas já com os ingredientes.
// Ingredientes = receita_ingredientes (com quantidade em texto) + prato_ingredientes
// do prato resultante (que é o que a equipe edita hoje no painel).
import { comCache } from '../../../../shared/offline/cacheLocal';
import { unirIngredientes, type IngredienteReceita as IngredienteCombinacao } from '../../receitas-ingredientes/utils/combinarReceitas';

export type ReceitaComIngredientes = ReceitaComAlimento & { ingredientes: IngredienteCombinacao[] };

export async function listarReceitasComIngredientes(userId: string): Promise<ReceitaComIngredientes[]> {
  return comCache<ReceitaComIngredientes[]>(`receitas:ingredientes:${userId}`, async () => {
    const classificacao = await obterClassificacaoEbiaAtual(userId);
    const idsPratos = await idsPratosPermitidos(classificacao);
    if (idsPratos.length === 0) return [];

    const { data, error } = await supabase
      .from('receitas')
      .select(
        `*, alimento_resultante:alimentos!receitas_alimento_resultante_id_fkey(${COLUNAS_ALIMENTO_EMBUTIDO}),
         receita_ingredientes(alimento_id, quantidade_texto, alimentos(nome))`
      )
      .in('alimento_resultante_id', idsPratos)
      .order('titulo');
    if (error) throw error;

    const receitas = (data ?? []) as any[];
    const idsResultantes = receitas.map((r) => r.alimento_resultante_id);

    const { data: doPrato, error: erroPrato } = await supabase
      .from('prato_ingredientes')
      .select('prato_id, ingrediente_id, alimentos!prato_ingredientes_ingrediente_id_fkey(nome)')
      .in('prato_id', idsResultantes);
    if (erroPrato) throw erroPrato;

    const porPrato = new Map<string, IngredienteCombinacao[]>();
    ((doPrato ?? []) as any[]).forEach((linha) => {
      const lista = porPrato.get(linha.prato_id) ?? [];
      lista.push({ alimentoId: linha.ingrediente_id, nome: linha.alimentos?.nome ?? 'Ingrediente', quantidadeTexto: null });
      porPrato.set(linha.prato_id, lista);
    });

    return receitas.map((r) => {
      const daReceita: IngredienteCombinacao[] = (r.receita_ingredientes ?? []).map((i: any) => ({
        alimentoId: i.alimento_id,
        nome: i.alimentos?.nome ?? 'Ingrediente',
        quantidadeTexto: i.quantidade_texto ?? null,
      }));
      const { receita_ingredientes: _descartado, ...resto } = r;
      return { ...resto, ingredientes: unirIngredientes(daReceita, porPrato.get(r.alimento_resultante_id) ?? []) } as ReceitaComIngredientes;
    });
  });
}
