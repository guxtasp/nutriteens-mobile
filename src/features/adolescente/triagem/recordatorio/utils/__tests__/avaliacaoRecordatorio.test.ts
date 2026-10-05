import { avaliarRecordatorio, ItemAvaliacao } from '../avaliacaoRecordatorio';

const item = (nova: ItemAvaliacao['classificacao_nova']): ItemAvaliacao => ({ classificacao_nova: nova });

describe('avaliarRecordatorio', () => {
  it('dia sem itens: sem proporção e sem nível', () => {
    const r = avaliarRecordatorio([], 0);
    expect(r.versao).toBe(2);
    expect(r.total_itens).toBe(0);
    expect(r.ultraprocessados).toEqual({ quantidade: 0, proporcao: null, nivel: null });
  });

  it('nível BAIXO sem nenhum ultraprocessado', () => {
    const r = avaliarRecordatorio([item('IN_NATURA'), item('PROCESSADO'), item('IN_NATURA'), item('IN_NATURA')], 6);
    expect(r.ultraprocessados).toEqual({ quantidade: 0, proporcao: 0, nivel: 'BAIXO' });
  });

  it('nível MODERADO a partir de 25% (e abaixo de 50%)', () => {
    const r = avaliarRecordatorio([item('IN_NATURA'), item('IN_NATURA'), item('IN_NATURA'), item('ULTRAPROCESSADO')], 6);
    expect(r.ultraprocessados.proporcao).toBe(0.25);
    expect(r.ultraprocessados.nivel).toBe('MODERADO');
  });

  it('nível ALTO a partir de 50%', () => {
    const r = avaliarRecordatorio([item('IN_NATURA'), item('IN_NATURA'), item('ULTRAPROCESSADO'), item('ULTRAPROCESSADO')], 6);
    expect(r.ultraprocessados.nivel).toBe('ALTO');
  });

  it('processado NÃO conta como ultraprocessado', () => {
    const r = avaliarRecordatorio([item('PROCESSADO'), item('PROCESSADO')], 3);
    expect(r.ultraprocessados.quantidade).toBe(0);
  });

  it('guarda quantas refeições o adolescente realmente fez', () => {
    expect(avaliarRecordatorio([], 4).refeicoes_realizadas).toBe(4);
  });
});
