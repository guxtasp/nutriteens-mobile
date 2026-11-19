import { erroAmigavel } from '../utils/mensagemErro';

describe('erroAmigavel', () => {
  it('falha de rede vira orientação de conexão', () => {
    const e = erroAmigavel('TypeError: Network request failed');
    expect(e.titulo).toBe('Sem conexão com o servidor');
    expect(e.detalhe).toBe('TypeError: Network request failed');
  });

  it('erro de permissão do Postgres não aparece cru', () => {
    const e = erroAmigavel('permission denied for table profiles');
    expect(e.titulo).toBe('Sem permissão para esta ação');
    expect(e.texto).not.toMatch(/profiles/);
  });

  it('função inexistente vira aviso de migration', () => {
    expect(erroAmigavel('Could not find the function public.painel_x in the schema cache').titulo).toBe('Recurso ainda não configurado');
  });

  it('mensagem já escrita para pessoas passa direto, sem detalhe repetido', () => {
    const msg = 'A função painel_dashboard ainda não existe no banco. Rode a migration migration_painel_dashboard.sql no SQL Editor.';
    const e = erroAmigavel(msg);
    expect(e.texto).toBe(msg);
    expect(e.detalhe).toBeNull();
  });

  it('chave duplicada e dados inválidos têm textos próprios', () => {
    expect(erroAmigavel('duplicate key value violates unique constraint "x_pkey"').titulo).toBe('Este item já existe');
    expect(erroAmigavel('new row violates check constraint "eventos_app_nome_check"').titulo).toBe('Dados inválidos');
  });

  it('validação escrita para pessoas, mesmo sem acento, passa direto', () => {
    expect(erroAmigavel('3 problemas para corrigir antes de salvar (veja os avisos em vermelho).').texto).toMatch(/^3 problemas/);
    expect(erroAmigavel('Informe o nome do produto.').texto).toBe('Informe o nome do produto.');
  });

  it('mensagem vazia ou desconhecida cai no texto genérico', () => {
    expect(erroAmigavel(null).titulo).toBe('Não foi possível carregar');
    expect(erroAmigavel('xyz').detalhe).toBe('xyz');
  });
});
