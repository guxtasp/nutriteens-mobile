import { formatarRelogio, minutosDoPasso, montarPassos, passosDoTexto } from '../passosReceita';

describe('passosReceita', () => {
  it('quebra um parágrafo em frases', () => {
    const p = passosDoTexto('Bata os ovos com uma pitada de sal. Aqueça uma frigideira, mexa os ovos até firmarem e misture ao arroz.');
    expect(p.map((x) => x.descricao)).toEqual([
      'Bata os ovos com uma pitada de sal.',
      'Aqueça uma frigideira, mexa os ovos até firmarem e misture ao arroz.',
    ]);
  });
  it('uma linha por passo e tira a numeração', () => {
    const p = passosDoTexto('1. Lave a banana\n2) Amasse\n- Misture');
    expect(p.map((x) => x.descricao)).toEqual(['Lave a banana', 'Amasse', 'Misture']);
  });
  it('texto vazio não gera passo', () => {
    expect(passosDoTexto('  ')).toEqual([]);
    expect(passosDoTexto(null)).toEqual([]);
  });
  it('prefere os passos cadastrados', () => {
    const p = montarPassos([{ titulo: 'Misture', descricao: 'Misture tudo', foto_url: null }], 'Outro texto.');
    expect(p).toEqual([{ titulo: 'Misture', descricao: 'Misture tudo', foto_url: null }]);
    expect(montarPassos([], 'Faça isso. Faça aquilo.')).toHaveLength(2);
  });
  it('acha o tempo do passo', () => {
    expect(minutosDoPasso('Deixe cozinhar por 10 minutos')).toBe(10);
    expect(minutosDoPasso('asse de 15 a 20 min')).toBe(20);
    expect(minutosDoPasso('Deixe descansar meia hora')).toBe(30);
    expect(minutosDoPasso('Cozinhe por 2 horas')).toBe(120);
    expect(minutosDoPasso('Misture bem')).toBeNull();
  });
  it('formata o relógio', () => {
    expect(formatarRelogio(125)).toBe('02:05');
    expect(formatarRelogio(-3)).toBe('00:00');
  });
});
