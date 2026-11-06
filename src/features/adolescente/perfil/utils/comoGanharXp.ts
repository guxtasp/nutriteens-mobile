// src/features/adolescente/perfil/utils/comoGanharXp.ts
//
// Explicação em linguagem simples de como ganhar pontos (XP). Sem valores numéricos:
// eles vêm do banco e podem mudar. Sem comparação com outras pessoas.
import type { OrigemLancamento } from './extratoXp';

export type FormaDeGanharXp = {
  origem: Exclude<OrigemLancamento, 'saldo_anterior'>;
  titulo: string;
  texto: string;
};

export const COMO_GANHAR_XP: FormaDeGanharXp[] = [
  { origem: 'licao', titulo: 'Concluir lições', texto: 'Cada lição da trilha que você termina rende pontos.' },
  { origem: 'bonus_modulo', titulo: 'Fechar um módulo', texto: 'Ao terminar todas as lições de um módulo, você ganha um bônus.' },
  { origem: 'bonus_trilha', titulo: 'Fechar uma trilha', texto: 'Terminar uma trilha inteira também dá um bônus.' },
  { origem: 'missao_diaria', titulo: 'Missões do dia', texto: 'Registrar água, atividade física e refeições cumpre as missões do dia.' },
  { origem: 'missao_periodica', titulo: 'Missões da semana e do mês', texto: 'Manter seus hábitos ao longo dos dias cumpre as missões maiores.' },
  { origem: 'marco_sequencia', titulo: 'Marcos de sequência', texto: 'Ao completar dias seguidos você alcança marcos que dão pontos.' },
];
