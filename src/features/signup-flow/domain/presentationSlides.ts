export interface PresentationSlide {
  id: string;
  title: string;
  subtitle: string;
  image: any; 
}

// Esse array contém os slides de apresentação do aplicativo, 
// cada um com um id, título, subtítulo e imagem correspondente
export const PRESENTATION_SLIDES: PresentationSlide[] = [
  {
    id: 'habitos',
    title: 'Hábitos saudáveis que crescem com você',
    subtitle: 'Monitore sua alimentação, hidratação e atividade física de maneira simples e divertida.',
    image: require('../../../../assets/img/presentation/habitos-saudaveis.png'),
  },
  {
    id: 'evolui',
    title: 'Aprenda enquanto evolui',
    subtitle: 'Complete desafios, acumule recompensas e desenvolva hábitos mais saudáveis.',
    image: require('../../../../assets/img/presentation/aprenda-evolui.png'),
  },
  {
    id: 'sozinho',
    title: 'Você não está sozinho',
    subtitle: 'Registre seus hábitos, acompanhe seu progresso e receba orientações ao longo da sua jornada.',
    image: require('../../../../assets/img/presentation/nao-sozinho.png'),
  },
  {
    id: 'conhecer',
    title: 'Queremos conhecer você melhor',
    subtitle: 'Responda a algumas perguntas para personalizar a sua experiência.',
    image: require('../../../../assets/img/presentation/conhecer-voce.png'),
  },
];