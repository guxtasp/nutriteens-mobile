-- migration_social_desafio_grupo.sql  (idempotente)
-- Desafio em grupo: 2 a 5 amigos, 7 dias, uma métrica de hábito. Rodar DEPOIS de migration_amizades.sql
-- (usa _amizade_eh_adolescente e _social_bloqueado). migration_painel_moderacao_acoes.sql continua opcional.
--
-- Regras (ECA Digital / D2):
--  * só AMIGOS entram: o convite usa o id da amizade e precisa ser aceito; no máximo 5 pessoas por desafio;
--    3 desafios ativos por pessoa;
--  * a métrica é sempre um HÁBITO que qualquer um consegue cumprir (água, atividade, passos, registro),
--    medido contra a META PESSOAL de cada um. Nunca peso, calorias, corpo ou volume;
--  * o app calcula "cumpri o dia" nos dados da própria pessoa e só avisa o banco (desafio_marcar_hoje).
--    O banco guarda apenas "dia cumprido: sim", nunca o que foi comido ou bebido;
--  * COOPERATIVO (padrão): o banco devolve só o total da turma e "fez hoje" de cada um. Sem ranking;
--  * PODIO (opcional, escolhido ao criar e visível no convite): devolve também os dias cumpridos de cada
--    membro. O ranking é por DIAS CUMPRIDOS (máx. 7), então empate é normal;
--  * insígnia de participação para TODOS os membros ativos quando o desafio acaba, e outra se a turma chega ao ouro;
--  * sem texto livre; tabelas sem acesso direto (RLS ligado, sem políticas), tudo via funções desafio_*.
begin;

create table if not exists public.desafios_grupo (
  id          uuid primary key default gen_random_uuid(),
  metrica     text not null check (metrica in ('AGUA', 'ATIVIDADE', 'PASSOS', 'REGISTRO')),
  modo        text not null default 'COOPERATIVO' check (modo in ('COOPERATIVO', 'PODIO')),
  inicio      date not null,
  fim         date not null,
  criado_por  uuid references public.profiles(id) on delete set null,
  criado_em   timestamptz not null default now(),
  encerrado_em timestamptz,
  constraint desafios_grupo_sete_dias check (fim = inicio + 6)
);

create table if not exists public.desafio_grupo_membros (
  desafio_id    uuid not null references public.desafios_grupo(id) on delete cascade,
  usuario_id    uuid not null references public.profiles(id) on delete cascade,
  status        text not null default 'convidado' check (status in ('convidado', 'ativo')),
  convidado_por uuid references public.profiles(id) on delete set null,
  criado_em     timestamptz not null default now(),
  entrou_em     timestamptz,
  primary key (desafio_id, usuario_id)
);
create index if not exists desafio_grupo_membros_usuario_idx on public.desafio_grupo_membros (usuario_id, status);

create table if not exists public.desafio_grupo_dias (
  desafio_id uuid not null references public.desafios_grupo(id) on delete cascade,
  usuario_id uuid not null references public.profiles(id) on delete cascade,
  dia        date not null,
  criado_em  timestamptz not null default now(),
  primary key (desafio_id, usuario_id, dia)
);

alter table public.desafios_grupo enable row level security;
alter table public.desafio_grupo_membros enable row level security;
alter table public.desafio_grupo_dias enable row level security;
revoke all on public.desafios_grupo from anon, authenticated;
revoke all on public.desafio_grupo_membros from anon, authenticated;
revoke all on public.desafio_grupo_dias from anon, authenticated;

-- Insígnias de participação (a engine de insígnias ignora o tipo 'desafio_grupo': só esta migration concede)
insert into public.insignias (codigo, categoria, nome, descricao, icone, criterio, ordem) values
  ('desafio_turma_participou', 'insignia', 'Na turma',      'Participou de um desafio em grupo.',          'people', '{"tipo":"desafio_grupo","nivel":"participou"}', 120),
  ('desafio_turma_ouro',       'conquista', 'Turma de ouro', 'Sua turma chegou ao ouro em um desafio.',     'trophy', '{"tipo":"desafio_grupo","nivel":"ouro"}',       130)
on conflict (codigo) do update
  set nome = excluded.nome, descricao = excluded.descricao, icone = excluded.icone, criterio = excluded.criterio;

-- Eventos para a pesquisa (eventos_app): acrescenta 3 nomes à lista permitida.
do $$
declare c record;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.eventos_app'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) ilike '%alimentacao_registrada%' loop
    execute format('alter table public.eventos_app drop constraint %I', c.conname);
  end loop;
  alter table public.eventos_app add constraint eventos_app_nome_check check (nome = any (array[
    'login','cadastro_concluido','onboarding_concluido','triagem_concluida',
    'alimentacao_registrada','agua_registrada','atividade_registrada',
    'desafio_visualizado','desafio_iniciado','desafio_concluido',
    'trilha_visualizada','trilha_iniciada','trilha_concluida','licao_concluida',
    'receita_visualizada','receita_concluida',
    'amizade_solicitada','amizade_aceita','conteudo_abandonado',
    'troca_sugerida','troca_aceita','troca_recusada',
    'scanner_lido','feed_visualizado','reacao_enviada',
    'desafio_grupo_criado','desafio_grupo_aceito','desafio_grupo_renovado'
  ]::text[]));
end $$;

create or replace function public._desafio_hoje()
returns date language sql stable as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;

create or replace function public._desafio_exigir_livre()
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if to_regprocedure('public._social_exigir_livre()') is not null then
    execute 'select public._social_exigir_livre()';
  end if;
end;
$$;

-- Meta de pessoa-dias por marco: bronze 3, prata 5, ouro 6 dias por pessoa ativa (ajuste aqui).
create or replace function public._desafio_marco(p_total integer, p_ativos integer)
returns text language sql immutable as $$
  select case
    when p_ativos <= 0 then 'NENHUM'
    when p_total >= 6 * p_ativos then 'OURO'
    when p_total >= 5 * p_ativos then 'PRATA'
    when p_total >= 3 * p_ativos then 'BRONZE'
    else 'NENHUM' end
$$;

-- Fecha desafios vencidos e concede as insígnias. Idempotente; chamada por desafio_listar.
create or replace function public._desafio_encerrar_vencidos(p_usuario uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  d record;
  v_ativos integer;
  v_total integer;
  v_part uuid;
  v_ouro uuid;
begin
  select id into v_part from public.insignias where codigo = 'desafio_turma_participou';
  select id into v_ouro from public.insignias where codigo = 'desafio_turma_ouro';
  for d in select ds.id from public.desafios_grupo ds
            join public.desafio_grupo_membros m on m.desafio_id = ds.id and m.usuario_id = p_usuario and m.status = 'ativo'
           where ds.encerrado_em is null and ds.fim < public._desafio_hoje()
           for update of ds loop
    update public.desafios_grupo set encerrado_em = now() where id = d.id;
    delete from public.desafio_grupo_membros where desafio_id = d.id and status = 'convidado';
    select count(*) into v_ativos from public.desafio_grupo_membros where desafio_id = d.id and status = 'ativo';
    select count(*) into v_total from public.desafio_grupo_dias where desafio_id = d.id;
    if v_part is not null then
      insert into public.insignias_usuario (usuario_id, insignia_id)
      select m.usuario_id, v_part from public.desafio_grupo_membros m
       where m.desafio_id = d.id and m.status = 'ativo'
      on conflict (usuario_id, insignia_id) do nothing;
    end if;
    if v_ouro is not null and public._desafio_marco(v_total, v_ativos) = 'OURO' then
      insert into public.insignias_usuario (usuario_id, insignia_id)
      select m.usuario_id, v_ouro from public.desafio_grupo_membros m
       where m.desafio_id = d.id and m.status = 'ativo'
      on conflict (usuario_id, insignia_id) do nothing;
    end if;
  end loop;
end;
$$;

-- Criar: devolve o id. Erros: DESAFIO_LIMITE (já está em 3), SEM_PERFIL.
create or replace function public.desafio_criar(p_metrica text, p_modo text default 'COOPERATIVO')
returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_eu uuid := auth.uid();
  v_hoje date := public._desafio_hoje();
  v_id uuid;
begin
  if v_eu is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  perform public._desafio_exigir_livre();
  if not public._amizade_eh_adolescente(v_eu) then raise exception 'SEM_PERFIL' using errcode = 'P0001'; end if;
  if p_metrica not in ('AGUA', 'ATIVIDADE', 'PASSOS', 'REGISTRO') or p_modo not in ('COOPERATIVO', 'PODIO') then
    raise exception 'Parâmetro inválido.' using errcode = '22023';
  end if;
  if (select count(*) from public.desafio_grupo_membros m join public.desafios_grupo d on d.id = m.desafio_id
       where m.usuario_id = v_eu and m.status = 'ativo' and d.fim >= v_hoje) >= 3 then
    raise exception 'DESAFIO_LIMITE' using errcode = 'P0001';
  end if;
  insert into public.desafios_grupo (metrica, modo, inicio, fim, criado_por)
  values (p_metrica, p_modo, v_hoje, v_hoje + 6, v_eu) returning id into v_id;
  insert into public.desafio_grupo_membros (desafio_id, usuario_id, status, entrou_em) values (v_id, v_eu, 'ativo', now());
  return v_id;
end;
$$;

-- Convidar um amigo. Retorno: enviado | sem_amizade | nao_membro | cheio | ja_membro | limite_do_amigo | encerrado
-- Só dá para convidar nos 2 primeiros dias (quem entra tarde teria menos dias; o pódio ficaria injusto).
create or replace function public.desafio_convidar(p_desafio uuid, p_amizade_id uuid)
returns text
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_eu uuid := auth.uid();
  v_hoje date := public._desafio_hoje();
  d public.desafios_grupo%rowtype;
  a public.amizades%rowtype;
  v_outro uuid;
begin
  if v_eu is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  perform public._desafio_exigir_livre();
  if not public._amizade_eh_adolescente(v_eu) then return 'sem_amizade'; end if;

  select * into d from public.desafios_grupo where id = p_desafio for update;
  if not found then return 'nao_membro'; end if;
  if not exists (select 1 from public.desafio_grupo_membros where desafio_id = p_desafio and usuario_id = v_eu and status = 'ativo') then
    return 'nao_membro';
  end if;
  if v_hoje > d.inicio + 1 then return 'encerrado'; end if;

  select * into a from public.amizades
   where id = p_amizade_id and status = 'aceita' and v_eu in (solicitante_id, destinatario_id);
  if not found then return 'sem_amizade'; end if;
  v_outro := case when a.solicitante_id = v_eu then a.destinatario_id else a.solicitante_id end;
  if public._social_bloqueado(v_eu, v_outro) then return 'sem_amizade'; end if;
  if exists (select 1 from public.desafio_grupo_membros where desafio_id = p_desafio and usuario_id = v_outro) then return 'ja_membro'; end if;
  if (select count(*) from public.desafio_grupo_membros where desafio_id = p_desafio) >= 5 then return 'cheio'; end if;
  if (select count(*) from public.desafio_grupo_membros where usuario_id = v_outro and status = 'convidado') >= 5 then
    return 'limite_do_amigo';
  end if;
  insert into public.desafio_grupo_membros (desafio_id, usuario_id, status, convidado_por) values (p_desafio, v_outro, 'convidado', v_eu);
  return 'enviado';
end;
$$;

-- Responder convite. Aceitar devolve false se encheu, se já está em 3 ou se o prazo de entrada passou.
create or replace function public.desafio_responder(p_desafio uuid, p_aceitar boolean)
returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_eu uuid := auth.uid();
  v_hoje date := public._desafio_hoje();
  d public.desafios_grupo%rowtype;
begin
  if v_eu is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  if not exists (select 1 from public.desafio_grupo_membros where desafio_id = p_desafio and usuario_id = v_eu and status = 'convidado') then
    return false;
  end if;
  if not p_aceitar then
    delete from public.desafio_grupo_membros where desafio_id = p_desafio and usuario_id = v_eu and status = 'convidado';
    return true;
  end if;
  perform public._desafio_exigir_livre();
  select * into d from public.desafios_grupo where id = p_desafio for update;
  if d.id is null or v_hoje > d.inicio + 1 then
    delete from public.desafio_grupo_membros where desafio_id = p_desafio and usuario_id = v_eu and status = 'convidado';
    return false;
  end if;
  if (select count(*) from public.desafio_grupo_membros m join public.desafios_grupo x on x.id = m.desafio_id
       where m.usuario_id = v_eu and m.status = 'ativo' and x.fim >= v_hoje) >= 3 then return false; end if;
  update public.desafio_grupo_membros set status = 'ativo', entrou_em = now()
   where desafio_id = p_desafio and usuario_id = v_eu and status = 'convidado';
  return true;
end;
$$;

-- Sair (ou cancelar convite). Os dias já cumpridos continuam contando para a turma.
create or replace function public.desafio_sair(p_desafio uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_eu uuid := auth.uid();
  v_linhas integer;
begin
  if v_eu is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  delete from public.desafio_grupo_membros where desafio_id = p_desafio and usuario_id = v_eu;
  get diagnostics v_linhas = row_count;
  if not exists (select 1 from public.desafio_grupo_membros where desafio_id = p_desafio and status = 'ativo') then
    delete from public.desafios_grupo where id = p_desafio;
  end if;
  return v_linhas > 0;
end;
$$;

-- Quais desafios ATIVOS ainda não têm o dia de hoje marcado por mim? O app confere a meta e chama desafio_marcar_hoje.
create or replace function public.desafio_pendentes_hoje()
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_eu uuid := auth.uid();
  v_hoje date := public._desafio_hoje();
begin
  if v_eu is null then return '[]'::jsonb; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', d.id, 'metrica', d.metrica))
      from public.desafios_grupo d
      join public.desafio_grupo_membros m on m.desafio_id = d.id and m.usuario_id = v_eu and m.status = 'ativo'
     where d.encerrado_em is null and v_hoje between d.inicio and d.fim
       and not exists (select 1 from public.desafio_grupo_dias x
                        where x.desafio_id = d.id and x.usuario_id = v_eu and x.dia = v_hoje)
  ), '[]'::jsonb);
end;
$$;

-- Marca hoje como cumprido (idempotente). Funciona com conta restrita no social: cumprir hábito não é contato.
create or replace function public.desafio_marcar_hoje(p_desafio uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_eu uuid := auth.uid();
  v_hoje date := public._desafio_hoje();
  v_linhas integer;
begin
  if v_eu is null then return false; end if;
  if not exists (
    select 1 from public.desafios_grupo d
      join public.desafio_grupo_membros m on m.desafio_id = d.id and m.usuario_id = v_eu and m.status = 'ativo'
     where d.id = p_desafio and d.encerrado_em is null and v_hoje between d.inicio and d.fim) then
    return false;
  end if;
  insert into public.desafio_grupo_dias (desafio_id, usuario_id, dia) values (p_desafio, v_eu, v_hoje)
  on conflict do nothing;
  get diagnostics v_linhas = row_count;
  return v_linhas > 0;
end;
$$;

-- Listar meus desafios. COOPERATIVO: sem dias por pessoa (só os meus). PODIO: dias de cada membro ativo.
create or replace function public.desafio_listar()
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_eu uuid := auth.uid();
  v_hoje date := public._desafio_hoje();
begin
  if v_eu is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  perform public._desafio_encerrar_vencidos(v_eu);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', d.id, 'metrica', d.metrica, 'modo', d.modo,
      'inicio', d.inicio, 'fim', d.fim, 'encerrado', d.encerrado_em is not null,
      'situacao', me.status,
      'convidado_por', case when me.status = 'convidado'
         then (select coalesce(p.apelido, 'Um amigo') from public.profiles p where p.id = me.convidado_por) end,
      'total_dias', (select count(*) from public.desafio_grupo_dias x where x.desafio_id = d.id),
      'meus_dias', coalesce((select jsonb_agg(x.dia order by x.dia) from public.desafio_grupo_dias x
                              where x.desafio_id = d.id and x.usuario_id = v_eu), '[]'::jsonb),
      'membros', coalesce((
        select jsonb_agg(jsonb_build_object(
                 'apelido', coalesce(p.apelido, 'Amigo'), 'avatar', p.avatar_social,
                 'eu', m.usuario_id = v_eu, 'pendente', m.status = 'convidado',
                 'fez_hoje', exists (select 1 from public.desafio_grupo_dias x
                                      where x.desafio_id = d.id and x.usuario_id = m.usuario_id and x.dia = v_hoje),
                 'dias', case when m.status = 'ativo' and (d.modo = 'PODIO' or m.usuario_id = v_eu)
                              then (select count(*) from public.desafio_grupo_dias x
                                     where x.desafio_id = d.id and x.usuario_id = m.usuario_id) end)
               order by (m.usuario_id = v_eu) desc, m.criado_em)
          from public.desafio_grupo_membros m
          join public.profiles p on p.id = m.usuario_id
         where m.desafio_id = d.id
           and (m.usuario_id = v_eu or not public._social_bloqueado(v_eu, m.usuario_id))), '[]'::jsonb)
    ) order by (me.status = 'convidado') desc, d.criado_em desc)
    from public.desafio_grupo_membros me
    join public.desafios_grupo d on d.id = me.desafio_id
    where me.usuario_id = v_eu
      and (d.encerrado_em is null or d.encerrado_em > now() - interval '14 days')), '[]'::jsonb);
end;
$$;

-- Renovar com um toque: novo desafio de 7 dias, mesma métrica e modo, convidando quem ainda é amigo seu.
create or replace function public.desafio_renovar(p_desafio uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_eu uuid := auth.uid();
  v_hoje date := public._desafio_hoje();
  d public.desafios_grupo%rowtype;
  v_novo uuid;
  r record;
begin
  if v_eu is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  perform public._desafio_exigir_livre();
  select * into d from public.desafios_grupo where id = p_desafio;
  if not found or not exists (select 1 from public.desafio_grupo_membros where desafio_id = p_desafio and usuario_id = v_eu and status = 'ativo') then
    raise exception 'DESAFIO_INVALIDO' using errcode = 'P0001';
  end if;
  if d.fim >= v_hoje then raise exception 'DESAFIO_EM_ANDAMENTO' using errcode = 'P0001'; end if;
  v_novo := public.desafio_criar(d.metrica, d.modo);
  for r in
    select distinct on (m.usuario_id) a.id as amizade_id
      from public.desafio_grupo_membros m
      join public.amizades a on a.status = 'aceita'
       and ((a.solicitante_id = v_eu and a.destinatario_id = m.usuario_id) or (a.destinatario_id = v_eu and a.solicitante_id = m.usuario_id))
     where m.desafio_id = p_desafio and m.status = 'ativo' and m.usuario_id <> v_eu
  loop
    perform public.desafio_convidar(v_novo, r.amizade_id);
  end loop;
  return v_novo;
end;
$$;

revoke all on function public._desafio_hoje() from public, anon;
revoke all on function public._desafio_exigir_livre() from public, anon, authenticated;
revoke all on function public._desafio_marco(integer, integer) from public, anon;
revoke all on function public._desafio_encerrar_vencidos(uuid) from public, anon, authenticated;
revoke all on function public.desafio_criar(text, text) from public, anon;
revoke all on function public.desafio_convidar(uuid, uuid) from public, anon;
revoke all on function public.desafio_responder(uuid, boolean) from public, anon;
revoke all on function public.desafio_sair(uuid) from public, anon;
revoke all on function public.desafio_pendentes_hoje() from public, anon;
revoke all on function public.desafio_marcar_hoje(uuid) from public, anon;
revoke all on function public.desafio_listar() from public, anon;
revoke all on function public.desafio_renovar(uuid) from public, anon;
grant execute on function public._desafio_hoje() to authenticated;
grant execute on function public.desafio_criar(text, text) to authenticated;
grant execute on function public.desafio_convidar(uuid, uuid) to authenticated;
grant execute on function public.desafio_responder(uuid, boolean) to authenticated;
grant execute on function public.desafio_sair(uuid) to authenticated;
grant execute on function public.desafio_pendentes_hoje() to authenticated;
grant execute on function public.desafio_marcar_hoje(uuid) to authenticated;
grant execute on function public.desafio_listar() to authenticated;
grant execute on function public.desafio_renovar(uuid) to authenticated;

commit;
