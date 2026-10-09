// src/features/adolescente/social/utils/receitaCompartilhada.ts
export type ResultadoEnvioReceita = 'enviada' | 'sem_amizade' | 'receita_invalida' | 'ja_enviada' | 'limite';

export type ReceitaRecebida = { id: string; receitaId: string; titulo: string; remetente: string };

export function mensagemEnvioReceita(r: ResultadoEnvioReceita, apelido?: string): string {
  switch (r) {
    case 'enviada':
      return `Receita enviada${apelido ? ` para ${apelido}` : ''}! Que tal cozinharem juntos?`;
    case 'ja_enviada':
      return 'Você já mandou essa receita para esse amigo hoje.';
    case 'limite':
      return 'Você já mandou várias receitas hoje. Tente de novo amanhã.';
    default:
      return 'Não foi possível enviar agora.';
  }
}
