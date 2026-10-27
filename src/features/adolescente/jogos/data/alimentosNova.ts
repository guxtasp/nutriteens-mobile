// Lista CURADA e estática para o jogo "Classificar NOVA".
// ATENÇÃO: precisa ser validada pela nutricionista antes de ir para os usuários
// (ver PLANO_NOVAS_FUNCIONALIDADES_NUTRITEENS.md, seção 5). Itens ambíguos
// (pão francês, queijo, suco de caixinha...) ficam de fora de propósito.
export type GrupoNova = 'IN_NATURA' | 'INGREDIENTE_CULINARIO' | 'PROCESSADO' | 'ULTRAPROCESSADO';

export type AlimentoNova = { id: string; nome: string; icone: string; cor: string; grupo: GrupoNova; dica: string };

export const GRUPOS_NOVA: { chave: GrupoNova; nome: string; resumo: string }[] = [
  { chave: 'IN_NATURA', nome: 'In natura', resumo: 'Vem direto da natureza ou quase sem mudança.' },
  { chave: 'INGREDIENTE_CULINARIO', nome: 'Ingrediente de cozinha', resumo: 'Usado para temperar e cozinhar.' },
  { chave: 'PROCESSADO', nome: 'Processado', resumo: 'In natura com sal, açúcar ou óleo, poucos ingredientes.' },
  { chave: 'ULTRAPROCESSADO', nome: 'Ultraprocessado', resumo: 'Feito em fábrica, com aditivos que você não tem em casa.' },
];

export const ALIMENTOS_NOVA: AlimentoNova[] = [
  { id: 'banana', nome: 'Banana', icone: 'food-apple', cor: '#F5B800', grupo: 'IN_NATURA', dica: 'Fruta inteira, do jeito que vem da árvore.' },
  { id: 'arroz', nome: 'Arroz branco (grão)', icone: 'rice', cor: '#8A7F6A', grupo: 'IN_NATURA', dica: 'Grão só beneficiado, sem nada adicionado.' },
  { id: 'feijao', nome: 'Feijão (grão)', icone: 'seed', cor: '#7B4B2A', grupo: 'IN_NATURA', dica: 'Semente seca, sem aditivos.' },
  { id: 'ovo', nome: 'Ovo', icone: 'egg', cor: '#E8A33D', grupo: 'IN_NATURA', dica: 'Alimento inteiro, sem transformação industrial.' },
  { id: 'cenoura', nome: 'Cenoura', icone: 'carrot', cor: '#F2761B', grupo: 'IN_NATURA', dica: 'Raiz fresca.' },
  { id: 'laranja', nome: 'Laranja', icone: 'fruit-citrus', cor: '#F59E0B', grupo: 'IN_NATURA', dica: 'Fruta fresca.' },
  { id: 'leite', nome: 'Leite', icone: 'glass-mug-variant', cor: '#5B8DB8', grupo: 'IN_NATURA', dica: 'Leite pasteurizado é considerado in natura/minimamente processado.' },
  { id: 'acucar', nome: 'Açúcar', icone: 'spoon-sugar', cor: '#8A7F6A', grupo: 'INGREDIENTE_CULINARIO', dica: 'Usado para adoçar preparações, não como alimento sozinho.' },
  { id: 'sal', nome: 'Sal de cozinha', icone: 'shaker', cor: '#6B7280', grupo: 'INGREDIENTE_CULINARIO', dica: 'Tempero usado na cozinha.' },
  { id: 'oleo', nome: 'Óleo de soja', icone: 'oil', cor: '#B8860B', grupo: 'INGREDIENTE_CULINARIO', dica: 'Gordura usada para cozinhar.' },
  { id: 'manteiga', nome: 'Manteiga', icone: 'food-variant', cor: '#D9A404', grupo: 'INGREDIENTE_CULINARIO', dica: 'Extraída do leite, usada para cozinhar.' },
  { id: 'conserva', nome: 'Milho em conserva', icone: 'corn', cor: '#E2B100', grupo: 'PROCESSADO', dica: 'In natura com água e sal.' },
  { id: 'atum', nome: 'Atum em lata', icone: 'fish', cor: '#3B82A0', grupo: 'PROCESSADO', dica: 'Peixe com óleo e sal, poucos ingredientes.' },
  { id: 'queijo_minas', nome: 'Queijo minas curado', icone: 'cheese', cor: '#E2A400', grupo: 'PROCESSADO', dica: 'Leite, sal e fermento: poucos ingredientes.' },
  { id: 'fruta_calda', nome: 'Pêssego em calda', icone: 'food-apple', cor: '#F08A4B', grupo: 'PROCESSADO', dica: 'Fruta com açúcar, em conserva.' },
  { id: 'refri', nome: 'Refrigerante', icone: 'bottle-soda', cor: '#C0392B', grupo: 'ULTRAPROCESSADO', dica: 'Água, açúcar e aditivos como corante e aromatizante.' },
  { id: 'salgadinho', nome: 'Salgadinho de pacote', icone: 'french-fries', cor: '#D97706', grupo: 'ULTRAPROCESSADO', dica: 'Realçador de sabor e aromatizantes.' },
  { id: 'nuggets', nome: 'Nuggets', icone: 'food-drumstick', cor: '#B45309', grupo: 'ULTRAPROCESSADO', dica: 'Carne reconstituída com muitos aditivos.' },
  { id: 'macarrao_inst', nome: 'Macarrão instantâneo', icone: 'noodles', cor: '#CA8A04', grupo: 'ULTRAPROCESSADO', dica: 'Tempero pronto com realçadores de sabor.' },
  { id: 'biscoito_rech', nome: 'Biscoito recheado', icone: 'cookie', cor: '#7C3F1D', grupo: 'ULTRAPROCESSADO', dica: 'Gordura vegetal, açúcar e aromatizantes.' },
  { id: 'salsicha', nome: 'Salsicha', icone: 'food-hot-dog', cor: '#B91C1C', grupo: 'ULTRAPROCESSADO', dica: 'Embutido com conservantes e corantes.' },
  { id: 'iogurte_sabor', nome: 'Iogurte com sabor de frutas', icone: 'cup', cor: '#DB2777', grupo: 'ULTRAPROCESSADO', dica: 'Corante e aromatizante no lugar da fruta.' },
];
