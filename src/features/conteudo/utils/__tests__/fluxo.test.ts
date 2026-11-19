import { diasDesde, textoEspera } from '../fluxo';
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
  it('só a nutricionista arquiva (despublica) conteúdo publicado', () => {
    expect(acoesPermitidas('ADMINISTRADOR', 'PUBLICADO')).not.toContain('ARQUIVAR');
    expect(acoesPermitidas('NUTRICIONISTA', 'PUBLICADO')).toContain('ARQUIVAR');
    for (const s of ['RASCUNHO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'REJEITADO'] as const) {
      expect(acoesPermitidas('ADMINISTRADOR', s)).toContain('ARQUIVAR');
    }
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

describe('tempo de espera na fila', () => {
  it('conta dias inteiros e nunca negativos', () => {
    const agora = new Date('2026-11-19T12:00:00Z');
    expect(diasDesde('2026-11-19T08:00:00Z', agora)).toBe(0);
    expect(diasDesde('2026-11-17T11:00:00Z', agora)).toBe(2);
    expect(diasDesde('2026-11-20T08:00:00Z', agora)).toBe(0);
    expect(diasDesde('lixo', agora)).toBe(0);
  });
  it('escreve o texto', () => {
    expect(textoEspera(0)).toBe('desde hoje');
    expect(textoEspera(1)).toBe('há 1 dia');
    expect(textoEspera(4)).toBe('há 4 dias');
  });
});
