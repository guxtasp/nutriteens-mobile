// src/features/conteudo/utils/trilhaEdicao.ts
// Regras do editor de trilha (lógica pura, sem React nem Supabase): validação dos campos,
// XP bônus, ordem da trilha e qual trilha o adolescente enxerga.

export const XP_BONUS_PADRAO_MODULO = 100; // coalesce(m.xp_bonus, 100) em migration_xp_servidor.sql
export const XP_BONUS_PADRAO_TRILHA = 125; // coalesce(t.xp_bonus, 125)
export const XP_BONUS_MAX = 1000;
export const ORDEM_TRILHA_MAX = 999;

/** '' = usar o padrão (nulo no banco); número inteiro >= 0 = valor próprio; inválido = NaN. */
export function lerXpBonus(texto: string | number | null | undefined): number | null {
  if (texto === null || texto === undefined) return null;
  const t = String(texto).trim();
  if (t === '') return null;
  return /^\d+$/.test(t) ? Number(t) : NaN;
}

function problemaXpBonus(texto: string, quem: string): string | null {
  const v = lerXpBonus(texto);
  if (v === null) return null;
  if (Number.isNaN(v) || v < 0 || v > XP_BONUS_MAX) return `O XP bônus ${quem} deve ser um número inteiro entre 0 e ${XP_BONUS_MAX} (ou vazio para usar o padrão).`;
  return null;
}

export type DadosTrilhaForm = { titulo: string; descricao: string; tema: string; ordem: string; xpBonus: string };

export function validarTrilha(d: DadosTrilhaForm): string[] {
  const erros: string[] = [];
  const titulo = d.titulo.trim();
  if (titulo.length < 3) erros.push('Dê um título com pelo menos 3 letras.');
  if (titulo.length > 120) erros.push('O título passa de 120 letras.');
  if (d.descricao.trim().length > 500) erros.push('A descrição passa de 500 letras.');
  if (!d.tema) erros.push('Escolha o tema da trilha.');
  const ordem = d.ordem.trim() === '' ? NaN : Number(d.ordem);
  if (!Number.isInteger(ordem) || ordem < 1 || ordem > ORDEM_TRILHA_MAX) erros.push(`A ordem da trilha deve ser um número inteiro entre 1 e ${ORDEM_TRILHA_MAX}.`);
  const xp = problemaXpBonus(d.xpBonus, 'da trilha');
  if (xp) erros.push(xp);
  return erros;
}

export function validarModulo(d: { titulo: string; xpBonus: string }): string[] {
  const erros: string[] = [];
  const titulo = d.titulo.trim();
  if (titulo.length < 2) erros.push('Dê um nome ao módulo (mínimo de 2 letras).');
  if (titulo.length > 120) erros.push('O nome do módulo passa de 120 letras.');
  const xp = problemaXpBonus(d.xpBonus, 'do módulo');
  if (xp) erros.push(xp);
  return erros;
}

/** Ordem sugerida para trilha nova: depois de todas as que existem (não rouba o lugar de ninguém). */
export function proximaOrdemTrilha(ordens: number[]): number {
  return Math.min(ORDEM_TRILHA_MAX, ordens.reduce((m, o) => Math.max(m, Number.isFinite(o) ? o : 0), 0) + 1);
}

export type TrilhaOrdem = { id: string; titulo: string; ordem: number; status: string; criadoEm?: string | null };

const porOrdem = (a: TrilhaOrdem, b: TrilhaOrdem) =>
  a.ordem - b.ordem || String(a.criadoEm ?? '').localeCompare(String(b.criadoEm ?? ''));

/**
 * As trilhas que o adolescente vê HOJE, na ordem do caminho: todas as publicadas (status 'aprovada'),
 * por `ordem`; empate = a mais antiga. Uma depois da outra: a seguinte só abre quando a anterior
 * termina. Espelha buscarTrilhasComProgresso (trilhaService.ts).
 */
export function trilhasVisiveisAoAdolescente(trilhas: TrilhaOrdem[]): TrilhaOrdem[] {
  return trilhas.filter((t) => t.status === 'aprovada').sort(porOrdem);
}

export type PosicaoNoCaminho = { posicao: number; total: number; antes: TrilhaOrdem | null; depois: TrilhaOrdem | null };

/**
 * Em que lugar do caminho a trilha fica (ou ficaria, quando publicada) com a `ordem` dada.
 * Trilha nova (sem id) que empata em ordem fica depois das que já existem.
 */
export function posicaoNoCaminho(
  trilhas: TrilhaOrdem[],
  atual: { id?: string; ordem: number; titulo?: string; criadoEm?: string | null }
): PosicaoNoCaminho {
  const outras = trilhasVisiveisAoAdolescente(trilhas.filter((t) => t.id !== atual.id));
  const eu: TrilhaOrdem = {
    id: atual.id ?? '__nova__',
    titulo: atual.titulo ?? '',
    ordem: atual.ordem,
    status: 'aprovada',
    criadoEm: atual.criadoEm ?? trilhas.find((t) => t.id === atual.id)?.criadoEm ?? '9999-12-31',
  };
  const fila = [...outras, eu].sort(porOrdem);
  const i = fila.findIndex((t) => t.id === eu.id);
  return { posicao: i + 1, total: fila.length, antes: fila[i - 1] ?? null, depois: fila[i + 1] ?? null };
}

/** Aviso para o formulário: a ordem escolhida coloca a trilha ANTES de outra já publicada. */
export function avisoOrdemTrilha(trilhas: TrilhaOrdem[], atual: { id?: string; ordem: number }): string | null {
  const nova = posicaoNoCaminho(trilhas, atual);
  if (!nova.depois) return null;
  // trilha já publicada que continua com o mesmo vizinho de trás: nada mudou, não avisa
  const linha = atual.id ? trilhas.find((t) => t.id === atual.id) : undefined;
  if (linha?.status === 'aprovada' && posicaoNoCaminho(trilhas, { id: linha.id, ordem: linha.ordem }).depois?.id === nova.depois.id) return null;
  return `Atenção: com esta ordem ela entra como Trilha ${nova.posicao} de ${nova.total}, antes de "${nova.depois.titulo}". Quem já avançou em "${nova.depois.titulo}" precisa concluir esta antes de continuar.`;
}

/** Frase única sobre o lugar da trilha no caminho (para o formulário e para a prévia). */
export function textoPosicaoNoCaminho(pos: PosicaoNoCaminho, publicada: boolean): string {
  const quando = publicada ? 'No app ela é' : 'Quando for publicada, será';
  const depoisDe = pos.antes ? ` Vem depois de "${pos.antes.titulo}".` : '';
  const antesDe = pos.depois ? ` Vem antes de "${pos.depois.titulo}".` : '';
  return `${quando} a Trilha ${pos.posicao} de ${pos.total} no caminho dos adolescentes (as trilhas aparecem em sequência; a seguinte só abre quando a anterior termina).${depoisDe}${antesDe}`;
}

/** Lista de ids depois de mover o item `i` (dir -1 sobe, +1 desce). Sem mudar se estiver na borda. */
export function idsAposMover(ids: string[], i: number, dir: -1 | 1): string[] {
  const j = i + dir;
  if (i < 0 || i >= ids.length || j < 0 || j >= ids.length) return ids;
  const nova = [...ids];
  [nova[i], nova[j]] = [nova[j], nova[i]];
  return nova;
}

export function textoConfirmaExclusao(nivel: 'MODULO' | 'LICAO', titulo: string, qtdLicoes = 0): string {
  if (nivel === 'LICAO') return `Excluir a lição "${titulo}" e todos os passos dela? Isso não pode ser desfeito.`;
  return qtdLicoes > 0
    ? `Excluir o módulo "${titulo}", as ${qtdLicoes} lição(ões) e todos os passos? Isso não pode ser desfeito.`
    : `Excluir o módulo "${titulo}"? Isso não pode ser desfeito.`;
}
