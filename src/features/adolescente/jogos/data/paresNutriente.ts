// Pares "nutriente -> alimento que é boa fonte" do jogo de memória.
// Lista CURADA e estática, usada só como reserva quando a tabela jogo_pares_nutriente
// (migration_jogos_memoria.sql) não pôde ser lida. PRECISA de validação da nutricionista.
import type { NutrienteChave } from '../../alimentacao/utils/nutrientesPorGrupo';

export type ParNutriente = { id: string; nutriente: NutrienteChave; nome: string; icone: string; cor: string };

export const PARES_NUTRIENTE: ParNutriente[] = [
  { id: 'par_vitamina_a_cenoura', nutriente: 'vitamina_a', nome: 'Cenoura', icone: 'carrot', cor: '#F2761B' },
  { id: 'par_vitamina_a_abobora', nutriente: 'vitamina_a', nome: 'Abóbora', icone: 'pumpkin', cor: '#E8890C' },
  { id: 'par_vitamina_c_laranja', nutriente: 'vitamina_c', nome: 'Laranja', icone: 'fruit-citrus', cor: '#F59E0B' },
  { id: 'par_vitamina_c_acerola', nutriente: 'vitamina_c', nome: 'Acerola', icone: 'fruit-cherries', cor: '#DC2626' },
  { id: 'par_vitamina_d_ovo', nutriente: 'vitamina_d', nome: 'Ovo', icone: 'egg', cor: '#E8A33D' },
  { id: 'par_vitamina_d_sardinha', nutriente: 'vitamina_d', nome: 'Sardinha', icone: 'fish', cor: '#3B82A0' },
  { id: 'par_calcio_leite', nutriente: 'calcio', nome: 'Leite', icone: 'glass-mug-variant', cor: '#5B8DB8' },
  { id: 'par_calcio_queijo', nutriente: 'calcio', nome: 'Queijo', icone: 'cheese', cor: '#E2A400' },
  { id: 'par_calcio_iogurte', nutriente: 'calcio', nome: 'Iogurte natural', icone: 'cup', cor: '#7C9CB8' },
  { id: 'par_ferro_feijao', nutriente: 'ferro', nome: 'Feijão', icone: 'seed', cor: '#7B4B2A' },
  { id: 'par_ferro_carne', nutriente: 'ferro', nome: 'Carne bovina', icone: 'food-steak', cor: '#B91C1C' },
  { id: 'par_magnesio_amendoim', nutriente: 'magnesio', nome: 'Amendoim', icone: 'peanut', cor: '#A16207' },
  { id: 'par_magnesio_castanha', nutriente: 'magnesio', nome: 'Castanha', icone: 'nut', cor: '#7C3F1D' },
  { id: 'par_potassio_banana', nutriente: 'potassio', nome: 'Banana', icone: 'food-apple', cor: '#F5B800' },
  { id: 'par_zinco_carne', nutriente: 'zinco', nome: 'Carne bovina', icone: 'food-steak', cor: '#B91C1C' },
  { id: 'par_zinco_feijao', nutriente: 'zinco', nome: 'Feijão', icone: 'seed', cor: '#7B4B2A' },
  { id: 'par_niacina_frango', nutriente: 'niacina', nome: 'Frango', icone: 'food-drumstick', cor: '#B45309' },
  { id: 'par_niacina_amendoim', nutriente: 'niacina', nome: 'Amendoim', icone: 'peanut', cor: '#A16207' },
];
