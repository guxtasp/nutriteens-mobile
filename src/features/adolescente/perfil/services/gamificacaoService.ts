import { supabase } from '../../../../lib/supabase';
import { FASES_PADRAO, FaseMascote, FaseId } from '../utils/fasesMascote';

export type CategoriaReconhecimento = 'conquista' | 'marco' | 'insignia';

export type Insignia = {
  id: string;
  codigo: string | null;
  categoria: CategoriaReconhecimento;
  /** número exibido no Marco (criterio.min) */
  valor: number | null;
  nome: string;
  descricao: string | null;
  icone: string | null;
  obtida: boolean;
  nova: boolean; // ganhou e ainda não viu
};

export async function buscarFases(): Promise<FaseMascote[]> {
  const { data, error } = await supabase
    .from('fases_mascote')
    .select('fase, titulo, xp_minimo')
    .order('xp_minimo');
  if (error || !data?.length) return FASES_PADRAO;
  return data.map((f) => ({ fase: f.fase as FaseId, titulo: f.titulo, xpMinimo: f.xp_minimo }));
}

export async function buscarXpTotal(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('xp_usuario')
    .select('xp_total')
    .eq('usuario_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.xp_total ?? 0;
}

/** Reavalia no servidor (concede o que faltava) e devolve catálogo + status do usuário. */
export async function buscarInsignias(userId: string): Promise<Insignia[]> {
  // falha na avaliação não deve esconder as insígnias já ganhas
  await supabase.rpc('avaliar_minhas_insignias');

  const [{ data: catalogo, error: e1 }, { data: ganhas, error: e2 }] = await Promise.all([
    supabase.from('insignias').select('id, codigo, categoria, criterio, nome, descricao, icone').order('ordem'),
    supabase.from('insignias_usuario').select('insignia_id, vista').eq('usuario_id', userId),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

  const mapa = new Map((ganhas ?? []).map((g) => [g.insignia_id, g.vista as boolean]));
  const lista = (catalogo ?? []).map((i) => ({
    id: i.id,
    codigo: i.codigo,
    categoria: (i.categoria ?? 'conquista') as CategoriaReconhecimento,
    valor: typeof i.criterio?.min === 'number' ? (i.criterio.min as number) : null,
    nome: i.nome,
    descricao: i.descricao,
    icone: i.icone,
    obtida: mapa.has(i.id),
    nova: mapa.has(i.id) && mapa.get(i.id) === false,
  }));
  // conquistadas primeiro, mantendo a ordem do catálogo
  return [...lista.filter((i) => i.obtida), ...lista.filter((i) => !i.obtida)];
}

export async function marcarInsigniasVistas(userId: string): Promise<void> {
  await supabase
    .from('insignias_usuario')
    .update({ vista: true })
    .eq('usuario_id', userId)
    .eq('vista', false);
}

/** Marca só as insígnias indicadas como vistas (a celebração marca apenas o que mostrou). */
export async function marcarInsigniasVistasPorId(userId: string, insigniaIds: string[]): Promise<void> {
  if (insigniaIds.length === 0) return;
  const { error } = await supabase
    .from('insignias_usuario')
    .update({ vista: true })
    .eq('usuario_id', userId)
    .in('insignia_id', insigniaIds);
  if (error) console.warn('Erro ao marcar insígnias como vistas:', error.message);
}
