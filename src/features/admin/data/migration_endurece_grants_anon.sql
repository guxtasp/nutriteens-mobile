-- Higiene de permissões do papel `anon` (revisão de 06/11/2026). Idempotente.
-- Achados do verificar_rls_mvp.sql: (a) `anon` tem INSERT/UPDATE/DELETE em profiles e progresso_licao
-- (as policies hoje barram, mas é uma camada a menos); (b) `anon` executa funções SECURITY DEFINER
-- que só fazem sentido para usuário logado.
-- Seguro para triggers: o EXECUTE de função de trigger só é conferido na criação do trigger.

-- 1. anon nunca escreve nestas tabelas
revoke insert, update, delete on public.profiles from anon;
revoke insert, update, delete on public.progresso_licao from anon;

-- 2. Funções: tira de PUBLIC e de anon; mantém para quem está logado
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig, p.proname
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'avaliar_minhas_insignias', 'desafio_trofeus_listar', 'fluxo_alteracao_relevante', 'fluxo_criar',
        'fluxo_remover', 'fluxo_titulo', 'fn_avaliar_apos_xp', 'fn_avaliar_cartas_apos_xp',
        'profiles_protege_campos', 'receita_publicada', 'trilhas_guarda_aprovacao')
  loop
    execute format('revoke all on function %s from public, anon', r.sig);
    -- as que o app/policies chamam como usuário logado continuam liberadas para ele
    if r.proname in ('avaliar_minhas_insignias', 'desafio_trofeus_listar', 'receita_publicada', 'fluxo_titulo') then
      execute format('grant execute on function %s to authenticated', r.sig);
    end if;
  end loop;
end $$;

-- Conferir (deve vir vazio): consulta 4 do verificar_rls_mvp.sql
