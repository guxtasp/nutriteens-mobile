import { irParaTelaAuth } from '../navegacaoAuth';

function nav(rotas: string[]) {
  return {
    getState: () => ({ routes: rotas.map((name) => ({ name })) }),
    popTo: jest.fn(),
    navigate: jest.fn(),
  };
}

describe('irParaTelaAuth', () => {
  it('volta até a tela quando ela já está na pilha', () => {
    const n = nav(['AppPresentation', 'Signup', 'Login']);
    irParaTelaAuth(n, 'Signup');
    expect(n.popTo).toHaveBeenCalledWith('Signup');
    expect(n.navigate).not.toHaveBeenCalled();
  });

  it('empilha quando a tela ainda não está na pilha', () => {
    const n = nav(['AppPresentation', 'Login']);
    irParaTelaAuth(n, 'Signup');
    expect(n.navigate).toHaveBeenCalledWith('Signup');
    expect(n.popTo).not.toHaveBeenCalled();
  });
});
