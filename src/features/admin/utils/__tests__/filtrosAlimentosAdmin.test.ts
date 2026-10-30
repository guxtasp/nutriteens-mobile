import { contarFiltros, filtrarAlimentos, FILTROS_VAZIOS, normalizar } from '../filtrosAlimentosAdmin';
import type { Alimento } from '../../services/alimentosAdminService';

jest.mock('../../../../lib/supabase', () => ({ supabase: {} }));

const base: Alimento = {
  id: '1', nome: 'Maçã', eh_prato_composto: false, classificacao_nova: 'IN_NATURA', acessivel_ebia: true,
  nivel_maximo_ebia: 'INSEGURANCA_GRAVE', grupos_alimentares: ['FRUTAS'], criado_por: null,
};
const lista: Alimento[] = [
  base,
  { ...base, id: '2', nome: 'Feijoada', eh_prato_composto: true, classificacao_nova: 'PROCESSADO', grupos_alimentares: ['LEGUMINOSAS', 'CARNES_E_OVOS'], tem_receita: true, tipos_refeicao_recordatorio: ['ALMOCO'] },
  { ...base, id: '3', nome: 'Bolacha recheada', classificacao_nova: 'ULTRAPROCESSADO', grupos_alimentares: ['ACUCARES_E_DOCES'], criado_por: 'u1', nutrientes_fonte: 'INFERIDO_POR_GRUPO', tipos_refeicao_recordatorio: ['LANCHE_TARDE', 'LANCHE_MANHA'] },
  { ...base, id: '4', nome: 'Pizza', eh_prato_composto: true, criado_por: 'u2', nutrientes_fonte: 'REVISADO_NUTRICIONISTA' },
];
const ids = (f: Partial<typeof FILTROS_VAZIOS>) => filtrarAlimentos(lista, { ...FILTROS_VAZIOS, ...f }).map((a) => a.id);

describe('filtrarAlimentos', () => {
  it('sem filtros devolve tudo', () => expect(ids({})).toEqual(['1', '2', '3', '4']));
  it('busca ignora acento e caixa', () => {
    expect(ids({ busca: 'maca' })).toEqual(['1']);
    expect(ids({ busca: 'FEIJOADA' })).toEqual(['2']);
  });
  it('separa pratos de ingredientes', () => {
    expect(ids({ tipo: 'PRATO' })).toEqual(['2', '4']);
    expect(ids({ tipo: 'INGREDIENTE' })).toEqual(['1', '3']);
  });
  it('origem: equipe, adolescente e a revisar', () => {
    expect(ids({ origem: 'EQUIPE' })).toEqual(['1', '2']);
    expect(ids({ origem: 'ADOLESCENTE' })).toEqual(['3', '4']);
    expect(ids({ origem: 'REVISAR' })).toEqual(['3']);
  });
  it('NOVA e grupo', () => {
    expect(ids({ nova: 'ULTRAPROCESSADO' })).toEqual(['3']);
    expect(ids({ grupo: 'LEGUMINOSAS' })).toEqual(['2']);
  });
  it('recordatório: refeição específica e "fora do recordatório"', () => {
    expect(ids({ recordatorio: 'ALMOCO' })).toEqual(['2']);
    expect(ids({ recordatorio: 'LANCHE_MANHA' })).toEqual(['3']);
    expect(ids({ recordatorio: 'SEM' })).toEqual(['1', '4']);
  });
  it('receita', () => {
    expect(ids({ receita: 'COM' })).toEqual(['2']);
    expect(ids({ receita: 'SEM' })).toEqual(['1', '3', '4']);
  });
  it('combina filtros', () => expect(ids({ tipo: 'PRATO', origem: 'ADOLESCENTE' })).toEqual(['4']));
});

describe('contarFiltros / normalizar', () => {
  it('conta só filtros ligados, sem a busca', () => {
    expect(contarFiltros({ ...FILTROS_VAZIOS, busca: 'x' })).toBe(0);
    expect(contarFiltros({ ...FILTROS_VAZIOS, tipo: 'PRATO', nova: 'IN_NATURA' })).toBe(2);
  });
  it('normaliza', () => expect(normalizar('  Maçã Açaí ')).toBe('maca acai'));
});
