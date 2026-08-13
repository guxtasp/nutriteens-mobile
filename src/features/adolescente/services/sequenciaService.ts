// src/features/adolescente/services/sequenciaService.ts
import { supabase } from '../../../lib/supabase';
import { obterOuAtribuirMissaoDoDia, avaliarMissaoDoDia, mapearMissao } from './missaoService';
import { formatarDataISO } from '../../../shared/utils/data';

export type StatusSequencia = {
  sequenciaAtual: number;
  maiorSequencia: number;
  diaDeHojeMantido: boolean;
};

async function existeRegistroNoDia(userId: string, data: string): Promise<boolean> {
  const [{ count: agua }, { count: atividade }, { count: refeicao }] = await Promise.all([
    supabase.from('registros_agua').select('id, registros_diarios!inner(user_id,data)', { count: 'exact', head: true })
      .eq('registros_diarios.user_id', userId).eq('registros_diarios.data', data),
    supabase.from('registros_atividade_fisica').select('id, registros_diarios!inner(user_id,data)', { count: 'exact', head: true })
      .eq('registros_diarios.user_id', userId).eq('registros_diarios.data', data),
    supabase.from('refeicoes').select('id, registros_diarios!inner(user_id,data)', { count: 'exact', head: true })
      .eq('registros_diarios.user_id', userId).eq('registros_diarios.data', data),
  ]);
  return (agua ?? 0) > 0 || (atividade ?? 0) > 0 || (refeicao ?? 0) > 0;
}

// versão COM efeito colateral: cria a missão do dia se ainda não existir.
// Usar só pra "hoje" (é o único dia que faz sentido atribuir missão nova).
async function diaFoiMantido(userId: string, data: string): Promise<boolean> {
  const missao = await obterOuAtribuirMissaoDoDia(userId, data);
  const missaoConcluida = await avaliarMissaoDoDia(userId, data, missao);
  if (missaoConcluida) return true;
  return existeRegistroNoDia(userId, data);
}

// versão somente-leitura: pra dias passados, na visão semanal — nunca cria
// missão nova (não faz sentido atribuir missão retroativa pra um dia que já passou).
// Se não havia missão atribuída naquele dia (ex: dia anterior a essa feature),
// cai no fallback de "existe algum registro no dia".
//
// Mantida pra compatibilidade/uso pontual, mas o WeekDaySelector usa a versão
// em lote abaixo (obterDiasQueContaramParaSequencia) — chamar isso aqui uma
// vez por dia da semana era o motivo da Home ficando lenta ao abrir.
export async function diaContouParaSequencia(userId: string, data: string): Promise<boolean> {
  const { data: missaoRow } = await supabase
    .from('missoes_diarias')
    .select('id, parametros, missoes_catalogo(tipo, titulo, descricao, icone, criterio)')
    .eq('user_id', userId)
    .eq('data', data)
    .maybeSingle();

  if (missaoRow) {
    const missao = mapearMissao(missaoRow);
    const concluida = await avaliarMissaoDoDia(userId, data, missao);
    if (concluida) return true;
  }

  return existeRegistroNoDia(userId, data);
}

// checa existência de registro em VÁRIOS dias de uma vez (3 queries no total,
// em vez de 3 por dia) — usada pela versão em lote abaixo
async function existeRegistroEmDatas(userId: string, datas: string[]): Promise<Set<string>> {
  const [agua, atividade, refeicao] = await Promise.all([
    supabase.from('registros_agua').select('registros_diarios!inner(user_id,data)')
      .eq('registros_diarios.user_id', userId).in('registros_diarios.data', datas),
    supabase.from('registros_atividade_fisica').select('registros_diarios!inner(user_id,data)')
      .eq('registros_diarios.user_id', userId).in('registros_diarios.data', datas),
    supabase.from('refeicoes').select('registros_diarios!inner(user_id,data)')
      .eq('registros_diarios.user_id', userId).in('registros_diarios.data', datas),
  ]);

  const dias = new Set<string>();
  for (const resultado of [agua, atividade, refeicao]) {
    for (const linha of (resultado.data ?? []) as any[]) {
      const data = linha.registros_diarios?.data;
      if (data) dias.add(data);
    }
  }
  return dias;
}

// versão em LOTE de diaContouParaSequencia, pra visão semanal (WeekDaySelector):
// 1 query em missoes_diarias (.in) + 3 queries de registro no total — em vez de
// até 7 × (1 a 4) queries, uma leva por dia. Só avalia a missão dia a dia quando
// o dia ainda não bateu pelo fallback de registro (early exit barato).
export async function obterDiasQueContaramParaSequencia(userId: string, datas: string[]): Promise<Set<string>> {
  if (datas.length === 0) return new Set();

  const [{ data: missoesDoPeriodo }, diasMantidos] = await Promise.all([
    supabase
      .from('missoes_diarias')
      .select('data, parametros, missoes_catalogo(tipo, titulo, descricao, icone, criterio)')
      .eq('user_id', userId)
      .in('data', datas),
    existeRegistroEmDatas(userId, datas),
  ]);

  for (const row of (missoesDoPeriodo ?? []) as any[]) {
    if (diasMantidos.has(row.data)) continue; // já contou pelo registro, não precisa avaliar a missão
    const missao = mapearMissao(row);
    const concluida = await avaliarMissaoDoDia(userId, row.data, missao);
    if (concluida) diasMantidos.add(row.data);
  }

  return diasMantidos;
}

// chamar sempre que o app abrir/HomeScreen montar
export async function sincronizarSequencia(userId: string): Promise<StatusSequencia> {
  const hoje = formatarDataISO(new Date());
  const ontem = formatarDataISO(new Date(Date.now() - 86400000));

  const { data: perfil, error } = await supabase
    .from('profiles')
    .select('sequencia_atual, maior_sequencia, ultimo_dia_mantido')
    .eq('id', userId)
    .single();
  if (error) throw error;

  let { sequencia_atual: sequenciaAtual, maior_sequencia: maiorSequencia, ultimo_dia_mantido: ultimoDia } = perfil;

  if (ultimoDia === hoje) {
    return { sequenciaAtual, maiorSequencia, diaDeHojeMantido: true };
  }

  const hojeMantido = await diaFoiMantido(userId, hoje);

  if (ultimoDia === ontem) {
    if (hojeMantido) {
      sequenciaAtual += 1;
      ultimoDia = hoje;
    }
  } else {
    sequenciaAtual = hojeMantido ? 1 : 0;
    ultimoDia = hojeMantido ? hoje : ultimoDia;
  }

  maiorSequencia = Math.max(maiorSequencia, sequenciaAtual);

  await supabase.from('profiles').update({
    sequencia_atual: sequenciaAtual,
    maior_sequencia: maiorSequencia,
    ultimo_dia_mantido: ultimoDia,
  }).eq('id', userId);

  return { sequenciaAtual, maiorSequencia, diaDeHojeMantido: hojeMantido };
}