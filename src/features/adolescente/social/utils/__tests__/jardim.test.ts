import { ESTAGIOS_JARDIM, estagioDoJardim, mapearJardins, progressoDoJardim, textoRegaHoje, type Jardim } from '../jardim';

const base = (membros: Jardim['membros']): Jardim => ({ id: 'j', tema: 'GIRASSOL', pontos: 5, situacao: 'ativo', convidadoPor: null, membros });
const m = (eu: boolean, regouHoje: boolean, pendente = false) => ({ apelido: eu ? 'Eu' : 'Ana', avatar: null, eu, pendente, regouHoje });

describe('jardim', () => {
  it('o estágio nunca diminui quando os pontos sobem', () => {
    let anterior = -1;
    for (let p = 0; p <= 120; p++) {
      const i = estagioDoJardim(p).indice;
      expect(i).toBeGreaterThanOrEqual(anterior);
      anterior = i;
    }
    expect(estagioDoJardim(0).nome).toBe('Semente');
    expect(estagioDoJardim(70).indice).toBe(ESTAGIOS_JARDIM.length - 1);
  });

  it('progresso mostra quanto falta e fica cheio no último estágio', () => {
    expect(progressoDoJardim(0)).toMatchObject({ faltam: 3, fracao: 0 });
    expect(progressoDoJardim(5).faltam).toBe(3);
    expect(progressoDoJardim(500)).toMatchObject({ fracao: 1, faltam: 0, proximo: null });
    expect(estagioDoJardim(-4).indice).toBe(0);
  });

  it('o texto do dia só celebra e nunca aponta quem faltou', () => {
    expect(textoRegaHoje(base([m(true, false), m(false, false)]))).toMatch(/esperando/);
    expect(textoRegaHoje(base([m(true, true), m(false, true)]))).toMatch(/Todo mundo/);
    expect(textoRegaHoje(base([m(true, true), m(false, false)]))).toBe('Você regou o jardim hoje.');
    const t = textoRegaHoje(base([m(true, false), m(false, true), m(false, false)]));
    expect(t).not.toMatch(/faltou|falta|não regou|esqueceu/i);
  });

  it('convidados pendentes não contam para "todo mundo regou"', () => {
    expect(textoRegaHoje(base([m(true, true), m(false, false, true)]))).toMatch(/Todo mundo/);
  });

  it('mapeia o retorno do banco e descarta lixo', () => {
    const lista = mapearJardins([
      { id: 'a', tema: 'HORTA', pontos: 9, situacao: 'ativo', membros: [{ apelido: 'Lu', eu: true, regou_hoje: true }] },
      { id: 'b', tema: 'INVALIDO', situacao: 'ativo' },
      { tema: 'GIRASSOL', situacao: 'ativo' },
    ]);
    expect(lista).toHaveLength(1);
    expect(lista[0].membros[0]).toMatchObject({ apelido: 'Lu', eu: true, regouHoje: true, pendente: false });
    expect(mapearJardins(null)).toEqual([]);
  });
});
