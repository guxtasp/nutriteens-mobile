// src/features/conteudo/utils/previa.ts
// Lógica pura da pré-visualização (sem React nem Supabase): converte o que a equipe lê para o
// formato que os componentes do ADOLESCENTE esperam, monta o mapa da trilha e aponta lacunas.
// Tipos locais e estruturais de propósito: não importam o app do adolescente (nem o Supabase).
import { XP_BONUS_PADRAO_MODULO, XP_BONUS_PADRAO_TRILHA } from './trilhaEdicao';

export type OpcaoPrevia = { id?: string; texto: string; correta: boolean; ordem?: number; categoria?: string | null };
export type QuestaoPrevia = { id: string; enunciado: string; formato: string; dadosExtra: Record<string, any>; opcoes: OpcaoPrevia[] };

/** Questões no formato de QuestaoQuiz (trilhaService): ids garantidos, ordem 1..n, opções por ordem. */
export function paraQuestoesDoApp(questoes: QuestaoPrevia[]) {
  return questoes.map((q, i) => ({
    id: q.id,
    enunciado: q.enunciado,
    ordem: i + 1,
    formato: q.formato,
    dadosExtra: q.dadosExtra ?? {},
    opcoes: [...(q.opcoes ?? [])]
      .map((o, k) => ({ o, k }))
      .sort((a, b) => (a.o.ordem ?? a.k + 1) - (b.o.ordem ?? b.k + 1))
      .map(({ o }, k) => ({
        id: o.id ?? `${q.id}:${k}`,
        texto: o.texto,
        correta: !!o.correta,
        ordem: k + 1,
        categoria: o.categoria ?? null,
      })),
  }));
}

/** A lição roda como sessão de passos no app? (mesma regra de LicaoDetalheScreen). */
export function usaSessaoDePassos(tipo: string, qtdPassos: number): boolean {
  return tipo === 'quiz' || (tipo === 'conteudo' && qtdPassos > 0);
}

export type LicaoDaPrevia = { id: string; titulo: string; ordem: number; tipo: string; xp: number; icone?: string | null; passos?: number };
export type ModuloDaPrevia = { id: string; titulo: string; ordem: number; xpBonus: number | null; licoes: LicaoDaPrevia[] };
export type TrilhaDaPrevia = { id: string; titulo: string; xpBonus: number | null; modulos: ModuloDaPrevia[] };

/**
 * Mapa da trilha como um adolescente NOVO vê: só a primeira lição está liberada, o resto bloqueado.
 * (Na prévia a equipe pode tocar em qualquer nó para abrir a lição.)
 */
export function gruposDoCaminho(trilha: TrilhaDaPrevia, numeroTrilha = 1) {
  let primeiro = true;
  return trilha.modulos.map((m, indice) => ({
    moduloId: m.id,
    titulo: m.titulo,
    // a prévia mostra UMA trilha: o primeiro módulo é o começo dela
    trilhaId: trilha.id,
    tituloTrilha: trilha.titulo,
    numeroTrilha,
    inicioDeTrilha: indice === 0,
    nos: m.licoes.map((l) => {
      const status = primeiro ? ('atual' as const) : ('bloqueada' as const);
      primeiro = false;
      return { id: l.id, moduloId: m.id, status, icone: l.icone ?? null, tipo: l.tipo as 'conteudo' | 'quiz' | 'atividade_rastreavel' };
    }),
  }));
}

export function resumoTrilha(trilha: TrilhaDaPrevia) {
  const licoes = trilha.modulos.flatMap((m) => m.licoes);
  const xpLicoes = licoes.reduce((s, l) => s + (l.xp || 0), 0);
  const xpBonusModulos = trilha.modulos.reduce((s, m) => s + (m.xpBonus ?? XP_BONUS_PADRAO_MODULO), 0);
  const xpBonusTrilha = trilha.xpBonus ?? XP_BONUS_PADRAO_TRILHA;
  return {
    modulos: trilha.modulos.length,
    licoes: licoes.length,
    passos: licoes.reduce((s, l) => s + (l.passos ?? 0), 0),
    xpLicoes,
    xpBonusModulos,
    xpBonusTrilha,
    xpTotal: xpLicoes + xpBonusModulos + xpBonusTrilha,
  };
}

/** Lacunas objetivas que a equipe deve ver antes de aprovar/publicar a trilha. */
export function alertasTrilha(trilha: TrilhaDaPrevia): string[] {
  const alertas: string[] = [];
  if (trilha.modulos.length === 0) alertas.push('A trilha não tem módulos.');
  for (const m of trilha.modulos) {
    if (m.licoes.length === 0) alertas.push(`O módulo "${m.titulo}" não tem lições.`);
    for (const l of m.licoes) {
      if (l.tipo === 'quiz' && (l.passos ?? 0) === 0) alertas.push(`A lição "${l.titulo}" é um quiz sem passos.`);
    }
  }
  return alertas;
}

export type ReceitaDaPrevia = {
  fotoUrl: string | null;
  modoPreparo: string;
  tempoPreparoMin: number | null;
  porcoes: number | null;
  ingredientes: number;
  passos: number;
};

/** Itens que a receita ainda não tem e que o adolescente notaria (não bloqueiam, só avisam). */
export function lacunasReceita(r: ReceitaDaPrevia): string[] {
  const l: string[] = [];
  if (r.ingredientes === 0) l.push('Sem ingredientes cadastrados: a seção "Ingredientes" não aparece para o adolescente.');
  if (r.passos === 0) l.push('Sem passo a passo: o botão de preparo avisa que não há passos.');
  if (!r.fotoUrl) l.push('Sem foto: o adolescente vê um ícone no lugar.');
  if (!r.tempoPreparoMin) l.push('Sem tempo de preparo: o tempo não é mostrado.');
  if (!r.porcoes) l.push('Sem número de porções.');
  if (r.modoPreparo.trim().length < 10) l.push('Modo de preparo muito curto.');
  return l;
}
