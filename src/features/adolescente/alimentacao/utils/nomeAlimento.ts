// Regras do nome de um alimento cadastrado pelo próprio adolescente.
// `alimentos.nome` é UNIQUE e global (e sensível a maiúsculas), então o app
// normaliza antes de gravar e reaproveita o alimento que já existe.

export const NOME_ALIMENTO_MIN = 2;
export const NOME_ALIMENTO_MAX = 60;

/** Tira espaços das pontas e junta espaços repetidos ("  arroz   doce " -> "arroz doce"). */
export function normalizarNomeAlimento(nome: string): string {
  return nome.trim().replace(/\s+/g, ' ');
}

/** Devolve a mensagem de erro para mostrar à pessoa, ou null se o nome serve. */
export function validarNomeAlimento(nome: string): string | null {
  const n = normalizarNomeAlimento(nome);
  if (n.length < NOME_ALIMENTO_MIN) return `Escreva o nome do alimento (mínimo ${NOME_ALIMENTO_MIN} letras).`;
  if (n.length > NOME_ALIMENTO_MAX) return `Nome muito longo (máximo ${NOME_ALIMENTO_MAX} letras).`;
  if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(n)) return 'O nome precisa ter letras.';
  return null;
}

/** Escapa % _ e \ para usar o texto como igualdade exata dentro de um ILIKE. */
export function escaparCuringasIlike(texto: string): string {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`);
}
