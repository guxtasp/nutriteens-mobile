import { normalizarNomeAlimento, validarNomeAlimento, escaparCuringasIlike } from '../nomeAlimento';

describe('nomeAlimento', () => {
  it('normaliza espaços', () => {
    expect(normalizarNomeAlimento('  arroz   doce ')).toBe('arroz doce');
  });
  it('valida tamanho e letras', () => {
    expect(validarNomeAlimento('')).not.toBeNull();
    expect(validarNomeAlimento(' a ')).not.toBeNull();
    expect(validarNomeAlimento('x'.repeat(61))).not.toBeNull();
    expect(validarNomeAlimento('1234')).not.toBeNull();
    expect(validarNomeAlimento('Pão de queijo')).toBeNull();
    expect(validarNomeAlimento('Açaí')).toBeNull();
  });
  it('escapa curingas do ILIKE', () => {
    expect(escaparCuringasIlike('100%_ok\\')).toBe('100\\%\\_ok\\\\');
  });
});
