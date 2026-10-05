import type { ImageSourcePropType } from 'react-native';

/**
 * Créditos do app. Edite SÓ aqui.
 * Logos: substitua os PNGs em assets/img/ mantendo os nomes
 * (logo-departamento-1.png e logo-departamento-2.png).
 */
export type Departamento = { nome: string; instituicao: string; logo: ImageSourcePropType };
export type Pessoa = { nome: string; papel: string };

export const CREDITOS: {
  projeto: string;
  departamentos: Departamento[];
  equipe: Pessoa[];
} = {
  projeto: 'NutriTeens',
  departamentos: [
    // TODO: trocar pelos nomes reais dos dois departamentos
    { nome: 'Departamento de Informática', instituicao: 'Universidade Federal de Viçosa', logo: require('../../../assets/img/logo-departamento-1.png') },
    { nome: 'Departamento de Nutrição e Saúde', instituicao: 'Universidade Federal de Viçosa', logo: require('../../../assets/img/logo-departamento-2.png') },
    
  ],
 equipe: [
  { nome: 'Prof.ª Maria Lúcia Bento Villela', papel: 'Orientação' },
  { nome: 'Patrícia Aparecida Fontes Vieira', papel: 'Co-orientação' },
  { nome: 'Gustavo Santos Pinto', papel: 'Pesquisa, Desenvolvimento, Idealização e Conteúdo' },
  { nome: 'Ana Elisa Silva Pinto', papel: 'Pesquisa' },
  { nome: 'Isabela Cristina da Silva Nascimento', papel: 'Pesquisa' },
  { nome: 'Pedro Henrique Xavier', papel: 'Ilustração' },
  { nome: 'Conselho Nacional de Desenvolvimento Científico e Tecnológico', papel: 'Fomento' },
],
};
