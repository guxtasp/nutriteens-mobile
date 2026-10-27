// src/features/adolescente/metricas/utils/detalhes.ts
//
// Conteúdo do "Ver detalhes" de cada cartão: números de apoio, dicas práticas e sugestões.
// Tudo sai dos dados reais; dica só aparece quando uma condição dos dados a justifica.
// Sem juízo de valor, sem calorias/peso e sem pedir que o adolescente coma ou compre algo.
import type { GruposInfo } from '../types/estado';
import type { MetricasCompletas } from '../types/metricas';
import type { CartaoId } from './cartoesInfo';
import { humanizarGrupo, pluralizar } from './apresentacao';
import { formatarDiaMes } from './periodos';
import { selecionarSugestoes, type AlimentoSugestao } from './sugestoes';
import { celebracaoMelhorSemana, linhaMelhorSemana, type MelhorSemana } from './melhorPeriodo';

export type LinhaDetalhe = { rotulo: string; valor: string };
export type Detalhe = {
  linhas: LinhaDetalhe[];
  dicas: string[];
  sugestoes?: { titulo: string; alimentos: string[] }[];
};
export type ContextoDetalhes = {
  restricao: boolean;
  alimentos: AlimentoSugestao[];
  gruposInfo?: GruposInfo;
  semente: string;
  /** melhor semana do próprio histórico (opcional) */
  melhores?: MelhorSemana[];
};

const NOME_REFEICAO: Record<string, string> = {
  CAFE_DA_MANHA: 'Café da manhã', LANCHE_MANHA: 'Lanche da manhã', ALMOCO: 'Almoço',
  LANCHE_TARDE: 'Lanche da tarde', JANTAR: 'Jantar', CEIA: 'Ceia',
};
const decimal = (n: number) => n.toFixed(1).replace('.', ',');

export function montarDetalhes(m: MetricasCompletas, ctx: ContextoDetalhes): Record<CartaoId, Detalhe> {
  const a = m.atual;
  const h = a.habitos;
  const e = a.engajamento;
  const total = a.janela.dias;

  const melhor = (c: MelhorSemana['chave']) => ctx.melhores?.find((x) => x.chave === c);
  const mDias = melhor('diasAtivos');
  const mVar = melhor('variedade');

  // ---- resumo
  const areas = [
    { nome: 'refeição', dias: h.diasComRefeicao },
    { nome: 'água', dias: h.agua.diasComRegistro },
    { nome: 'atividade', dias: h.atividade.diasAtivos },
  ];
  const faltando = areas.find((x) => x.dias === 0);
  const resumoDicas: string[] = [];
  if (mDias?.atual) resumoDicas.push(celebracaoMelhorSemana(mDias));
  if (a.diasAtivos > 0 && faltando && areas.some((x) => x.dias > 0)) {
    resumoDicas.push(`Você ainda não registrou ${faltando.nome} neste período. Registrar leva menos de um minuto e ajuda a ver o quadro completo.`);
  } else if (a.diasAtivos > 0 && !faltando) {
    resumoDicas.push('Você usou refeição, água e atividade neste período. Assim o quadro fica completo!');
  }

  // ---- alimentação
  const tipos = Object.entries(h.refeicoesPorTipo).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]));
  const alimDicas: string[] = [];
  if (h.refeicoes > 0 && tipos.length < 3) {
    alimDicas.push('Registrar também lanches e outras refeições ajuda o Bróxis a entender sua rotina. Registre só o que realmente aconteceu.');
  }
  if (h.diasComRefeicao > 0 && h.diasComRefeicao * 2 < total) {
    alimDicas.push('Registrar logo depois de comer ajuda a lembrar de tudo.');
  }

  // ---- diversidade
  const presentes = h.grupos.map((g) => g.grupo);
  const sugGrupos = selecionarSugestoes(ctx.alimentos, presentes, `${ctx.semente}|${a.janela.fim}`);
  const sugestoes = sugGrupos.map((s) => ({ titulo: ctx.gruposInfo?.[s.grupo]?.titulo ?? humanizarGrupo(s.grupo), alimentos: s.alimentos }));
  const divLinhas: LinhaDetalhe[] = [
    { rotulo: 'Alimentos diferentes', valor: String(h.alimentosDistintos) },
    { rotulo: 'Grupos alimentares que apareceram', valor: String(h.grupos.length) },
  ];
  if (h.alimentosNovos !== null) {
    divLinhas.push({ rotulo: 'Alimentos novos no seu histórico', valor: String(h.alimentosNovos.length) });
    if (h.alimentosNovos.length > 0) divLinhas.push({ rotulo: 'Os novos foram', valor: h.alimentosNovos.slice(0, 3).join(', ') });
  }
  if (mVar) divLinhas.push(linhaMelhorSemana(mVar));
  const divDicas: string[] = [];
  if (mVar?.atual) divDicas.push(celebracaoMelhorSemana(mVar));
  if (h.alimentosDistintos > 0 && sugestoes.length > 0) {
    divDicas.push(ctx.restricao
      ? 'Para variar, vale olhar o que já está disponível para você em casa ou na escola, nestes grupos. Registre só se você comer de verdade.'
      : 'Que tal incluir um destes em alguma refeição? Registre só se você comer de verdade.');
  }

  // ---- água
  const aguaLinhas: LinhaDetalhe[] = [{ rotulo: 'Dias com água registrada', valor: String(h.agua.diasComRegistro) }];
  if (h.agua.diasComMeta !== null) aguaLinhas.push({ rotulo: 'Dias em que chegou na meta', valor: String(h.agua.diasComMeta) });
  if (h.agua.mediaMlPorDiaRegistrado !== null) aguaLinhas.push({ rotulo: 'Média nos dias com registro', valor: `${h.agua.mediaMlPorDiaRegistrado} ml` });
  const aguaDicas: string[] = [];
  if (h.agua.diasComMeta !== null && h.agua.diasComRegistro > h.agua.diasComMeta) {
    aguaDicas.push('Em alguns dias você registrou água, mas faltou um pouco para a meta. Um copo ao acordar e outro junto das refeições ajudam.');
  }
  if (h.agua.diasComRegistro > 0 && h.agua.diasComRegistro * 2 < total) {
    aguaDicas.push('Registrar na hora em que bebe evita esquecer.');
  }

  // ---- atividade
  const at = h.atividade;
  const ativLinhas: LinhaDetalhe[] = [
    { rotulo: 'Dias com atividade', valor: String(at.diasAtivos) },
    { rotulo: 'Minutos registrados', valor: String(at.minutos) },
    { rotulo: 'Atividades diferentes', valor: String(at.tiposDistintos) },
  ];
  if (at.diasAtivos > 0) ativLinhas.push({ rotulo: 'Média por dia com atividade', valor: `${Math.round(at.minutos / at.diasAtivos)} min` });
  const ativDicas: string[] = [];
  if (at.diasAtivos > 0 && at.tiposDistintos === 1) {
    ativDicas.push('Você repetiu a mesma atividade. Variar com caminhada, dança, pular corda ou brincadeira de pique deixa mais divertido e não custa nada.');
  } else if (at.diasAtivos > 0) {
    ativDicas.push('Qualquer movimento conta: caminhar, dançar ou brincar.');
  }

  // ---- engajamento
  const engLinhas: LinhaDetalhe[] = [
    { rotulo: 'Missões do dia atribuídas', valor: String(e.missoes.atribuidas) },
    { rotulo: 'Missões concluídas', valor: String(e.missoes.concluidas) },
    { rotulo: 'Lições concluídas', valor: String(e.licoes) },
    { rotulo: 'Pontos ganhos no período', valor: String(e.xpNoPeriodo) },
  ];
  e.trilhas.emAndamento.forEach((t) => engLinhas.push({ rotulo: t.titulo, valor: `${t.licoesConcluidas} de ${t.totalLicoes} lições` }));
  if (e.trilhas.finalizadas > 0) engLinhas.push({ rotulo: 'Trilhas finalizadas', valor: String(e.trilhas.finalizadas) });
  const engDicas: string[] = [];
  const perto = e.trilhas.emAndamento.find((t) => t.totalLicoes - t.licoesConcluidas <= 3);
  if (perto) {
    const f = perto.totalLicoes - perto.licoesConcluidas;
    engDicas.push(`Falta${f === 1 ? '' : 'm'} só ${f} ${pluralizar(f, 'lição', 'lições')} em "${perto.titulo}".`);
  } else if (e.trilhas.emAndamento.length > 0) {
    engDicas.push('Siga a trilha no seu ritmo: uma lição de cada vez já conta.');
  }

  // ---- conquistas
  const conqLinhas: LinhaDetalhe[] = a.evolucao.conquistasRecentes.map((c) => ({
    rotulo: c.tipo === 'carta' ? 'Carta' : 'Insígnia',
    valor: `${c.nome} · ${formatarDiaMes(c.data)}`,
  }));

  return {
    resumo: { linhas: [
      { rotulo: 'Dias com refeição registrada', valor: String(h.diasComRefeicao) },
      { rotulo: 'Dias com água registrada', valor: String(h.agua.diasComRegistro) },
      { rotulo: 'Dias com atividade', valor: String(at.diasAtivos) },
      { rotulo: 'Lições concluídas', valor: String(e.licoes) },
      ...(mDias ? [linhaMelhorSemana(mDias)] : []),
    ], dicas: resumoDicas },
    alimentacao: { linhas: [
      { rotulo: 'Refeições registradas', valor: String(h.refeicoes) },
      ...(h.diasComRefeicao > 0 ? [{ rotulo: 'Média por dia com registro', valor: decimal(h.refeicoes / h.diasComRefeicao) }] : []),
      ...tipos.map(([t, n]) => ({ rotulo: NOME_REFEICAO[t] ?? humanizarGrupo(t), valor: String(n) })),
    ], dicas: alimDicas },
    diversidade: { linhas: divLinhas, dicas: divDicas, sugestoes: sugestoes.length ? sugestoes : undefined },
    agua: { linhas: aguaLinhas, dicas: aguaDicas },
    atividade: { linhas: ativLinhas, dicas: ativDicas },
    engajamento: { linhas: engLinhas, dicas: engDicas },
    conquistas: { linhas: conqLinhas, dicas: [] },
  };
}
