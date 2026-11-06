// src/features/auth/utils/etapasCadastro.ts
//
// Regras puras do cadastro em 2 etapas (decisão 3.2). Sem React e sem Supabase,
// para poder testar com Jest. A criação da conta continua toda no useSignup.
import {
  validateNome,
  validateDataNascimento,
  validateEmail,
  validatePassword,
} from './signupValidators';

export const TOTAL_ETAPAS = 2;

export interface DadosCadastro {
  nome: string;
  dataNascimento: string;
  genero: string | null;
  tipoEscola: string | null;
  email: string;
  password: string;
  aceitouTermos: boolean;
}

export const ERRO_GENERO = 'Selecione o gênero';
export const ERRO_ESCOLA = 'Selecione o tipo de escola';
export const ERRO_TERMOS = 'Você precisa aceitar os termos de uso para continuar';

/** Primeira mensagem de erro da etapa 1 (na ordem da tela), ou null se está tudo certo. */
export function etapa1Erro(d: DadosCadastro): string | null {
  return (
    validateNome(d.nome) ??
    validateDataNascimento(d.dataNascimento) ??
    (d.genero ? null : ERRO_GENERO) ??
    (d.tipoEscola ? null : ERRO_ESCOLA)
  );
}

/** Primeira mensagem de erro da etapa 2, ou null se está tudo certo. */
export function etapa2Erro(d: DadosCadastro): string | null {
  return (
    validateEmail(d.email) ??
    validatePassword(d.password) ??
    (d.aceitouTermos ? null : ERRO_TERMOS)
  );
}

export function etapa1Valida(d: DadosCadastro): boolean {
  return etapa1Erro(d) === null;
}

export function etapa2Valida(d: DadosCadastro): boolean {
  return etapa2Erro(d) === null;
}

/** true se a pessoa já digitou/escolheu algo (decide se pede confirmação ao sair). */
export function temDadosPreenchidos(d: DadosCadastro): boolean {
  return (
    d.nome.trim() !== '' ||
    d.dataNascimento !== '' ||
    d.genero !== null ||
    d.tipoEscola !== null ||
    d.email.trim() !== '' ||
    d.password !== '' ||
    d.aceitouTermos
  );
}

/** Primeiro nome para o título da etapa 2 ("Quase lá, Ana!"); vazio se não houver nome. */
export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? '';
}

/** Progresso da barra (0 a 1): etapa 1 = 50%, etapa 2 = 100%. */
export function progressoDaEtapa(etapa: number): number {
  return Math.min(Math.max(etapa / TOTAL_ETAPAS, 0), 1);
}
