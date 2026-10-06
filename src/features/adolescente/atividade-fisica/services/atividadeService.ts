// src/features/adolescente/services/atividadeService.ts
import { supabase } from '../../../../lib/supabase';
import { obterOuCriarRegistroDiario } from '../../../../shared/services/registroDiarioService';
import { formatarDataISO } from '../../../../shared/utils/data';
import { registrarEvento } from '../../../../shared/analytics/analytics';

export type AtividadeCatalogo = {
  id: string;
  nome: string;
  duracao_padrao_min: number;
};

export type ItemParaRegistrar = {
  nomeAtividade: string;
  duracaoMinutos: number;
};

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase();
}

/** Busca no catálogo, com filtro opcional por termo (pesquisa, ignora acento) */
export async function buscarAtividades(termo: string = ''): Promise<AtividadeCatalogo[]> {
  const { data, error } = await supabase
    .from('atividades')
    .select('id, nome, duracao_padrao_min')
    .order('nome');

  if (error) throw error;
  const todas = data ?? [];

  if (!termo.trim()) return todas;

  const termoNormalizado = normalizar(termo);
  return todas.filter((atividade) => normalizar(atividade.nome).includes(termoNormalizado));
}

export async function registrarAtividades(params: {
  userId: string;
  data: string;
  itens: ItemParaRegistrar[];
}): Promise<void> {
  const { userId, data, itens } = params;
  if (itens.length === 0) return;

  const registroDiarioId = await obterOuCriarRegistroDiario(userId, data);
  const horarioRegistro = new Date().toTimeString().slice(0, 8);

  const linhas = itens.map((item) => ({
    registro_diario_id: registroDiarioId,
    tipo_atividade: item.nomeAtividade,
    duracao_minutos: item.duracaoMinutos,
    horario_registro: horarioRegistro,
  }));

  const { error } = await supabase.from('registros_atividade_fisica').insert(linhas);
  if (error) throw error;
  registrarEvento('atividade_registrada', undefined, { userId });
}

export function horarioAgora(): string {
  return new Date().toTimeString().slice(0, 8);
}

// ---------------------------------------------------------------------
// Lacuna semanal de atividade física — mesmo espírito da lacuna de
// nutriente (ver nutrienteService.ts): conta em quantos dos últimos 7
// dias o total de minutos registrados bateu a meta diária, e reporta
// como lacuna se ficou abaixo do mínimo de dias esperado na semana.
//
// A meta diária (alvo_min) vem do catálogo de missões (missoes_catalogo,
// tipo ATIVIDADE_MIN) em vez de fixa aqui — é a mesma referência que já
// usávamos pra avaliar a missão do dia (ver missaoService.ts), então não
// há dois números diferentes de "quanto é suficiente" flutuando no app.
export type LacunaAtividade = { diasComAtividade: number; minimoDias: number; alvoMinPorDia: number };

const MINIMO_DIAS_ATIVIDADE_NA_SEMANA = 4; // mais de metade da semana com a meta diária batida

async function buscarAlvoMinDiarioAtividade(): Promise<number | null> {
  const { data, error } = await supabase
    .from('missoes_catalogo')
    .select('criterio')
    .eq('tipo', 'ATIVIDADE_MIN')
    .maybeSingle();
  if (error || !data?.criterio?.alvo_min) return null;
  return data.criterio.alvo_min as number;
}

/** Conta em quantos dos últimos 7 dias o total de minutos de atividade bateu a meta diária. */
export async function diasComAtividadeSuficienteNaSemana(userId: string, alvoMinPorDia: number): Promise<number> {
  const hoje = new Date();
  const seteDiasAtras = new Date(hoje);
  seteDiasAtras.setDate(hoje.getDate() - 6);

  const { data, error } = await supabase
    .from('registros_diarios')
    .select('data, registros_atividade_fisica ( duracao_minutos )')
    .eq('user_id', userId)
    .gte('data', formatarDataISO(seteDiasAtras))
    .lte('data', formatarDataISO(hoje));

  if (error) throw error;

  let diasComAtividade = 0;
  for (const dia of data ?? []) {
    const totalMin = ((dia as any).registros_atividade_fisica ?? []).reduce(
      (soma: number, r: any) => soma + r.duracao_minutos,
      0
    );
    if (totalMin >= alvoMinPorDia) diasComAtividade += 1;
  }
  return diasComAtividade;
}

/** Retorna a lacuna de atividade da semana, ou null se não há meta cadastrada ou se está tudo em dia. */
export async function detectarLacunaAtividade(userId: string): Promise<LacunaAtividade | null> {
  const alvoMinPorDia = await buscarAlvoMinDiarioAtividade();
  if (!alvoMinPorDia) return null; // sem missão ATIVIDADE_MIN ativa no catálogo, não dá pra saber a meta

  const diasComAtividade = await diasComAtividadeSuficienteNaSemana(userId, alvoMinPorDia);
  if (diasComAtividade >= MINIMO_DIAS_ATIVIDADE_NA_SEMANA) return null;

  return { diasComAtividade, minimoDias: MINIMO_DIAS_ATIVIDADE_NA_SEMANA, alvoMinPorDia };
}