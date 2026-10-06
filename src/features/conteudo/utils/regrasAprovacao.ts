// Regras de aprovação de conteúdo — lógica pura (sem Supabase).
// O banco é quem GARANTE (ver data/migration_revisao_trilhas.sql); isto só
// decide o que a tela mostra/permite e é reaproveitado pelo editor.

export type Papel = 'ADOLESCENTE' | 'NUTRICIONISTA' | 'ADMINISTRADOR';
export type StatusTrilha = 'rascunho' | 'aprovada';
export type DecisaoRevisao = 'APROVADA' | 'DEVOLVIDA';

/** Só a nutricionista aprova (inclusive o que ela mesma criou). */
export function podeAprovar(papel: Papel | null | undefined): boolean {
  return papel === 'NUTRICIONISTA';
}

/** Quem pode criar/editar conteúdo. */
export function podeEditarConteudo(papel: Papel | null | undefined): boolean {
  return papel === 'NUTRICIONISTA' || papel === 'ADMINISTRADOR';
}

/** Status com que o conteúdo nasce: da nutricionista já vale; do admin espera revisão. */
export function statusAoCriar(papel: Papel): StatusTrilha {
  return papel === 'NUTRICIONISTA' ? 'aprovada' : 'rascunho';
}

/** Depois de editar: admin mexeu em conteúdo aprovado -> volta pra revisão; nutricionista mantém. */
export function statusAposEdicao(papel: Papel, statusAtual: StatusTrilha): StatusTrilha {
  if (statusAtual === 'rascunho') return 'rascunho';
  return papel === 'NUTRICIONISTA' ? 'aprovada' : 'rascunho';
}

/** Devolver/despublicar exige motivo. Retorna a mensagem de erro, ou null se ok. */
export function validarComentarioDevolucao(texto: string): string | null {
  const t = texto.trim();
  if (t.length === 0) return 'Explique o que precisa mudar para quem criou o conteúdo.';
  if (t.length > 2000) return 'O comentário passou de 2000 caracteres.';
  return null;
}

export type SeloTrilha = { texto: string; tom: 'ok' | 'pendente' | 'devolvida' };

/** Selo exibido na lista, a partir do status e da decisão mais recente (se houver). */
export function seloDaTrilha(status: StatusTrilha, ultimaDecisao?: DecisaoRevisao | null): SeloTrilha {
  if (status === 'aprovada') return { texto: 'Aprovada', tom: 'ok' };
  if (ultimaDecisao === 'DEVOLVIDA') return { texto: 'Devolvida · aguardando ajustes', tom: 'devolvida' };
  return { texto: 'Aguardando revisão', tom: 'pendente' };
}

export function labelPapel(papel: Papel | null | undefined): string {
  switch (papel) {
    case 'NUTRICIONISTA':
      return 'Nutricionista';
    case 'ADMINISTRADOR':
      return 'Administrador';
    case 'ADOLESCENTE':
      return 'Adolescente';
    default:
      return 'Autor desconhecido';
  }
}

/** "3 módulos · 15 lições" */
export function resumoTamanho(modulos: number, licoes: number): string {
  const m = `${modulos} ${modulos === 1 ? 'módulo' : 'módulos'}`;
  const l = `${licoes} ${licoes === 1 ? 'lição' : 'lições'}`;
  return `${m} · ${l}`;
}
