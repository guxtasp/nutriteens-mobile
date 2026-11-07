import { ImageSourcePropType } from 'react-native';

// Cores de cada slide. O fundo da tela troca em degradê enquanto a pessoa arrasta.
export interface TemaSlide {
  fundo: string;     // cor do fundo da parte de cima
  blob: string;      // círculo claro grande atrás da ilustração
  blobSuave: string; // círculos pequenos nos cantos
  brilho: string;    // cor dos brilhos (estrelinhas)
  acento: string;    // texto da etiqueta "1 DE 4" e dos chips (contraste AA no branco)
  chip: string;      // fundo da etiqueta e dos chips
  marca: string;     // marca-texto atrás da palavra em destaque do título
}

export interface PresentationSlide {
  id: string;
  title: string;
  // palavra do título que ganha o marca-texto (tem que existir em `title`)
  highlight: string;
  subtitle: string;
  // palavras-chave que aparecem em chips abaixo do subtítulo
  tags: string[];
  // texto do botão principal neste slide
  cta: string;
  // descrição da ilustração para leitores de tela
  alt: string;
  image: ImageSourcePropType;
  // carinha de reação do Bróxis que fica na borda da folha branca
  face: ImageSourcePropType;
  tema: TemaSlide;
}

// Esse array contém os slides de apresentação do aplicativo.
export const PRESENTATION_SLIDES: PresentationSlide[] = [
  {
    id: 'habitos',
    title: 'Hábitos saudáveis que crescem com você',
    highlight: 'saudáveis',
    subtitle: 'Monitore sua alimentação, hidratação e atividade física de maneira simples e divertida.',
    tags: ['Alimentação', 'Hidratação', 'Atividade física'],
    cta: 'CONTINUAR',
    alt: 'Bróxis apontando para uma trilha com frutas, gotas de água e medalhas',
    image: require('../../../../assets/img/presentation/habitos-saudaveis.png'),
    face: require('../../../../assets/img/feedback/energizado.png'),
    tema: {
      fundo: '#DCF1C6',
      blob: 'rgba(255,255,255,0.55)',
      blobSuave: 'rgba(139,207,74,0.28)',
      brilho: '#FCCB28',
      acento: '#3F6B12',
      chip: '#EAF6DC',
      marca: '#BFE59B',
    },
  },
  {
    id: 'evolui',
    title: 'Aprenda enquanto evolui',
    highlight: 'evolui',
    subtitle: 'Complete desafios, acumule recompensas e desenvolva hábitos mais saudáveis.',
    tags: ['Desafios', 'Recompensas', 'Hábitos'],
    cta: 'CONTINUAR',
    alt: 'Bróxis comemorando cercado de medalhas, moedas de XP e cartas de conquista',
    image: require('../../../../assets/img/presentation/aprenda-evolui.png'),
    face: require('../../../../assets/img/feedback/comemorando.png'),
    tema: {
      fundo: '#FFEFB0',
      blob: 'rgba(255,255,255,0.55)',
      blobSuave: 'rgba(252,203,40,0.35)',
      brilho: '#F5A623',
      acento: '#8A5A00',
      chip: '#FFF4CC',
      marca: '#FFD866',
    },
  },
  {
    id: 'sozinho',
    title: 'Você não está sozinho',
    highlight: 'sozinho',
    subtitle: 'Registre seus hábitos, acompanhe seu progresso e receba orientações ao longo da sua jornada.',
    tags: ['Registro', 'Progresso', 'Orientação'],
    cta: 'CONTINUAR',
    alt: 'Bróxis ao lado de gráficos de progresso, notificações e uma tigela de comida',
    image: require('../../../../assets/img/presentation/nao-sozinho.png'),
    face: require('../../../../assets/img/feedback/acolhedor.png'),
    tema: {
      fundo: '#CDEEFA',
      blob: 'rgba(255,255,255,0.55)',
      blobSuave: 'rgba(106,202,240,0.38)',
      brilho: '#FFFFFF',
      acento: '#17678A',
      chip: '#DDF3FC',
      marca: '#9ADCF2',
    },
  },
  {
    id: 'conhecer',
    title: 'Queremos conhecer você melhor',
    highlight: 'melhor',
    subtitle: 'Responda a algumas perguntas para personalizar a sua experiência.',
    tags: ['Perguntas rápidas', 'Sob medida'],
    cta: 'VAMOS COMEÇAR!',
    alt: 'Bróxis de óculos segurando uma prancheta e um lápis',
    image: require('../../../../assets/img/presentation/conhecer-voce.png'),
    face: require('../../../../assets/img/feedback/curioso.png'),
    tema: {
      fundo: '#E7E0FA',
      blob: 'rgba(255,255,255,0.55)',
      blobSuave: 'rgba(139,110,230,0.22)',
      brilho: '#8B6EE6',
      acento: '#5B45B0',
      chip: '#EEE9FC',
      marca: '#CDBEF5',
    },
  },
];