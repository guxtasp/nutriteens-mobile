// src/features/adolescente/metricas/utils/habitos.ts
//
// Hábitos a partir do que o adolescente REGISTROU. Alimento só conta se estiver em
// uma refeição registrada; receita/missão/conteúdo visualizado nunca entram aqui.
// Sem juízo de valor: nada de "bom/ruim", calorias, peso ou comparação corporal.
import type { DadosBrutos, DiaHabito, Janela, MetricasHabitos } from '../types/metricas';
import { dentro, listarDias } from './periodos';

export function calcularHabitos(dados: DadosBrutos, janela: Janela): MetricasHabitos {
  const refeicoes = dados.refeicoes.filter((r) => dentro(r.data, janela));
  const diasComRefeicao = new Set(refeicoes.map((r) => r.data));

  const refeicoesPorTipo: Record<string, number> = {};
  const idsAlimentos = new Set<string>();
  const diasPorGrupo = new Map<string, Set<string>>();
  for (const r of refeicoes) {
    refeicoesPorTipo[r.tipo] = (refeicoesPorTipo[r.tipo] ?? 0) + 1;
    for (const a of r.alimentos) {
      idsAlimentos.add(a.alimentoId);
      for (const g of a.grupos) {
        if (!diasPorGrupo.has(g)) diasPorGrupo.set(g, new Set());
        diasPorGrupo.get(g)!.add(r.data);
      }
    }
  }
  const grupos = Array.from(diasPorGrupo.entries())
    .map(([grupo, dias]) => ({ grupo, dias: dias.size }))
    .sort((a, b) => b.dias - a.dias || a.grupo.localeCompare(b.grupo));

  // "Novo" só faz sentido se o adolescente já tinha histórico antes do período;
  // senão tudo seria "novo" e a mensagem seria falsa.
  const primeiras = dados.primeiraAparicaoAlimentos;
  const temHistoricoAnterior = primeiras.some((p) => p.data < janela.inicio);
  const alimentosNovos = temHistoricoAnterior
    ? primeiras.filter((p) => dentro(p.data, janela)).map((p) => p.nome)
    : null;

  // água
  const aguaPorDia = new Map<string, number>();
  for (const a of dados.agua) {
    if (a.ml > 0 && dentro(a.data, janela)) aguaPorDia.set(a.data, (aguaPorDia.get(a.data) ?? 0) + a.ml);
  }
  const meta = dados.metaAguaMl && dados.metaAguaMl > 0 ? dados.metaAguaMl : null;
  const totalAgua = Array.from(aguaPorDia.values()).reduce((s, v) => s + v, 0);

  // atividade
  const ativ = dados.atividades.filter((a) => a.minutos > 0 && dentro(a.data, janela));
  const diasAtividade = new Set(ativ.map((a) => a.data));

  const porDia: DiaHabito[] = listarDias(janela).map((data) => ({
    data,
    refeicoes: refeicoes.filter((r) => r.data === data).length,
    aguaMeta: meta === null ? null : (aguaPorDia.get(data) ?? 0) >= meta,
    aguaRegistrada: aguaPorDia.has(data),
    atividade: diasAtividade.has(data),
  }));

  return {
    diasComRefeicao: diasComRefeicao.size,
    refeicoes: refeicoes.length,
    refeicoesPorTipo,
    alimentosDistintos: idsAlimentos.size,
    grupos,
    alimentosNovos,
    agua: {
      diasComRegistro: aguaPorDia.size,
      diasComMeta: meta === null ? null : Array.from(aguaPorDia.values()).filter((v) => v >= meta).length,
      mediaMlPorDiaRegistrado: aguaPorDia.size ? Math.round(totalAgua / aguaPorDia.size) : null,
    },
    atividade: {
      diasAtivos: diasAtividade.size,
      minutos: ativ.reduce((s, a) => s + a.minutos, 0),
      tiposDistintos: new Set(ativ.map((a) => a.tipo.trim().toLowerCase())).size,
    },
    porDia,
  };
}
