import { textoTermometro } from '../textoTermometro';
import type { EstadoTermometro } from '../misturaNova';

const ESTADOS: EstadoTermometro[] = ['sem_dados', 'mais_natural', 'mistura', 'mais_industrializado'];
const PROIBIDAS = /falta|ruim|péssim|errad|nota|culpa|vermelho|ebia|inseguran/i;

describe('textoTermometro', () => {
  it('nunca usa vocabulário de cobrança ou de EBIA, em nenhum estado, tom ou período', () => {
    for (const estado of ESTADOS) {
      for (const evitarCobranca of [true, false]) {
        for (const periodo of ['semana', 'mes'] as const) {
          for (const semente of ['a', 'b', 'c', 'd']) {
            const f = textoTermometro(estado, { evitarCobranca, periodo, semente });
            expect(f.texto).not.toMatch(PROIBIDAS);
            expect(f.texto.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('é determinístico para a mesma semente', () => {
    const o = { evitarCobranca: false, periodo: 'semana' as const, semente: 'u1' };
    expect(textoTermometro('mistura', o)).toEqual(textoTermometro('mistura', o));
  });

  it('mais_industrializado: evitarCobranca muda o tom e não sugere trocar nada', () => {
    const suave = textoTermometro('mais_industrializado', { evitarCobranca: true, periodo: 'semana', semente: 's' });
    const direto = textoTermometro('mais_industrializado', { evitarCobranca: false, periodo: 'semana', semente: 's' });
    expect(suave.texto).not.toEqual(direto.texto);
    expect(suave.texto).not.toMatch(/trocar/i);
  });

  it('só o estado sem_dados oferece próximo passo', () => {
    for (const estado of ESTADOS) {
      const f = textoTermometro(estado, { evitarCobranca: true, periodo: 'mes', semente: 's' });
      expect(f.proximoPasso !== null).toBe(estado === 'sem_dados');
    }
  });

  it('o texto acompanha o período', () => {
    expect(textoTermometro('mistura', { evitarCobranca: false, periodo: 'semana', semente: 's' }).texto).toMatch(/semana/);
    expect(textoTermometro('mistura', { evitarCobranca: false, periodo: 'mes', semente: 's' }).texto).toMatch(/mês/);
  });
});
