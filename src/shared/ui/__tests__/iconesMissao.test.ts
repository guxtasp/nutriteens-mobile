import { ICONES_MISSAO, ICONE_DO_EMOJI, ICONE_MISSAO_PADRAO, resolverIconeMissao } from '../iconesMissao';
import { VARIANTES_MISSAO } from '../../../features/adolescente/missoes/utils/variantesMissao';

// mapa oficial de glifos do Ionicons instalado no projeto
// eslint-disable-next-line @typescript-eslint/no-var-requires
const GLIFOS: Record<string, number> = require('../../../../node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');

describe('ícones de missão', () => {
  it('todo ícone da lista existe no Ionicons', () => {
    const inexistentes = ICONES_MISSAO.map((i) => i.nome).filter((n) => !(n in GLIFOS));
    expect(inexistentes).toEqual([]);
  });

  it('todo emoji convertido aponta para um ícone que existe', () => {
    const inexistentes = Object.values(ICONE_DO_EMOJI).filter((n) => !(n in GLIFOS));
    expect(inexistentes).toEqual([]);
  });

  it('não há nomes repetidos na lista', () => {
    const nomes = ICONES_MISSAO.map((i) => i.nome);
    expect(new Set(nomes).size).toBe(nomes.length);
  });

  it('resolve nome, emoji antigo e valor vazio', () => {
    expect(resolverIconeMissao('water')).toBe('water');
    expect(resolverIconeMissao('💧')).toBe('water');
    expect(resolverIconeMissao('🍽️')).toBe('restaurant');
    expect(resolverIconeMissao(null)).toBe(ICONE_MISSAO_PADRAO);
    expect(resolverIconeMissao('algo-que-nao-existe')).toBe(ICONE_MISSAO_PADRAO);
  });

  it('as missões embutidas do app não usam emoji sem conversão', () => {
    const semConversao = VARIANTES_MISSAO.map((v) => v.icone).filter((i) => resolverIconeMissao(i) === ICONE_MISSAO_PADRAO && i !== ICONE_MISSAO_PADRAO);
    expect(semConversao).toEqual([]);
  });
});
