// src/features/auth/utils/signupValidators.ts

// converte DD/MM/AAAA -> AAAA-MM-DD (formato aceito pela coluna DATE do Postgres)
export function toIsoDate(brDate: string): string | null {
  const match = brDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

// checa se dia/mês/ano formam uma data real (rejeita 31/02, 30/02 em ano não bissexto etc.)
function isRealDate(day: number, month: number, year: number): boolean {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export const PASSWORD_MIN_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateNome(value: string): string | null {
  const palavras = value.trim().split(/\s+/).filter(Boolean);
  if (palavras.length < 2) {
    return 'Digite seu nome completo (nome e sobrenome)';
  }
  return null;
}

export function validateDataNascimento(value: string): string | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return 'Digite a data no formato DD/MM/AAAA';
  }

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (!isRealDate(day, month, year)) {
    return 'Digite uma data de nascimento válida';
  }

  const hoje = new Date();
  const dataInformada = new Date(year, month - 1, day);
  if (dataInformada > hoje) {
    return 'A data de nascimento não pode ser no futuro';
  }

  return null;
}

export function validateEmail(value: string): string | null {
  if (!EMAIL_REGEX.test(value.trim())) {
    return 'Digite um e-mail em um formato válido';
  }
  return null;
}

export function validatePassword(value: string): string | null {
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`;
  }
  if (!/[a-z]/.test(value)) return 'A senha precisa ter pelo menos uma letra minúscula';
  if (!/[A-Z]/.test(value)) return 'A senha precisa ter pelo menos uma letra maiúscula';
  if (!/[0-9]/.test(value)) return 'A senha precisa ter pelo menos um número';
  if (!/[^A-Za-z0-9]/.test(value)) return 'A senha precisa ter pelo menos um caractere especial (ex: !@#$%)';
  return null;
}