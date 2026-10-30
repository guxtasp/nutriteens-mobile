// src/features/auth/utils/acessoProfissional.ts
//
// O acesso profissional (nutricionista e administrador) só é oferecido no computador:
// na web, em janela larga. No celular (app ou navegador do celular) o link some e a
// pessoa entra pelo login comum, que funciona para qualquer perfil.
export const LARGURA_ACESSO_PROFISSIONAL = 900;

export function acessoProfissionalDisponivel(plataforma: string, largura: number): boolean {
  return plataforma === 'web' && largura >= LARGURA_ACESSO_PROFISSIONAL;
}
