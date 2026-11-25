// src/features/adolescente/triagem/data/roteiroBroxis.ts
//
// Roteiro da conversa com o Bróxis antes do recordatório (HANDOFF_REBRAND, fase 2).
// Só dados: cada nó tem as falas do Bróxis (e cartões) e as respostas, que apontam para o
// próximo nó. `seguir` encadeia um nó no outro sem resposta (o Bróxis continua falando).
// A validação do grafo (todo caminho termina em `bora`, sem nó órfão) está em
// utils/__tests__/roteiroBroxis.test.ts.
//
// ⚠️ Todas as falas estão PENDENTES DE REVISÃO DA NUTRICIONISTA.

export type IdNoRoteiro = 'inicio' | 'oi' | 'quem' | 'combinado' | 'porque' | 'bora';
export type IdCartao = 'como_vai_ser' | 'privacidade';

export type MensagemRoteiro = { tipo: 'broxis'; texto: string } | { tipo: 'cartao'; cartao: IdCartao };

export type OpcaoRoteiro = {
  rotulo: string;
  proximo: IdNoRoteiro;
  /** Código curto para analytics (nunca o texto). */
  codigo: string;
};

export type NoRoteiro = {
  mensagens: MensagemRoteiro[];
  opcoes: OpcaoRoteiro[];
  /** Nó que vem logo depois, sem esperar resposta. */
  seguir?: IdNoRoteiro;
  /** Fim da conversa: aparece o botão COMEÇAR. */
  final?: boolean;
};

export const NO_INICIAL: IdNoRoteiro = 'inicio';
export const NO_FINAL: IdNoRoteiro = 'bora';

export const ROTEIRO_BROXIS: Record<IdNoRoteiro, NoRoteiro> = {
  inicio: {
    mensagens: [
      { tipo: 'broxis', texto: 'E aí! Eu sou o Bróxis.' },
      { tipo: 'broxis', texto: 'Antes da sua trilha começar, bora bater um papo rápido?' },
    ],
    opcoes: [
      { rotulo: 'Oi, Bróxis!', proximo: 'oi', codigo: 'oi' },
      { rotulo: 'Quem é você?', proximo: 'quem', codigo: 'quem' },
    ],
  },
  oi: {
    mensagens: [{ tipo: 'broxis', texto: 'Que bom te ver por aqui!' }],
    opcoes: [],
    seguir: 'combinado',
  },
  quem: {
    mensagens: [
      {
        tipo: 'broxis',
        texto: 'Sou um brócolis meio cientista! Vou te acompanhar nas trilhas, nas trocas e nos desafios.',
      },
    ],
    opcoes: [],
    seguir: 'combinado',
  },
  combinado: {
    mensagens: [
      {
        tipo: 'broxis',
        texto: 'Pra começar, quero saber o que você comeu ontem. Assim eu sugiro coisas que combinam com a sua rotina.',
      },
      { tipo: 'cartao', cartao: 'como_vai_ser' },
      { tipo: 'broxis', texto: 'Não tem resposta certa nem errada. Se não lembrar de algo, tudo bem.' },
    ],
    opcoes: [
      { rotulo: 'Bora!', proximo: 'bora', codigo: 'bora' },
      { rotulo: 'Por que você quer saber?', proximo: 'porque', codigo: 'porque' },
    ],
  },
  porque: {
    mensagens: [
      {
        tipo: 'broxis',
        texto: 'Boa pergunta! Não é pra te dar nota. É pra eu sugerir ideias que combinam com o seu dia a dia.',
      },
      { tipo: 'cartao', cartao: 'privacidade' },
    ],
    opcoes: [{ rotulo: 'Entendi, bora!', proximo: 'bora', codigo: 'entendi' }],
  },
  bora: {
    mensagens: [{ tipo: 'broxis', texto: 'Partiu! Vamos começar pelo café da manhã de ontem.' }],
    opcoes: [],
    final: true,
  },
};

/** Cartão "Como vai ser". */
export const CARTAO_COMO_VAI_SER = {
  titulo: 'COMO VAI SER · UNS 4 MINUTOS',
  passos: [
    { titulo: 'Suas refeições de ontem', texto: 'Café, almoço, lanches e jantar.' },
    { titulo: 'Umas perguntas do dia a dia', texto: 'Rapidinhas, de sim ou não.' },
    { titulo: 'Sua trilha começa', texto: 'Com lições que combinam com você.' },
  ],
} as const;

/** Cartão de privacidade. `icone` é um nome do Ionicons. */
export const CARTAO_PRIVACIDADE = {
  itens: [
    { icone: 'eye-outline', destaque: 'Quem vê:', texto: 'só você e a equipe da pesquisa (UFV). Seus amigos não veem.' },
    { icone: 'shield-outline', destaque: 'Sem contar caloria', texto: 'e sem dieta. É só pra entender sua rotina.' },
    { icone: 'trash-outline', destaque: 'Mudou de ideia?', texto: 'Dá pra pedir pra apagar seus dados quando quiser.' },
  ],
  link: 'Ler a política de privacidade',
} as const;

export const DICA_PRIMEIRA_RESPOSTA = 'Toque numa resposta pra conversar com o Bróxis';
export const DICA_RESPOSTA = 'Escolha uma resposta';
