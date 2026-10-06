import { acoesPermitidas, avisoEdicao, permissoes, rotuloAcao, validarMotivo } from '../fluxo';

describe('fluxo de aprovação', () => {
  it('admin nunca vê aprovar, rejeitar nem publicar', () => {
    for (const s of ['RASCUNHO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'PUBLICADO', 'REJEITADO', 'ARQUIVADO'] as const) {
      const a = acoesPermitidas('ADMINISTRADOR', s);
      expect(a).not.toContain('APROVAR');
      expect(a).not.toContain('REJEITAR');
      expect(a).not.toContain('PUBLICAR');
    }
  });
  it('admin envia rascunho e arquiva', () => {
    expect(acoesPermitidas('ADMINISTRADOR', 'RASCUNHO')).toEqual(['ENVIAR', 'ARQUIVAR']);
  });
  it('nutricionista aprova e publica direto (fluxo simplificado), mas não o que já está publicado', () => {
    expect(acoesPermitidas('NUTRICIONISTA', 'RASCUNHO')).toContain('PUBLICAR');
    expect(acoesPermitidas('NUTRICIONISTA', 'AGUARDANDO_APROVACAO')).toEqual(expect.arrayContaining(['APROVAR', 'PUBLICAR', 'REJEITAR']));
    expect(acoesPermitidas('NUTRICIONISTA', 'PUBLICADO')).not.toContain('PUBLICAR');
    expect(acoesPermitidas('NUTRICIONISTA', 'ARQUIVADO')).not.toContain('PUBLICAR');
  });
  it('rótulo: publicar direto vira "aprovar e publicar"', () => {
    expect(rotuloAcao('PUBLICAR', 'APROVADO')).toBe('PUBLICAR');
    expect(rotuloAcao('PUBLICAR', 'RASCUNHO')).toBe('APROVAR E PUBLICAR');
  });
  it('ver, editar e aprovar são permissões separadas', () => {
    expect(permissoes('ADMINISTRADOR')).toMatchObject({ ver: true, editar: true, aprovar: false, publicar: false });
    expect(permissoes('NUTRICIONISTA')).toMatchObject({ ver: true, editar: true, aprovar: true, publicar: true });
  });
  it('aviso de edição difere por papel', () => {
    expect(avisoEdicao('ADMINISTRADOR', 'PUBLICADO')).toMatch(/volta para rascunho/);
    expect(avisoEdicao('NUTRICIONISTA', 'PUBLICADO')).toMatch(/mantêm o status/);
    expect(avisoEdicao('ADMINISTRADOR', 'RASCUNHO')).toBeNull();
  });
  it('rejeição exige motivo', () => {
    expect(validarMotivo('   ')).not.toBeNull();
    expect(validarMotivo('Faltou fonte')).toBeNull();
  });
});
