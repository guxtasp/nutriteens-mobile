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
  /** passos/grupos/minutos_dia, conforme a métrica */
  parametros: Record<string, any>;
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
      alvo: d.alvo, pontos: d.pontos, ativa: !!d.ativa, nutriente: d.nutriente ?? null, parametros: d.parametros ?? {}, resgatada: Number(d.resgatada ?? 0),
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
  DIAS_PASSOS_META: 'dias batendo a meta de passos',
  DIAS_VARIEDADE_GRUPOS: 'dias com variedade de grupos alimentares',
  REFEICOES_REGISTRADAS: 'refeições registradas',
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
  /** passos/dia, grupos/dia ou minutos/dia, conforme a métrica */
  valor?: number | null;
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
    p_valor: d.valor ?? null,
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

// ---- Excluir (desafio periódico e conquista/marco) ----
export async function excluirDesafioPeriodico(codigo: string): Promise<void> {
  const { error } = await supabase.rpc('painel_desafio_periodico_excluir', { p_codigo: codigo });
  if (error) throw error;
}
export async function excluirInsignia(id: string): Promise<void> {
  const { error } = await supabase.rpc('painel_insignia_excluir', { p_id: id });
  if (error) throw error;
}

// ---- Desafios DIÁRIOS criados pelo painel ----
// Cada um usa uma regra que o app já sabe medir; o painel só escolhe regra + valor.
export type RegraDiariaCustom =
  | 'AGUA_PCT_META' | 'ATIVIDADE_MIN' | 'ATIVIDADE_PASSOS' | 'NATURAIS_QTD' | 'SEM_ULTRA'
  | 'REFEICOES_QTD' | 'REFEICAO_TIPO' | 'VARIEDADE_GRUPOS' | 'GRUPO' | 'FONTE_NUTRIENTE';

export interface RegraDiariaDef {
  chave: RegraDiariaCustom;
  label: string;
  /** campo numérico da regra (null = só a escolha, sem quantidade) */
  campo: 'pct' | 'min' | 'passos' | 'qtd' | 'refeicoes' | 'grupos' | null;
  unidade: string;
  min: number;
  max: number;
  padrao: number;
  /** escolha extra (ex.: qual refeição, qual grupo, qual nutriente) */
  seletor?: { campo: 'tipo' | 'grupo' | 'nutriente'; rotulo: string; opcoes: { chave: string; label: string }[] };
}

export const REFEICOES_OPCOES = [
  { chave: 'CAFE_DA_MANHA', label: 'Café da manhã' }, { chave: 'LANCHE_MANHA', label: 'Lanche da manhã' },
  { chave: 'ALMOCO', label: 'Almoço' }, { chave: 'LANCHE_TARDE', label: 'Lanche da tarde' },
  { chave: 'JANTAR', label: 'Jantar' }, { chave: 'CEIA', label: 'Ceia' },
];
export const GRUPOS_OPCOES = [
  { chave: 'FRUTAS', label: 'Frutas' }, { chave: 'LEGUMES_E_VERDURAS', label: 'Legumes e verduras' },
  { chave: 'LEGUMINOSAS', label: 'Leguminosas' }, { chave: 'CARNES_E_OVOS', label: 'Carnes e ovos' },
  { chave: 'LEITE_E_DERIVADOS', label: 'Leite e derivados' }, { chave: 'CEREAIS_E_TUBERCULOS', label: 'Cereais e tubérculos' },
  { chave: 'OLEAGINOSAS_E_SEMENTES', label: 'Oleaginosas e sementes' },
];
export const NUTRIENTES_DIARIO = [
  { chave: 'vitamina_a', label: 'Vitamina A' }, { chave: 'vitamina_c', label: 'Vitamina C' }, { chave: 'vitamina_d', label: 'Vitamina D' },
  { chave: 'calcio', label: 'Cálcio' }, { chave: 'ferro', label: 'Ferro' }, { chave: 'zinco', label: 'Zinco' },
  { chave: 'magnesio', label: 'Magnésio' }, { chave: 'proteina', label: 'Proteína' }, { chave: 'fibra', label: 'Fibra' },
];

export const REGRAS_DIARIAS: RegraDiariaDef[] = [
  { chave: 'AGUA_PCT_META', label: 'Beber parte da meta de água', campo: 'pct', unidade: '% da meta de água', min: 10, max: 150, padrao: 80 },
  { chave: 'ATIVIDADE_MIN', label: 'Minutos de atividade física', campo: 'min', unidade: 'minutos', min: 5, max: 180, padrao: 30 },
  { chave: 'ATIVIDADE_PASSOS', label: 'Passos no dia', campo: 'passos', unidade: 'passos', min: 1000, max: 30000, padrao: 5000 },
  { chave: 'NATURAIS_QTD', label: 'Comida de verdade (in natura)', campo: 'qtd', unidade: 'porções', min: 1, max: 10, padrao: 3 },
  { chave: 'SEM_ULTRA', label: 'Refeições sem ultraprocessado', campo: 'refeicoes', unidade: 'refeições', min: 1, max: 5, padrao: 1 },
  { chave: 'REFEICOES_QTD', label: 'Registrar várias refeições', campo: 'qtd', unidade: 'refeições', min: 1, max: 6, padrao: 3 },
  { chave: 'REFEICAO_TIPO', label: 'Registrar uma refeição específica', campo: null, unidade: '', min: 1, max: 1, padrao: 1,
    seletor: { campo: 'tipo', rotulo: 'Qual refeição', opcoes: REFEICOES_OPCOES } },
  { chave: 'VARIEDADE_GRUPOS', label: 'Variedade de grupos alimentares', campo: 'grupos', unidade: 'grupos diferentes', min: 2, max: 7, padrao: 4 },
  { chave: 'GRUPO', label: 'Itens de um grupo alimentar', campo: 'qtd', unidade: 'itens', min: 1, max: 5, padrao: 2,
    seletor: { campo: 'grupo', rotulo: 'Qual grupo', opcoes: GRUPOS_OPCOES } },
  { chave: 'FONTE_NUTRIENTE', label: 'Alimentos fonte de um nutriente', campo: 'qtd', unidade: 'alimentos', min: 1, max: 5, padrao: 2,
    seletor: { campo: 'nutriente', rotulo: 'Qual nutriente', opcoes: NUTRIENTES_DIARIO } },
];

export interface DesafioDiarioCustom {
  codigo: string;
  area: 'AGUA' | 'ATIVIDADE' | 'ALIMENTACAO';
  titulo: string;
  descricao: string;
  icone: string | null;
  regra: Record<string, any> & { regra: RegraDiariaCustom };
  ativa: boolean;
  sorteada: number;
}

export async function listarDiariosCustom(): Promise<DesafioDiarioCustom[]> {
  const { data, error } = await supabase.rpc('painel_variantes_custom_listar');
  if (error) throw error;
  return ((data ?? []) as any[]).map((v) => ({
    codigo: v.codigo, area: v.area, titulo: v.titulo, descricao: v.descricao, icone: v.icone ?? null,
    regra: v.regra, ativa: !!v.ativa, sorteada: Number(v.sorteada ?? 0),
  }));
}

export async function salvarDiarioCustom(d: {
  codigo?: string | null; titulo: string; descricao: string; icone: string; regra: DesafioDiarioCustom['regra']; ativa?: boolean;
}): Promise<string> {
  const { data, error } = await supabase.rpc('painel_variante_custom_salvar', {
    p_codigo: d.codigo ?? null, p_titulo: d.titulo, p_descricao: d.descricao, p_icone: d.icone, p_regra: d.regra, p_ativa: d.ativa ?? true,
  });
  if (error) throw error;
  return data as string;
}

export async function excluirDiarioCustom(codigo: string): Promise<void> {
  const { error } = await supabase.rpc('painel_variante_custom_excluir', { p_codigo: codigo });
  if (error) throw error;
}

// Pontos dos desafios diários do catálogo base (valem para todas as variantes daquele tipo)
export async function definirPontosDiario(id: string, pontos: number): Promise<void> {
  const { error } = await supabase.rpc('painel_desafio_diario_pontos', { p_id: id, p_pontos: pontos });
  if (error) throw error;
}
