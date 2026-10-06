-- Etapa 3: eventos de utilização + analytics agregado.
-- Idempotente. Rodar no SQL Editor DEPOIS de migration_revisao_trilhas.sql
-- (usa papel_atual()).
--
-- Privacidade:
--  * o adolescente só INSERE eventos dele mesmo (não lê, não altera, não apaga);
--  * Admin/Nutricionista NÃO leem a tabela: só a RPC analytics_painel, que devolve
--    agregados (nenhum user_id sai do banco);
--  * props guarda só ids de conteúdo (trilha_id, licao_id, receita_id, tipo) — nada de
--    texto livre, nome, peso, resposta de triagem etc.

-- 1. Tabela ------------------------------------------------------------------
create table if not exists public.eventos_app (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  nome       text not null check (nome in (
               'login', 'cadastro_concluido', 'onboarding_concluido', 'triagem_concluida',
               'alimentacao_registrada', 'agua_registrada', 'atividade_registrada',
               'desafio_visualizado', 'desafio_iniciado', 'desafio_concluido',
               'trilha_visualizada', 'trilha_iniciada', 'trilha_concluida', 'licao_concluida',
               'receita_visualizada', 'receita_concluida',
               'amizade_solicitada', 'amizade_aceita', 'conteudo_abandonado')),
  sessao_id  text check (sessao_id is null or char_length(sessao_id) <= 64),
  props      jsonb not null default '{}'::jsonb
             check (jsonb_typeof(props) = 'object' and octet_length(props::text) <= 600),
  criado_em  timestamptz not null default now()
);
create index if not exists eventos_app_criado_idx on public.eventos_app (criado_em desc);
create index if not exists eventos_app_nome_idx   on public.eventos_app (nome, criado_em desc);
create index if not exists eventos_app_user_idx   on public.eventos_app (user_id, criado_em desc);

-- o cliente não escolhe a data nem o dono: o banco carimba
create or replace function public.eventos_app_carimbar()
returns trigger language plpgsql as $$
begin
  new.criado_em := now();
  new.user_id   := coalesce(auth.uid(), new.user_id);
  return new;
end;
$$;
drop trigger if exists eventos_app_carimbar on public.eventos_app;
create trigger eventos_app_carimbar before insert on public.eventos_app
  for each row execute function public.eventos_app_carimbar();

-- 2. RLS: inserir só como si mesmo; ninguém lê/edita/apaga pelo app ------------
alter table public.eventos_app enable row level security;

drop policy if exists "eventos_insere_proprio" on public.eventos_app;
create policy "eventos_insere_proprio" on public.eventos_app
  for insert to authenticated
  with check (user_id = auth.uid());

revoke all on public.eventos_app from anon, authenticated;
grant insert on public.eventos_app to authenticated;

-- 3. Analytics agregado (período em dias de São Paulo) --------------------------
create or replace function public.analytics_painel(p_inicio date, p_fim date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_papel text := public.papel_atual();
  v_tz    text := 'America/Sao_Paulo';
  v_res   jsonb;
begin
  if v_papel is null or v_papel not in ('ADMINISTRADOR', 'NUTRICIONISTA') then
    raise exception 'acesso negado' using errcode = '42501';
  end if;
  if p_inicio is null or p_fim is null or p_fim < p_inicio or (p_fim - p_inicio) > 365 then
    raise exception 'período inválido' using errcode = '22023';
  end if;

  with ev as materialized (
    select e.user_id, e.nome, e.sessao_id, e.props,
           (e.criado_em at time zone v_tz)::date as dia
      from public.eventos_app e
      join public.profiles p on p.id = e.user_id and p.papel::text = 'ADOLESCENTE'
     where (e.criado_em at time zone v_tz)::date between p_inicio and p_fim
  ), dias as (
    select generate_series(p_inicio::timestamp, p_fim::timestamp, interval '1 day')::date as dia
  ), diario as (
    select dia,
           count(distinct user_id)   as usuarios,
           count(distinct sessao_id) as sessoes,
           count(*)                  as eventos,
           count(*) filter (where nome = 'desafio_iniciado')  as desafios_iniciados,
           count(*) filter (where nome = 'desafio_concluido') as desafios_concluidos,
           count(*) filter (where nome = 'trilha_iniciada')   as trilhas_iniciadas,
           count(*) filter (where nome = 'trilha_concluida')  as trilhas_concluidas,
           count(*) filter (where nome = 'licao_concluida')   as licoes,
           count(*) filter (where nome in ('receita_visualizada', 'receita_concluida')) as receitas
      from ev group by dia
  )
  select jsonb_build_object(
    'periodo', jsonb_build_object('inicio', p_inicio, 'fim', p_fim, 'dias', (p_fim - p_inicio) + 1),

    'kpis', jsonb_build_object(
      'usuarios_ativos', (select count(distinct user_id) from ev),
      'sessoes',         (select count(distinct sessao_id) from ev),
      'eventos',         (select count(*) from ev),
      'cadastros',       (select count(*) from ev where nome = 'cadastro_concluido')
    ),

    'serie', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'dia', d.dia,
               'usuarios',            coalesce(a.usuarios, 0),
               'sessoes',             coalesce(a.sessoes, 0),
               'eventos',             coalesce(a.eventos, 0),
               'desafios_iniciados',  coalesce(a.desafios_iniciados, 0),
               'desafios_concluidos', coalesce(a.desafios_concluidos, 0),
               'trilhas_iniciadas',   coalesce(a.trilhas_iniciadas, 0),
               'trilhas_concluidas',  coalesce(a.trilhas_concluidas, 0),
               'licoes',              coalesce(a.licoes, 0),
               'receitas',            coalesce(a.receitas, 0)
             ) order by d.dia), '[]'::jsonb)
        from dias d left join diario a on a.dia = d.dia
    ),

    'uso', (
      select coalesce(jsonb_agg(jsonb_build_object('recurso', r, 'eventos', n, 'usuarios', u) order by n desc), '[]'::jsonb)
        from (
          select case
                   when nome = 'alimentacao_registrada' then 'Alimentação'
                   when nome = 'agua_registrada'        then 'Água'
                   when nome = 'atividade_registrada'   then 'Atividade física'
                   when nome like 'trilha\_%' or nome = 'licao_concluida' then 'Trilhas'
                   when nome like 'desafio\_%'  then 'Desafios'
                   when nome like 'receita\_%'  then 'Receitas'
                   when nome like 'amizade\_%'  then 'Amigos'
                 end as r,
                 count(*) as n, count(distinct user_id) as u
            from ev group by 1
        ) x where r is not null
    ),

    'por_evento', (
      select coalesce(jsonb_object_agg(nome, n), '{}'::jsonb)
        from (select nome, count(*) as n from ev group by nome) x
    ),

    'top_trilhas', (
      select coalesce(jsonb_agg(jsonb_build_object('titulo', titulo, 'iniciadas', ini, 'concluidas', con) order by ini desc, con desc), '[]'::jsonb)
        from (
          select t.titulo,
                 count(*) filter (where ev.nome = 'trilha_iniciada')  as ini,
                 count(*) filter (where ev.nome = 'trilha_concluida') as con
            from ev join public.trilhas t on t.id::text = ev.props->>'trilha_id'
           where ev.nome in ('trilha_iniciada', 'trilha_concluida')
           group by t.id, t.titulo order by 2 desc, 3 desc limit 8
        ) x
    ),

    'top_receitas', (
      select coalesce(jsonb_agg(jsonb_build_object('titulo', titulo, 'visualizadas', vis, 'concluidas', con) order by vis desc, con desc), '[]'::jsonb)
        from (
          select r.titulo,
                 count(*) filter (where ev.nome = 'receita_visualizada') as vis,
                 count(*) filter (where ev.nome = 'receita_concluida')   as con
            from ev join public.receitas r on r.id::text = ev.props->>'receita_id'
           where ev.nome in ('receita_visualizada', 'receita_concluida')
           group by r.id, r.titulo order by 2 desc, 3 desc limit 8
        ) x
    ),

    -- abandono = abandonos / (abandonos + concluídos) do mesmo tipo de conteúdo
    'abandono', (
      select coalesce(jsonb_agg(jsonb_build_object('tipo', v.tipo, 'abandonos', s.a, 'concluidos', s.c)), '[]'::jsonb)
        from (values ('licao', 'licao_concluida'), ('receita', 'receita_concluida')) as v(tipo, concluido)
        cross join lateral (
          select count(*) filter (where ev.nome = 'conteudo_abandonado' and ev.props->>'tipo' = v.tipo) as a,
                 count(*) filter (where ev.nome = v.concluido) as c
            from ev
        ) s
    ),

    -- funis: cada etapa é subconjunto da anterior (mesmas pessoas, em ordem)
    'funil_onboarding', (
      with s1 as (select distinct user_id from ev where nome = 'cadastro_concluido'),
           s2 as (select distinct user_id from ev where nome = 'onboarding_concluido' and user_id in (select user_id from s1)),
           s3 as (select distinct user_id from ev where nome = 'triagem_concluida'    and user_id in (select user_id from s2))
      select jsonb_build_array(
        jsonb_build_object('etapa', 'Cadastro',    'usuarios', (select count(*) from s1)),
        jsonb_build_object('etapa', 'Onboarding',  'usuarios', (select count(*) from s2)),
        jsonb_build_object('etapa', 'Triagem',     'usuarios', (select count(*) from s3)))
    ),
    'funil_uso', (
      with s0 as (select distinct user_id from ev),
           s1 as (select distinct user_id from ev
                   where nome in ('alimentacao_registrada', 'agua_registrada', 'atividade_registrada')
                     and user_id in (select user_id from s0)),
           s2 as (select distinct user_id from ev where nome = 'licao_concluida'   and user_id in (select user_id from s1)),
           s3 as (select distinct user_id from ev where nome = 'desafio_concluido' and user_id in (select user_id from s2)),
           s4 as (select distinct user_id from ev where nome = 'trilha_concluida'  and user_id in (select user_id from s3))
      select jsonb_build_array(
        jsonb_build_object('etapa', 'Abriu o app',        'usuarios', (select count(*) from s0)),
        jsonb_build_object('etapa', 'Fez um registro',    'usuarios', (select count(*) from s1)),
        jsonb_build_object('etapa', 'Concluiu lição',     'usuarios', (select count(*) from s2)),
        jsonb_build_object('etapa', 'Concluiu desafio',   'usuarios', (select count(*) from s3)),
        jsonb_build_object('etapa', 'Concluiu trilha',    'usuarios', (select count(*) from s4)))
    )
  ) into v_res;

  return v_res;
end;
$$;
revoke all on function public.analytics_painel(date, date) from public;
grant execute on function public.analytics_painel(date, date) to authenticated;
