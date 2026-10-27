import { sortearRodada, acertou, embaralhar } from '../rodadaNova';
import { ALIMENTOS_NOVA } from '../../data/alimentosNova';

describe('rodadaNova', () => {
  it('sorteia n itens únicos com os 4 grupos presentes', () => {
    for (let k = 0; k < 50; k++) {
      const r = sortearRodada(8);
      expect(r).toHaveLength(8);
      expect(new Set(r.map((a) => a.id)).size).toBe(8);
      expect(new Set(r.map((a) => a.grupo)).size).toBe(4);
    }
  });
  it('não passa do tamanho da lista', () => {
    expect(sortearRodada(999)).toHaveLength(ALIMENTOS_NOVA.length);
  });
  it('embaralhar mantém os elementos', () => {
    expect(embaralhar([1, 2, 3, 4]).sort()).toEqual([1, 2, 3, 4]);
  });
  it('confere o acerto pelo grupo', () => {
    const refri = ALIMENTOS_NOVA.find((a) => a.id === 'refri')!;
    expect(acertou(refri, 'ULTRAPROCESSADO')).toBe(true);
    expect(acertou(refri, 'IN_NATURA')).toBe(false);
  });
  it('ids são únicos', () => {
    expect(new Set(ALIMENTOS_NOVA.map((a) => a.id)).size).toBe(ALIMENTOS_NOVA.length);
  });
});
