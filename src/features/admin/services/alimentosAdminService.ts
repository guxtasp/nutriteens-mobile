import { supabase } from '../../../lib/supabase';

export type ClassificacaoNova = 'IN_NATURA' | 'INGREDIENTE_CULINARIO' | 'PROCESSADO' | 'ULTRAPROCESSADO';
export type GrupoAlimentar =
  | 'CEREAIS_E_TUBERCULOS' | 'LEGUMES_E_VERDURAS' | 'FRUTAS' | 'LEITE_E_DERIVADOS'
  | 'CARNES_E_OVOS' | 'LEGUMINOSAS' | 'OLEAGINOSAS_E_SEMENTES' | 'OLEOS_E_GORDURAS'
  | 'ACUCARES_E_DOCES' | 'BEBIDAS';

export type ClassificacaoEbia = 'SEGURANCA_ALIMENTAR' | 'INSEGURANCA_LEVE' | 'INSEGURANCA_MODERADA' | 'INSEGURANCA_GRAVE';

// nível categórico de nutriente (ver migracao_alimento_nutrientes_categorico.sql).
// 'INFERIDO_POR_GRUPO': preenchido automaticamente quando um ADOLESCENTE cadastra
// o próprio alimento, a partir do grupo escolhido — nunca visto por um humano ainda.
// 'REVISADO_NUTRICIONISTA': alguém aqui no admin já olhou/confirmou/ajustou.
//
// Duas escalas: NivelNutriente (AUSENTE/FONTE/ALTO_TEOR) pra vitaminas,
// minerais, proteína e fibra — sempre um benefício a destacar. NivelAtencao
// (BAIXO/MODERADO/ALTO) pra sódio, carboidrato e gordura total — quantidade
// neutra, não é "fonte de" nada.
export type NivelNutriente = 'AUSENTE' | 'FONTE' | 'ALTO_TEOR';
export type NivelAtencao = 'BAIXO' | 'MODERADO' | 'ALTO';
export type FonteNutrientes = 'INFERIDO_POR_GRUPO' | 'REVISADO_NUTRICIONISTA' | 'TACO_4ED' | null;

export type NutrienteChave =
  | 'vitamina_a' | 'vitamina_c' | 'vitamina_d'
  | 'tiamina' | 'riboflavina' | 'niacina' | 'piridoxina'
  | 'calcio' | 'ferro' | 'magnesio' | 'fosforo' | 'potassio' | 'zinco'
  | 'proteina' | 'fibra';
export type NutrienteAtencaoChave = 'sodio' | 'carboidrato' | 'lipideos';

export type NutrientesAlimento = Partial<Record<NutrienteChave, NivelNutriente | null>> &
  Partial<Record<NutrienteAtencaoChave, NivelAtencao | null>>;

export interface Alimento {
  id: string;
  nome: string;
  eh_prato_composto: boolean;
  classificacao_nova: ClassificacaoNova;
  acessivel_ebia: boolean;
  // até qual severidade de insegurança alimentar o item continua aparecendo
  // pro adolescente na busca — uso interno, nunca exposto no app dele
  nivel_maximo_ebia: ClassificacaoEbia;
  grupos_alimentares: GrupoAlimentar[];
  criado_por: string | null;
  // os dois campos abaixo não são colunas de `alimentos` — vêm de um join
  // feito só em listarAlimentos(), pra dar pra priorizar a revisão na lista
  // sem abrir cada item um por um.
  nutrientes_fonte?: FonteNutrientes;
  vezes_usado?: number;
}

// alimento criado por um adolescente (criado_por preenchido) cujo nutriente
// ainda não passou pelos olhos de um nutricionista — é o que deve aparecer
// destacado/priorizado na lista do admin.
export function precisaRevisaoNutricional(alimento: Alimento): boolean {
  return alimento.criado_por !== null && alimento.nutrientes_fonte !== 'REVISADO_NUTRICIONISTA';
}

export async function listarAlimentos(): Promise<Alimento[]> {
  const { data, error } = await supabase
    .from('alimentos')
    .select('*, alimento_nutrientes(fonte), refeicao_alimentos(count)')
    .order('nome');
  if (error) {
    console.error('Erro ao listar alimentos:', error.message);
    return [];
  }

  const lista: Alimento[] = (data ?? []).map((linha: any) => ({
    ...linha,
    nutrientes_fonte: linha.alimento_nutrientes?.fonte ?? null,
    vezes_usado: linha.refeicao_alimentos?.[0]?.count ?? 0,
  }));

  // pendentes de revisão primeiro, e entre eles os mais usados primeiro —
  // prioriza revisar o que mais aparece no dia a dia, não ordem alfabética às cegas
  return lista.sort((a, b) => {
    const aPendente = precisaRevisaoNutricional(a);
    const bPendente = precisaRevisaoNutricional(b);
    if (aPendente !== bPendente) return aPendente ? -1 : 1;
    if (aPendente && bPendente) return (b.vezes_usado ?? 0) - (a.vezes_usado ?? 0);
    return a.nome.localeCompare(b.nome);
  });
}

export async function criarAlimento(alimento: Omit<Alimento, 'id'>) {
  const { data, error } = await supabase.from('alimentos').insert(alimento).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarAlimento(id: string, alimento: Omit<Alimento, 'id'>) {
  const { error } = await supabase.from('alimentos').update(alimento).eq('id', id);
  if (error) throw error;
}

export async function excluirAlimento(id: string) {
  const { error } = await supabase.from('alimentos').delete().eq('id', id);
  if (error) throw error;
}

// ---- Nutrientes (nível categórico — ver migracao_alimento_nutrientes_categorico.sql) ----

const COLUNAS_NUTRIENTES =
  'vitamina_a, vitamina_c, vitamina_d, tiamina, riboflavina, niacina, piridoxina, ' +
  'calcio, ferro, magnesio, fosforo, potassio, zinco, proteina, fibra, ' +
  'sodio, carboidrato, lipideos, fonte';

export async function buscarNutrientesDoAlimento(alimentoId: string): Promise<{ nutrientes: NutrientesAlimento; fonte: FonteNutrientes }> {
  const { data, error } = await supabase
    .from('alimento_nutrientes')
    .select(COLUNAS_NUTRIENTES)
    .eq('alimento_id', alimentoId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { nutrientes: {}, fonte: null };
  const { fonte, ...nutrientes } = data;
  return { nutrientes, fonte };
}

// chamado sempre que um nutricionista salva o formulário com pelo menos um
// nível de nutriente preenchido — sempre marca fonte como REVISADO_NUTRICIONISTA,
// seja o alimento novo (sem linha ainda) ou um que já tinha inferência por grupo.
export async function salvarNutrientesDoAlimento(alimentoId: string, nutrientes: NutrientesAlimento): Promise<void> {
  const { error } = await supabase
    .from('alimento_nutrientes')
    .upsert({ alimento_id: alimentoId, ...nutrientes, fonte: 'REVISADO_NUTRICIONISTA' });
  if (error) throw error;
}

export type IngredientePrato = {
  ingrediente_id: string;
  proporcao: number;
  nome?: string; // preenchido ao buscar, pra exibir na lista
};

export async function buscarIngredientesDoPrato(pratoId: string): Promise<IngredientePrato[]> {
  const { data, error } = await supabase
    .from('prato_ingredientes')
    .select('ingrediente_id, proporcao, alimentos!prato_ingredientes_ingrediente_id_fkey(nome)')
    .eq('prato_id', pratoId);

  if (error) throw error;
  return (data ?? []).map((linha: any) => ({
    ingrediente_id: linha.ingrediente_id,
    proporcao: linha.proporcao,
    nome: linha.alimentos?.nome,
  }));
}

export async function salvarIngredientesDoPrato(
  pratoId: string,
  ingredientes: { ingrediente_id: string; proporcao: number }[]
): Promise<void> {
  const { error } = await supabase.rpc('substituir_ingredientes_prato', {
    p_prato_id: pratoId,
    p_ingredientes: ingredientes,
  });
  if (error) throw error;
}

export async function buscarAlimentosParaSelecao(termo: string): Promise<Alimento[]> {
  if (!termo.trim()) return [];
  const { data, error } = await supabase
    .from('alimentos')
    .select('*')
    .ilike('nome', `%${termo.trim()}%`)
    .order('nome')
    .limit(15);
  if (error) throw error;
  return data ?? [];
}

// ---- Receitas ----
export type Receita = {
  id: string;
  alimento_resultante_id: string;
  titulo: string;
  modo_preparo: string;
  tempo_preparo_min: number | null;
  porcoes: number;
  dificuldade: 'FACIL' | 'MEDIO' | 'DIFICIL';
  foto_url: string | null;
};

export async function buscarReceitaDoAlimento(alimentoId: string): Promise<Receita | null> {
  const { data, error } = await supabase
    .from('receitas')
    .select('*')
    .eq('alimento_resultante_id', alimentoId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function salvarReceita(params: {
  id?: string;
  alimentoResultanteId: string;
  titulo: string;
  modoPreparo: string;
  tempoPreparoMin: number | null;
  porcoes: number;
  dificuldade: 'FACIL' | 'MEDIO' | 'DIFICIL';
  fotoUrl?: string | null;
}): Promise<string> {
  const payload = {
    alimento_resultante_id: params.alimentoResultanteId,
    titulo: params.titulo,
    modo_preparo: params.modoPreparo,
    tempo_preparo_min: params.tempoPreparoMin,
    porcoes: params.porcoes,
    dificuldade: params.dificuldade,
    foto_url: params.fotoUrl ?? null,
  };

  if (params.id) {
    const { error } = await supabase.from('receitas').update(payload).eq('id', params.id);
    if (error) throw error;
    return params.id;
  }
  const { data, error } = await supabase.from('receitas').insert(payload).select('id').single();
  if (error) throw error;
  return data.id;
}

// ---- Passos da receita (guia dinâmico, tipo GuiaAtividadeSheet) ----
export type PassoReceita = {
  id?: string;
  ordem: number;
  titulo: string;
  descricao: string;
  foto_url: string | null;
};

export async function listarPassosDaReceita(receitaId: string): Promise<PassoReceita[]> {
  const { data, error } = await supabase
    .from('receita_passos')
    .select('*')
    .eq('receita_id', receitaId)
    .order('ordem');
  if (error) throw error;
  return data ?? [];
}

export async function salvarPassosDaReceita(
  receitaId: string,
  passos: { ordem: number; titulo: string; descricao: string; foto_url?: string | null }[]
): Promise<void> {
  const { error } = await supabase.rpc('substituir_passos_receita', {
    p_receita_id: receitaId,
    p_passos: passos.map((p) => ({ ...p, foto_url: p.foto_url ?? null })),
  });
  if (error) throw error;
}