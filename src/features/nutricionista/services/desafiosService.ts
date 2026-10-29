// src/features/nutricionista/services/desafiosService.ts
// Catálogo de desafios (missões diárias e periódicas). Admin e Nutricionista consultam e
// podem ativar/desativar; o banco confere o papel.
import { supabase } from '../../../lib/supabase';

export interface DesafioDiario {
  ref: string;
  tipo: string;
  titulo: string;
  descricao: string;
  pontos: number;
  ativa: boolean;
  sorteada: number;
  concluida: number;
}
export interface DesafioPeriodico {
  ref: string;
  periodo: 'SEMANAL' | 'MENSAL';
  titulo: string;
  descricao: string;
  icone: string | null;
  metrica: string;
  alvo: number;
  pontos: number;
  ativa: boolean;
  nutriente: string | null;
  resgatada: number;
}

export async function listarDesafios(): Promise<{ diarios: DesafioDiario[]; periodicos: DesafioPeriodico[] }> {
  const { data, error } = await supabase.rpc('painel_desafios_listar');
  if (error) throw error;
  const r: any = data ?? {};
  return {
    diarios: (r.diarios ?? []).map((d: any) => ({
      ref: d.ref, tipo: d.tipo, titulo: d.titulo, descricao: d.descricao, pontos: d.pontos,
      ativa: !!d.ativa, sorteada: Number(d.sorteada ?? 0), concluida: Number(d.concluida ?? 0),
    })),
    periodicos: (r.periodicos ?? []).map((d: any) => ({
      ref: d.ref, periodo: d.periodo, titulo: d.titulo, descricao: d.descricao, icone: d.icone ?? null, metrica: d.metrica,
      alvo: d.alvo, pontos: d.pontos, ativa: !!d.ativa, nutriente: d.nutriente ?? null, resgatada: Number(d.resgatada ?? 0),
    })),
  };
}

export async function definirDesafioAtivo(origem: 'DIARIO' | 'PERIODICO', ref: string, ativa: boolean): Promise<void> {
  const { error } = await supabase.rpc('painel_desafio_definir_ativo', { p_origem: origem, p_ref: ref, p_ativa: ativa });
  if (error) throw error;
}

export const METRICA_LABEL: Record<string, string> = {
  DIAS_AGUA_META: 'dias batendo a meta de água',
  DIAS_ATIVIDADE_META: 'dias batendo a meta de atividade',
  DIAS_COM_REGISTRO: 'dias com registro',
  DIAS_FONTE_NUTRIENTE: 'dias com fonte do nutriente',
  REFEICOES_SEM_ULTRAPROCESSADO: 'refeições sem ultraprocessado',
  MINUTOS_ATIVIDADE: 'minutos de atividade',
  LICOES: 'lições concluídas',
  MISSOES_DIARIAS: 'desafios diários concluídos',
};

// ---- Criar / editar desafios semanais e mensais ----
// Desafios DIÁRIOS não são criados aqui: cada tipo tem regra própria no código do app
// (variantesMissao). Os periódicos são só "métrica + meta", então cabem num formulário.
export interface DadosDesafioPeriodico {
  codigo?: string | null;
  periodo: 'SEMANAL' | 'MENSAL';
  titulo: string;
  descricao: string;
  icone: string;
  metrica: string;
  alvo: number;
  pontos: number;
  nutriente?: string | null;
}

export async function salvarDesafioPeriodico(d: DadosDesafioPeriodico): Promise<string> {
  const { data, error } = await supabase.rpc('painel_desafio_periodico_salvar', {
    p_codigo: d.codigo ?? null,
    p_periodo: d.periodo,
    p_titulo: d.titulo,
    p_descricao: d.descricao,
    p_icone: d.icone,
    p_metrica: d.metrica,
    p_alvo: d.alvo,
    p_pontos: d.pontos,
    p_nutriente: d.nutriente ?? null,
  });
  if (error) throw error;
  return data as string;
}

export const NUTRIENTES_DESAFIO: { chave: string; label: string }[] = [
  { chave: 'proteina', label: 'Proteína' },
  { chave: 'fibra', label: 'Fibra' },
  { chave: 'ferro', label: 'Ferro' },
  { chave: 'calcio', label: 'Cálcio' },
  { chave: 'vitamina_a', label: 'Vitamina A' },
  { chave: 'vitamina_c', label: 'Vitamina C' },
];

// ---- Conquistas, marcos e insígnias ----
export type CategoriaInsignia = 'conquista' | 'marco' | 'insignia';
export interface InsigniaPainel {
  id: string;
  codigo: string | null;
  categoria: CategoriaInsignia;
  nome: string;
  descricao: string | null;
  icone: string | null;
  tipo: string | null;
  min: number | null;
  ativa: boolean;
  ganhas: number;
}

export const CRITERIO_LABEL: Record<string, string> = {
  licoes: 'lições concluídas',
  xp: 'XP total',
  sequencia: 'dias seguidos (maior sequência)',
  agua: 'registros de água',
  refeicao: 'refeições registradas',
  alimento: 'alimentos registrados',
  alimentos_distintos: 'alimentos diferentes registrados',
  atividade: 'atividades físicas registradas',
  registros: 'dias com registro',
  missao: 'desafios do dia concluídos',
  amigos: 'amigos no app',
};

// ícones (Ionicons) que fazem sentido para conquistas — escolhidos visualmente no formulário
export const ICONES_CONQUISTA = [
  'ribbon', 'trophy', 'star', 'medal', 'flame', 'water', 'nutrition', 'restaurant', 'fitness', 'walk',
  'book', 'school', 'people', 'heart', 'leaf', 'sparkles', 'flag', 'rocket', 'sunny', 'happy',
] as const;

export async function listarInsignias(): Promise<InsigniaPainel[]> {
  const { data, error } = await supabase.rpc('painel_insignias_listar');
  if (error) throw error;
  return ((data ?? []) as any[]).map((i) => ({
    id: i.id, codigo: i.codigo, categoria: i.categoria, nome: i.nome, descricao: i.descricao,
    icone: i.icone, tipo: i.tipo, min: i.min, ativa: !!i.ativa, ganhas: Number(i.ganhas ?? 0),
  }));
}

export async function salvarInsignia(d: {
  id?: string | null; categoria: CategoriaInsignia; nome: string; descricao: string; icone: string; tipo: string; min: number;
}): Promise<string> {
  const { data, error } = await supabase.rpc('painel_insignia_salvar', {
    p_id: d.id ?? null, p_categoria: d.categoria, p_nome: d.nome, p_descricao: d.descricao,
    p_icone: d.icone, p_tipo: d.tipo, p_min: d.min,
  });
  if (error) throw error;
  return data as string;
}

export async function definirInsigniaAtiva(id: string, ativa: boolean): Promise<void> {
  const { error } = await supabase.rpc('painel_insignia_definir_ativa', { p_id: id, p_ativa: ativa });
  if (error) throw error;
}
