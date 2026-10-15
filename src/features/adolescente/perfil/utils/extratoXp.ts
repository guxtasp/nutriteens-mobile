// src/features/adolescente/perfil/utils/extratoXp.ts
//
// Regras puras do extrato de pontos (RF054): rótulos por origem e agrupamento por dia.
import { formatarDataISO } from '../../../../shared/utils/data';

export type OrigemLancamento =
  | 'licao'
  | 'bonus_modulo'
  | 'bonus_trilha'
  | 'missao_diaria'
  | 'missao_periodica'
  | 'marco_sequencia'
  | 'saldo_anterior';

export type LancamentoXp = {
  id: string;
  origem: OrigemLancamento | string; // string: origem nova no banco ainda não conhecida pelo app
  quantidade: number;
  descricao: string | null;
  criadoEm: string; // ISO
};

export type DiaExtrato = {
  /** AAAA-MM-DD no fuso do aparelho */
  data: string;
  titulo: string;
  total: number;
  itens: LancamentoXp[];
};

export const ROTULO_ORIGEM: Record<OrigemLancamento, string> = {
  licao: 'Lição concluída',
  bonus_modulo: 'Bônus de módulo',
  bonus_trilha: 'Bônus de trilha',
  missao_diaria: 'Missão do dia',
  missao_periodica: 'Missão da semana/mês',
  marco_sequencia: 'Marco de sequência',
  saldo_anterior: 'Pontos anteriores',
};

export const ICONE_ORIGEM: Record<OrigemLancamento, string> = {
  licao: 'book',
  bonus_modulo: 'ribbon',
  bonus_trilha: 'trophy',
  missao_diaria: 'flag',
  missao_periodica: 'calendar',
  marco_sequencia: 'flame',
  saldo_anterior: 'archive',
};

const ICONE_PADRAO = 'star';
const ROTULO_PADRAO = 'Pontos ganhos';

export function rotuloOrigem(origem: string): string {
  return ROTULO_ORIGEM[origem as OrigemLancamento] ?? ROTULO_PADRAO;
}

export function iconeOrigem(origem: string): string {
  return ICONE_ORIGEM[origem as OrigemLancamento] ?? ICONE_PADRAO;
}

/** Texto principal da linha: a descrição gravada pelo servidor ou, sem ela, o rótulo da origem. */
export function tituloLancamento(l: Pick<LancamentoXp, 'origem' | 'descricao'>): string {
  const d = l.descricao?.trim();
  return d ? d : rotuloOrigem(l.origem);
}

export function formatarQuantidade(quantidade: number): string {
  return `+${quantidade} XP`;
}

function tituloDoDia(dataISO: string, hojeISO: string, ontemISO: string): string {
  if (dataISO === hojeISO) return 'Hoje';
  if (dataISO === ontemISO) return 'Ontem';
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  const nomeMes = new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', { month: 'long' });
  return `${dia} de ${nomeMes}`;
}

/**
 * Agrupa os lançamentos (já ordenados do mais novo para o mais antigo) por dia local,
 * com o total de XP de cada dia.
 */
export function agruparPorDia(lancamentos: LancamentoXp[], agora: Date = new Date()): DiaExtrato[] {
  const hojeISO = formatarDataISO(agora);
  const ontem = new Date(agora);
  ontem.setDate(agora.getDate() - 1);
  const ontemISO = formatarDataISO(ontem);

  const dias: DiaExtrato[] = [];
  for (const l of lancamentos) {
    const data = formatarDataISO(new Date(l.criadoEm));
    let dia = dias[dias.length - 1];
    if (!dia || dia.data !== data) {
      dia = { data, titulo: tituloDoDia(data, hojeISO, ontemISO), total: 0, itens: [] };
      dias.push(dia);
    }
    dia.itens.push(l);
    dia.total += l.quantidade;
  }
  return dias;
}

// ---------------------------------------------------------------------------
// Filtros e resumo (parte dinâmica da tela)
// ---------------------------------------------------------------------------

export type FiltroExtrato = 'todos' | 'licoes' | 'missoes' | 'sequencia';

export const FILTROS_EXTRATO: { id: FiltroExtrato; rotulo: string; icone: string }[] = [
  { id: 'todos', rotulo: 'Tudo', icone: 'apps' },
  { id: 'licoes', rotulo: 'Lições', icone: 'book' },
  { id: 'missoes', rotulo: 'Missões', icone: 'flag' },
  { id: 'sequencia', rotulo: 'Sequência', icone: 'flame' },
];

const ORIGENS_DO_FILTRO: Record<Exclude<FiltroExtrato, 'todos'>, string[]> = {
  licoes: ['licao', 'bonus_modulo', 'bonus_trilha'],
  missoes: ['missao_diaria', 'missao_periodica'],
  sequencia: ['marco_sequencia'],
};

export function filtrarLancamentos(lancamentos: LancamentoXp[], filtro: FiltroExtrato): LancamentoXp[] {
  if (filtro === 'todos') return lancamentos;
  const origens = ORIGENS_DO_FILTRO[filtro];
  return lancamentos.filter((l) => origens.includes(l.origem));
}

export type ResumoExtrato = {
  hoje: number;
  ultimos7Dias: number;
};

/** XP ganho hoje e nos últimos 7 dias (contando hoje), no fuso do aparelho. */
export function resumirPeriodos(lancamentos: LancamentoXp[], agora: Date = new Date()): ResumoExtrato {
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime();
  const inicio7Dias = inicioHoje - 6 * 86400000;
  let hoje = 0;
  let ultimos7Dias = 0;
  for (const l of lancamentos) {
    if (l.origem === 'saldo_anterior') continue; // saldo antigo não é "ganho recente"
    const t = new Date(l.criadoEm).getTime();
    if (t >= inicioHoje) hoje += l.quantidade;
    if (t >= inicio7Dias) ultimos7Dias += l.quantidade;
  }
  return { hoje, ultimos7Dias };
}

/** true se o lançamento mais antigo já carregado ainda está dentro dos últimos 7 dias (resumo pode estar incompleto). */
export function resumoPodeEstarIncompleto(lancamentos: LancamentoXp[], agora: Date = new Date()): boolean {
  if (lancamentos.length === 0) return false;
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime();
  const maisAntigo = new Date(lancamentos[lancamentos.length - 1].criadoEm).getTime();
  return maisAntigo >= inicioHoje - 6 * 86400000;
}
