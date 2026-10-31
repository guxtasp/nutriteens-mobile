// src/features/adolescente/social/services/desafioGrupoService.ts
// Camada fina sobre as funções desafio_* (data/migration_social_desafio_grupo.sql).
// O app confere a meta do dia nos dados da PRÓPRIA pessoa e só avisa o banco "hoje cumprido".
import { supabase } from '../../../../lib/supabase';
import { calcularMetaAguaMl } from '../../../../shared/utils/calcularMetaAgua';
import { registrarEvento } from '../../../../shared/analytics/analytics';
import { mapearTrofeus, type Trofeu } from '../utils/trofeu';
import {
  PASSOS_PADRAO, diaCumpriuMetrica, mapearDesafios,
  type DesafioGrupo, type MetricaDesafio, type ModoDesafio, type ResultadoConviteDesafio, type ResumoDiaDesafio,
} from '../utils/desafioGrupo';

export async function listarDesafios(): Promise<DesafioGrupo[]> {
  const { data, error } = await supabase.rpc('desafio_listar');
  if (error) throw error;
  return mapearDesafios(data);
}

/** Troféus da temporada de quem chama. Se a migration ainda não foi rodada, devolve lista vazia (a tela segue normal). */
export async function listarTrofeus(): Promise<Trofeu[]> {
  const { data, error } = await supabase.rpc('desafio_trofeus_listar');
  if (error) return [];
  return mapearTrofeus(data);
}

export async function criarDesafio(metrica: MetricaDesafio, modo: ModoDesafio): Promise<string> {
  const { data, error } = await supabase.rpc('desafio_criar', { p_metrica: metrica, p_modo: modo });
  if (error) throw error;
  registrarEvento('desafio_grupo_criado', { metrica, modo });
  return data as string;
}

export async function convidarParaDesafio(desafioId: string, amizadeId: string): Promise<ResultadoConviteDesafio> {
  const { data, error } = await supabase.rpc('desafio_convidar', { p_desafio: desafioId, p_amizade_id: amizadeId });
  if (error) throw error;
  return data as ResultadoConviteDesafio;
}

export async function responderConviteDesafio(desafioId: string, aceitar: boolean): Promise<boolean> {
  const { data, error } = await supabase.rpc('desafio_responder', { p_desafio: desafioId, p_aceitar: aceitar });
  if (error) throw error;
  if (aceitar && data === true) registrarEvento('desafio_grupo_aceito');
  return data === true;
}

export async function sairDoDesafio(desafioId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('desafio_sair', { p_desafio: desafioId });
  if (error) throw error;
  return data === true;
}

export async function renovarDesafio(desafioId: string): Promise<string> {
  const { data, error } = await supabase.rpc('desafio_renovar', { p_desafio: desafioId });
  if (error) throw error;
  registrarEvento('desafio_grupo_renovado');
  return data as string;
}

/** Resumo de HOJE (só água, atividade, passos e se há registro) + metas pessoais. */
async function resumoEMetasDeHoje(userId: string, hojeISO: string) {
  const [dia, perfil, catalogo] = await Promise.all([
    supabase
      .from('registros_diarios')
      .select('data, registros_agua ( quantidade_ml ), registros_atividade_fisica ( duracao_minutos, quantidade_passos ), refeicoes ( id )')
      .eq('user_id', userId)
      .eq('data', hojeISO)
      .maybeSingle(),
    supabase.from('profiles').select('peso_kg').eq('id', userId).single(),
    supabase.from('missoes_catalogo').select('tipo, criterio').in('tipo', ['ATIVIDADE_MIN', 'AGUA_ML']),
  ]);
  if (dia.error) throw dia.error;
  const raw: any = dia.data ?? {};
  const agua = (raw.registros_agua ?? []).reduce((s: number, r: any) => s + (r.quantidade_ml ?? 0), 0);
  const ativ = (raw.registros_atividade_fisica ?? []).reduce((s: number, r: any) => s + (r.duracao_minutos ?? 0), 0);
  const passos = (raw.registros_atividade_fisica ?? []).reduce((s: number, r: any) => s + (r.quantidade_passos ?? 0), 0);
  const resumo: ResumoDiaDesafio = { aguaMl: agua, atividadeMin: ativ, passos, temRegistro: agua > 0 || ativ > 0 || (raw.refeicoes ?? []).length > 0 };

  const criterio = (tipo: string) => (catalogo.data ?? []).find((c: any) => c.tipo === tipo)?.criterio ?? {};
  const pesoKg = perfil.data?.peso_kg as number | null | undefined;
  const metas = {
    // mesma meta personalizada da tela de água e das missões semanais
    metaAguaMl: pesoKg ? calcularMetaAguaMl(pesoKg) : Number(criterio('AGUA_ML').alvo_ml) || 2000,
    metaAtividadeMin: Number(criterio('ATIVIDADE_MIN').alvo_min) || 60,
    metaPassos: PASSOS_PADRAO,
  };
  return { resumo, metas };
}

/**
 * Para cada desafio ativo ainda sem o dia de hoje marcado, confere a meta pessoal e marca se cumpriu.
 * Idempotente e silencioso em caso de erro (nunca bloqueia a tela). Devolve quantos dias foram marcados agora.
 */
export async function sincronizarDesafiosHoje(userId: string, hojeISO: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('desafio_pendentes_hoje');
    if (error) throw error;
    const pendentes = (Array.isArray(data) ? data : []) as { id: string; metrica: MetricaDesafio }[];
    if (pendentes.length === 0) return 0;
    const { resumo, metas } = await resumoEMetasDeHoje(userId, hojeISO);
    let marcados = 0;
    for (const p of pendentes) {
      if (!diaCumpriuMetrica(p.metrica, resumo, metas)) continue;
      const { data: ok, error: e2 } = await supabase.rpc('desafio_marcar_hoje', { p_desafio: p.id });
      if (e2) throw e2;
      if (ok === true) marcados += 1;
    }
    return marcados;
  } catch (e) {
    console.error('Erro ao sincronizar o desafio em grupo:', e);
    return 0;
  }
}
