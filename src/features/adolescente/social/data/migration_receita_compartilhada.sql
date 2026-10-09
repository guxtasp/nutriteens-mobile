-- MIGRAÇÃO: RECEITA PARA UM AMIGO
-- Execute no SQL Editor do Supabase. Idempotente. Requer migration_amizades.sql.
--
-- Regras:
--  * só entre amigos (amizade aceita), sem bloqueio entre eles;
--  * mensagem fixa (sem texto livre): o app mostra "[amigo] te mandou uma receita";
--  * a mesma receita para o mesmo amigo só 1 vez por dia; no máximo 10 envios por dia;
--  * quem recebe vê os envios dos últimos 7 dias;
--  * tabela sem acesso direto (RLS ligado, sem políticas); tudo via funções.
begin;

create table if not exists public.receitas_compartilhadas (
  id uuid primary key default gen_random_uuid(),
  amizade_id uuid not null references public.amizades(id) on delete cascade,
  remetente_id uuid not null references public.profiles(id) on delete cascade,
  destinatario_id uuid not null references public.profiles(id) on delete cascade,
  receita_id uuid not null references public.receitas(id) on delete cascade,
  dia date not null default ((now() at time zone 'America/Sao_Paulo')::date),
  criado_em timestamptz not null default now(),
  check (remetente_id <> destinatario_id),
  unique (remetente_id, destinatario_id, receita_id, dia)
);
create index if not exists receitas_compartilhadas_dest_idx
  on public.receitas_compartilhadas (destinatario_id, criado_em desc);

alter table public.receitas_compartilhadas enable row level security;
revoke all on public.receitas_compartilhadas from anon, authenticated;

-- retorno: enviada | sem_amizade | receita_invalida | ja_enviada | limite
create or replace function public.receita_compartilhar(p_amizade_id uuid, p_receita_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_eu uuid := auth.uid();
  a public.amizades%rowtype;
  v_outro uuid;
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if v_eu is null or not public._amizade_eh_adolescente(v_eu) then return 'sem_amizade'; end if;

  select * into a from public.amizades
   where id = p_amizade_id and status = 'aceita' and v_eu in (solicitante_id, destinatario_id);
  if not found then return 'sem_amizade'; end if;
  v_outro := case when a.solicitante_id = v_eu then a.destinatario_id else a.solicitante_id end;

  if exists (select 1 from public.bloqueios
              where (bloqueador_id = v_eu and bloqueado_id = v_outro)
                 or (bloqueador_id = v_outro and bloqueado_id = v_eu)) then
    return 'sem_amizade';
  end if;
  if not exists (select 1 from public.receitas where id = p_receita_id) then
    return 'receita_invalida';
  end if;
  if (select count(*) from public.receitas_compartilhadas
       where remetente_id = v_eu and dia = v_hoje) >= 10 then
    return 'limite';
  end if;

  insert into public.receitas_compartilhadas (amizade_id, remetente_id, destinatario_id, receita_id)
  values (a.id, v_eu, v_outro, p_receita_id)
  on conflict (remetente_id, destinatario_id, receita_id, dia) do nothing;
  if not found then return 'ja_enviada'; end if;
  return 'enviada';
end;
$$;

create or replace function public.receita_compartilhada_listar()
returns table (id uuid, receita_id uuid, titulo text, remetente text, criado_em timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not public._amizade_eh_adolescente(auth.uid()) then return; end if;
  return query
  select c.id, c.receita_id, r.titulo, coalesce(p.apelido, 'Um amigo'), c.criado_em
    from public.receitas_compartilhadas c
    join public.receitas r on r.id = c.receita_id
    join public.profiles p on p.id = c.remetente_id
   where c.destinatario_id = auth.uid()
     and c.criado_em > now() - interval '7 days'
     and not exists (select 1 from public.bloqueios b
                      where (b.bloqueador_id = auth.uid() and b.bloqueado_id = c.remetente_id)
                         or (b.bloqueador_id = c.remetente_id and b.bloqueado_id = auth.uid()))
   order by c.criado_em desc
   limit 20;
end;
$$;

revoke all on function public.receita_compartilhar(uuid, uuid) from public, anon;
revoke all on function public.receita_compartilhada_listar() from public, anon;
grant execute on function public.receita_compartilhar(uuid, uuid) to authenticated;
grant execute on function public.receita_compartilhada_listar() to authenticated;

commit;
