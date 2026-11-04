// src/features/adolescente/tour/tourPassos.ts
//
// Roteiro do tour de apresentação. Dado puro (sem React): quem toca o roteiro é o TourContext.
// Passo SEM `alvo` = tela cheia (abertura e fim); passo COM `alvo` = destaque com cartão.
// Voz do Bróxis: curta, e sem prometer nada que o app ainda não faz.

export type TelaTour = 'Home' | 'Trilha' | 'Social';

/** Expressões do Bróxis usadas no tour (ver tourAvatares.ts para a imagem de cada uma). */
export type ExpressaoBroxis =
  | 'acolhedor'
  | 'aceno'
  | 'apresentando'
  | 'curioso'
  | 'orgulhoso'
  | 'incentivando'
  | 'energizado'
  | 'comemorando'
  | 'supercontente'
  | 'surpreso'
  | 'pensando'
  | 'radiante'
  | 'bebendo-agua'
  | 'com-fome'
  | 'calmo';

export type ItemRoteiro = { icone: string; rotulo: string };

export type PassoTour = {
  id: string;
  tela: TelaTour;
  /** id registrado com useTourAlvo/TourAlvo; ausente = tela cheia */
  alvo?: string;
  titulo: string;
  texto: string;
  avatar: ExpressaoBroxis;
  /** rola a tela da Home antes de medir o alvo */
  rolar?: 'topo' | 'fim';
  /** se o alvo não aparecer, mostra o cartão no centro em vez de pular o passo */
  fallbackCentral?: boolean;
  /** balão ao lado do Bróxis (telas cheias) */
  balao?: string;
  /** chips do que vem pela frente (abertura) */
  roteiro?: ItemRoteiro[];
  rotuloPrincipal?: string;
  rotuloPular?: string;
};

export const PASSOS_TOUR: PassoTour[] = [
  {
    id: 'abertura',
    tela: 'Home',
    titulo: 'Quer um tour rápido?',
    texto:
      'Eu te mostro onde fica cada coisa do app em menos de um minuto. Você pode pular quando quiser e rever depois em Mais.',
    avatar: 'apresentando',
    balao: 'Bora conhecer?',
    roteiro: [
      { icone: 'home', rotulo: 'Início' },
      { icone: 'book', rotulo: 'Trilha' },
      { icone: 'people', rotulo: 'Turma' },
    ],
    rotuloPrincipal: 'Bora conhecer!',
    rotuloPular: 'Agora não',
  },
  {
    id: 'perfil',
    tela: 'Home',
    alvo: 'perfil',
    titulo: 'Seu perfil',
    texto: 'Toque aqui para ver seu perfil, suas insígnias e como você está evoluindo.',
    avatar: 'acolhedor',
    rolar: 'topo',
  },
  {
    id: 'estatisticas',
    tela: 'Home',
    alvo: 'estatisticas',
    titulo: 'XP, sequência e avisos',
    texto:
      'O XP são os pontos que você ganha ao cumprir atividades. A chama conta os dias seguidos cuidando de você, e o sininho guarda as novidades.',
    avatar: 'energizado',
    rolar: 'topo',
  },
  {
    id: 'semana',
    tela: 'Home',
    alvo: 'semana',
    titulo: 'Sua semana',
    texto: 'Aqui você vê como foi cada dia da semana e acompanha sua constância.',
    avatar: 'orgulhoso',
    rolar: 'topo',
  },
  {
    id: 'agua',
    tela: 'Home',
    alvo: 'agua',
    titulo: 'Água do dia',
    texto: 'Acompanhe quanto você já bebeu hoje em relação à sua meta diária.',
    avatar: 'bebendo-agua',
    rolar: 'topo',
  },
  {
    id: 'missoes',
    tela: 'Home',
    alvo: 'missoes',
    titulo: 'Missão do mês',
    texto: 'Todo mês tem uma missão nova. Toque no card para ver o que falta e acompanhar seu progresso.',
    avatar: 'incentivando',
    rolar: 'topo',
    fallbackCentral: true,
  },
  {
    id: 'metricas',
    tela: 'Home',
    alvo: 'metricas',
    titulo: 'Sua jornada',
    texto: 'Um resumo do que você registrou e aprendeu, com comentários do Bróxis.',
    avatar: 'curioso',
    rolar: 'fim',
  },
  {
    id: 'chat',
    tela: 'Home',
    alvo: 'chat',
    titulo: 'Papo com o Bróxis',
    texto: 'Em breve você vai poder conversar comigo por aqui. Fica de olho!',
    avatar: 'aceno',
  },
  {
    id: 'novo-registro',
    tela: 'Home',
    alvo: 'novo-registro',
    titulo: 'Novo registro',
    texto: 'O botão + é o atalho para registrar o que você comeu, a água que bebeu ou uma atividade física.',
    avatar: 'com-fome',
  },
  {
    id: 'aba-trilha',
    tela: 'Home',
    alvo: 'aba-trilha',
    titulo: 'Trilha',
    texto: 'Aqui ficam as lições: conteúdos, quizzes e atividades para aprender sobre alimentação e ganhar XP.',
    avatar: 'surpreso',
    rotuloPrincipal: 'Me leva lá! ✈️',
  },
  {
    id: 'trilha-faixa',
    tela: 'Trilha',
    alvo: 'trilha-faixa',
    titulo: 'Onde você está',
    texto: 'Essa faixa mostra a trilha e o módulo em que você está. Ela muda conforme você rola o caminho.',
    avatar: 'apresentando',
    fallbackCentral: true,
  },
  {
    id: 'trilha-no-atual',
    tela: 'Trilha',
    alvo: 'trilha-no-atual',
    titulo: 'Seu próximo passo',
    texto: 'Esse nó é a lição da vez. Toque nele para começar e ganhar XP!',
    avatar: 'incentivando',
    fallbackCentral: true,
  },
  {
    id: 'aba-turma',
    tela: 'Trilha',
    alvo: 'aba-turma',
    titulo: 'Turma',
    texto: 'O espaço com seus amigos: jardins, desafios em grupo e o perfil dos colegas.',
    avatar: 'radiante',
    rotuloPrincipal: 'Bora pra Turma! 👥',
  },
  {
    id: 'turma-hero',
    tela: 'Social',
    alvo: 'turma-hero',
    titulo: 'Sua turma',
    texto: 'Aqui você vê quantos amigos você tem e quantos já cuidaram de si hoje. Esse espaço ainda está ganhando novidades!',
    avatar: 'supercontente',
    fallbackCentral: true,
  },
  {
    id: 'turma-abas',
    tela: 'Social',
    alvo: 'turma-abas',
    titulo: 'Novidades e Minha turma',
    texto: 'Em Novidades você acompanha o que a turma anda fazendo. Em Minha turma ficam seus amigos e os pedidos de amizade.',
    avatar: 'curioso',
    fallbackCentral: true,
  },
  {
    id: 'aba-comer',
    tela: 'Social',
    alvo: 'aba-comer',
    titulo: 'Comer',
    texto: 'Registre suas refeições, escaneie produtos, veja sugestões de trocas e receitas com o que você tem em casa.',
    avatar: 'com-fome',
  },
  {
    id: 'aba-mais',
    tela: 'Social',
    alvo: 'aba-mais',
    titulo: 'Mais',
    texto: 'Lembretes, sons do app e a sua jornada. E, se quiser rever este tour, é por aqui.',
    avatar: 'calmo',
  },
  {
    id: 'fim',
    tela: 'Home',
    titulo: 'Tudo pronto!',
    texto: 'Agora é com você. Se quiser rever o tour, é só abrir Mais e tocar em "Rever o tour do app".',
    avatar: 'comemorando',
    balao: 'Boa jornada!',
    rotuloPrincipal: 'Começar',
  },
];

/** quantos passos têm destaque (os que entram na barra de progresso) */
export const TOTAL_PASSOS_COM_ALVO = PASSOS_TOUR.filter((p) => !!p.alvo).length;

/** posição (1-based) do passo entre os que têm destaque; 0 se for tela cheia */
export function numeroDoPasso(indice: number): number {
  const passo = PASSOS_TOUR[indice];
  if (!passo?.alvo) return 0;
  return PASSOS_TOUR.slice(0, indice + 1).filter((p) => !!p.alvo).length;
}
