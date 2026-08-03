// src/features/adolescente/services/aguaService.ts
import { supabase } from '../../../lib/supabase';
import { obterOuCriarRegistroDiario } from '../../../shared/services/registroDiarioService';

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

  return buscarConsumoAguaHoje(userId, data);
}

/** Progresso semanal/mensal (média de ml/dia) — usado nos cards de progresso */
export async function buscarMediaConsumoAgua(
  userId: string,
  diasAtras: number
): Promise<number> {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - diasAtras);
  const dataLimiteIso = dataLimite.toISOString().slice(0, 10);

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