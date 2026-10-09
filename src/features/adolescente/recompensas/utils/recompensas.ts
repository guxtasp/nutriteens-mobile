// src/features/adolescente/recompensas/utils/recompensas.ts
//
// Regras puras da "celebração de recompensas": quando o aluno ganha uma carta do Guia,
// uma insígnia, um marco ou uma conquista, o app mostra uma animação de comemoração.
// Aqui ficam só as decisões (sem React, sem Supabase): o que entra na fila, em que ordem,
// em quais telas pode aparecer e quando vale a pena perguntar ao servidor de novo.
import type { CartaGuia } from '../../cartas/utils/cartas';
import type { CategoriaReconhecimento, Insignia } from '../../perfil/services/gamificacaoService';

export type Recompensa =
  | { tipo: 'carta'; chave: string; carta: CartaGuia }
  | { tipo: 'insignia'; chave: string; insignia: Insignia };

/** Ordem de exibição das insígnias/marcos/conquistas: o mais "raro" por último (clímax). */
const PESO_CATEGORIA: Record<CategoriaReconhecimento, number> = { conquista: 0, marco: 1, insignia: 2 };

/**
 * Monta a fila do que deve ser comemorado: tudo que o aluno já ganhou e ainda não viu
 * (`nova`), exceto o que já foi mostrado nesta sessão. Cartas primeiro (por passo), depois
 * conquistas -> marcos -> insígnias.
 */
export function montarFilaRecompensas(
  cartas: CartaGuia[],
  insignias: Insignia[],
  jaConhecidas: ReadonlySet<string>,
): Recompensa[] {
  const dasCartas: Recompensa[] = cartas
    .filter((c) => c.obtida && c.nova)
    .sort((a, b) => a.passo - b.passo)
    .map((carta) => ({ tipo: 'carta' as const, chave: `carta:${carta.id}`, carta }));

  const dasInsignias: Recompensa[] = insignias
    .filter((i) => i.obtida && i.nova)
    .sort((a, b) => PESO_CATEGORIA[a.categoria] - PESO_CATEGORIA[b.categoria])
    .map((insignia) => ({ tipo: 'insignia' as const, chave: `insignia:${insignia.id}`, insignia }));

  return [...dasCartas, ...dasInsignias].filter((r) => !jaConhecidas.has(r.chave));
}

/** Telas em que a celebração pode aparecer (calmas, fora de lição/quiz/registro). */
export const ROTAS_PARA_CELEBRAR: ReadonlySet<string> = new Set([
  'Home',
  'Trilha',
  'Alimentacao',
  'Missoes',
  'Social',
  'Mais',
]);

/**
 * Telas que acabam de "gerar" recompensa: ao sair delas, o app pergunta na hora ao servidor
 * (sem esperar o intervalo normal). Perfil e Álbum ficam de fora de propósito: elas já
 * mostram o pontinho/etiqueta "nova" por conta própria.
 */
export const ROTAS_QUE_GERAM_RECOMPENSA: ReadonlySet<string> = new Set([
  'LicaoCompleta',
  'ModuloCompleta',
  'TrilhaCompleta',
  'FeedbackRefeicao',
  'AlimentoCadastrado',
  'ConsumoAgua',
  'AtividadeFisica',
  'Sequencia',
]);

export function rotaPermiteCelebrar(nome: string | undefined): boolean {
  return !!nome && ROTAS_PARA_CELEBRAR.has(nome);
}

/** Intervalo mínimo entre duas consultas "de rotina" ao servidor. */
export const INTERVALO_VERIFICACAO_MS = 45_000;

export function deveVerificar(params: {
  agora: number;
  ultimaVerificacao: number;
  rotaAnterior: string | undefined;
}): boolean {
  const { agora, ultimaVerificacao, rotaAnterior } = params;
  if (rotaAnterior && ROTAS_QUE_GERAM_RECOMPENSA.has(rotaAnterior)) return true;
  return agora - ultimaVerificacao >= INTERVALO_VERIFICACAO_MS;
}

type EstadoNavegacao = { index?: number; routes: { name: string; state?: unknown }[] };

/** Nome da tela que está de fato aparecendo (desce pelos navegadores aninhados). */
export function obterRotaAtiva(state: unknown): string | undefined {
  const estado = state as EstadoNavegacao | undefined;
  if (!estado?.routes?.length) return undefined;
  const rota = estado.routes[estado.index ?? estado.routes.length - 1];
  if (!rota) return undefined;
  return rota.state ? (obterRotaAtiva(rota.state) ?? rota.name) : rota.name;
}

/** Título da celebração de insígnia/marco/conquista. */
export function tituloRecompensaInsignia(categoria: CategoriaReconhecimento): string {
  if (categoria === 'insignia') return 'Nova insígnia!';
  if (categoria === 'marco') return 'Marco alcançado!';
  return 'Conquista desbloqueada!';
}
