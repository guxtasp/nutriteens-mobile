// src/features/adolescente/social/utils/amizade.ts
//
// Regras puras da parte social (sem React/Supabase, pra testar). Espelham as
// regras do banco (data/migration_social_amizades.sql); o BANCO é quem manda —
// aqui é só pra avisar o usuário antes de ir ao servidor.

// Mesmo alfabeto do banco: 32 caracteres, sem I, O, 0 e 1 (não se confundem
// quando o código é lido ou digitado).
export const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const TAMANHO_CODIGO = 8;

/** Tira hífen/espaços e põe em maiúsculas: "ab12-cd34" vira "AB12CD34". */
export function normalizarCodigo(texto: string): string {
  return (texto ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Mostra o código em dois blocos, mais fácil de ler e ditar: "AB12-CD34". */
export function formatarCodigo(codigo: string): string {
  const n = normalizarCodigo(codigo);
  return n.length > 4 ? `${n.slice(0, 4)}-${n.slice(4)}` : n;
}

/** O código está completo e só tem caracteres do alfabeto? */
export function codigoCompleto(texto: string): boolean {
  const n = normalizarCodigo(texto);
  return n.length === TAMANHO_CODIGO && n.split('').every((c) => ALFABETO_CODIGO.includes(c));
}

// ---------------------------------------------------------------------------
// Apelido
// ---------------------------------------------------------------------------

export type ErroApelido = 'curto' | 'longo' | 'caracteres' | 'telefone';

export const MENSAGEM_ERRO_APELIDO: Record<ErroApelido, string> = {
  curto: 'O apelido precisa ter pelo menos 3 caracteres.',
  longo: 'O apelido pode ter no máximo 20 caracteres.',
  caracteres: 'Use só letras, números, espaço, ponto, hífen ou _. Comece e termine com letra ou número.',
  telefone: 'Não coloque telefone no apelido.',
};

const LETRA_OU_NUMERO = 'A-Za-zÀ-ÖØ-öø-ÿ0-9';
const REGEX_APELIDO = new RegExp(`^[${LETRA_OU_NUMERO}][${LETRA_OU_NUMERO} ._-]*[${LETRA_OU_NUMERO}]$`);

/** Tira espaços das pontas e junta espaços repetidos (igual ao banco). */
export function normalizarApelido(texto: string): string {
  return (texto ?? '').replace(/\s+/g, ' ').trim();
}

export type ResultadoApelido = { valido: true; valor: string } | { valido: false; valor: string; erro: ErroApelido };

export function validarApelido(texto: string): ResultadoApelido {
  const valor = normalizarApelido(texto);
  if (valor.length < 3) return { valido: false, valor, erro: 'curto' };
  if (valor.length > 20) return { valido: false, valor, erro: 'longo' };
  if (/\d{6,}/.test(valor)) return { valido: false, valor, erro: 'telefone' };
  if (!REGEX_APELIDO.test(valor)) return { valido: false, valor, erro: 'caracteres' };
  return { valido: true, valor };
}

// ---------------------------------------------------------------------------
// Avatar: reaproveita as poses do Broxis. A chave vai pro banco em minúsculas
// (profiles.avatar_social); `poseDoAvatar` traduz pra pose do BroxisMascot.
// ---------------------------------------------------------------------------

export const AVATARES_SOCIAIS = ['supercontente', 'orgulhoso', 'curioso', 'calmo', 'pensando', 'surpreso'] as const;
export type AvatarSocial = (typeof AVATARES_SOCIAIS)[number];

export const AVATAR_SOCIAL_PADRAO: AvatarSocial = 'supercontente';

type PoseBroxis = 'pensando' | 'orgulhoso' | 'supercontente' | 'surpresoPositivo' | 'curioso' | 'calmo';

const POSE_POR_AVATAR: Record<AvatarSocial, PoseBroxis> = {
  supercontente: 'supercontente',
  orgulhoso: 'orgulhoso',
  curioso: 'curioso',
  calmo: 'calmo',
  pensando: 'pensando',
  surpreso: 'surpresoPositivo',
};

/**
 * A chave é um avatar que ainda existe? Chaves antigas (ex.: "aceno", removido)
 * ou vazias não são válidas: a tela mostra um placeholder no lugar.
 */
export function avatarSocialValido(chave: string | null | undefined): chave is AvatarSocial {
  return (AVATARES_SOCIAIS as readonly string[]).includes(chave ?? '');
}

/** Pose do BroxisMascot para a chave de avatar (chave desconhecida cai no padrão). */
export function poseDoAvatar(chave: string | null | undefined): PoseBroxis {
  return POSE_POR_AVATAR[(chave ?? '') as AvatarSocial] ?? POSE_POR_AVATAR[AVATAR_SOCIAL_PADRAO];
}