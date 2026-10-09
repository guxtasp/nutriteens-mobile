// src/features/adolescente/social/utils/perfilAmigo.ts
//
// Regras puras do perfil do amigo (sem React/Supabase, pra testar). O que o
// amigo pode ver é decidido no BANCO (social_perfil_amigo); aqui só convertemos
// a linha que volta em tipos do app.
import type { CategoriaReconhecimento, Insignia } from '../../perfil/services/gamificacaoService';

export type PerfilAmigo = {
  apelido: string;
  avatar: string | null;
  desde: Date | null;
  xpTotal: number;
  sequenciaAtual: number;
  maiorSequencia: number;
  licoesConcluidas: number;
  /** Só as já ganhas: o que está bloqueado nunca chega no app do amigo. */
  insignias: Insignia[];
};

/** Formato cru devolvido por `social_perfil_amigo`. */
export type LinhaPerfilAmigo = {
  apelido: string | null;
  avatar: string | null;
  desde: string | null;
  xp_total: number | null;
  sequencia_atual: number | null;
  maior_sequencia: number | null;
  licoes_concluidas: number | null;
  insignias: unknown;
};

const CATEGORIAS: readonly CategoriaReconhecimento[] = ['conquista', 'marco', 'insignia'];

function mapearInsignias(bruto: unknown): Insignia[] {
  if (!Array.isArray(bruto)) return [];
  return bruto.flatMap((i): Insignia[] => {
    if (!i || typeof i !== 'object' || typeof i.id !== 'string' || typeof i.nome !== 'string') return [];
    return [
      {
        id: i.id,
        codigo: typeof i.codigo === 'string' ? i.codigo : null,
        categoria: CATEGORIAS.includes(i.categoria) ? i.categoria : 'conquista',
        valor: typeof i.valor === 'number' ? i.valor : null,
        nome: i.nome,
        descricao: typeof i.descricao === 'string' ? i.descricao : null,
        icone: typeof i.icone === 'string' ? i.icone : null,
        obtida: true,
        nova: false, // "nova" é do dono da insígnia, não de quem visita
      },
    ];
  });
}

export function mapearPerfilAmigo(l: LinhaPerfilAmigo): PerfilAmigo {
  return {
    apelido: l.apelido ?? 'Amigo',
    avatar: l.avatar,
    desde: l.desde ? new Date(l.desde) : null,
    xpTotal: Math.max(0, l.xp_total ?? 0),
    sequenciaAtual: Math.max(0, l.sequencia_atual ?? 0),
    maiorSequencia: Math.max(0, l.maior_sequencia ?? 0),
    licoesConcluidas: Math.max(0, l.licoes_concluidas ?? 0),
    insignias: mapearInsignias(l.insignias),
  };
}

/** "1 dia" / "5 dias" — usado na sequência. */
export function rotuloDias(n: number): string {
  return n === 1 ? '1 dia' : `${n} dias`;
}

/** "1 lição" / "12 lições". */
export function rotuloLicoes(n: number): string {
  return n === 1 ? '1 lição' : `${n} lições`;
}
