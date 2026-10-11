// Ícones (MaterialCommunityIcons) do módulo de trocas.
import type { CategoriaTroca } from './trocas';

// ícone das categorias (cartões da tela de sugestões)
export const ICONE_CATEGORIA: Record<CategoriaTroca, string> = {
  REFRIGERANTE_BEBIDA: 'bottle-soda-outline',
  DOCE: 'ice-cream',
  EMBUTIDO: 'sausage',
  LANCHE: 'hamburger',
  REFEICAO: 'silverware-fork-knife',
  BISCOITO: 'cookie-outline',
  SALGADINHO: 'food-variant',
};

// ícone usado quando o alimento de destino não tem um ícone próprio
export const ICONE_ALTERNATIVA = 'leaf';

// ícone por alimento de destino (chave = nome sem acento, minúsculo, pelo INÍCIO do nome)
const ICONE_POR_DESTINO: [string, string][] = [
  ['agua de coco', 'palm-tree'],
  ['agua', 'water-outline'],
  ['suco', 'cup-water'],
  ['limonada', 'fruit-citrus'],
  ['leite', 'cow'],
  ['banana', 'fruit-pineapple'],
  ['maca', 'food-apple-outline'],
  ['mamao', 'fruit-watermelon'],
  ['fruta', 'fruit-cherries'],
  ['iogurte', 'cup-outline'],
  ['castanha', 'peanut-outline'],
  ['ovo', 'egg-outline'],
  ['queijo', 'cheese'],
  ['frango', 'food-drumstick-outline'],
  ['carne', 'food-steak'],
  ['feijao', 'seed-outline'],
  ['sanduiche', 'sandwich'],
  ['vitamina', 'blender-outline'],
  ['tapioca', 'taco'],
  ['pao de queijo', 'muffin'],
  ['cuscuz', 'corn'],
  ['salada', 'chef-hat'],
  ['macarrao', 'pasta'],
  ['bolo', 'cake-variant-outline'],
  ['pipoca', 'popcorn'],
  ['mandioca', 'french-fries'],
];

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Ícone do alimento de destino; cai na folha quando não há um específico. */
export function iconeDoDestino(nome: string): string {
  const n = semAcento(nome);
  return ICONE_POR_DESTINO.find(([k]) => n.startsWith(k))?.[1] ?? ICONE_ALTERNATIVA;
}
