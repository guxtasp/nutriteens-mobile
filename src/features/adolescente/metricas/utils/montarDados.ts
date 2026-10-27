// src/features/adolescente/metricas/utils/montarDados.ts
//
// Transforma as LINHAS devolvidas pelo Supabase em `DadosBrutos`. Pura (sem rede):
// é aqui que ficam as regras de tradução (dia local, embed do PostgREST, primeira
// aparição, trilhas), para poderem ser testadas sem backend.
import type { ClassificacaoNova } from '../../alimentacao/utils/regraFeedbackRefeicao';
import type {
  ConquistaObtida, DadosBrutos, DataISO, PrimeiraAparicaoAlimento, ProgressoTrilha, RefeicaoRegistrada,
} from '../types/metricas';

/** O PostgREST devolve embed to-one como objeto; por segurança aceitamos lista de 1 item. */
type Embed<T> = T | T[] | null | undefined;

type LinhaAlimento = { id: string; nome: string; grupos_alimentares: string[] | null; classificacao_nova?: string | null };

export type LinhaRefeicao = {
  id: string;
  tipo: string;
  registros_diarios: Embed<{ data: string }>;
  refeicao_alimentos: Embed<{ alimentos: Embed<LinhaAlimento> }[]> | null;
};
export type LinhaAgua = { quantidade_ml: number; registros_diarios: Embed<{ data: string }> };
export type LinhaAtividade = { tipo_atividade: string; duracao_minutos: number; registros_diarios: Embed<{ data: string }> };
export type LinhaMissao = { data: string; xp_concedido: boolean };
export type LinhaProgresso = { licao_id: string; concluida_em: string };
export type LinhaXp = { origem: string; quantidade: number; criado_em: string };
export type LinhaInsignia = { obtida_em: string; insignias: Embed<{ nome: string }> };
export type LinhaCarta = { obtida_em: string; cartas_guia: Embed<{ titulo: string }> };
export type LinhaTrilha = { id: string; titulo: string; modulos_trilha: Embed<{ licoes: Embed<{ id: string }[]> }[]> };

export type LinhasBrutas = {
  hoje: DataISO;
  refeicoes: LinhaRefeicao[];
  /** ids de alimentos que o usuário já tinha registrado ANTES do intervalo carregado */
  alimentosVistosAntes: string[];
  /** true se a consulta de histórico anterior foi cortada: não dá para afirmar o que é "novo" */
  historicoAnteriorIncompleto: boolean;
  agua: LinhaAgua[];
  atividades: LinhaAtividade[];
  missoes: LinhaMissao[];
  progressoLicoes: LinhaProgresso[];
  xp: LinhaXp[];
  insignias: LinhaInsignia[];
  cartas: LinhaCarta[];
  trilhas: LinhaTrilha[];
  pesoKg: number | null;
};

/** Marca "visto antes do intervalo carregado": só importa ser menor que qualquer início de janela. */
export const ANTES_DO_INTERVALO: DataISO = '0001-01-01';

const lista = <T,>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);
function um<T>(x: Embed<T>): T | null {
  if (!x) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}

/**
 * Timestamp (UTC no banco) -> dia local do aparelho, a mesma regra que o app usa para
 * `registros_diarios.data` (formatarDataISO). Uma regra única evita lição "no dia seguinte".
 */
export function diaLocal(timestamp: string): DataISO {
  const d = new Date(timestamp);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const NOVAS: ClassificacaoNova[] = ['IN_NATURA', 'INGREDIENTE_CULINARIO', 'PROCESSADO', 'ULTRAPROCESSADO'];

/** Valor desconhecido ou nulo vira null: o item fica fora do termômetro em vez de ser chutado. */
function normalizarNova(v: unknown): ClassificacaoNova | null {
  return typeof v === 'string' && (NOVAS as string[]).includes(v) ? (v as ClassificacaoNova) : null;
}

export function montarDadosBrutos(l: LinhasBrutas, dia: (ts: string) => DataISO = diaLocal): DadosBrutos {
  const refeicoes: RefeicaoRegistrada[] = [];
  for (const r of l.refeicoes) {
    const data = um(r.registros_diarios)?.data;
    if (!data) continue;
    const alimentos = lista(r.refeicao_alimentos as any[])
      .map((ra: any) => um(ra.alimentos as Embed<LinhaAlimento>))
      .filter((a): a is LinhaAlimento => !!a)
      .map((a) => ({
        alimentoId: a.id,
        nome: a.nome,
        grupos: a.grupos_alimentares ?? [],
        classificacaoNova: normalizarNova(a.classificacao_nova),
      }));
    refeicoes.push({ id: r.id, data, tipo: r.tipo, alimentos });
  }

  // primeira aparição: só é afirmável se o histórico anterior foi lido por inteiro
  const vistos = new Set(l.alimentosVistosAntes);
  const primeira = new Map<string, PrimeiraAparicaoAlimento>();
  if (!l.historicoAnteriorIncompleto) {
    for (const r of refeicoes) {
      for (const a of r.alimentos) {
        const data = vistos.has(a.alimentoId) ? ANTES_DO_INTERVALO : r.data;
        const atual = primeira.get(a.alimentoId);
        if (!atual || data < atual.data) primeira.set(a.alimentoId, { alimentoId: a.alimentoId, nome: a.nome, data });
      }
    }
  }

  const agua = l.agua
    .map((a) => ({ data: um(a.registros_diarios)?.data, ml: a.quantidade_ml }))
    .filter((a): a is { data: string; ml: number } => !!a.data);
  const atividades = l.atividades
    .map((a) => ({ data: um(a.registros_diarios)?.data, tipo: a.tipo_atividade, minutos: a.duracao_minutos }))
    .filter((a): a is { data: string; tipo: string; minutos: number } => !!a.data);

  // lição -> trilha, e progresso por trilha (lições distintas concluídas / total)
  const trilhaDaLicao = new Map<string, string>();
  const totalPorTrilha = new Map<string, Set<string>>();
  for (const t of l.trilhas) {
    const ids = new Set<string>();
    for (const m of lista(t.modulos_trilha as any[])) for (const li of lista(m.licoes as any[])) ids.add(li.id);
    totalPorTrilha.set(t.id, ids);
    ids.forEach((id) => trilhaDaLicao.set(id, t.id));
  }
  const concluidasDistintas = new Set(l.progressoLicoes.map((p) => p.licao_id));
  const trilhas: ProgressoTrilha[] = l.trilhas.map((t) => {
    const ids = totalPorTrilha.get(t.id)!;
    let feitas = 0;
    ids.forEach((id) => concluidasDistintas.has(id) && feitas++);
    return { trilhaId: t.id, titulo: t.titulo, totalLicoes: ids.size, licoesConcluidas: feitas };
  });

  const conquistas: ConquistaObtida[] = [
    ...l.insignias.map((i) => ({ nome: um(i.insignias)?.nome, data: dia(i.obtida_em), tipo: 'insignia' as const })),
    ...l.cartas.map((c) => ({ nome: um(c.cartas_guia)?.titulo, data: dia(c.obtida_em), tipo: 'carta' as const })),
  ].filter((c): c is ConquistaObtida => !!c.nome);

  return {
    hoje: l.hoje,
    refeicoes,
    agua,
    metaAguaMl: null, // preenchido pelo serviço (depende de calcularMetaAguaMl)
    atividades,
    missoesDiarias: l.missoes.map((m) => ({ data: m.data, concluida: m.xp_concedido === true })),
    licoes: l.progressoLicoes.map((p) => ({ data: dia(p.concluida_em), licaoId: p.licao_id, trilhaId: trilhaDaLicao.get(p.licao_id) ?? '' })),
    // "saldo_anterior" é migração de pontos antigos, não algo que o adolescente fez no período
    xp: l.xp.filter((x) => x.origem !== 'saldo_anterior').map((x) => ({ data: dia(x.criado_em), origem: x.origem, quantidade: x.quantidade })),
    conquistas,
    trilhas,
    primeiraAparicaoAlimentos: Array.from(primeira.values()),
  };
}
