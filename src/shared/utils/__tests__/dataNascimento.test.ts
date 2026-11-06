import { dataInicialDoSeletor, formatarDataBR, lerDataBR, limitesDoSeletor } from '../dataNascimento';

const HOJE = new Date(2026, 10, 6);

describe('dataNascimento', () => {
  it('formata com zeros à esquerda', () => {
    expect(formatarDataBR(new Date(2010, 2, 5))).toBe('05/03/2010');
  });

  it('lê datas válidas e rejeita inválidas/incompletas', () => {
    expect(lerDataBR('05/03/2010')?.getFullYear()).toBe(2010);
    expect(lerDataBR('31/02/2010')).toBeNull();
    expect(lerDataBR('05/03/20')).toBeNull();
  });

  it('abre na data digitada quando válida', () => {
    expect(formatarDataBR(dataInicialDoSeletor('05/03/2010', HOJE))).toBe('05/03/2010');
  });

  it('abre ~14 anos atrás quando vazia, inválida ou futura', () => {
    expect(dataInicialDoSeletor('', HOJE).getFullYear()).toBe(2012);
    expect(dataInicialDoSeletor('31/02/2010', HOJE).getFullYear()).toBe(2012);
    expect(dataInicialDoSeletor('01/01/2030', HOJE).getFullYear()).toBe(2012);
  });

  it('limita entre 100 anos atrás e hoje', () => {
    const { minimo, maximo } = limitesDoSeletor(HOJE);
    expect(minimo.getFullYear()).toBe(1926);
    expect(maximo).toBe(HOJE);
  });
});
