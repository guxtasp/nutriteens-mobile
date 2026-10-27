// src/features/adolescente/notificacoes/utils/aniversarioLembrete.ts
//
// Notificação local de aniversário (fase 2 da ideia 8). Lógica pura, separada do
// planejamento diário e do resumo semanal para não mexer nas regras já testadas.
// Regras:
//  - 1 por ano, na data do aniversário, às HORA_ANIVERSARIO (manhã, aviso de "surpresa");
//  - só agenda quando o aniversário está a no máximo JANELA_AGENDAMENTO_DIAS dias: como o
//    app reagenda a cada abertura, quem abre o app de vez em quando ainda é alcançado;
//  - se o horário de hoje já passou (ou falta menos de 5 min), não agenda: a mensagem do dia
//    aparece sozinha quando a pessoa abrir o app (modal da Home);
//  - se a pessoa já viu a mensagem deste ano dentro do app, não avisa de novo;
//  - NÃO passa pelo "freio" de lembretes ignorados (é uma vez por ano e afetiva), mas
//    respeita a chave geral e o interruptor próprio (config.aniversario === false desliga);
//  - ocupa a vaga do dia (junto com combinarComJornada): nunca chegam dois no mesmo dia.
import { proximoAniversario } from '../../home/utils/aniversario';
import type { ConfigLembretes, LembretePlanejado } from './escolherLembrete';

export const HORA_ANIVERSARIO = 9;
export const JANELA_AGENDAMENTO_DIAS = 14;
const MARGEM_MS = 5 * 60 * 1000;

export type EntradaAniversario = {
  agora: Date;
  config: ConfigLembretes;
  /** `profiles.data_nascimento` (AAAA-MM-DD); null/inválida → não agenda */
  dataNascimento: string | null | undefined;
  /** dia local de hoje, AAAA-MM-DD */
  hojeISO: string;
  /** anos cuja mensagem de aniversário já foi mostrada dentro do app (gate local) */
  anosCelebrados: number[];
};

export function planejarAniversario(e: EntradaAniversario): LembretePlanejado | null {
  if (!e.config.ativado || e.config.aniversario === false) return null;

  const prox = proximoAniversario(e.dataNascimento, e.hojeISO);
  if (!prox || prox.diasAte > JANELA_AGENDAMENTO_DIAS) return null;
  if (e.anosCelebrados.includes(prox.ano)) return null;

  const quando = new Date(prox.ano, prox.mes - 1, prox.dia, HORA_ANIVERSARIO, 0, 0, 0);
  if (quando.getTime() <= e.agora.getTime() + MARGEM_MS) return null;

  return { quando, tipo: 'aniversario' };
}
