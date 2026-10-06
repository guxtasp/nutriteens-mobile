import { supabase } from '../../../../lib/supabase';
import { concederXp } from '../../../../shared/services/xpService';
import { calcularMetaAguaMl } from '../../../../shared/utils/calcularMetaAgua';
import { META_SEMANAL } from '../../alimentacao/services/nutrienteService';
import { intervaloDoPeriodo, IntervaloPeriodo, Periodo } from '../utils/periodos';
import { Progresso } from '../utils/progresso';
import {
  calcularProgressoPeriodico,
  ContextoPeriodico,
  DefinicaoPeriodica,
  MetricaPeriodica,
  resumirDia,
} from '../utils/progressoPeriodico';

export type MissaoPeriodica = {
  def: DefinicaoPeriodica;
  progresso: Progresso;
  /** os pontos já foram creditados neste período */
  pontosCreditados: boolean;
};

export type MissoesDoPeriodo = { intervalo: IntervaloPeriodo; missoes: MissaoPeriodica[] };

const NUTRIENTES = Object.keys(META_SEMANAL);

async function buscarCatalogo(periodo: Periodo): Promise<DefinicaoPeriodica[]> {
  const { data, error } = await supabase
    .from('missoes_periodicas_catalogo')
    .select('codigo, periodo, titulo, descricao, icone, metrica, alvo, parametros, pontos_recompensa')
    .eq('periodo', periodo)
    .eq('ativa', true)
    .order('ordem');
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    codigo: r.codigo,
    periodo: r.periodo,
    titulo: r.titulo,
    descricao: r.descricao,
    icone: r.icone,
    metrica: r.metrica as MetricaPeriodica,
    alvo: r.alvo,
    parametros: r.parametros ?? {},
    pontos: r.pontos_recompensa,
  }));
}

async function buscarDias(userId: string, inicio: string, fim: string) {
  const colunas = NUTRIENTES.join(', ');
  const { data, error } = await supabase
    .from('registros_diarios')
    .select(`
      data,
      registros_agua ( quantidade_ml ),
      registros_atividade_fisica ( duracao_minutos ),
      refeicoes (
        refeicao_alimentos (
          alimentos ( classificacao_nova, grupos_alimentares, alimento_nutrientes ( ${colunas} ) )
        )
      )
    `)
    .eq('user_id', userId)
    .gte('data', inicio)
    .lte('data', fim);
  if (error) throw error;
  return (data ?? []).map((raw) => resumirDia(raw, NUTRIENTES));
}

async function buscarContexto(userId: string, inicio: string, fim: string): Promise<ContextoPeriodico> {
  const inicioTs = new Date(`${inicio}T00:00:00`).toISOString();
  const fimExclusivoTs = new Date(new Date(`${fim}T00:00:00`).getTime() + 86400000).toISOString();

  const [perfil, catalogo, licoes, missoes] = await Promise.all([
    supabase.from('profiles').select('peso_kg').eq('id', userId).single(),
    supabase.from('missoes_catalogo').select('tipo, criterio').in('tipo', ['ATIVIDADE_MIN', 'AGUA_ML']),
    supabase
      .from('progresso_licao')
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', userId)
      .gte('concluida_em', inicioTs)
      .lt('concluida_em', fimExclusivoTs),
    supabase
      .from('missoes_diarias')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('xp_concedido', true)
      .gte('data', inicio)
      .lte('data', fim),
  ]);

  const criterio = (tipo: string) => (catalogo.data ?? []).find((c: any) => c.tipo === tipo)?.criterio ?? {};
  const pesoKg = perfil.data?.peso_kg as number | null | undefined;

  return {
    // mesma meta personalizada da tela de água; sem peso, cai no valor do catálogo
    metaAguaMl: pesoKg ? calcularMetaAguaMl(pesoKg) : Number(criterio('AGUA_ML').alvo_ml) || 2000,
    alvoAtividadeMinDia: Number(criterio('ATIVIDADE_MIN').alvo_min) || 60,
    licoes: licoes.count ?? 0,
    missoesDiariasCumpridas: missoes.count ?? 0,
  };
}

/**
 * Missões do período atual com progresso real. As que acabaram de ser concluídas
 * têm os pontos creditados UMA vez (insert com chave única user+missão+período:
 * só quem "ganha a corrida" do insert concede o XP — mesmo padrão das missões do dia).
 */
export async function buscarMissoesDoPeriodo(userId: string, periodo: Periodo): Promise<MissoesDoPeriodo> {
  const intervalo = intervaloDoPeriodo(periodo);
  const [catalogo, dias, ctx, resgates] = await Promise.all([
    buscarCatalogo(periodo),
    buscarDias(userId, intervalo.inicio, intervalo.fim),
    buscarContexto(userId, intervalo.inicio, intervalo.fim),
    supabase
      .from('missoes_periodicas_resgates')
      .select('codigo')
      .eq('user_id', userId)
      .eq('periodo_inicio', intervalo.inicio),
  ]);
  if (resgates.error) throw resgates.error;

  const jaCreditados = new Set((resgates.data ?? []).map((r: any) => r.codigo as string));
  const missoes: MissaoPeriodica[] = [];

  for (const def of catalogo) {
    const progresso = calcularProgressoPeriodico(def, dias, ctx);
    let creditado = jaCreditados.has(def.codigo);

    if (progresso.concluida && !creditado) {
      const { data: inserido, error } = await supabase
        .from('missoes_periodicas_resgates')
        .upsert(
          { user_id: userId, codigo: def.codigo, periodo_inicio: intervalo.inicio, pontos: def.pontos },
          { onConflict: 'user_id,codigo,periodo_inicio', ignoreDuplicates: true },
        )
        .select('id');
      if (error) throw error;
      if (inserido && inserido.length > 0) await concederXp(userId, def.pontos);
      creditado = true;
    }

    missoes.push({ def, progresso, pontosCreditados: creditado });
  }

  return { intervalo, missoes };
}
