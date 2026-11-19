// src/shared/ui/iconesMissao.ts
//
// Ícones de missões e desafios. Antes cada missão guardava um emoji no campo `icone`; agora o
// painel oferece esta lista para ESCOLHER (ninguém precisa saber o nome de um ícone) e o app
// desenha o ícone com Ionicons. Todos os nomes foram conferidos no mapa de glifos do Ionicons
// (há teste para isso).
//
// Missões antigas continuam com emoji gravado no banco e nas variantes embutidas: o app converte
// esses emojis para um ícone equivalente (ICONE_DO_EMOJI), então nenhum emoji aparece na tela.

export type IconeMissao = { nome: string; rotulo: string };

export const GRUPOS_ICONES_MISSAO: { titulo: string; icones: IconeMissao[] }[] = [
  {
    titulo: 'Alimentação',
    icones: [
      { nome: 'nutrition', rotulo: 'Fruta' },
      { nome: 'leaf', rotulo: 'Folha' },
      { nome: 'restaurant', rotulo: 'Refeição' },
      { nome: 'fish', rotulo: 'Peixe' },
      { nome: 'egg', rotulo: 'Ovo' },
      { nome: 'cafe', rotulo: 'Café da manhã' },
      { nome: 'basket', rotulo: 'Cesta' },
      { nome: 'cart', rotulo: 'Compras' },
    ],
  },
  {
    titulo: 'Água e corpo',
    icones: [
      { nome: 'water', rotulo: 'Água' },
      { nome: 'walk', rotulo: 'Caminhada' },
      { nome: 'footsteps', rotulo: 'Passos' },
      { nome: 'bicycle', rotulo: 'Bicicleta' },
      { nome: 'fitness', rotulo: 'Exercício' },
      { nome: 'basketball', rotulo: 'Basquete' },
      { nome: 'football', rotulo: 'Futebol' },
      { nome: 'body', rotulo: 'Corpo' },
      { nome: 'pulse', rotulo: 'Batimento' },
      { nome: 'bed', rotulo: 'Descanso' },
    ],
  },
  {
    titulo: 'Rotina',
    icones: [
      { nome: 'sunny', rotulo: 'Manhã' },
      { nome: 'partly-sunny', rotulo: 'Tarde' },
      { nome: 'moon', rotulo: 'Noite' },
      { nome: 'calendar', rotulo: 'Calendário' },
      { nome: 'time', rotulo: 'Relógio' },
      { nome: 'alarm', rotulo: 'Alarme' },
      { nome: 'timer', rotulo: 'Cronômetro' },
      { nome: 'create', rotulo: 'Registrar' },
      { nome: 'clipboard', rotulo: 'Prancheta' },
      { nome: 'checkmark-circle', rotulo: 'Concluído' },
    ],
  },
  {
    titulo: 'Conquista e diversão',
    icones: [
      { nome: 'flag', rotulo: 'Bandeira' },
      { nome: 'star', rotulo: 'Estrela' },
      { nome: 'trophy', rotulo: 'Troféu' },
      { nome: 'medal', rotulo: 'Medalha' },
      { nome: 'ribbon', rotulo: 'Fita' },
      { nome: 'flame', rotulo: 'Sequência' },
      { nome: 'rocket', rotulo: 'Foguete' },
      { nome: 'sparkles', rotulo: 'Brilho' },
      { nome: 'color-palette', rotulo: 'Variedade' },
      { nome: 'heart', rotulo: 'Coração' },
      { nome: 'happy', rotulo: 'Feliz' },
      { nome: 'people', rotulo: 'Turma' },
      { nome: 'book', rotulo: 'Leitura' },
      { nome: 'school', rotulo: 'Aprender' },
      { nome: 'bulb', rotulo: 'Ideia' },
      { nome: 'gift', rotulo: 'Presente' },
    ],
  },
];

export const ICONES_MISSAO: IconeMissao[] = GRUPOS_ICONES_MISSAO.flatMap((g) => g.icones);
const NOMES = new Set(ICONES_MISSAO.map((i) => i.nome));

/** Ícone usado quando a missão não tem ícone (ou tem um valor desconhecido). */
export const ICONE_MISSAO_PADRAO = 'flag';

/** Emojis já gravados (banco e variantes embutidas) → ícone equivalente. */
export const ICONE_DO_EMOJI: Record<string, string> = {
  '🎯': 'flag', '💧': 'water', '🏃': 'walk', '👟': 'footsteps', '🥗': 'leaf', '🍽️': 'restaurant', '🍽': 'restaurant',
  '📝': 'create', '🌅': 'sunny', '🍎': 'nutrition', '🍛': 'restaurant', '🥪': 'restaurant', '🌙': 'moon', '🥛': 'cafe',
  '🌈': 'color-palette', '🍌': 'nutrition', '🥕': 'leaf', '🫘': 'leaf', '🥚': 'egg', '🍚': 'restaurant', '🥜': 'leaf',
  '🍊': 'nutrition', '🐟': 'fish', '🥩': 'restaurant', '🌰': 'leaf', '🍗': 'restaurant', '🥦': 'leaf', '🔥': 'flame',
  '⭐': 'star', '🏆': 'trophy', '🥇': 'medal', '💪': 'fitness', '🚴': 'bicycle', '⚽': 'football', '🏀': 'basketball',
  '📚': 'book', '😴': 'bed', '🗓️': 'calendar', '📅': 'calendar', '✅': 'checkmark-circle', '❤️': 'heart', '🚀': 'rocket',
};

/** Nome do ícone (Ionicons) para o valor guardado no campo `icone` de uma missão. */
export function resolverIconeMissao(valor: string | null | undefined): string {
  const v = (valor ?? '').trim();
  if (!v) return ICONE_MISSAO_PADRAO;
  if (NOMES.has(v)) return v;
  // emoji antigo: tenta com e sem o seletor de variação (U+FE0F)
  return ICONE_DO_EMOJI[v] ?? ICONE_DO_EMOJI[v.replace(/️/g, '')] ?? ICONE_MISSAO_PADRAO;
}

/** Rótulo em português do ícone (para leitores de tela e para o seletor). */
export function rotuloIconeMissao(nome: string): string {
  return ICONES_MISSAO.find((i) => i.nome === nome)?.rotulo ?? 'Ícone';
}
