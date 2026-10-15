// src/features/adolescente/metricas/utils/engajamento.ts
//
// Diferencia o que foi ATRIBUÍDO, CONCLUÍDO e efetivamente REGISTRADO.
// Visualizar conteúdo não é participação ativa e não entra (nem existe no cliente:
// `eventos_app` é só de escrita).
//
// Limitação conhecida: "missão concluída" = XP concedido, e o XP só é gravado quando
// o app abre Home/Missões depois da conclusão. Pode haver subcontagem em dias antigos.
import type { DadosBrutos, Janela, MetricasEngajamento } from '../types/metricas';
import { dentro, listarDias } from './periodos';

/** Dia ativo = algo foi REGISTRADO ou uma lição foi concluída. Missão atribuída não conta. */
export function acoesPorDia(dados: DadosBrutos, janela: Janela): Map<string, number> {
  const mapa = new Map<string, number>();
  const somar = (d: string) => mapa.set(d, (mapa.get(d) ?? 0) + 1);
  dados.refeicoes.forEach((r) => dentro(r.data, janela) && somar(r.data));
  dados.agua.forEach((a) => a.ml > 0 && dentro(a.data, janela) && somar(a.data));
  dados.atividades.forEach((a) => a.minutos > 0 && dentro(a.data, janela) && somar(a.data));
  dados.licoes.forEach((l) => dentro(l.data, janela) && somar(l.data));
  return mapa;
}

export function calcularEngajamento(dados: DadosBrutos, janela: Janela): MetricasEngajamento {
  const missoes = dados.missoesDiarias.filter((m) => dentro(m.data, janela));
  const licoes = new Set(dados.licoes.filter((l) => dentro(l.data, janela)).map((l) => l.licaoId));

  const xpPorOrigem: Record<string, number> = {};
  let xpNoPeriodo = 0;
  for (const x of dados.xp) {
    if (!dentro(x.data, janela)) continue;
    xpNoPeriodo += x.quantidade;
    xpPorOrigem[x.origem] = (xpPorOrigem[x.origem] ?? 0) + x.quantidade;
  }

  const acoes = acoesPorDia(dados, janela);
  return {
    missoes: { atribuidas: missoes.length, concluidas: missoes.filter((m) => m.concluida).length },
    licoes: licoes.size,
    trilhas: {
      emAndamento: dados.trilhas.filter((t) => t.licoesConcluidas > 0 && t.licoesConcluidas < t.totalLicoes),
      finalizadas: dados.trilhas.filter((t) => t.totalLicoes > 0 && t.licoesConcluidas >= t.totalLicoes).length,
    },
    xpNoPeriodo,
    xpPorOrigem,
    porDia: listarDias(janela).map((data) => ({ data, ativo: acoes.has(data), acoes: acoes.get(data) ?? 0 })),
  };
}
