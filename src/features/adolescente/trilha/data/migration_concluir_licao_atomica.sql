-- Conclusão de lição ATÔMICA: grava o progresso e concede XP (lição + bônus de módulo/trilha)
-- na MESMA transação. Antes o app fazia 2+ chamadas (insert em progresso_licao, depois
-- conceder_xp); se a rede caísse no meio, a lição ficava concluída sem XP e o reenvio não
-- corrigia (risco apontado na AUDITORIA_MVP).
--
-- Idempotente (rodar de novo é seguro). Rodar no SQL Editor do Supabase.
-- Requer: conceder_xp() (migration_xp_servidor.sql) e xp_lancamentos.
--
-- ORDEM DE DEPLOY:
--   1. Rodar ESTE arquivo (app antigo continua funcionando).
--   2. Publicar o app novo (chama rpc('concluir_licao'); se a função não existir, cai no fluxo antigo).
--   3. Quando o app antigo sair de uso: rodar a seção "FECHAR" no fim (tira do app o INSERT direto
--      em progresso_licao). Só aí quem "completa lição sem fazer" deixa de conseguir.

-- 0. Unicidade (usuário + lição): JÁ EXISTE no banco (conferido em 06/11/2026 com pg_indexes:
--    progresso_licao_usuario_id_licao_id_key e progresso_licao_usuario_licao_unique).
--    Nada a criar aqui. Os dois são redundantes entre si; se quiser limpar, remova só UM,
--    conferindo antes se é constraint ou índice avulso:
--      select conname from pg_constraint where conrelid = 'public.progresso_licao'::regclass and contype = 'u';
--      -- constraint: alter table public.progresso_licao drop constraint progresso_licao_usuario_licao_unique;
--      -- índice avulso: drop index public.progresso_licao_usuario_licao_unique;

create or replace function public.concluir_licao(p_licao_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid       uuid := auth.uid();
  v_modulo    uuid;
  v_trilha    uuid;
  v_status    text;
  v_xp        integer;
  v_ja        boolean := false;
  v_nivel     text := 'licao';
  v_xp_licao  integer := 0;
  v_xp_mod    integer := 0;
  v_xp_tri    integer := 0;
begin
  if v_uid is null then
    raise exception 'nao_autenticado' using errcode = '28000';
  end if;

  select l.modulo_id, coalesce(l.xp_recompensa, 0), m.trilha_id, t.status::text
    into v_modulo, v_xp, v_trilha, v_status
    from licoes l
    join modulos_trilha m on m.id = l.modulo_id
    join trilhas t on t.id = m.trilha_id
   where l.id = p_licao_id;
  if not found then
    raise exception 'licao_inexistente' using errcode = 'P0001';
  end if;
  -- adolescente só conclui lição de trilha aprovada (publicada)
  if v_status <> 'aprovada' then
    raise exception 'licao_indisponivel' using errcode = 'P0001';
  end if;

  -- duas chamadas simultâneas da mesma lição (duplo toque, fila offline) esperam uma à outra
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text || ':' || p_licao_id::text, 0));

  select exists (select 1 from progresso_licao where usuario_id = v_uid and licao_id = p_licao_id)
    into v_ja;

  if not v_ja then
    insert into progresso_licao (usuario_id, licao_id, xp_ganho)
    values (v_uid, p_licao_id, v_xp);

    v_xp_licao := conceder_xp('licao', p_licao_id::text);
  end if;

  -- o módulo está todo concluído?
  if not exists (
    select 1 from licoes l
     where l.modulo_id = v_modulo
       and not exists (select 1 from progresso_licao p where p.licao_id = l.id and p.usuario_id = v_uid)
  ) then
    v_nivel := 'modulo';
    if not v_ja then v_xp_mod := conceder_xp('bonus_modulo', v_modulo::text); end if;

    -- a trilha toda?
    if not exists (
      select 1 from licoes l join modulos_trilha m on m.id = l.modulo_id
       where m.trilha_id = v_trilha
         and not exists (select 1 from progresso_licao p where p.licao_id = l.id and p.usuario_id = v_uid)
    ) then
      v_nivel := 'trilha';
      if not v_ja then v_xp_tri := conceder_xp('bonus_trilha', v_trilha::text); end if;
    end if;
  end if;

  return jsonb_build_object(
    'ja_concluida', v_ja,
    'nivel', v_nivel,
    'trilha_id', v_trilha,
    'xp_licao', v_xp_licao,
    'xp_bonus', v_xp_mod + v_xp_tri
  );
end $$;

revoke all on function public.concluir_licao(uuid) from public, anon;
grant execute on function public.concluir_licao(uuid) to authenticated;

-- ============================================================
-- FECHAR (rodar só depois que o app antigo sair de uso)
-- ============================================================
-- Hoje a policy progresso_licao_own é FOR ALL: o adolescente consegue inserir progresso de
-- qualquer lição direto pela API (e então pedir o XP dela). Depois de publicar o app novo:
--   revoke insert, update, delete on public.progresso_licao from anon, authenticated;
-- (a leitura continua pela policy; a escrita passa a ser só por concluir_licao()).
-- ATENÇÃO: o fluxo de "prática real" (atividade_rastreavel) e qualquer outro ponto do app que
-- insira em progresso_licao precisa antes ir para a função. Confira com:
--   grep -rn "from('progresso_licao')" src | grep insert
