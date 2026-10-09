import {
  contarNovas,
  montarCartas,
  progressoAlbum,
  rotuloPasso,
  textoCartasNovas,
  type LinhaCartaGuia,
} from '../cartas';

function linha(passo: number): LinhaCartaGuia {
  return {
    id: `c${passo}`,
    passo,
    codigo: `passo_${passo}`,
    titulo: `Carta ${passo}`,
    resumo: 'resumo',
    dica: 'dica',
    como_ganhar: 'como ganhar',
  };
}

describe('montarCartas', () => {
  it('ordena pelos passos, mesmo com o catálogo fora de ordem', () => {
    const cartas = montarCartas([linha(3), linha(1), linha(2)], []);
    expect(cartas.map((c) => c.passo)).toEqual([1, 2, 3]);
  });

  it('marca como obtida só o que o usuário ganhou', () => {
    const cartas = montarCartas([linha(1), linha(2)], [{ carta_id: 'c2', vista: true }]);
    expect(cartas.map((c) => c.obtida)).toEqual([false, true]);
  });

  it('carta ganha e ainda não vista é "nova"; carta vista não é', () => {
    const cartas = montarCartas(
      [linha(1), linha(2), linha(3)],
      [
        { carta_id: 'c1', vista: false },
        { carta_id: 'c2', vista: true },
      ]
    );
    expect(cartas.map((c) => c.nova)).toEqual([true, false, false]);
  });

  it('carta bloqueada nunca é "nova"', () => {
    expect(montarCartas([linha(1)], [])[0].nova).toBe(false);
  });

  it('ignora cartas ganhas que não estão mais no catálogo (carta desativada)', () => {
    const cartas = montarCartas([linha(1)], [{ carta_id: 'sumiu', vista: false }]);
    expect(cartas).toHaveLength(1);
    expect(cartas[0].obtida).toBe(false);
  });

  it('traduz como_ganhar para comoGanhar', () => {
    expect(montarCartas([linha(1)], [])[0].comoGanhar).toBe('como ganhar');
  });
});

describe('progressoAlbum', () => {
  it('álbum vazio não divide por zero', () => {
    expect(progressoAlbum([])).toEqual({ obtidas: 0, total: 0, fracao: 0, completo: false });
  });

  it('calcula a fração e detecta álbum completo', () => {
    const todas = Array.from({ length: 10 }, (_, i) => linha(i + 1));
    const metade = montarCartas(
      todas,
      todas.slice(0, 5).map((l) => ({ carta_id: l.id, vista: true }))
    );
    expect(progressoAlbum(metade)).toEqual({ obtidas: 5, total: 10, fracao: 0.5, completo: false });

    const completo = montarCartas(
      todas,
      todas.map((l) => ({ carta_id: l.id, vista: true }))
    );
    expect(progressoAlbum(completo).completo).toBe(true);
  });
});

describe('contarNovas / textoCartasNovas', () => {
  it('conta só as novas', () => {
    const cartas = montarCartas(
      [linha(1), linha(2)],
      [
        { carta_id: 'c1', vista: false },
        { carta_id: 'c2', vista: false },
      ]
    );
    expect(contarNovas(cartas)).toBe(2);
  });

  it('usa singular e plural', () => {
    expect(textoCartasNovas(0)).toBeNull();
    expect(textoCartasNovas(1)).toBe('Você ganhou 1 carta nova!');
    expect(textoCartasNovas(3)).toBe('Você ganhou 3 cartas novas!');
  });
});

describe('rotuloPasso', () => {
  it('formata o rótulo', () => {
    expect(rotuloPasso(4)).toBe('Passo 4');
  });
});
