// Papéis e checagens simples de permissão de conteúdo — lógica pura (sem Supabase).
// O banco é quem GARANTE; isto só decide o que a tela mostra. O fluxo de aprovação (status,
// ações por papel) está em fluxo.ts; as regras de edição por papel, em CamposEdicao/avisoEdicao.

export type Papel = 'ADOLESCENTE' | 'NUTRICIONISTA' | 'ADMINISTRADOR';

/** Só a nutricionista aprova (inclusive o que ela mesma criou). */
export function podeAprovar(papel: Papel | null | undefined): boolean {
  return papel === 'NUTRICIONISTA';
}

/** Quem pode criar/editar conteúdo. */
export function podeEditarConteudo(papel: Papel | null | undefined): boolean {
  return papel === 'NUTRICIONISTA' || papel === 'ADMINISTRADOR';
}
