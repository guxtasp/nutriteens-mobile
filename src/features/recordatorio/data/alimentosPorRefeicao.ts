
// Mapeia cada tipo de refeição para os nomes de alimentos (exatamente como
// gravados em `alimentos.nome` via seed_alimentos.sql) que aparecem no grid
// daquela tela. É só uma organização de UI — o catálogo em si é compartilhado
// entre todas as refeições no banco.
export const ALIMENTOS_POR_REFEICAO: Record<string, string[]> = {
  CAFE_DA_MANHA: [
    'Pão francês', 'Pão de forma', 'Pão de queijo', 'Tapioca', 'Cuscuz',
    'Leite', 'Café com leite', 'Iogurte', 'Queijo', 'Manteiga/margarina',
    'Ovo', 'Fruta (banana, maçã, mamão...)', 'Suco natural', 'Cereal matinal',
    'Mel', 'Geleia',
  ],
  LANCHE_MANHA: [
    'Fruta (banana, maçã, mamão...)', 'Iogurte', 'Barra de cereal',
    'Bolacha/biscoito', 'Suco natural', 'Castanhas/amendoim', 'Sanduíche natural',
  ],
  ALMOCO: [
    'Arroz', 'Feijão', 'Macarrão', 'Batata', 'Mandioca/aipim',
    'Carne bovina', 'Frango', 'Carne suína', 'Peixe', 'Ovo frito/mexido',
    'Salada (alface, tomate...)', 'Legumes cozidos', 'Miojo/macarrão instantâneo',
    'Refrigerante', 'Suco natural',
  ],
  LANCHE_TARDE: [
    'Salgado (coxinha, pastel...)', 'Bolo', 'Sorvete', 'Balas/doces',
    'Chocolate', 'Salgadinho de pacote', 'Açaí', 'Suco natural', 'Refrigerante',
  ],
  JANTAR: [
    'Arroz', 'Feijão', 'Macarrão', 'Batata', 'Carne bovina', 'Frango',
    'Carne suína', 'Peixe', 'Ovo frito/mexido', 'Salada (alface, tomate...)',
    'Legumes cozidos', 'Miojo/macarrão instantâneo', 'Sanduíche natural',
  ],
  CEIA: [
    'Leite', 'Chá', 'Vitamina de fruta', 'Fruta (banana, maçã, mamão...)',
    'Bolacha/biscoito', 'Iogurte',
  ],
};