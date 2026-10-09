// src/features/adolescente/cartas/services/cartasService.ts
//
// Camada fina sobre cartas_guia / cartas_usuario e as funções do banco
// (ver data/migration_cartas_guia.sql). O app nunca concede carta: quem concede
// é avaliar_minhas_cartas().
import { supabase } from '../../../../lib/supabase';
import { montarCartas, type CartaGuia, type LinhaCartaGuia, type LinhaCartaUsuario } from '../utils/cartas';

/** Reavalia no servidor (concede o que faltava) e devolve o álbum completo, na ordem dos passos. */
export async function buscarCartas(userId: string): Promise<CartaGuia[]> {
  // falha na avaliação não deve esconder as cartas já ganhas
  const { error: erroAvaliar } = await supabase.rpc('avaliar_minhas_cartas');
  if (erroAvaliar) console.warn('Erro ao avaliar cartas:', erroAvaliar.message);

  const [{ data: catalogo, error: e1 }, { data: ganhas, error: e2 }] = await Promise.all([
    supabase.from('cartas_guia').select('id, passo, codigo, titulo, resumo, dica, como_ganhar').order('passo'),
    supabase.from('cartas_usuario').select('carta_id, vista').eq('usuario_id', userId),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

  return montarCartas((catalogo ?? []) as LinhaCartaGuia[], (ganhas ?? []) as LinhaCartaUsuario[]);
}

/** Marca uma carta como vista (some o pontinho de "nova"). Falha silenciosa: é só enfeite. */
export async function marcarCartaVista(cartaId: string): Promise<void> {
  const { error } = await supabase.rpc('cartas_marcar_vista', { p_carta_id: cartaId });
  if (error) console.warn('Erro ao marcar carta como vista:', error.message);
}
