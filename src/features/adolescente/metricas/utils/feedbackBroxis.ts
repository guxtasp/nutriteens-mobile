// src/features/adolescente/metricas/utils/feedbackBroxis.ts
//
// Motor de mensagens do Broxis. Regras:
//  - toda frase nasce de um número/fato calculado; sem dado, o Broxis diz que falta dado;
//  - tom positivo e neutro: queda de um período para outro NUNCA vira cobrança;
//  - sem "bom/ruim", calorias, peso ou comparação com outras pessoas;
//  - variação determinística: a mesma semente (usuário + período) dá o mesmo texto,
//    sementes diferentes alternam as frases entre cartões e períodos.
import type { Comparacao, MetricasCompletas } from '../types/metricas';
import { formatarDiaMes } from './periodos';
import type { CartaoId } from './cartoesInfo';

export type PoseBroxis = 'aceno' | 'apresentando' | 'pensando' | 'orgulhoso' | 'supercontente' | 'surpresoPositivo' | 'curioso' | 'calmo';

export type ProximoPasso = {
  tipo: 'registrar_refeicao' | 'registrar_agua' | 'registrar_atividade' | 'continuar_trilha' | 'ver_missao';
  texto: string;
  /** título da trilha em andamento, quando o passo é continuar */
  trilhaTitulo?: string;
};

export type FeedbackBroxis = { cartao: CartaoId; pose: PoseBroxis; texto: string; proximoPasso: ProximoPasso | null };
export type ContextoFeedback = { semente: string };

export function hashTexto(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
export function escolher<T>(opcoes: T[], semente: string): T {
  return opcoes[hashTexto(semente) % opcoes.length];
}
const plural = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`;

/** Evolução em tom neutro. `sem_base` não gera frase (não há o que comparar). */
export function fraseComparacao(c: Comparacao, sing: string, plur: string): string {
  if (c.direcao === 'sem_base') return '';
  if (c.direcao === 'subiu') return `São ${c.diferenca} a mais que no período anterior.`;
  if (c.direcao === 'igual') return 'É o mesmo tanto do período anterior.';
  return `No período anterior foram ${plural(c.anterior, sing, plur)}.`;
}
const junta = (...p: string[]) => p.filter(Boolean).join(' ');

function resumo(m: MetricasCompletas, s: string): FeedbackBroxis {
  const a = m.atual;
  if (a.nivelDados === 'nenhum') {
    return {
      cartao: 'resumo', pose: 'aceno',
      texto: escolher([
        'Oi! Ainda não tenho registros seus nesse período. Quando você registrar uma refeição, água ou atividade, eu mostro como foi.',
        'Por aqui está tudo quietinho. Registre algo e eu começo a montar seu resumo!',
      ], s),
      proximoPasso: { tipo: 'registrar_refeicao', texto: 'Registre sua primeira refeição, água ou atividade.' },
    };
  }
  if (a.nivelDados === 'pouco') {
    return {
      cartao: 'resumo', pose: 'curioso',
      texto: junta(`Já tenho ${plural(a.diasAtivos, 'dia', 'dias')} com registros seus.`, 'Ainda são poucos para eu enxergar um padrão; com mais alguns, ele aparece.'),
      proximoPasso: { tipo: 'registrar_refeicao', texto: 'Registre mais um dia para eu mostrar sua evolução.' },
    };
  }
  const c = m.comparacoes.diasAtivos;
  const pose: PoseBroxis = c.direcao === 'subiu' ? 'supercontente' : c.direcao === 'igual' ? 'orgulhoso' : c.direcao === 'desceu' ? 'calmo' : 'apresentando';
  const lead = escolher([`Você teve ${plural(a.diasAtivos, 'dia', 'dias')} com registros ou lições.`, `Foram ${plural(a.diasAtivos, 'dia', 'dias')} em que você registrou algo ou fez uma lição.`], s);
  return { cartao: 'resumo', pose, texto: junta(lead, fraseComparacao(c, 'dia', 'dias') || 'Ainda não tenho o período anterior para comparar.'), proximoPasso: null };
}

function alimentacao(m: MetricasCompletas, s: string): FeedbackBroxis {
  const h = m.atual.habitos;
  if (h.diasComRefeicao === 0) {
    const temOutros = m.atual.diasAtivos > 0;
    return {
      cartao: 'alimentacao', pose: 'pensando',
      texto: temOutros
        ? 'Nesse período você registrou outras coisas, mas nenhuma refeição. Registrando refeições, eu consigo mostrar seus hábitos alimentares.'
        : 'Ainda não tenho refeições registradas nesse período. Registre uma e eu te mostro o que aprendi.',
      proximoPasso: { tipo: 'registrar_refeicao', texto: 'Registre uma refeição de hoje.' },
    };
  }
  const lead = escolher([
    `Você registrou refeições em ${plural(h.diasComRefeicao, 'dia', 'dias')}, somando ${plural(h.refeicoes, 'refeição', 'refeições')}.`,
    `Foram ${plural(h.refeicoes, 'refeição registrada', 'refeições registradas')} em ${plural(h.diasComRefeicao, 'dia', 'dias')}.`,
  ], s);
  return { cartao: 'alimentacao', pose: 'orgulhoso', texto: junta(lead, fraseComparacao(m.comparacoes.diasComRefeicao, 'dia', 'dias')), proximoPasso: null };
}

function diversidade(m: MetricasCompletas, s: string): FeedbackBroxis {
  const h = m.atual.habitos;
  if (h.alimentosDistintos === 0) {
    return {
      cartao: 'diversidade', pose: 'curioso',
      texto: 'A variedade aparece quando você registra refeições. Assim que tiver alguns registros, mostro quantos alimentos e grupos diferentes apareceram.',
      proximoPasso: { tipo: 'registrar_refeicao', texto: 'Registre uma refeição para começar.' },
    };
  }
  const base = `Apareceram ${plural(h.alimentosDistintos, 'alimento diferente', 'alimentos diferentes')} e ${plural(h.grupos.length, 'grupo alimentar', 'grupos alimentares')}.`;
  const novos = h.alimentosNovos;
  if (novos && novos.length > 0) {
    const nomes = novos.slice(0, 3).join(', ');
    const extra = novos.length > 3 ? ` e mais ${novos.length - 3}` : '';
    return { cartao: 'diversidade', pose: 'surpresoPositivo', texto: junta(base, `${novos.length === 1 ? 'Um alimento novo' : `${novos.length} alimentos novos`} pra você: ${nomes}${extra}!`), proximoPasso: null };
  }
  if (novos && novos.length === 0) {
    return {
      cartao: 'diversidade', pose: 'curioso',
      texto: junta(base, escolher(['Dessa vez não teve alimento novo no seu registro.', 'Nenhum alimento novo apareceu nesse período.'], s)),
      proximoPasso: { tipo: 'registrar_refeicao', texto: 'Quando provar algo diferente, registre para eu contar como novidade.' },
    };
  }
  return { cartao: 'diversidade', pose: 'apresentando', texto: base, proximoPasso: null };
}

function agua(m: MetricasCompletas, s: string): FeedbackBroxis {
  const a = m.atual.habitos.agua;
  if (a.diasComRegistro === 0) {
    return { cartao: 'agua', pose: 'calmo', texto: 'Não tenho registros de água nesse período. Quando você registrar, mostro como foram seus dias.', proximoPasso: { tipo: 'registrar_agua', texto: 'Registre o primeiro copo de água.' } };
  }
  if (a.diasComMeta !== null) {
    const lead = a.diasComMeta === 0
      ? `Você registrou água em ${plural(a.diasComRegistro, 'dia', 'dias')}, mas ainda sem chegar na meta.`
      : `Você chegou na meta de água em ${plural(a.diasComMeta, 'dia', 'dias')}, entre ${plural(a.diasComRegistro, 'dia', 'dias')} com registro.`;
    return { cartao: 'agua', pose: a.diasComMeta > 0 ? 'supercontente' : 'calmo', texto: junta(lead, fraseComparacao(m.comparacoes.diasComMetaAgua, 'dia', 'dias')), proximoPasso: a.diasComMeta === 0 ? { tipo: 'registrar_agua', texto: 'Um copo de cada vez já aproxima da meta.' } : null };
  }
  return { cartao: 'agua', pose: 'apresentando', texto: junta(escolher([`Você registrou água em ${plural(a.diasComRegistro, 'dia', 'dias')}.`, `Foram ${plural(a.diasComRegistro, 'dia', 'dias')} com água registrada.`], s), fraseComparacao(m.comparacoes.diasComAgua, 'dia', 'dias')), proximoPasso: null };
}

function atividade(m: MetricasCompletas): FeedbackBroxis {
  const a = m.atual.habitos.atividade;
  if (a.diasAtivos === 0) {
    return { cartao: 'atividade', pose: 'calmo', texto: 'Não tenho atividades registradas nesse período. Qualquer movimento conta, e você pode registrar quando fizer.', proximoPasso: { tipo: 'registrar_atividade', texto: 'Registre uma atividade que você gosta.' } };
  }
  const tipos = a.tiposDistintos > 1 ? ` em ${a.tiposDistintos} tipos diferentes` : '';
  return { cartao: 'atividade', pose: 'orgulhoso', texto: junta(`Você registrou ${plural(a.minutos, 'minuto', 'minutos')} de atividade em ${plural(a.diasAtivos, 'dia', 'dias')}${tipos}.`, fraseComparacao(m.comparacoes.diasAtividade, 'dia', 'dias')), proximoPasso: null };
}

function engajamento(m: MetricasCompletas): FeedbackBroxis {
  const e = m.atual.engajamento;
  const trilha = e.trilhas.emAndamento[0];
  const passoTrilha: ProximoPasso = trilha
    ? { tipo: 'continuar_trilha', texto: `Continue a trilha "${trilha.titulo}".`, trilhaTitulo: trilha.titulo }
    : { tipo: 'continuar_trilha', texto: 'Faça uma lição curta da Trilha.' };
  if (e.missoes.atribuidas === 0 && e.licoes === 0) {
    return { cartao: 'engajamento', pose: 'curioso', texto: 'Ainda não vi missões ou lições concluídas nesse período. A Trilha tem lições curtas para começar quando você quiser.', proximoPasso: passoTrilha };
  }
  const partes: string[] = [];
  if (e.missoes.atribuidas > 0) partes.push(`Você concluiu ${e.missoes.concluidas} de ${plural(e.missoes.atribuidas, 'missão do dia', 'missões do dia')}.`);
  if (e.licoes > 0) partes.push(`Terminou ${plural(e.licoes, 'lição', 'lições')} na trilha.`);
  const tudoFeito = e.missoes.atribuidas > 0 && e.missoes.concluidas === e.missoes.atribuidas;
  return {
    cartao: 'engajamento', pose: tudoFeito ? 'supercontente' : 'apresentando',
    texto: junta(...partes, fraseComparacao(m.comparacoes.licoes, 'lição', 'lições')),
    proximoPasso: e.licoes === 0 ? passoTrilha : trilha ? passoTrilha : null,
  };
}

function conquistas(m: MetricasCompletas, s: string): FeedbackBroxis {
  const ev = m.atual.evolucao;
  const ultima = ev.conquistasRecentes[0];
  if (ev.conquistasNoPeriodo > 0 && ultima) {
    return { cartao: 'conquistas', pose: 'supercontente', texto: `Você ganhou ${plural(ev.conquistasNoPeriodo, 'conquista', 'conquistas')} nesse período! A mais recente: ${ultima.nome}.`, proximoPasso: null };
  }
  if (ultima) {
    return { cartao: 'conquistas', pose: 'orgulhoso', texto: escolher([`Sua última conquista foi "${ultima.nome}", em ${formatarDiaMes(ultima.data)}.`, `A conquista mais recente que tenho é "${ultima.nome}" (${formatarDiaMes(ultima.data)}).`], s), proximoPasso: null };
  }
  return { cartao: 'conquistas', pose: 'calmo', texto: 'Ainda não há conquistas por aqui. Elas vão aparecendo conforme você registra e aprende.', proximoPasso: null };
}

export function gerarFeedbacks(m: MetricasCompletas, ctx: ContextoFeedback): Record<CartaoId, FeedbackBroxis> {
  const s = (id: CartaoId) => `${ctx.semente}|${m.atual.janela.fim}|${id}`;
  return {
    resumo: resumo(m, s('resumo')),
    alimentacao: alimentacao(m, s('alimentacao')),
    diversidade: diversidade(m, s('diversidade')),
    agua: agua(m, s('agua')),
    atividade: atividade(m),
    engajamento: engajamento(m),
    conquistas: conquistas(m, s('conquistas')),
  };
}
