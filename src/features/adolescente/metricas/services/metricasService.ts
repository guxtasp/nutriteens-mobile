// src/features/adolescente/metricas/services/metricasService.ts
//
// SÓ busca dados. Toda consulta filtra pelo usuário logado (além da RLS), então cada
// adolescente lê apenas o que é seu. As regras de cálculo ficam em utils/.
// Uma única carga cobre as duas janelas de 28 dias; trocar Semana/Mês não refaz consultas.
import { supabase } from '../../../../lib/supabase';
import { formatarDataISO } from '../../../../shared/utils/data';
import { calcularMetaAguaMl } from '../../../../shared/utils/calcularMetaAgua';
import { buscarGruposAlimentaresInfo } from '../../alimentacao/services/gruposAlimentaresService';
import type { DadosBrutos } from '../types/metricas';
import type { ApoioDetalhes, GruposInfo } from '../types/estado';
import type { ClassificacaoEbia } from '../../triagem/ebia/data/ebiaData';
import { valoresEbiaAceitaveis } from '../../triagem/ebia/utils/ordemEbia';
import { restricaoRecursos } from '../utils/sugestoes';
import { DIAS_DO_PERIODO, somarDias } from '../utils/periodos';
import { montarDadosBrutos, type LinhasBrutas } from '../utils/montarDados';

/** atual + anterior no maior período (28 + 28) */
export const DIAS_CARREGADOS = DIAS_DO_PERIODO.mes * 2;
const POR_PAGINA = 1000;
const LOTE_IDS = 100;

type Resposta = { data: any[] | null; error: { message: string } | null };

/** Lê todas as páginas (o Supabase corta em 1000 linhas). Exige `.order` estável na consulta. */
async function todas(montar: (de: number, ate: number) => PromiseLike<any>): Promise<any[]> {
  const linhas: any[] = [];
  for (let de = 0; ; de += POR_PAGINA) {
    const { data, error } = (await montar(de, de + POR_PAGINA - 1)) as Resposta;
    if (error) throw new Error(error.message);
    linhas.push(...(data ?? []));
    if ((data?.length ?? 0) < POR_PAGINA) return linhas;
  }
}

function checar(r: { error: { message: string } | null }): void {
  if (r.error) throw new Error(r.error.message);
}

/** Alimentos (entre `ids`) que o usuário já registrou antes de `inicio`. */
async function alimentosVistosAntes(userId: string, ids: string[], inicio: string) {
  const lotes: string[][] = [];
  for (let i = 0; i < ids.length; i += LOTE_IDS) lotes.push(ids.slice(i, i + LOTE_IDS));
  const respostas = await Promise.all(
    lotes.map((lote) =>
      supabase
        .from('refeicao_alimentos')
        .select('alimento_id, refeicoes!inner(realizada, registros_diarios!inner(user_id, data))')
        .in('alimento_id', lote)
        .eq('refeicoes.realizada', true)
        .eq('refeicoes.registros_diarios.user_id', userId)
        .lt('refeicoes.registros_diarios.data', inicio)
        .limit(POR_PAGINA),
    ),
  );
  const vistos = new Set<string>();
  let incompleto = false;
  for (const r of respostas) {
    checar(r);
    const linhas = ((r.data ?? []) as unknown) as { alimento_id: string }[];
    if (linhas.length >= POR_PAGINA) incompleto = true; // cortado: não dá para afirmar o que é novo
    linhas.forEach((x) => vistos.add(x.alimento_id));
  }
  return { vistos: Array.from(vistos), incompleto };
}

// Cache curto em memória: a Home e a tela "Minha jornada" compartilham a mesma carga.
// Vale só para o mesmo usuário e o mesmo dia; a tela de métricas sempre busca de novo.
const TTL_CACHE_MS = 2 * 60 * 1000;
let cache: { userId: string; dias: number; em: number; dados: DadosBrutos } | null = null;

/** Para a Home: reaproveita uma carga recente (que cubra `dias`), senão busca e guarda. */
export async function buscarDadosMetricasRecentes(userId: string, dias: number, ttlMs = TTL_CACHE_MS): Promise<DadosBrutos> {
  const hoje = formatarDataISO(new Date());
  if (cache && cache.userId === userId && cache.dias >= dias && cache.dados.hoje === hoje && Date.now() - cache.em < ttlMs) {
    return cache.dados;
  }
  return buscarDadosMetricas(userId, dias);
}

/** Ao sair da conta, nada de um usuário pode sobrar para o próximo. */
export function limparCacheMetricas(): void {
  cache = null;
}

/** `dias` menor serve a quem só precisa de uma janela curta (ex.: widget da Home). */
export async function buscarDadosMetricas(userId: string, dias: number = DIAS_CARREGADOS): Promise<DadosBrutos> {
  const hoje = formatarDataISO(new Date());
  const inicio = somarDias(hoje, -(dias - 1));
  const inicioTs = new Date(`${inicio}T00:00:00`).toISOString(); // meia-noite local do 1º dia

  const [refeicoes, agua, atividades, missoes, progressoLicoes, xp, insignias, cartas, trilhasR, perfil] = await Promise.all([
    todas((de, ate) =>
      supabase
        .from('refeicoes')
        .select('id, tipo, registros_diarios!inner(data, user_id), refeicao_alimentos(alimentos(id, nome, grupos_alimentares, classificacao_nova))')
        .eq('realizada', true) // exclui refeição "pulada"; o inner join exclui o recordatório da triagem
        .eq('registros_diarios.user_id', userId)
        .gte('registros_diarios.data', inicio)
        .order('id')
        .range(de, ate),
    ),
    todas((de, ate) =>
      supabase
        .from('registros_agua')
        .select('quantidade_ml, registros_diarios!inner(data, user_id)')
        .eq('registros_diarios.user_id', userId)
        .gte('registros_diarios.data', inicio)
        .order('id')
        .range(de, ate),
    ),
    todas((de, ate) =>
      supabase
        .from('registros_atividade_fisica')
        .select('tipo_atividade, duracao_minutos, registros_diarios!inner(data, user_id)')
        .eq('registros_diarios.user_id', userId)
        .gte('registros_diarios.data', inicio)
        .order('id')
        .range(de, ate),
    ),
    todas((de, ate) =>
      supabase.from('missoes_diarias').select('data, xp_concedido').eq('user_id', userId).gte('data', inicio).order('id').range(de, ate),
    ),
    // histórico inteiro: serve ao andamento das trilhas (estado atual) e às lições do período
    todas((de, ate) =>
      supabase.from('progresso_licao').select('licao_id, concluida_em').eq('usuario_id', userId).order('id').range(de, ate),
    ),
    todas((de, ate) =>
      supabase.from('xp_lancamentos').select('origem, quantidade, criado_em').eq('usuario_id', userId).gte('criado_em', inicioTs).order('id').range(de, ate),
    ),
    supabase.from('insignias_usuario').select('obtida_em, insignias(nome)').eq('usuario_id', userId).order('obtida_em', { ascending: false }).limit(100),
    supabase.from('cartas_usuario').select('obtida_em, cartas_guia(titulo)').eq('usuario_id', userId).order('obtida_em', { ascending: false }).limit(100),
    supabase.from('trilhas').select('id, titulo, modulos_trilha(licoes(id))').eq('status', 'aprovada'),
    supabase.from('profiles').select('peso_kg').eq('id', userId).maybeSingle(),
  ]);
  checar(insignias); checar(cartas); checar(trilhasR); checar(perfil);

  // histórico anterior só dos alimentos que aparecem no intervalo
  const idsNoIntervalo = Array.from(new Set(refeicoes.flatMap((r: any) =>
    (r.refeicao_alimentos ?? []).map((ra: any) => (Array.isArray(ra.alimentos) ? ra.alimentos[0] : ra.alimentos)?.id).filter(Boolean),
  ))) as string[];
  const antes = idsNoIntervalo.length
    ? await alimentosVistosAntes(userId, idsNoIntervalo, inicio)
    : { vistos: [] as string[], incompleto: false };

  const pesoBruto = (perfil.data as any)?.peso_kg;
  const peso = pesoBruto != null ? Number(pesoBruto) : null;
  const linhas: LinhasBrutas = {
    hoje,
    refeicoes,
    alimentosVistosAntes: antes.vistos,
    historicoAnteriorIncompleto: antes.incompleto,
    agua,
    atividades,
    missoes,
    progressoLicoes,
    xp,
    insignias: (insignias.data ?? []) as any,
    cartas: (cartas.data ?? []) as any,
    trilhas: (trilhasR.data ?? []) as any,
    pesoKg: peso,
  };
  const dados = montarDadosBrutos(linhas);
  // sem peso não há meta calculável: a água aparece só como "dias com registro" (não inventamos meta)
  const completos = { ...dados, diasCarregados: dias, metaAguaMl: peso && peso > 0 ? calcularMetaAguaMl(peso) : null };
  cache = { userId, dias, em: Date.now(), dados: completos };
  return completos;
}

/** Nomes amigáveis dos grupos. Falha aqui nunca derruba a tela: cai no nome humanizado. */
export async function buscarGruposInfoMetricas(): Promise<GruposInfo> {
  try {
    const info = await buscarGruposAlimentaresInfo();
    return Object.fromEntries(Object.entries(info).map(([k, v]) => [k, { titulo: v.titulo_amigavel }]));
  } catch {
    return {};
  }
}

/**
 * Contexto das dicas e sugestões de alimentos. A EBIA só FILTRA o catálogo (alimentos
 * acessíveis ao nível do adolescente, igual à tela de alimentação) e ajusta o tom; nunca
 * é devolvida como dado exibível. Sem triagem usa o nível mais conservador. Só alimentos
 * in natura, simples e do catálogo da equipe (sem os cadastrados por usuários).
 * Nunca lança: sem contexto, os detalhes aparecem sem sugestões.
 */
export async function buscarApoioDetalhes(userId: string): Promise<ApoioDetalhes> {
  try {
    const { data: perfil } = await supabase.from('profiles').select('classificacao_ebia_atual').eq('id', userId).maybeSingle();
    const classificacao = ((perfil as any)?.classificacao_ebia_atual ?? 'INSEGURANCA_GRAVE') as ClassificacaoEbia;
    const linhas = await todas((de, ate) =>
      supabase
        .from('alimentos')
        .select('id, nome, grupos_alimentares')
        .eq('classificacao_nova', 'IN_NATURA')
        .not('eh_prato_composto', 'is', true)
        .is('criado_por', null)
        .in('nivel_maximo_ebia', valoresEbiaAceitaveis(classificacao))
        .order('id')
        .range(de, ate),
    );
    return {
      restricao: restricaoRecursos(classificacao),
      alimentos: linhas.map((l: any) => ({ nome: String(l.nome), grupos: (l.grupos_alimentares ?? []) as string[] })),
    };
  } catch (e) {
    console.warn('Métricas: sugestões indisponíveis:', e);
    return { restricao: true, alimentos: [] };
  }
}
