// src/features/auth/utils/loginErros.ts
//
// Regras de login compartilhadas entre a tela do adolescente (LoginScreen) e a
// tela de acesso profissional (LoginProfissionalScreen), para as duas dizerem
// sempre a mesma coisa.
import { validateEmail } from './signupValidators';

export const MENSAGEM_LOGIN_INVALIDO = 'E-mail ou senha incorretos';
export const MENSAGEM_FALHA_CONEXAO = 'Não conseguimos conectar agora. Verifique sua internet e tente de novo';

// Mesma mensagem para qualquer recusa de login (senha errada, conta inexistente, e-mail não
// confirmado...): mensagens diferentes revelariam quais e-mails têm conta (RF005). Só falha de
// conexão/servidor tem texto próprio, pois não diz nada sobre a conta.
export function mensagemErroLogin(error: { name?: string; status?: number }): string {
  const semConexao =
    error.name === 'AuthRetryableFetchError' || error.status === 0 || (error.status ?? 0) >= 500;
  return semConexao ? MENSAGEM_FALHA_CONEXAO : MENSAGEM_LOGIN_INVALIDO;
}

export interface ErrosCredenciais {
  email?: string;
  senha?: string;
}

// Validação antes de chamar o servidor. Não exige tamanho mínimo da senha: quem já tem conta
// pode ter uma senha mais antiga, e dizer "mínimo de 8" no login só atrapalha.
export function validarCredenciais(email: string, senha: string): ErrosCredenciais {
  const erros: ErrosCredenciais = {};
  if (!email.trim()) erros.email = 'Digite seu e-mail';
  else {
    const formato = validateEmail(email);
    if (formato) erros.email = formato;
  }
  if (!senha) erros.senha = 'Digite sua senha';
  return erros;
}
