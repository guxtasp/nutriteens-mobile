// RF016 — busca no catálogo os alimentos que são fonte de um nutriente.
// A EBIA só ordena (acessíveis primeiro) e nunca aparece; sem triagem, tudo conta como acessível.
import { supabase } from '../../../../lib/supabase';
import { valoresEbiaAceitaveis } from '../../triagem/ebia/utils/ordemEbia';
import type { NutrienteChave } from '../../alimentacao/utils/nutrientesPorGrupo';
import { selecionarFontes, AlimentoCatalogo } from '../utils/fontesNutriente';

export async function buscarFontes(userId: string, coluna: NutrienteChave): Promise<AlimentoCatalogo[]> {
  const { data: perfil } = await supabase.from('profiles').select('classificacao_ebia_atual').eq('id', userId).single();
  const classificacao = perfil?.classificacao_ebia_atual ?? null;

  const [todos, acessiveis] = await Promise.all([
    supabase
      .from('alimentos')
      .select(`id, nome, classificacao_nova, grupos_alimentares, alimento_nutrientes ( ${coluna} )`)
      .neq('classificacao_nova', 'ULTRAPROCESSADO'),
    classificacao
      ? supabase.from('alimentos').select('id').in('nivel_maximo_ebia', valoresEbiaAceitaveis(classificacao))
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (todos.error) throw todos.error;

  // se a consulta de acessibilidade falhar, só perdemos a ordem (nada some)
  const ids = !acessiveis.error && acessiveis.data ? new Set(acessiveis.data.map((r: any) => r.id as string)) : null;
  return selecionarFontes((todos.data ?? []) as AlimentoCatalogo[], coluna, ids);
}
