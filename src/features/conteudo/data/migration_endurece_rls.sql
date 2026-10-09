-- Etapa 4: endurecimento de RLS. Idempotente.
-- Rodar DEPOIS de migration_fluxo_conteudo.sql.
--
-- 1. receita_ingredientes / receita_passos: o adolescente só lê itens de receita PUBLICADA
--    (antes, uma receita em rascunho/rejeitada ainda vazava por estas tabelas).
-- 2. Escrita nessas tabelas só para Admin/Nutricionista.
-- 3. eventos_app: garante que o papel anon não tem acesso nenhum.
-- Cada bloco só age se a tabela existir.

do $$
declare
  t text;
begin
  foreach t in array array['receita_ingredientes', 'receita_passos'] loop
    if to_regclass('public.' || t) is null then
      raise notice 'tabela % não existe, ignorada', t;
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);

    -- leitura geral para autenticados (se ainda não houver política de leitura) ...
    execute format('drop policy if exists %I on public.%I', t || '_leitura_autenticados', t);
    execute format('create policy %I on public.%I for select to authenticated using (true)',
                   t || '_leitura_autenticados', t);

    -- ... restringida por política RESTRICTIVE: só publicadas (ou equipe)
    execute format('drop policy if exists %I on public.%I', t || '_so_publicadas', t);
    execute format($p$create policy %I on public.%I as restrictive for select to authenticated
                      using (public.papel_atual() in ('NUTRICIONISTA', 'ADMINISTRADOR')
                             or public.receita_publicada(receita_id))$p$,
                   t || '_so_publicadas', t);

    -- escrita só da equipe
    execute format('drop policy if exists %I on public.%I', t || '_escrita_staff', t);
    execute format($p$create policy %I on public.%I for all to authenticated
                      using (public.papel_atual() in ('NUTRICIONISTA', 'ADMINISTRADOR'))
                      with check (public.papel_atual() in ('NUTRICIONISTA', 'ADMINISTRADOR'))$p$,
                   t || '_escrita_staff', t);
  end loop;
end $$;

-- só age se a tabela existir (ela vem de migration_analytics_eventos.sql)
do $$
begin
  if to_regclass('public.eventos_app') is not null then
    execute 'revoke all on public.eventos_app from anon';
  else
    raise notice 'eventos_app não existe ainda; rode migration_analytics_eventos.sql e depois esta migration de novo';
  end if;
end $$;
