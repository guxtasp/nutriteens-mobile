// src/features/adolescente/social/utils/jardim.ts
//
// Regras puras do Jardim do grupo (ver data/migration_social_jardim.sql).
// A planta SÓ CRESCE: o estágio vem de `pontos`, que o banco nunca diminui.
// Textos sempre positivos: quem não regou hoje simplesmente não aparece "regado", sem aviso nem cobrança.

export type TemaJardim = 'BROCOLIS' | 'GIRASSOL' | 'TOMATEIRO' | 'LARANJEIRA' | 'HORTA';

/** `descricao` aparece na escolha da planta; a arte de cada tema é desenhada em components/PlantaJardim.tsx. */
export const TEMAS_JARDIM: { tema: TemaJardim; nome: string; descricao: string }[] = [
  { tema: 'BROCOLIS', nome: 'Brócolis', descricao: 'Vira uma cabeça verde bem fofa.' },
  { tema: 'GIRASSOL', nome: 'Girassol', descricao: 'Cresce até virar um sol gigante.' },
  { tema: 'TOMATEIRO', nome: 'Tomateiro', descricao: 'Enche de tomates vermelhinhos.' },
  { tema: 'LARANJEIRA', nome: 'Laranjeira', descricao: 'Uma árvore cheia de laranjas.' },
  { tema: 'HORTA', nome: 'Horta colorida', descricao: 'Cenoura, alface e beterraba juntas.' },
];

export const TEMAS_VALIDOS: TemaJardim[] = TEMAS_JARDIM.map((t) => t.tema);

export const MAX_MEMBROS_JARDIM = 5;
export const MAX_JARDINS_ATIVOS = 3;

export type EstagioJardim = { indice: number; nome: string; minPontos: number };

/** Pontos = dias de registro somados de todo mundo do grupo. Limiares pensados para 2 a 5 pessoas. */
export const ESTAGIOS_JARDIM: EstagioJardim[] = [
  { indice: 0, nome: 'Semente', minPontos: 0 },
  { indice: 1, nome: 'Brotinho', minPontos: 3 },
  { indice: 2, nome: 'Muda', minPontos: 8 },
  { indice: 3, nome: 'Plantinha', minPontos: 15 },
  { indice: 4, nome: 'Planta forte', minPontos: 28 },
  { indice: 5, nome: 'Florescendo', minPontos: 45 },
  { indice: 6, nome: 'Dando frutos', minPontos: 70 },
];

export const ULTIMO_ESTAGIO = ESTAGIOS_JARDIM.length - 1;

/** Nome do estágio para a planta escolhida: brócolis não "dá frutos", ele forma a cabeça. */
export function nomeDoEstagio(tema: TemaJardim, indice: number): string {
  const i = Math.min(ULTIMO_ESTAGIO, Math.max(0, Math.floor(indice)));
  if (tema === 'BROCOLIS') {
    if (i === 5) return 'Cabecinha nascendo';
    if (i === 6) return 'Brócolis pronto';
  }
  if (tema === 'HORTA' && i === 6) return 'Colheita pronta';
  if (tema === 'GIRASSOL' && i === 6) return 'Sol gigante';
  return ESTAGIOS_JARDIM[i].nome;
}

export function estagioDoJardim(pontos: number): EstagioJardim {
  const p = Math.max(0, Math.floor(pontos));
  let atual = ESTAGIOS_JARDIM[0];
  for (const e of ESTAGIOS_JARDIM) if (p >= e.minPontos) atual = e;
  return atual;
}

/** Progresso dentro do estágio atual (0 a 1) e quanto falta para o próximo. No último estágio fica cheio. */
export function progressoDoJardim(pontos: number): { fracao: number; faltam: number; proximo: EstagioJardim | null } {
  const atual = estagioDoJardim(pontos);
  const proximo = ESTAGIOS_JARDIM[atual.indice + 1] ?? null;
  if (!proximo) return { fracao: 1, faltam: 0, proximo: null };
  const p = Math.max(0, Math.floor(pontos));
  return { fracao: (p - atual.minPontos) / (proximo.minPontos - atual.minPontos), faltam: proximo.minPontos - p, proximo };
}

export type MembroJardim = { apelido: string; avatar: string | null; eu: boolean; pendente: boolean; regouHoje: boolean };
export type Jardim = {
  id: string;
  tema: TemaJardim;
  pontos: number;
  situacao: 'ativo' | 'convidado';
  convidadoPor: string | null;
  membros: MembroJardim[];
};

export function mapearJardins(bruto: unknown): Jardim[] {
  if (!Array.isArray(bruto)) return [];
  const temas = new Set<string>(TEMAS_VALIDOS);
  return bruto
    .filter((j: any) => j && j.id && temas.has(j.tema) && (j.situacao === 'ativo' || j.situacao === 'convidado'))
    .map((j: any) => ({
      id: String(j.id),
      tema: j.tema as TemaJardim,
      pontos: Math.max(0, Number(j.pontos ?? 0)),
      situacao: j.situacao,
      convidadoPor: j.convidado_por ?? null,
      membros: (Array.isArray(j.membros) ? j.membros : []).map((m: any) => ({
        apelido: String(m.apelido ?? 'Amigo'),
        avatar: m.avatar ?? null,
        eu: !!m.eu,
        pendente: !!m.pendente,
        regouHoje: !!m.regou_hoje,
      })),
    }));
}

/** Frase do dia: só celebra quem regou, nunca aponta quem faltou. */
export function textoRegaHoje(j: Jardim): string {
  const ativos = j.membros.filter((m) => !m.pendente);
  const regaram = ativos.filter((m) => m.regouHoje).length;
  const eu = ativos.find((m) => m.eu);
  if (regaram === 0) return 'O jardim está esperando a primeira regadinha de hoje.';
  if (regaram === ativos.length) return 'Todo mundo regou hoje. O jardim agradece!';
  if (eu?.regouHoje) return regaram === 1 ? 'Você regou o jardim hoje.' : `Você e mais ${regaram - 1} ${regaram - 1 === 1 ? 'amigo regaram' : 'amigos regaram'} hoje.`;
  return `${regaram} ${regaram === 1 ? 'amigo já regou' : 'amigos já regaram'} hoje. Sua regadinha chega a qualquer hora.`;
}

/** Você já regou este jardim hoje? (só os seus dados; nunca olha os dos outros) */
export function euRegueiHoje(j: Jardim): boolean {
  return j.membros.some((m) => m.eu && m.regouHoje);
}

/** Há algum jardim ATIVO que você ainda não regou hoje? Serve para tentar regar sozinho ao abrir a tela. */
export function faltaRegarHoje(jardins: Jardim[]): boolean {
  return jardins.some((j) => j.situacao === 'ativo' && !euRegueiHoje(j));
}

export type ResultadoConviteJardim =
  | 'enviado' | 'sem_amizade' | 'nao_membro' | 'cheio' | 'ja_membro' | 'limite_do_amigo';

export function mensagemConviteJardim(r: ResultadoConviteJardim, apelido?: string): string {
  const nome = apelido ?? 'seu amigo';
  switch (r) {
    case 'enviado': return `Convite enviado para ${nome}.`;
    case 'ja_membro': return `${nome} já está neste jardim (ou já foi convidado).`;
    case 'cheio': return `O jardim já tem ${MAX_MEMBROS_JARDIM} pessoas.`;
    case 'limite_do_amigo': return `${nome} já tem convites demais esperando. Tente mais tarde.`;
    default: return 'Não foi possível convidar agora.';
  }
}

export function ehErroLimiteJardim(erro: unknown): boolean {
  return ((erro as { message?: string } | null)?.message ?? '').includes('JARDIM_LIMITE');
}
