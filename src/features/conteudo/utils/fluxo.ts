// src/features/conteudo/utils/fluxo.ts
// Regras do fluxo de aprovação (espelho das que o banco garante em
// conteudo_transicionar). Aqui só decidimos o que MOSTRAR; quem decide de verdade é o banco.
export type PapelPainel = 'NUTRICIONISTA' | 'ADMINISTRADOR';
export type TipoConteudo = 'TRILHA' | 'RECEITA';
export type StatusFluxo =
  | 'RASCUNHO'
  | 'AGUARDANDO_APROVACAO'
  | 'APROVADO'
  | 'PUBLICADO'
  | 'REJEITADO'
  | 'ARQUIVADO';
export type AcaoFluxo = 'ENVIAR' | 'APROVAR' | 'REJEITAR' | 'PUBLICAR' | 'ARQUIVAR' | 'REABRIR';

export const STATUS_LABEL: Record<StatusFluxo, string> = {
  RASCUNHO: 'Rascunho',
  AGUARDANDO_APROVACAO: 'Em revisão',
  APROVADO: 'Aprovado',
  PUBLICADO: 'Publicado',
  REJEITADO: 'Rejeitado',
  ARQUIVADO: 'Arquivado',
};

export const ACAO_LABEL: Record<AcaoFluxo | 'CRIACAO' | 'EXCLUSAO' | 'ALTERACAO_RELEVANTE' | 'EDICAO', string> = {
  ENVIAR: 'Enviado para aprovação',
  APROVAR: 'Aprovado',
  REJEITAR: 'Rejeitado',
  PUBLICAR: 'Publicado',
  ARQUIVAR: 'Arquivado',
  REABRIR: 'Reaberto',
  CRIACAO: 'Criado',
  EXCLUSAO: 'Excluído',
  ALTERACAO_RELEVANTE: 'Alterado (nova aprovação)',
  EDICAO: 'Editado pela nutricionista',
};

export const TIPO_LABEL: Record<TipoConteudo, string> = { TRILHA: 'Trilha', RECEITA: 'Receita' };

export type TomStatus = 'neutro' | 'espera' | 'ok' | 'publicado' | 'erro';
export function tomDoStatus(s: StatusFluxo): TomStatus {
  if (s === 'AGUARDANDO_APROVACAO') return 'espera';
  if (s === 'APROVADO') return 'ok';
  if (s === 'PUBLICADO') return 'publicado';
  if (s === 'REJEITADO') return 'erro';
  return 'neutro';
}

/** O que cada status significa (usado nos informativos do painel). */
export const STATUS_AJUDA: Record<StatusFluxo, string> = {
  RASCUNHO: 'Em preparo. Ainda não foi enviado para revisão e os adolescentes não veem.',
  AGUARDANDO_APROVACAO: 'Enviado e esperando a decisão da nutricionista. Os adolescentes ainda não veem.',
  APROVADO: 'A nutricionista aprovou, mas ainda não publicou. Os adolescentes ainda não veem.',
  PUBLICADO: 'Aprovado e visível para os adolescentes no aplicativo.',
  REJEITADO: 'A nutricionista pediu ajustes (veja o motivo). Corrija e envie para revisão de novo.',
  ARQUIVADO: 'Guardado fora de uso. Não aparece para os adolescentes e pode ser reaberto como rascunho.',
};

/** Ações de decisão técnica: só a nutricionista, e só depois de abrir e ler o conteúdo. */
export const ACOES_DECISAO: AcaoFluxo[] = ['APROVAR', 'REJEITAR', 'PUBLICAR'];

/** Ações que o papel pode tentar a partir do status atual. */
export function acoesPermitidas(papel: PapelPainel, status: StatusFluxo): AcaoFluxo[] {
  const nutri = papel === 'NUTRICIONISTA';
  const r: AcaoFluxo[] = [];
  if (status === 'RASCUNHO' || status === 'REJEITADO') r.push('ENVIAR');
  if (nutri && status === 'AGUARDANDO_APROVACAO') r.push('APROVAR');
  // fluxo simplificado: a nutricionista aprova e publica numa só ação
  if (nutri && (status === 'RASCUNHO' || status === 'AGUARDANDO_APROVACAO' || status === 'APROVADO' || status === 'REJEITADO')) r.push('PUBLICAR');
  if (nutri && (status === 'AGUARDANDO_APROVACAO' || status === 'APROVADO' || status === 'PUBLICADO')) r.push('REJEITAR');
  if (status !== 'ARQUIVADO') r.push('ARQUIVAR');
  if (status === 'REJEITADO' || status === 'ARQUIVADO') r.push('REABRIR');
  return r;
}

/** Rótulo do botão: PUBLICAR direto de um status não aprovado vira "aprovar e publicar". */
export function rotuloAcao(acao: AcaoFluxo, status: StatusFluxo): string {
  if (acao === 'PUBLICAR') return status === 'APROVADO' ? 'PUBLICAR' : 'APROVAR E PUBLICAR';
  const r: Record<AcaoFluxo, string> = {
    ENVIAR: 'ENVIAR PARA REVISÃO',
    APROVAR: 'APROVAR',
    REJEITAR: 'REJEITAR',
    PUBLICAR: 'PUBLICAR',
    ARQUIVAR: 'ARQUIVAR',
    REABRIR: 'REABRIR COMO RASCUNHO',
  };
  return r[acao];
}

/** Quem pode ver, editar e decidir. VER ≠ EDITAR ≠ APROVAR. */
export function permissoes(papel: PapelPainel) {
  const nutri = papel === 'NUTRICIONISTA';
  return { ver: true, editar: true, aprovar: nutri, rejeitar: nutri, publicar: nutri };
}

/** Aviso sobre o efeito de editar conteúdo que já saiu do rascunho. */
export function avisoEdicao(papel: PapelPainel, status: StatusFluxo): string | null {
  if (status === 'RASCUNHO' || status === 'ARQUIVADO') return null;
  return papel === 'NUTRICIONISTA'
    ? 'Como nutricionista responsável, suas edições mantêm o status; a versão sobe e fica na auditoria.'
    : 'Se você editar o conteúdo, ele volta para rascunho e precisa de nova aprovação da nutricionista.';
}

export function validarMotivo(texto: string): string | null {
  return texto.trim().length === 0 ? 'Informe o motivo da rejeição.' : null;
}

export function formatarDataHora(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
