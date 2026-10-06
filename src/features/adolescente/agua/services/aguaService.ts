// src/features/adolescente/services/aguaService.ts
import { supabase } from '../../../../lib/supabase';
import { obterOuCriarRegistroDiario } from '../../../../shared/services/registroDiarioService';
import { calcularMetaAguaMl } from '../../../../shared/utils/calcularMetaAgua';
import { formatarDataISO } from '../../../../shared/utils/data';
import { registrarEvento } from '../../../../shared/analytics/analytics';

export type RegistroAguaDoDia = {
  id: string;
  quantidade_ml: number;
  horario_registro: string;
};

/** Soma o total de ml registrados hoje pelo usuário */
export async function buscarConsumoAguaHoje(userId: string, data: string): Promise<number> {
  const { data: registroDiario, error: erroDiario } = await supabase
    .from('registros_diarios')
    .select('id')
    .eq('user_id', userId)
    .eq('data', data)
    .maybeSingle();

  if (erroDiario) throw erroDiario;
  if (!registroDiario) return 0;

  const { data: registros, error: erroAgua } = await supabase
    .from('registros_agua')
    .select('quantidade_ml')
    .eq('registro_diario_id', registroDiario.id);

  if (erroAgua) throw erroAgua;
  return (registros ?? []).reduce((soma, r) => soma + r.quantidade_ml, 0);
}

/** Registra um consumo de água (ex: 200ml) e retorna o novo total do dia */
export async function registrarConsumoAgua(params: {
  userId: string;
  data: string;
  quantidadeMl: number;
}): Promise<number> {
  const { userId, data, quantidadeMl } = params;

  const registroDiarioId = await obterOuCriarRegistroDiario(userId, data);
  const horarioRegistro = new Date().toTimeString().slice(0, 8);

  const { error } = await supabase.from('registros_agua').insert({
    registro_diario_id: registroDiarioId,
    quantidade_ml: quantidadeMl,
    horario_registro: horarioRegistro,
  });

  if (error) throw error;
  registrarEvento('agua_registrada', undefined, { userId });

  return buscarConsumoAguaHoje(userId, data);
}

/** Progresso semanal/mensal (média de ml/dia) — usado nos cards de progresso */
export async function buscarMediaConsumoAgua(
  userId: string,
  diasAtras: number
): Promise<number> {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - diasAtras);
  const dataLimiteIso = formatarDataISO(dataLimite);

  const { data: registrosDiarios, error: erroDiarios } = await supabase
    .from('registros_diarios')
    .select('id, data')
    .eq('user_id', userId)
    .gte('data', dataLimiteIso);

  if (erroDiarios) throw erroDiarios;
  if (!registrosDiarios || registrosDiarios.length === 0) return 0;

  const ids = registrosDiarios.map((r) => r.id);
  const { data: registrosAgua, error: erroAgua } = await supabase
    .from('registros_agua')
    .select('quantidade_ml, registro_diario_id')
    .in('registro_diario_id', ids);

  if (erroAgua) throw erroAgua;

  const totalMl = (registrosAgua ?? []).reduce((soma, r) => soma + r.quantidade_ml, 0);
  return Math.round(totalMl / registrosDiarios.length);
}

// ---------------------------------------------------------------------
// Lacuna semanal de água — mesmo espírito das outras duas (ver
// nutrienteService.ts e atividadeService.ts), mas com meta PERSONALIZADA
// por peso (calcularMetaAguaMl), a mesma usada em useAguaHoje — em vez do
// alvo_ml genérico do catálogo. Sem peso cadastrado não dá pra calcular
// a meta real de ninguém, então a lacuna simplesmente não é avaliada
// (melhor não opinar do que usar um número que não é da pessoa).
export type LacunaAgua = { diasComAguaSuficiente: number; minimoDias: number; metaMlPorDia: number };

const MINIMO_DIAS_AGUA_NA_SEMANA = 4;

/** Conta em quantos dos últimos 7 dias o total de ml bateu a meta diária. */
export async function diasComAguaSuficienteNaSemana(userId: string, metaMlPorDia: number): Promise<number> {
  const hoje = new Date();
  const seteDiasAtras = new Date(hoje);
  seteDiasAtras.setDate(hoje.getDate() - 6);
  const seteDiasAtrasIso = formatarDataISO(seteDiasAtras);
  const hojeIso = formatarDataISO(hoje);

  const { data, error } = await supabase
    .from('registros_diarios')
    .select('data, registros_agua ( quantidade_ml )')
    .eq('user_id', userId)
    .gte('data', seteDiasAtrasIso)
    .lte('data', hojeIso);

  if (error) throw error;

  let diasComAgua = 0;
  for (const dia of data ?? []) {
    const totalMl = ((dia as any).registros_agua ?? []).reduce((soma: number, r: any) => soma + r.quantidade_ml, 0);
    if (totalMl >= metaMlPorDia) diasComAgua += 1;
  }
  return diasComAgua;
}

/** Retorna a lacuna de água da semana, ou null se não há peso cadastrado ou se está tudo em dia. */
export async function detectarLacunaAgua(userId: string): Promise<LacunaAgua | null> {
  const { data: perfil, error } = await supabase.from('profiles').select('peso_kg').eq('id', userId).single();
  if (error || !perfil?.peso_kg) return null; // sem peso, sem meta real — não avalia

  const metaMlPorDia = calcularMetaAguaMl(perfil.peso_kg);
  const diasComAguaSuficiente = await diasComAguaSuficienteNaSemana(userId, metaMlPorDia);
  if (diasComAguaSuficiente >= MINIMO_DIAS_AGUA_NA_SEMANA) return null;

  return { diasComAguaSuficiente, minimoDias: MINIMO_DIAS_AGUA_NA_SEMANA, metaMlPorDia };
}