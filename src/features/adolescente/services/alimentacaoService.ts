// src/features/adolescente/services/alimentacaoService.ts
import { supabase } from '../../../lib/supabase';
import type { ClassificacaoEbia } from '../../ebia/data/ebiaData';
import { gerarEPersistirFeedback } from './feedbackService';
import { ClassificacaoNova, FeedbackRefeicao } from '../utils/regraFeedbackRefeicao';
import { valoresEbiaAceitaveis } from '../utils/ordemEbia';

export type TipoRefeicao = 'CAFE_DA_MANHA' | 'LANCHE_MANHA' | 'ALMOCO' | 'LANCHE_TARDE' | 'JANTAR' | 'CEIA';

export type Alimento = {
  id: string;
  nome: string;
  eh_prato_composto: boolean;
  classificacao_nova: ClassificacaoNova;
  acessivel_ebia: boolean;
  grupos_alimentares: string[];
};

// colunas explícitas: nunca inclui nivel_maximo_ebia na resposta pro adolescente,
// ele só entra como critério de filtro (.gte), nunca é lido pelo app dele
const COLUNAS_ALIMENTO = 'id, nome, eh_prato_composto, classificacao_nova, acessivel_ebia, grupos_alimentares';

// cache simples em memória por sessão — evita 1 select em profiles a cada busca digitada
let cacheClassificacao: { userId: string; valor: ClassificacaoEbia } | null = null;

async function obterClassificacaoEbiaAtual(userId: string): Promise<ClassificacaoEbia> {
  if (cacheClassificacao?.userId === userId) return cacheClassificacao.valor;

  const { data, error } = await supabase
    .from('profiles')
    .select('classificacao_ebia_atual')
    .eq('id', userId)
    .single();

  // se ainda não fez a triagem ou deu erro, não filtra ninguém de fora —
  // trata como o nível mais severo (mostra tudo) até ter uma classificação real
  const valor: ClassificacaoEbia =
    !error && data?.classificacao_ebia_atual ? data.classificacao_ebia_atual : 'INSEGURANCA_GRAVE';

  cacheClassificacao = { userId, valor };
  return valor;
}

export async function criarAlimento(params: {
  nome: string;
  classificacaoNova: ClassificacaoNova;
  grupoAlimentar: string;
  userId: string; // obrigatório agora — a RLS exige auth.uid() = criado_por
}): Promise<Alimento> {
  const { data, error } = await supabase
    .from('alimentos')
    .insert({
      nome: params.nome.trim(),
      classificacao_nova: params.classificacaoNova,
      grupos_alimentares: [params.grupoAlimentar],
      eh_prato_composto: false,
      criado_por: params.userId,
    })
    .select(COLUNAS_ALIMENTO)
    .single();

  if (error) throw error;
  return data;
}

// mesma lógica de "achar ou criar o dia" que já deve existir em aguaService —
// reaproveita a tabela registros_diarios; se você já tiver essa função lá,
// pode importar de lá em vez de duplicar aqui.
async function obterOuCriarRegistroDiarioId(userId: string, dataISO: string): Promise<string> {
  const { data: existente, error: erroSelect } = await supabase
    .from('registros_diarios')
    .select('id')
    .eq('user_id', userId)
    .eq('data', dataISO)
    .maybeSingle();

  if (erroSelect) throw erroSelect;
  if (existente) return existente.id;

  const { data: novo, error: erroInsert } = await supabase
    .from('registros_diarios')
    .insert({ user_id: userId, data: dataISO })
    .select('id')
    .single();

  if (erroInsert) throw erroInsert;
  return novo.id;
}

export async function registrarRefeicao(params: {
  userId: string;
  dataISO: string;
  tipo: TipoRefeicao;
  itens: { alimento: Alimento; quantidade: number }[];
}): Promise<{ refeicaoId: string } & FeedbackRefeicao> {
  const registroDiarioId = await obterOuCriarRegistroDiarioId(params.userId, params.dataISO);

  const agora = new Date();
  const horario = agora.toTimeString().slice(0, 8); // HH:MM:SS

  const { data: refeicao, error: erroRefeicao } = await supabase
    .from('refeicoes')
    .insert({
      registro_diario_id: registroDiarioId,
      tipo: params.tipo,
      realizada: true,
      horario_registro: horario,
    })
    .select('id')
    .single();

  if (erroRefeicao) throw erroRefeicao;

  const linhas = params.itens.map((item) => ({
    refeicao_id: refeicao.id,
    alimento_id: item.alimento.id,
    quantidade: item.quantidade,
  }));

  const { error: erroItens } = await supabase.from('refeicao_alimentos').insert(linhas);
  if (erroItens) throw erroItens;

  // 1 "quantidade" no carrinho = 1 item pra fins de feedback (mesmo padrão
  // já usado antes pra classificacoesNova, só que agora carregando também
  // os grupos alimentares de cada item, usados na dimensão "nutricional")
  const itensFeedback = params.itens.flatMap((item) =>
    Array(item.quantidade).fill({
      classificacaoNova: item.alimento.classificacao_nova,
      gruposAlimentares: item.alimento.grupos_alimentares ?? [],
    })
  );
  const feedback = await gerarEPersistirFeedback({
    userId: params.userId,
    refeicaoId: refeicao.id,
    itens: itensFeedback,
  });
  return { refeicaoId: refeicao.id, ...feedback };
}
export async function buscarAlimentos(termo: string, userId: string): Promise<Alimento[]> {
  if (!termo.trim()) return [];
  const classificacao = await obterClassificacaoEbiaAtual(userId);

  const { data, error } = await supabase
    .from('alimentos')
    .select(COLUNAS_ALIMENTO)
    .in('nivel_maximo_ebia', valoresEbiaAceitaveis(classificacao))
    .ilike('nome', `%${termo.trim()}%`)
    .order('nome');

  if (error) throw error;
  return data ?? [];
}

export async function listarAlimentosIniciais(userId: string): Promise<Alimento[]> {
  const classificacao = await obterClassificacaoEbiaAtual(userId);

  const { data, error } = await supabase
    .from('alimentos')
    .select(COLUNAS_ALIMENTO)
    .in('nivel_maximo_ebia', valoresEbiaAceitaveis(classificacao))
    .order('nome');

  if (error) throw error;
  return data ?? [];
}

// alimentos cadastrados pelo próprio adolescente: sempre aparecem pra ele,
// então aqui não filtra por escala EBIA (só troca * pelas colunas explícitas)
export async function listarMeusAlimentos(userId: string): Promise<Alimento[]> {
  const { data, error } = await supabase
    .from('alimentos')
    .select(COLUNAS_ALIMENTO)
    .eq('criado_por', userId)
    .order('nome');

  if (error) throw error;
  return data ?? [];
}

export async function listarPratos(userId: string): Promise<Alimento[]> {
  const classificacao = await obterClassificacaoEbiaAtual(userId);

  const { data, error } = await supabase
    .from('alimentos')
    .select(COLUNAS_ALIMENTO)
    .eq('eh_prato_composto', true)
    .in('nivel_maximo_ebia', valoresEbiaAceitaveis(classificacao))
    .order('nome');

  if (error) throw error;
  return data ?? [];
}

export async function buscarPratos(termo: string, userId: string): Promise<Alimento[]> {
  const classificacao = await obterClassificacaoEbiaAtual(userId);

  const { data, error } = await supabase
    .from('alimentos')
    .select(COLUNAS_ALIMENTO)
    .eq('eh_prato_composto', true)
    .in('nivel_maximo_ebia', valoresEbiaAceitaveis(classificacao))
    .ilike('nome', `%${termo.trim()}%`)
    .order('nome');

  if (error) throw error;
  return data ?? [];
}