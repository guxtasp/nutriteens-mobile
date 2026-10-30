// src/features/adolescente/home/services/retrospectivaAnoService.ts
//
// Dados do "Seu ano com o Bróxis". Quase tudo é CONTAGEM no servidor (head + count exato);
// a única consulta que traz linhas é a dos dias com refeição (no máximo uma linha por dia,
// só a data), usada para o "mês mais ativo". Todas filtram pelo usuário logado, além da RLS.
// Qualquer falha vira null: sem dado confiável, a retrospectiva simplesmente não aparece.
import { supabase } from '../../../../lib/supabase';
import { formatarDataISO } from '../../../../shared/utils/data';
import { janelaDoAno } from '../../metricas/utils/retrospectivaAno';
import { montarSlidesAno, type RetrospectivaAno } from '../../metricas/utils/retrospectivaSlides';
import { LINK_DIVULGACAO } from '../utils/divulgacao';

async function contar(consulta: PromiseLike<{ count: number | null; error: { message: string } | null }>): Promise<number> {
  const { count, error } = await consulta;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function buscarRetrospectivaAno(userId: string, hojeISO: string): Promise<RetrospectivaAno | null> {
  try {
    const { data: perfil, error: erroPerfil } = await supabase
      .from('profiles')
      .select('created_at, maior_sequencia, avatar_social')
      .eq('id', userId)
      .maybeSingle();
    if (erroPerfil) throw new Error(erroPerfil.message);

    // created_at é timestamp com fuso: converte para o dia LOCAL antes de comparar datas
    const criadaEm = perfil?.created_at ? formatarDataISO(new Date(perfil.created_at)) : null;
    const janela = janelaDoAno(hojeISO, criadaEm);
    if (!janela) return null;
    const inicioTs = new Date(`${janela.inicio}T00:00:00`).toISOString(); // meia-noite local do 1º dia

    const [refeicoes, licoes, atividades, insignias, dias] = await Promise.all([
      contar(
        supabase
          .from('refeicoes')
          .select('id, registros_diarios!inner(user_id, data)', { count: 'exact', head: true })
          .eq('realizada', true) // exclui refeição "pulada"; o inner join exclui o recordatório da triagem
          .eq('registros_diarios.user_id', userId)
          .gte('registros_diarios.data', janela.inicio),
      ),
      contar(
        supabase
          .from('progresso_licao')
          .select('id', { count: 'exact', head: true })
          .eq('usuario_id', userId)
          .gte('concluida_em', inicioTs),
      ),
      contar(
        supabase
          .from('registros_atividade_fisica')
          .select('id, registros_diarios!inner(user_id, data)', { count: 'exact', head: true })
          .eq('registros_diarios.user_id', userId)
          .gte('registros_diarios.data', janela.inicio),
      ),
      contar(
        supabase
          .from('insignias_usuario')
          .select('id', { count: 'exact', head: true })
          .eq('usuario_id', userId)
          .gte('obtida_em', inicioTs),
      ),
      // um registro por dia que tenha refeição realizada (inner join no filho)
      supabase
        .from('registros_diarios')
        .select('data, refeicoes!inner(id)')
        .eq('user_id', userId)
        .eq('refeicoes.realizada', true)
        .gte('data', janela.inicio)
        .lte('data', janela.fim)
        .order('data')
        .limit(400),
    ]);
    if (dias.error) throw new Error(dias.error.message);

    const retrospectiva = montarSlidesAno(
      {
        janela,
        totais: { refeicoes, licoes, atividades, insignias },
        diasComRefeicao: (dias.data ?? []).map((r: { data: string }) => r.data),
        maiorSequencia: perfil?.maior_sequencia ?? 0,
        criadaEm,
      },
      LINK_DIVULGACAO,
    );
    return retrospectiva ? { ...retrospectiva, avatar: perfil?.avatar_social ?? null } : null;
  } catch (erro) {
    console.warn('Erro ao montar retrospectiva do ano:', erro);
    return null;
  }
}
