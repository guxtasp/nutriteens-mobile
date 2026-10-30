// src/features/conteudo/services/receitasListaService.ts
// Dados extras das receitas para a lista do painel (foto, tempo, porções, prato, contagens).
// A lista em si vem do fluxo (listarFluxo); se esta consulta falhar, a lista continua
// funcionando, só sem foto e detalhes.
import { supabase } from '../../../lib/supabase';
import { listarFluxo } from './fluxoService';
import type { DadosReceita, ReceitaDaLista } from '../utils/receitasLista';

export async function listarReceitasDoPainel(): Promise<ReceitaDaLista[]> {
  const itens = await listarFluxo('RECEITA');
  if (itens.length === 0) return [];

  const mapa = new Map<string, DadosReceita>();
  try {
    const { data } = await supabase
      .from('receitas')
      .select('id, foto_url, tempo_preparo_min, porcoes, dificuldade, prato:alimentos!receitas_alimento_resultante_id_fkey(nome), receita_ingredientes(count), receita_passos(count)')
      .in('id', itens.map((i) => i.conteudoId));
    for (const r of (data ?? []) as any[]) {
      mapa.set(r.id, {
        fotoUrl: r.foto_url ?? null,
        tempoMin: r.tempo_preparo_min ?? null,
        porcoes: r.porcoes ?? null,
        dificuldade: r.dificuldade ? String(r.dificuldade) : null,
        pratoNome: r.prato?.nome ?? null,
        ingredientes: r.receita_ingredientes?.[0]?.count ?? 0,
        passos: r.receita_passos?.[0]?.count ?? 0,
      });
    }
  } catch {
    /* sem detalhes: a lista mostra só o que o fluxo informa */
  }
  return itens.map((i) => ({ ...i, dados: mapa.get(i.conteudoId) ?? null }));
}
