import {
  AVATARES_SOCIAIS,
  avatarSocialValido,
  codigoCompleto,
  formatarCodigo,
  normalizarApelido,
  normalizarCodigo,
  poseDoAvatar,
  validarApelido,
} from '../amizade';

describe('código de amizade', () => {
  it('normaliza maiúsculas, hífen e espaços', () => {
    expect(normalizarCodigo(' ab12-cd34 ')).toBe('AB12CD34');
  });

  it('formata em dois blocos de 4', () => {
    expect(formatarCodigo('ab12cd34')).toBe('AB12-CD34');
    expect(formatarCodigo('ab1')).toBe('AB1');
  });

  it('só considera completo com 8 caracteres do alfabeto', () => {
    expect(codigoCompleto('AB2C-D3EF')).toBe(true);
    expect(codigoCompleto('AB2C-D3E')).toBe(false); // curto
    expect(codigoCompleto('AB2C-D3EFG')).toBe(false); // longo
    expect(codigoCompleto('AB0C-D3EF')).toBe(false); // 0 não existe no alfabeto
    expect(codigoCompleto('ABIC-D3EF')).toBe(false); // I não existe no alfabeto
  });
});

describe('apelido', () => {
  it('normaliza espaços', () => {
    expect(normalizarApelido('  Ana   Banana ')).toBe('Ana Banana');
  });

  it('aceita apelidos normais, com acento e número', () => {
    ['Ana', 'Ana Banana', 'João_10', 'Zé.Couve', 'Maria-Clara', 'Léo2010'].forEach((a) =>
      expect(validarApelido(a).valido).toBe(true)
    );
  });

  it('rejeita curto e longo', () => {
    expect(validarApelido('ab')).toMatchObject({ valido: false, erro: 'curto' });
    expect(validarApelido('a'.repeat(21))).toMatchObject({ valido: false, erro: 'longo' });
  });

  it('rejeita e-mail, link e símbolos', () => {
    ['joao@x.com', 'http://x.co', 'ana/banana', 'ana!!', '_ana', 'ana_'].forEach((a) =>
      expect(validarApelido(a)).toMatchObject({ valido: false, erro: 'caracteres' })
    );
  });

  it('rejeita sequência de 6 dígitos ou mais (telefone)', () => {
    expect(validarApelido('ana11999998888')).toMatchObject({ valido: false, erro: 'telefone' });
    expect(validarApelido('ana12345')).toMatchObject({ valido: true });
  });
});

describe('avatar', () => {
  it('toda chave de avatar é aceita pelo banco (minúsculas, sem espaço)', () => {
    AVATARES_SOCIAIS.forEach((a) => expect(a).toMatch(/^[a-z0-9_-]{1,30}$/));
  });

  it('chave removida (aceno) ou vazia não é um avatar válido', () => {
    expect(avatarSocialValido('aceno')).toBe(false);
    expect(avatarSocialValido(null)).toBe(false);
    expect(avatarSocialValido('calmo')).toBe(true);
  });

  it('traduz a chave para a pose do Broxis e cai no padrão se for desconhecida', () => {
    expect(poseDoAvatar('surpreso')).toBe('surpresoPositivo');
    expect(poseDoAvatar('calmo')).toBe('calmo');
    expect(poseDoAvatar('xyz')).toBe('supercontente');
    expect(poseDoAvatar(null)).toBe('supercontente');
  });
});