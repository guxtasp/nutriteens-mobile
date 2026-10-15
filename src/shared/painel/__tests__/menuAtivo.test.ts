import { rotaMenuAtiva } from '../menuAtivo';

const config = {
  itens: [
    { rota: 'AdminReceitas', rotasFilhas: ['EditarReceita'] },
    { rota: 'AdminConteudos', rotasFilhas: ['ConteudoDetalhe', 'LicaoPreview', 'EditarLicao'] },
    { rota: 'AdminTrilhas', rotasFilhas: ['EditarTrilha'] },
    { rota: 'AdminTrocas' },
  ],
};

describe('rotaMenuAtiva', () => {
  it('rota de lista marca o próprio item', () => {
    expect(rotaMenuAtiva(config, 'AdminTrilhas')).toBe('AdminTrilhas');
  });
  it('sem origem, usa as rotas filhas', () => {
    expect(rotaMenuAtiva(config, 'EditarLicao')).toBe('AdminConteudos');
    expect(rotaMenuAtiva(config, 'EditarTrilha')).toBe('AdminTrilhas');
  });
  it('com origem, a tela compartilhada marca a lista de onde veio', () => {
    expect(rotaMenuAtiva(config, 'EditarLicao', 'AdminTrilhas')).toBe('AdminTrilhas');
    expect(rotaMenuAtiva(config, 'ConteudoDetalhe', 'AdminReceitas')).toBe('AdminReceitas');
    expect(rotaMenuAtiva(config, 'LicaoPreview', 'AdminTrocas')).toBe('AdminTrocas');
  });
  it('origem desconhecida ou inválida cai nas rotas filhas', () => {
    expect(rotaMenuAtiva(config, 'EditarLicao', 'RotaInexistente')).toBe('AdminConteudos');
    expect(rotaMenuAtiva(config, 'EditarLicao', 42)).toBe('AdminConteudos');
  });
  it('rota fora do menu não marca nada', () => {
    expect(rotaMenuAtiva(config, 'Qualquer')).toBeNull();
  });
});
