// src/features/adolescente/notificacoes/data/mensagensLembrete.ts
//
// Banco de mensagens dos lembretes. Tom sempre convidativo (o Bróxis chamando
// pra brincar), nunca cobrança ou culpa — mesma decisão de produto do resto do app.
// Cada mensagem já carrega a tela de destino: ao tocar na notificação o app
// abre direto o lugar certo.

export type TipoRegular = 'agua' | 'alimentacao' | 'trilha' | 'missao' | 'atividade';
export type TipoLembrete = TipoRegular | 'saudade';

// Ordem = prioridade em caso de empate na escolha do dia
// (missão > alimentação > atividade > água > trilha).
export const TIPOS_REGULARES: TipoRegular[] = ['missao', 'alimentacao', 'atividade', 'agua', 'trilha'];

// Nomes das telas do AdolescenteNavigator (mantidos como string simples pra
// este arquivo continuar puro e testável fora do React Native).
export type DestinoLembrete = 'ConsumoAgua' | 'TipoRefeicao' | 'Trilha' | 'Home' | 'AtividadeFisica';

export type MensagemLembrete = {
  id: string;
  tipo: TipoLembrete;
  titulo: string;
  texto: string;
  destino: DestinoLembrete;
};

export const MENSAGENS_LEMBRETE: MensagemLembrete[] = [
  // Água
  { id: 'agua-1', tipo: 'agua', titulo: 'Hora de hidratar', texto: 'O Bróxis tá com sede. Bora um copinho de água?', destino: 'ConsumoAgua' },
  { id: 'agua-2', tipo: 'agua', titulo: 'Pausa rápida', texto: 'Que tal uma aguinha agora? Seu corpo agradece.', destino: 'ConsumoAgua' },
  { id: 'agua-3', tipo: 'agua', titulo: 'Gotinha do dia', texto: 'Um gole já ajuda a manter a energia lá em cima.', destino: 'ConsumoAgua' },
  { id: 'agua-4', tipo: 'agua', titulo: 'Hidratação em dia', texto: 'Registra seu copo de água e deixa a garrafinha mais cheia.', destino: 'ConsumoAgua' },

  // Registrar alimentação
  { id: 'alimentacao-1', tipo: 'alimentacao', titulo: 'O que rolou no prato?', texto: 'Conta pro Bróxis o que você comeu hoje. Leva só um minutinho.', destino: 'TipoRefeicao' },
  { id: 'alimentacao-2', tipo: 'alimentacao', titulo: 'Hora de registrar', texto: 'Já comeu alguma coisa? Registra a refeição e acompanha seu dia.', destino: 'TipoRefeicao' },
  { id: 'alimentacao-3', tipo: 'alimentacao', titulo: 'Bróxis curioso', texto: 'Quer me contar como foi sua última refeição?', destino: 'TipoRefeicao' },

  // Trilha
  { id: 'trilha-1', tipo: 'trilha', titulo: 'Sua trilha te espera', texto: 'Falta pouco pro próximo nó. Bora continuar a aventura?', destino: 'Trilha' },
  { id: 'trilha-2', tipo: 'trilha', titulo: 'Hora de aprender', texto: 'Um módulo rapidinho da trilha e você já avança.', destino: 'Trilha' },
  { id: 'trilha-3', tipo: 'trilha', titulo: 'Próxima parada', texto: 'Tem conteúdo novo te esperando na trilha.', destino: 'Trilha' },

  // Missão do dia
  { id: 'missao-1', tipo: 'missao', titulo: 'Missão do Bróxis', texto: 'Tem uma missão nova pra você hoje. Topa o desafio?', destino: 'Home' },
  { id: 'missao-2', tipo: 'missao', titulo: 'Desafio liberado', texto: 'Sua missão do dia está pronta. Dá uma olhada!', destino: 'Home' },
  { id: 'missao-3', tipo: 'missao', titulo: 'Bora completar?', texto: 'Uma missãozinha por dia deixa o Bróxis radiante.', destino: 'Home' },

  // Atividade física
  { id: 'atividade-1', tipo: 'atividade', titulo: 'Hora de se mexer', texto: 'Uma atividade, mesmo curtinha, já faz diferença. Bora?', destino: 'AtividadeFisica' },
  { id: 'atividade-2', tipo: 'atividade', titulo: 'Energia pra gastar?', texto: 'Registra o que você fez hoje ou escolhe uma atividade nova.', destino: 'AtividadeFisica' },
  { id: 'atividade-3', tipo: 'atividade', titulo: 'Movimento do dia', texto: 'Dança, caminhada, jogo com os amigos... tudo conta!', destino: 'AtividadeFisica' },

  // Saudade (só quando a pessoa fica alguns dias sem abrir o app)
  { id: 'saudade-1', tipo: 'saudade', titulo: 'O Bróxis sentiu sua falta', texto: 'Quando quiser, é só voltar. Tem novidade te esperando.', destino: 'Home' },
  { id: 'saudade-2', tipo: 'saudade', titulo: 'Faz um tempinho!', texto: 'Passa aqui pra ver como está sua trilha.', destino: 'Trilha' },
];

/**
 * Sorteia uma mensagem do tipo, evitando repetir a última usada (quando há
 * mais de uma opção). `aleatorio` é injetável pra facilitar teste.
 */
export function escolherMensagem(
  tipo: TipoLembrete,
  ultimaId?: string,
  aleatorio: () => number = Math.random
): MensagemLembrete {
  const doTipo = MENSAGENS_LEMBRETE.filter((m) => m.tipo === tipo);
  const candidatas = doTipo.length > 1 ? doTipo.filter((m) => m.id !== ultimaId) : doTipo;
  return candidatas[Math.min(Math.floor(aleatorio() * candidatas.length), candidatas.length - 1)];
}
