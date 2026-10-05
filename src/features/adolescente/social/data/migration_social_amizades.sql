-- MIGRAÇÃO: PARTE SOCIAL (apelido, código de amizade, solicitações, bloqueio e denúncia)
-- Execute no SQL Editor do Supabase. É idempotente: pode rodar de novo sem erro.
--
-- Princípios (ver requisitos-social.md):
--  * ninguém acha ninguém por nome nem pelo codigo_participante (que é da pesquisa);
--  * o único jeito de pedir amizade é ter o CÓDIGO DE AMIZADE que a própria pessoa
--    compartilhou: código aleatório, separado do codigo_participante, que vale 7 dias
--    e pode ser trocado a qualquer momento;
--  * quem usa o código vê só o APELIDO e o avatar (nunca o nome real, escola etc.);
--  * o código dá permissão de PEDIR, nunca de ver: o dono precisa aceitar;
--  * as tabelas não são acessíveis direto pelo app (RLS ligado e sem políticas);
--    tudo passa pelas funções social_*, que sempre filtram por auth.uid().
--
-- Para mudar a validade do código, edite só _social_validade_codigo() abaixo.

begin;

-- ---------------------------------------------------------------------------
-- 1) Perfil social: apelido e avatar (o nome real nunca é exposto)
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists apelido text;
alter table public.profiles add column if not exists avatar_social text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_apelido_valido') then
    alter table public.profiles add constraint profiles_apelido_valido check (
      apelido is null or (
        char_length(apelido) between 3 and 20
        and apelido ~ '^[[:alnum:]][[:alnum:] ._-]*[[:alnum:]]$'
        and apelido !~ '[0-9]{6,}'          -- sem telefone
      )
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_avatar_social_valido') then
    alter table public.profiles add constraint profiles_avatar_social_valido check (
      avatar_social is null or avatar_social ~ '^[a-z0-9_-]{1,30}$'
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2) Tabelas (sem acesso direto: ver seção 4)
-- ---------------------------------------------------------------------------
create table if not exists public.codigos_amizade (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.profiles(id) on delete cascade,
  -- 8 caracteres de um alfabeto de 32 (sem I, O, 0 e 1): 32^8 ≈ 1,1 trilhão
  codigo text not null check (codigo ~ '^[A-HJ-NP-Z2-9]{8}$'),
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null,
  revogado_em timestamptz
);
create unique index if not exists codigos_amizade_codigo_uq on public.codigos_amizade (codigo);
-- no máximo um código ativo (não revogado) por pessoa
create unique index if not exists codigos_amizade_ativo_uq on public.codigos_amizade (usuario_id) where revogado_em is null;

create table if not exists public.amizades (
  id uuid primary key default gen_random_uuid(),
  solicitante_id uuid not null references public.profiles(id) on delete cascade,
  destinatario_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'aceita', 'recusada')),
  criado_em timestamptz not null default now(),
  respondido_em timestamptz,
  check (solicitante_id <> destinatario_id)
);
-- um único registro por par de pessoas, nas duas direções
create unique index if not exists amizades_par_uq
  on public.amizades (least(solicitante_id, destinatario_id), greatest(solicitante_id, destinatario_id));
create index if not exists amizades_destinatario_idx on public.amizades (destinatario_id, status);

create table if not exists public.bloqueios (
  bloqueador_id uuid not null references public.profiles(id) on delete cascade,
  bloqueado_id uuid not null references public.profiles(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (bloqueador_id, bloqueado_id),
  check (bloqueador_id <> bloqueado_id)
);

create table if not exists public.denuncias_sociais (
  id uuid primary key default gen_random_uuid(),
  denunciante_id uuid not null references public.profiles(id) on delete cascade,
  denunciado_id uuid not null references public.profiles(id) on delete cascade,
  motivo text not null check (char_length(motivo) between 1 and 500),
  criado_em timestamptz not null default now()
);

-- tentativas de código que falharam (limite contra adivinhação)
create table if not exists public.tentativas_codigo (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.profiles(id) on delete cascade,
  criado_em timestamptz not null default now()
);
create index if not exists tentativas_codigo_usuario_idx on public.tentativas_codigo (usuario_id, criado_em);

-- ---------------------------------------------------------------------------
-- 3) Funções auxiliares (internas)
-- ---------------------------------------------------------------------------
create or replace function public._social_validade_codigo()
returns interval language sql immutable as $$ select interval '7 days' $$;

create or replace function public._social_normalizar_codigo(p text)
returns text language sql immutable as $$
  select upper(regexp_replace(coalesce(p, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

-- Código novo a partir de gen_random_uuid() (aleatório criptográfico). Usa só
-- bytes totalmente aleatórios do uuid v4 (pula os que têm bits fixos) e 256 é
-- múltiplo de 32, então não há viés no sorteio das letras.
create or replace function public._social_novo_codigo()
returns text language plpgsql volatile as $$
declare
  v_alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
  v_posicoes constant int[] := array[0, 1, 2, 3, 4, 5, 7, 9];
  v_codigo text := '';
  i int;
begin
  foreach i in array v_posicoes loop
    v_codigo := v_codigo || substr(v_alfabeto, (get_byte(v_bytes, i) % 32) + 1, 1);
  end loop;
  return v_codigo;
end $$;

-- 10 tentativas erradas por hora e por pessoa
create or replace function public._social_limite_atingido(p_uid uuid)
returns boolean language plpgsql as $$
declare
  v_falhas int;
begin
  delete from public.tentativas_codigo t where t.criado_em < now() - interval '1 day';
  select count(*) into v_falhas
  from public.tentativas_codigo t
  where t.usuario_id = p_uid and t.criado_em > now() - interval '1 hour';
  return v_falhas >= 10;
end $$;

create or replace function public._social_bloqueado(p_a uuid, p_b uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.bloqueios b
    where (b.bloqueador_id = p_a and b.bloqueado_id = p_b)
       or (b.bloqueador_id = p_b and b.bloqueado_id = p_a)
  );
$$;

-- ---------------------------------------------------------------------------
-- 4) Funções que o app chama (SECURITY DEFINER; sempre filtram por auth.uid())
--
-- Falhas ESPERADAS (código errado, limite…) voltam como "status" e não como
-- exceção, porque uma exceção desfaria o registro da tentativa que falhou.
-- ---------------------------------------------------------------------------

-- Apelido e avatar da própria pessoa.
create or replace function public.social_meu_perfil()
returns table (apelido text, avatar text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  return query select p.apelido, p.avatar_social from public.profiles p where p.id = v_uid;
end $$;

-- Define apelido e avatar. status: ok | apelido_invalido | avatar_invalido
create or replace function public.social_definir_perfil(p_apelido text, p_avatar text)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_apelido text := btrim(regexp_replace(coalesce(p_apelido, ''), '\s+', ' ', 'g'));
begin
  if v_uid is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  if char_length(v_apelido) not between 3 and 20
     or v_apelido !~ '^[[:alnum:]][[:alnum:] ._-]*[[:alnum:]]$'
     or v_apelido ~ '[0-9]{6,}' then
    return 'apelido_invalido';
  end if;
  if p_avatar is null or p_avatar !~ '^[a-z0-9_-]{1,30}$' then
    return 'avatar_invalido';
  end if;
  update public.profiles p set apelido = v_apelido, avatar_social = p_avatar where p.id = v_uid;
  return 'ok';
end $$;

-- Devolve o código ativo da pessoa (gera um se não houver ou se expirou).
-- Com p_renovar = true, revoga o atual e gera outro. Exige apelido definido.
create or replace function public.social_obter_ou_gerar_codigo(p_renovar boolean default false)
returns table (codigo text, expira_em timestamptz)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_codigo text;
  v_expira timestamptz;
  v_tentativas int := 0;
begin
  if v_uid is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  if not exists (select 1 from public.profiles p where p.id = v_uid and p.apelido is not null) then
    raise exception 'apelido_obrigatorio' using errcode = 'P0001';
  end if;

  select c.codigo, c.expira_em into v_codigo, v_expira
  from public.codigos_amizade c
  where c.usuario_id = v_uid and c.revogado_em is null and c.expira_em > now();

  if found and not coalesce(p_renovar, false) then
    return query select v_codigo, v_expira;
    return;
  end if;

  update public.codigos_amizade c set revogado_em = now()
  where c.usuario_id = v_uid and c.revogado_em is null;

  loop
    v_codigo := public._social_novo_codigo();
    v_expira := now() + public._social_validade_codigo();
    begin
      insert into public.codigos_amizade (usuario_id, codigo, expira_em) values (v_uid, v_codigo, v_expira);
      exit;
    exception when unique_violation then
      v_tentativas := v_tentativas + 1;
      if v_tentativas > 5 then raise; end if;
    end;
  end loop;

  return query select v_codigo, v_expira;
end $$;

-- Pré-visualização: o que aparece depois de digitar o código (só apelido e avatar).
-- status: ok | invalido | proprio | limite
create or replace function public.social_consultar_codigo(p_codigo text)
returns table (status text, apelido text, avatar text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_dono uuid;
begin
  if v_uid is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  if public._social_limite_atingido(v_uid) then
    return query select 'limite'::text, null::text, null::text;
    return;
  end if;

  select c.usuario_id into v_dono
  from public.codigos_amizade c
  where c.codigo = public._social_normalizar_codigo(p_codigo)
    and c.revogado_em is null and c.expira_em > now();

  -- bloqueio (em qualquer direção) é tratado como código inválido, sem revelar nada
  if v_dono is null or public._social_bloqueado(v_uid, v_dono) then
    insert into public.tentativas_codigo (usuario_id) values (v_uid);
    return query select 'invalido'::text, null::text, null::text;
    return;
  end if;

  if v_dono = v_uid then
    return query select 'proprio'::text, null::text, null::text;
    return;
  end if;

  return query select 'ok'::text, p.apelido, p.avatar_social from public.profiles p where p.id = v_dono;
end $$;

-- Envia o pedido de amizade.
-- status: enviada | aceita | ja_amigos | invalido | proprio | limite | limite_pendentes | sem_apelido
-- Pedido repetido, já recusado ou já enviado volta "enviada" (não revela recusa).
-- Se a outra pessoa já tinha pedido amizade, aceita na hora.
create or replace function public.social_solicitar_por_codigo(p_codigo text)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_dono uuid;
  v_am public.amizades%rowtype;
begin
  if v_uid is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  if public._social_limite_atingido(v_uid) then return 'limite'; end if;
  if not exists (select 1 from public.profiles p where p.id = v_uid and p.apelido is not null) then
    return 'sem_apelido';
  end if;

  select c.usuario_id into v_dono
  from public.codigos_amizade c
  where c.codigo = public._social_normalizar_codigo(p_codigo)
    and c.revogado_em is null and c.expira_em > now();

  if v_dono is null or public._social_bloqueado(v_uid, v_dono) then
    insert into public.tentativas_codigo (usuario_id) values (v_uid);
    return 'invalido';
  end if;
  if v_dono = v_uid then return 'proprio'; end if;

  select a.* into v_am
  from public.amizades a
  where least(a.solicitante_id, a.destinatario_id) = least(v_uid, v_dono)
    and greatest(a.solicitante_id, a.destinatario_id) = greatest(v_uid, v_dono);

  if found then
    if v_am.status = 'aceita' then return 'ja_amigos'; end if;
    if v_am.status = 'pendente' and v_am.destinatario_id = v_uid then
      update public.amizades a set status = 'aceita', respondido_em = now() where a.id = v_am.id;
      return 'aceita';
    end if;
    return 'enviada';
  end if;

  -- no máximo 20 pedidos pendentes enviados (contra spam)
  if (select count(*) from public.amizades a where a.solicitante_id = v_uid and a.status = 'pendente') >= 20 then
    return 'limite_pendentes';
  end if;

  insert into public.amizades (solicitante_id, destinatario_id) values (v_uid, v_dono);
  return 'enviada';
end $$;

-- Pedidos pendentes: direcao = 'recebida' (a pessoa pode aceitar/recusar) ou 'enviada'.
create or replace function public.social_listar_solicitacoes()
returns table (amizade_id uuid, direcao text, apelido text, avatar text, criado_em timestamptz)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  return query
    select a.id,
           case when a.destinatario_id = v_uid then 'recebida' else 'enviada' end,
           p.apelido, p.avatar_social, a.criado_em
    from public.amizades a
    join public.profiles p
      on p.id = case when a.destinatario_id = v_uid then a.solicitante_id else a.destinatario_id end
    where a.status = 'pendente' and (a.solicitante_id = v_uid or a.destinatario_id = v_uid)
    order by a.criado_em desc;
end $$;

create or replace function public.social_listar_amigos()
returns table (amizade_id uuid, apelido text, avatar text, desde timestamptz)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  return query
    select a.id, p.apelido, p.avatar_social, a.respondido_em
    from public.amizades a
    join public.profiles p
      on p.id = case when a.solicitante_id = v_uid then a.destinatario_id else a.solicitante_id end
    where a.status = 'aceita' and (a.solicitante_id = v_uid or a.destinatario_id = v_uid)
    order by p.apelido;
end $$;

-- Só quem RECEBEU o pedido responde. status: ok | nao_encontrada
create or replace function public.social_responder_solicitacao(p_amizade_id uuid, p_aceitar boolean)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_linhas int;
begin
  if v_uid is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  update public.amizades a
     set status = case when p_aceitar then 'aceita' else 'recusada' end, respondido_em = now()
   where a.id = p_amizade_id and a.destinatario_id = v_uid and a.status = 'pendente';
  get diagnostics v_linhas = row_count;
  return case when v_linhas > 0 then 'ok' else 'nao_encontrada' end;
end $$;

-- Desfaz amizade ou cancela pedido enviado. (Pedido já recusado não pode ser
-- apagado por quem enviou: isso reabriria a porta pra insistir.)
create or replace function public.social_remover_amizade(p_amizade_id uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_linhas int;
begin
  if v_uid is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  delete from public.amizades a
   where a.id = p_amizade_id and a.status in ('pendente', 'aceita')
     and (a.solicitante_id = v_uid or a.destinatario_id = v_uid);
  get diagnostics v_linhas = row_count;
  return v_linhas > 0;
end $$;

-- Bloqueia a outra pessoa de uma amizade ou pedido: desfaz o vínculo e impede
-- novos pedidos nos dois sentidos.
create or replace function public.social_bloquear(p_amizade_id uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_outro uuid;
begin
  if v_uid is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  select case when a.solicitante_id = v_uid then a.destinatario_id else a.solicitante_id end into v_outro
  from public.amizades a
  where a.id = p_amizade_id and (a.solicitante_id = v_uid or a.destinatario_id = v_uid);
  if v_outro is null then return false; end if;

  insert into public.bloqueios (bloqueador_id, bloqueado_id) values (v_uid, v_outro) on conflict do nothing;
  delete from public.amizades a where a.id = p_amizade_id;
  return true;
end $$;

-- Denuncia a outra pessoa de uma amizade ou pedido (a equipe lê por social_admin_listar_denuncias).
create or replace function public.social_denunciar(p_amizade_id uuid, p_motivo text)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_outro uuid;
  v_motivo text := btrim(coalesce(p_motivo, ''));
begin
  if v_uid is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  if char_length(v_motivo) not between 1 and 500 then return false; end if;
  select case when a.solicitante_id = v_uid then a.destinatario_id else a.solicitante_id end into v_outro
  from public.amizades a
  where a.id = p_amizade_id and (a.solicitante_id = v_uid or a.destinatario_id = v_uid);
  if v_outro is null then return false; end if;
  insert into public.denuncias_sociais (denunciante_id, denunciado_id, motivo) values (v_uid, v_outro, v_motivo);
  return true;
end $$;

-- Só a equipe (ADMINISTRADOR) lê as denúncias, por esta função (a tabela fica fechada).
create or replace function public.social_admin_listar_denuncias()
returns table (id uuid, denunciante_id uuid, denunciante_apelido text, denunciado_id uuid,
               denunciado_apelido text, motivo text, criado_em timestamptz)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  if not exists (select 1 from public.profiles p where p.id = v_uid and p.papel::text = 'ADMINISTRADOR') then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  return query
    select d.id, d.denunciante_id, pa.apelido, d.denunciado_id, pb.apelido, d.motivo, d.criado_em
    from public.denuncias_sociais d
    join public.profiles pa on pa.id = d.denunciante_id
    join public.profiles pb on pb.id = d.denunciado_id
    order by d.criado_em desc;
end $$;

-- ---------------------------------------------------------------------------
-- 5) Permissões: tabelas fechadas, funções só pra quem está logado
-- ---------------------------------------------------------------------------
alter table public.codigos_amizade enable row level security;
alter table public.amizades enable row level security;
alter table public.bloqueios enable row level security;
alter table public.denuncias_sociais enable row level security;
alter table public.tentativas_codigo enable row level security;

revoke all on table public.codigos_amizade, public.amizades, public.bloqueios,
  public.denuncias_sociais, public.tentativas_codigo from anon, authenticated;

drop policy if exists denuncias_sociais_admin_le on public.denuncias_sociais;

do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as assinatura, p.proname
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.proname like '\_social\_%'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.assinatura);
  end loop;
  for r in
    select p.oid::regprocedure as assinatura
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.proname like 'social\_%'
  loop
    execute format('revoke all on function %s from public, anon', r.assinatura);
    execute format('grant execute on function %s to authenticated', r.assinatura);
  end loop;
end $$;

commit;
