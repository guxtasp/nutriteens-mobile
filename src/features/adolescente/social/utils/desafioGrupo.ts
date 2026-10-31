// src/features/adolescente/social/utils/desafioGrupo.ts
//
// Regras puras do Desafio em grupo (ver data/migration_social_desafio_grupo.sql).
// Métrica = hábito que qualquer um cumpre, contra a META PESSOAL de cada um (nunca volume, peso ou corpo).
// Ranking só existe no modo PODIO e é por DIAS CUMPRIDOS (máx. 7): empate é normal, ninguém aparece "em último".

export type MetricaDesafio = 'AGUA' | 'ATIVIDADE' | 'PASSOS' | 'REGISTRO';
export type ModoDesafio = 'COOPERATIVO' | 'PODIO';
export type MarcoDesafio = 'NENHUM' | 'BRONZE' | 'PRATA' | 'OURO';

export const DIAS_DESAFIO = 7;
export const MAX_MEMBROS_DESAFIO = 5;
export const MAX_DESAFIOS_ATIVOS = 3;
export const PASSOS_PADRAO = 5000;

export const METRICAS_DESAFIO: { metrica: MetricaDesafio; nome: string; frase: string; icone: string }[] = [
  { metrica: 'AGUA', nome: 'Aguinha em dia', frase: 'Bater a sua meta de água', icone: 'water' },
  { metrica: 'ATIVIDADE', nome: 'Corpo em movimento', frase: 'Bater a sua meta de atividade', icone: 'walk' },
  { metrica: 'PASSOS', nome: 'Passo a passo', frase: `Chegar a ${PASSOS_PADRAO} passos`, icone: 'footsteps' },
  { metrica: 'REGISTRO', nome: 'Dia registrado', frase: 'Registrar algo do seu dia', icone: 'create' },
];

export const METRICAS_VALIDAS: MetricaDesafio[] = METRICAS_DESAFIO.map((m) => m.metrica);

export function nomeDaMetrica(m: MetricaDesafio): string {
  return METRICAS_DESAFIO.find((x) => x.metrica === m)?.nome ?? 'Desafio';
}
export function fraseDaMetrica(m: MetricaDesafio): string {
  return METRICAS_DESAFIO.find((x) => x.metrica === m)?.frase ?? '';
}

export type ResumoDiaDesafio = { aguaMl: number; atividadeMin: number; passos: number; temRegistro: boolean };
export type MetasDiaDesafio = { metaAguaMl: number; metaAtividadeMin: number; metaPassos: number };

/** O dia de hoje cumpriu a métrica? Sempre contra a meta pessoal. */
export function diaCumpriuMetrica(metrica: MetricaDesafio, dia: ResumoDiaDesafio, metas: MetasDiaDesafio): boolean {
  switch (metrica) {
    case 'AGUA': return metas.metaAguaMl > 0 && dia.aguaMl >= metas.metaAguaMl;
    case 'ATIVIDADE': return metas.metaAtividadeMin > 0 && dia.atividadeMin >= metas.metaAtividadeMin;
    case 'PASSOS': return metas.metaPassos > 0 && dia.passos >= metas.metaPassos;
    case 'REGISTRO': return dia.temRegistro;
    default: return false;
  }
}

/** Marcos da turma, em dias por pessoa ativa (mesmos valores de _desafio_marco no banco). */
export const MARCOS: { marco: Exclude<MarcoDesafio, 'NENHUM'>; nome: string; diasPorPessoa: number }[] = [
  { marco: 'BRONZE', nome: 'Bronze', diasPorPessoa: 3 },
  { marco: 'PRATA', nome: 'Prata', diasPorPessoa: 5 },
  { marco: 'OURO', nome: 'Ouro', diasPorPessoa: 6 },
];

export function marcoAtingido(totalDias: number, ativos: number): MarcoDesafio {
  if (ativos <= 0) return 'NENHUM';
  let atual: MarcoDesafio = 'NENHUM';
  for (const m of MARCOS) if (totalDias >= m.diasPorPessoa * ativos) atual = m.marco;
  return atual;
}

/** Quanto falta para o próximo marco (em dias da turma). Em OURO: null. */
export function proximoMarco(totalDias: number, ativos: number): { marco: MarcoDesafio; nome: string; faltam: number; fracao: number } | null {
  if (ativos <= 0) return null;
  for (const m of MARCOS) {
    const alvo = m.diasPorPessoa * ativos;
    if (totalDias < alvo) return { marco: m.marco, nome: m.nome, faltam: alvo - totalDias, fracao: Math.max(0, totalDias) / alvo };
  }
  return null;
}

export type MembroDesafio = { apelido: string; avatar: string | null; eu: boolean; pendente: boolean; fezHoje: boolean; dias: number | null };
export type DesafioGrupo = {
  id: string;
  metrica: MetricaDesafio;
  modo: ModoDesafio;
  inicio: string;
  fim: string;
  encerrado: boolean;
  situacao: 'ativo' | 'convidado';
  convidadoPor: string | null;
  totalDias: number;
  meusDias: string[];
  membros: MembroDesafio[];
};

export function mapearDesafios(bruto: unknown): DesafioGrupo[] {
  if (!Array.isArray(bruto)) return [];
  const validas = new Set<string>(METRICAS_VALIDAS);
  return bruto
    .filter((d: any) => d && d.id && validas.has(d.metrica) && (d.situacao === 'ativo' || d.situacao === 'convidado'))
    .map((d: any) => ({
      id: String(d.id),
      metrica: d.metrica as MetricaDesafio,
      modo: d.modo === 'PODIO' ? 'PODIO' : 'COOPERATIVO',
      inicio: String(d.inicio),
      fim: String(d.fim),
      encerrado: !!d.encerrado,
      situacao: d.situacao,
      convidadoPor: d.convidado_por ?? null,
      totalDias: Math.max(0, Number(d.total_dias ?? 0)),
      meusDias: Array.isArray(d.meus_dias) ? d.meus_dias.map(String) : [],
      membros: (Array.isArray(d.membros) ? d.membros : []).map((m: any) => ({
        apelido: String(m.apelido ?? 'Amigo'),
        avatar: m.avatar ?? null,
        eu: !!m.eu,
        pendente: !!m.pendente,
        fezHoje: !!m.fez_hoje,
        dias: m.dias == null ? null : Math.max(0, Number(m.dias)),
      })),
    }));
}

export const ativosDoDesafio = (d: DesafioGrupo) => d.membros.filter((m) => !m.pendente);

export type LinhaPodio = { apelido: string; avatar: string | null; eu: boolean; dias: number; posicao: number };

/**
 * Pódio por DIAS CUMPRIDOS. Empate divide a posição (1, 1, 3). Só no modo PODIO e só com quem tem dias
 * conhecidos. Quem tem 0 dia entra na lista sem posição (posicao = 0): nunca "último lugar".
 */
export function montarPodio(d: DesafioGrupo): LinhaPodio[] {
  if (d.modo !== 'PODIO') return [];
  const linhas = ativosDoDesafio(d)
    .filter((m) => m.dias != null)
    .map((m) => ({ apelido: m.apelido, avatar: m.avatar, eu: m.eu, dias: m.dias as number, posicao: 0 }))
    .sort((a, b) => b.dias - a.dias || (a.eu === b.eu ? a.apelido.localeCompare(b.apelido) : a.eu ? -1 : 1));
  let anterior = -1;
  let posAnterior = 0;
  linhas.forEach((l, i) => {
    if (l.dias <= 0) { l.posicao = 0; return; }
    l.posicao = l.dias === anterior ? posAnterior : i + 1;
    anterior = l.dias;
    posAnterior = l.posicao;
  });
  return linhas;
}

export type DegrauPalco = { posicao: 1 | 2 | 3; dias: number; pessoas: LinhaPodio[] };
export type Palco = {
  /** Degraus do 1º ao 3º que têm gente (um degrau some se ninguém chegou nele). */
  degraus: DegrauPalco[];
  /** Quem cumpriu dias mas ficou abaixo do 3º degrau (4º, 5º): lista simples, sem degrau. */
  resto: LinhaPodio[];
  /** Todo mundo que apareceu no pódio empatou no mesmo número de dias. */
  empateGeral: boolean;
};

/**
 * Palco do pódio: ranking DENSO por dias cumpridos (empate divide o degrau e o próximo valor ocupa o degrau seguinte,
 * então 7, 7, 5 vira ouro, ouro, prata, e ninguém fica sem medalha por causa de um empate). Só entra quem tem pelo
 * menos 1 dia: quem tem 0 continua na lista de membros do cartão, nunca num "último lugar". Só no modo PODIO.
 */
export function montarPalco(d: DesafioGrupo): Palco {
  const vazio: Palco = { degraus: [], resto: [], empateGeral: false };
  if (d.modo !== 'PODIO') return vazio;
  const com = ativosDoDesafio(d)
    .filter((m) => m.dias != null && (m.dias as number) > 0)
    .map((m) => ({ apelido: m.apelido, avatar: m.avatar, eu: m.eu, dias: m.dias as number, posicao: 0 }))
    .sort((a, b) => b.dias - a.dias || (a.eu === b.eu ? a.apelido.localeCompare(b.apelido) : a.eu ? -1 : 1));
  if (com.length === 0) return vazio;

  const valores = Array.from(new Set(com.map((l) => l.dias))).sort((a, b) => b - a);
  const degraus: DegrauPalco[] = [];
  const resto: LinhaPodio[] = [];
  for (const l of com) {
    l.posicao = valores.indexOf(l.dias) + 1;
    if (l.posicao <= 3) {
      let g = degraus.find((x) => x.posicao === l.posicao);
      if (!g) { g = { posicao: l.posicao as 1 | 2 | 3, dias: l.dias, pessoas: [] }; degraus.push(g); }
      g.pessoas.push(l);
    } else {
      resto.push(l);
    }
  }
  degraus.sort((a, b) => a.posicao - b.posicao);
  return { degraus, resto, empateGeral: valores.length === 1 && com.length > 1 };
}

/** Frase do pódio: celebra, nunca compara nem aponta ninguém. */
export function textoDoPodio(p: Palco, acabou: boolean): string {
  const topo = p.degraus.find((g) => g.posicao === 1);
  if (!topo) return '';
  const euNoTopo = topo.pessoas.some((x) => x.eu);
  const euNoPalco = p.degraus.some((g) => g.pessoas.some((x) => x.eu)) || p.resto.some((x) => x.eu);
  if (p.empateGeral) return acabou ? 'Empate no topo! A turma toda cumpriu o mesmo tanto.' : 'Empate no topo por enquanto. Quem cumprir hoje abre vantagem.';
  if (acabou) return euNoTopo ? 'Você ficou no topo! Mandou muito bem.' : 'Cada dia cumprido contou para a turma. Valeu!';
  if (euNoTopo) return 'Você está no topo por enquanto. Dá para manter?';
  return euNoPalco ? 'Cada dia cumprido sobe você no pódio. Ainda dá tempo!' : 'Cumpra o seu dia e entre no pódio!';
}

/** Dias que faltam depois de hoje (0 = termina hoje; negativo = acabou). */
export function diasRestantes(fimISO: string, hojeISO: string): number {
  const a = new Date(`${fimISO}T00:00:00`).getTime();
  const b = new Date(`${hojeISO}T00:00:00`).getTime();
  return Math.round((a - b) / 86400000);
}

export function jaAcabou(d: DesafioGrupo, hojeISO: string): boolean {
  return d.encerrado || d.fim < hojeISO;
}

/** Convite só vale nos 2 primeiros dias (igual ao banco). */
export function podeConvidar(d: DesafioGrupo, hojeISO: string): boolean {
  const limite = new Date(`${d.inicio}T00:00:00`);
  limite.setDate(limite.getDate() + 1);
  const y = limite.getFullYear();
  const m = String(limite.getMonth() + 1).padStart(2, '0');
  const dia = String(limite.getDate()).padStart(2, '0');
  return hojeISO <= `${y}-${m}-${dia}` && d.membros.length < MAX_MEMBROS_DESAFIO && !d.encerrado;
}

/** Frase do dia: só celebra, nunca aponta quem faltou. */
export function textoDoDia(d: DesafioGrupo): string {
  const ativos = ativosDoDesafio(d);
  const fizeram = ativos.filter((m) => m.fezHoje).length;
  const eu = ativos.find((m) => m.eu);
  if (fizeram === 0) return 'A turma ainda está começando o dia. Bora?';
  if (fizeram === ativos.length) return 'Todo mundo cumpriu hoje. Que turma!';
  if (eu?.fezHoje) return fizeram === 1 ? 'Você cumpriu o dia de hoje.' : `Você e mais ${fizeram - 1} ${fizeram - 1 === 1 ? 'amigo cumpriram' : 'amigos cumpriram'} hoje.`;
  return `${fizeram} ${fizeram === 1 ? 'amigo já cumpriu' : 'amigos já cumpriram'} hoje. O seu dia chega a qualquer hora.`;
}

export type ResultadoConviteDesafio = 'enviado' | 'sem_amizade' | 'nao_membro' | 'cheio' | 'ja_membro' | 'limite_do_amigo' | 'encerrado';

export function mensagemConviteDesafio(r: ResultadoConviteDesafio, apelido?: string): string {
  const nome = apelido ?? 'seu amigo';
  switch (r) {
    case 'enviado': return `Convite enviado para ${nome}.`;
    case 'ja_membro': return `${nome} já está neste desafio (ou já foi convidado).`;
    case 'cheio': return `O desafio já tem ${MAX_MEMBROS_DESAFIO} pessoas.`;
    case 'limite_do_amigo': return `${nome} já tem convites demais esperando. Tente mais tarde.`;
    case 'encerrado': return 'Os convites só valem nos 2 primeiros dias do desafio.';
    default: return 'Não foi possível convidar agora.';
  }
}

export function ehErroLimiteDesafio(erro: unknown): boolean {
  return ((erro as { message?: string } | null)?.message ?? '').includes('DESAFIO_LIMITE');
}
