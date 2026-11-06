// src/features/auth/utils/navegacaoAuth.ts
//
// Vai de Login para Cadastro (e vice-versa) sem empilhar telas repetidas. No React
// Navigation 7 `navigate` empilha uma cópia nova; se a tela de destino já está na pilha,
// volta até ela (`popTo`), mantendo a pilha curta e o botão voltar previsível.
export interface NavegacaoComPilha {
  getState: () => { routes: { name: string }[] };
  popTo: (nome: string) => void;
  navigate: (nome: string) => void;
}

export function irParaTelaAuth(navigation: NavegacaoComPilha, destino: 'Login' | 'Signup') {
  const jaNaPilha = navigation.getState().routes.some((r) => r.name === destino);
  if (jaNaPilha) navigation.popTo(destino);
  else navigation.navigate(destino);
}
