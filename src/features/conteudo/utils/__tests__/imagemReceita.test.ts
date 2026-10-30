import { nomeArquivoFoto } from '../../services/imagemReceitaService';

jest.mock('../../../../lib/supabase', () => ({ supabase: {} }));

describe('nomeArquivoFoto', () => {
  it('usa a extensão certa e fica na pasta fotos/', () => {
    expect(nomeArquivoFoto('image/jpeg', 1000, 0.5)).toMatch(/^fotos\/1000-[a-z0-9]+\.jpg$/);
    expect(nomeArquivoFoto('image/png', 1, 0.1)).toMatch(/\.png$/);
    expect(nomeArquivoFoto('IMAGE/WEBP', 1, 0.1)).toMatch(/\.webp$/);
  });
  it('recusa formatos não aceitos', () => {
    expect(nomeArquivoFoto('image/gif')).toBeNull();
    expect(nomeArquivoFoto('application/pdf')).toBeNull();
  });
  it('envios diferentes geram nomes diferentes', () => {
    expect(nomeArquivoFoto('image/jpeg', 1, 0.123)).not.toBe(nomeArquivoFoto('image/jpeg', 2, 0.123));
  });
});
