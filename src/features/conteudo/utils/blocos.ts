// src/features/conteudo/utils/blocos.ts
// Lógica PURA do editor em blocos (estilo Scratch) e da prévia ao vivo:
//  - categoria/cor de cada formato de passo;
//  - resumo de uma linha do bloco recolhido;
//  - conversão do RASCUNHO (o que está na tela, ainda não salvo) para o formato que a
//    prévia de uso do app do adolescente entende. Bloco incompleto vira um cartão de aviso,
//    para a prévia nunca quebrar enquanto a pessoa ainda está digitando.
import {
  paraPayloadPasso,
  validarPasso,
  type FormatoPasso,
  type LicaoEmEdicao,
  type PassoEdicao,
} from './passosEdicao';

export type CategoriaBloco = 'conteudo' | 'pergunta' | 'semNota' | 'jogo';

export const CATEGORIA_DO_FORMATO: Record<FormatoPasso, CategoriaBloco> = {
  cartao: 'conteudo',
  multipla_escolha: 'pergunta',
  verdadeiro_falso: 'pergunta',
  completar: 'pergunta',
  ordene: 'pergunta',
  associe: 'pergunta',
  classifique: 'pergunta',
  enquete: 'semNota',
  meta: 'semNota',
  memoria: 'jogo',
  prato: 'jogo',
};

export const ORDEM_CATEGORIAS: CategoriaBloco[] = ['conteudo', 'pergunta', 'semNota', 'jogo'];

export const ROTULO_CATEGORIA: Record<CategoriaBloco, string> = {
  conteudo: 'Conteúdo',
  pergunta: 'Perguntas com nota',
  semNota: 'Sem nota',
  jogo: 'Jogos',
};

/** Cores dos blocos (mesma ideia do Scratch: uma cor por tipo). `suave` é o fundo do bloco aberto. */
export const COR_CATEGORIA: Record<CategoriaBloco, { fundo: string; borda: string; suave: string }> = {
  conteudo: { fundo: '#4C97FF', borda: '#3373CC', suave: '#EAF2FF' },
  pergunta: { fundo: '#59C059', borda: '#389438', suave: '#EAF7EA' },
  semNota: { fundo: '#FFAB19', borda: '#CF8B17', suave: '#FFF4DF' },
  jogo: { fundo: '#9966FF', borda: '#774DCB', suave: '#F2ECFF' },
};

export const formatosDaCategoria = (c: CategoriaBloco): FormatoPasso[] =>
  (Object.keys(CATEGORIA_DO_FORMATO) as FormatoPasso[]).filter((f) => CATEGORIA_DO_FORMATO[f] === c);

const TAMANHO_RESUMO = 80;

/** Uma linha para o bloco recolhido. */
export function resumoDoBloco(p: PassoEdicao): string {
  const bruto = (p.enunciado ?? '').replace(/\s+/g, ' ').trim().replace(/\{lacuna\}/g, '____');
  if (!bruto) return '(vazio)';
  return bruto.length > TAMANHO_RESUMO ? `${bruto.slice(0, TAMANHO_RESUMO - 1)}…` : bruto;
}

/** Nova posição para inserir um bloco: logo depois do selecionado (ou no fim). */
export function posicaoDeInsercao(total: number, selecionado: number | null): number {
  if (selecionado === null || selecionado < 0 || selecionado >= total) return total;
  return selecionado + 1;
}

/** Para onde vai a seleção depois de remover o bloco `removido`. */
export function selecaoAposRemover(selecionado: number | null, removido: number, totalDepois: number): number | null {
  if (selecionado === null || totalDepois === 0) return null;
  if (selecionado === removido) return Math.min(removido, totalDepois - 1);
  return selecionado > removido ? selecionado - 1 : selecionado;
}

/** Para onde vai a seleção depois de mover o bloco `i` (dir = -1 sobe, +1 desce). */
export function selecaoAposMover(selecionado: number | null, i: number, dir: -1 | 1): number | null {
  if (selecionado === null) return null;
  if (selecionado === i) return i + dir;
  if (selecionado === i + dir) return i;
  return selecionado;
}

// ------------------------------------------------------------------ prévia ao vivo

export type OpcaoAoVivo = { id: string; texto: string; correta: boolean; ordem: number; categoria: string | null };
export type QuestaoAoVivo = {
  id: string;
  enunciado: string;
  formato: string;
  dadosExtra: Record<string, any>;
  opcoes: OpcaoAoVivo[];
};
/** Mesma forma de LicaoEditavel (edicaoService), sem importar o Supabase. */
export type LicaoAoVivo = {
  id: string;
  moduloId: string;
  titulo: string;
  tipo: string;
  xp: number;
  icone: string | null;
  tipoHabito: string | null;
  janelaHoras: number | null;
  conteudo: Record<string, any> | null;
  questoes: QuestaoAoVivo[];
};

/** Rascunho -> lição da prévia. `incompletos[i]` = o bloco i ainda tem problemas. */
export function paraPreviaAoVivo(l: LicaoEmEdicao): { licao: LicaoAoVivo; incompletos: boolean[] } {
  const habito = l.tipo === 'atividade_rastreavel';
  const incompletos: boolean[] = [];

  const questoes: QuestaoAoVivo[] = habito
    ? []
    : l.passos.map((p, i) => {
        const problemas = validarPasso(p);
        incompletos.push(problemas.length > 0);
        const id = `rascunho:${p.chave}`;
        if (problemas.length > 0) {
          return {
            id,
            enunciado: `Bloco ${i + 1} incompleto`,
            formato: 'cartao',
            dadosExtra: { texto: problemas.join(' ') },
            opcoes: [],
          };
        }
        const payload = paraPayloadPasso(p);
        return {
          id,
          enunciado: payload.enunciado,
          formato: payload.formato,
          dadosExtra: payload.dados_extra,
          opcoes: payload.opcoes.map((o, k) => ({
            id: `${id}:${k}`,
            texto: o.texto,
            correta: o.correta,
            ordem: k + 1,
            categoria: o.categoria,
          })),
        };
      });

  const xp = Number(l.xp);
  const janela = Number(l.janelaHoras);
  return {
    licao: {
      id: 'rascunho',
      moduloId: '',
      titulo: l.titulo.trim() || 'Sem título',
      tipo: l.tipo,
      xp: Number.isFinite(xp) ? xp : 0,
      icone: l.icone.trim() || null,
      tipoHabito: habito ? l.habito : null,
      janelaHoras: habito && Number.isFinite(janela) && janela > 0 ? janela : habito ? 24 : null,
      conteudo: { texto: l.texto.trim(), objetivo: l.objetivo.trim() },
      questoes,
    },
    incompletos,
  };
}

/** Começa a prévia no bloco `indice` (null = do início). Índice fora da lista é ajustado. */
export function recortarDesde(licao: LicaoAoVivo, indice: number | null): LicaoAoVivo {
  if (indice === null || licao.questoes.length === 0) return licao;
  const i = Math.max(0, Math.min(indice, licao.questoes.length - 1));
  return i === 0 ? licao : { ...licao, questoes: licao.questoes.slice(i) };
}

/** Texto curto e estável do que a prévia mostra: muda o conteúdo = a prévia reinicia. */
export function assinaturaAoVivo(licao: LicaoAoVivo): string {
  const texto = JSON.stringify(licao);
  let h = 5381;
  for (let i = 0; i < texto.length; i++) h = ((h << 5) + h + texto.charCodeAt(i)) | 0;
  return `${texto.length}:${(h >>> 0).toString(36)}`;
}