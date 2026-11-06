import { COMO_GANHAR_XP } from '../comoGanharXp';
import { ROTULO_ORIGEM } from '../extratoXp';

describe('COMO_GANHAR_XP', () => {
  it('cobre todas as origens do extrato (menos o saldo anterior)', () => {
    const origens = COMO_GANHAR_XP.map((f) => f.origem).sort();
    const esperadas = Object.keys(ROTULO_ORIGEM).filter((o) => o !== 'saldo_anterior').sort();
    expect(origens).toEqual(esperadas);
  });
  it('não cita comparação nem peso/corpo', () => {
    const texto = COMO_GANHAR_XP.map((f) => `${f.titulo} ${f.texto}`).join(' ').toLowerCase();
    expect(texto).not.toMatch(/ranking|peso|corpo|melhor que/);
  });
});
