// src/features/adolescente/metricas/utils/retrospectiva.ts
//
// "Seu mês em resumo" (últimos 28 dias): até 3 destaques reais, escolhidos entre os que
// têm valor > 0 e de áreas diferentes, mais uma conquista do período. Sem juízo de valor
// e sem destacar o que faltou: quem não tem nada a destacar não recebe o cartão.
import type { MetricasCompletas } from '../types/metricas';
import type { CartaoId } from './cartoesInfo';
import { pluralizar } from './apresentacao';
import { fraseComparacao, hashTexto } from './feedbackBroxis';
import { formatarDiaMes } from './periodos';

export type DestaqueRetro = { cartao: CartaoId; valor: string; rotulo: string };
export type Retrospectiva = {
  titulo: string;
  periodo: string;
  destaques: DestaqueRetro[];
  conquista: string | null;
  mensagem: string;
};

export function montarRetrospectiva(m: MetricasCompletas, semente: string): Retrospectiva | null {
  if (m.tipo !== 'mes' || m.atual.nivelDados === 'nenhum') return null;
  const a = m.atual;
  const h = a.habitos;
  const e = a.engajamento;
  const n = (v: number, s: string, p: string) => ({ valor: String(v), rotulo: pluralizar(v, s, p) });

  const candidatos: { chave: string; cartao: CartaoId; v: number; s: string; p: string }[] = [
    { chave: 'dias', cartao: 'resumo', v: a.diasAtivos, s: 'dia ativo', p: 'dias ativos' },
    { chave: 'alimentos', cartao: 'diversidade', v: h.alimentosDistintos, s: 'alimento diferente', p: 'alimentos diferentes' },
    { chave: 'novos', cartao: 'diversidade', v: h.alimentosNovos?.length ?? 0, s: 'alimento novo no seu histórico', p: 'alimentos novos no seu histórico' },
    h.agua.diasComMeta === null
      ? { chave: 'agua', cartao: 'agua', v: h.agua.diasComRegistro, s: 'dia com água registrada', p: 'dias com água registrada' }
      : { chave: 'agua', cartao: 'agua', v: h.agua.diasComMeta, s: 'dia na meta de água', p: 'dias na meta de água' },
    { chave: 'min', cartao: 'atividade', v: h.atividade.minutos, s: 'minuto de atividade', p: 'minutos de atividade' },
    { chave: 'licoes', cartao: 'engajamento', v: e.licoes, s: 'lição concluída', p: 'lições concluídas' },
    { chave: 'missoes', cartao: 'engajamento', v: e.missoes.concluidas, s: 'missão concluída', p: 'missões concluídas' },
    { chave: 'conq', cartao: 'conquistas', v: a.evolucao.conquistasNoPeriodo, s: 'conquista', p: 'conquistas' },
  ];

  const ordenados = candidatos
    .filter((c) => c.v > 0)
    .sort((x, y) => hashTexto(`${semente}|${a.janela.fim}|${x.chave}`) - hashTexto(`${semente}|${a.janela.fim}|${y.chave}`));
  const usadas = new Set<CartaoId>();
  const destaques: DestaqueRetro[] = [];
  for (const c of ordenados) {
    if (usadas.has(c.cartao)) continue;
    usadas.add(c.cartao);
    destaques.push({ cartao: c.cartao, ...n(c.v, c.s, c.p) });
    if (destaques.length === 3) break;
  }
  if (destaques.length === 0) return null;

  const naJanela = a.evolucao.conquistasRecentes.find((c) => c.data >= a.janela.inicio && c.data <= a.janela.fim);
  const extra = m.comparacoes.diasAtivos.direcao === 'subiu' ? ` ${fraseComparacao(m.comparacoes.diasAtivos, 'dia ativo', 'dias ativos')}` : '';
  return {
    titulo: 'Seu mês em resumo',
    periodo: `${formatarDiaMes(a.janela.inicio)} a ${formatarDiaMes(a.janela.fim)}`,
    destaques,
    conquista: naJanela ? naJanela.nome : null,
    mensagem: `Foram ${a.diasAtivos} ${pluralizar(a.diasAtivos, 'dia', 'dias')} com algo registrado ou aprendido nos últimos ${a.janela.dias} dias. Cada registro conta, no seu ritmo!${extra}`,
  };
}
