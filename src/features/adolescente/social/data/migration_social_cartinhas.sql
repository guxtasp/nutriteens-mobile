-- migration_social_cartinhas.sql  (idempotente)
-- Cartinhas entre amigos + lembrete gentil. Figurinhas FIXAS, sem texto livre.
-- Rodar DEPOIS de migration_social_amizades.sql (usa _social_bloqueado) e migration_amizades.sql
-- (usa _amizade_eh_adolescente). migration_painel_moderacao_acoes.sql continua OPCIONAL: se existir,
-- conta restrita no social não envia cartinha (receber e abrir a caixa continuam livres).
--
-- Regras (desenhadas para o ECA Digital e para nunca gerar culpa ou cobrança):
--  * só entre AMIGOS (amizade aceita, sem bloqueio); o app usa o id da amizade, nunca o id do amigo;
--  * sem texto livre: o tipo vem de uma lista fixa (a arte e a frase ficam no app);
--  * 1 cartinha por dia por amigo e no máximo 5 por dia no total;
--  * "lembrete gentil" (BORA, AGUA, FRUTA) é uma cartinha como as outras, com 2 travas a mais:
--      - no máximo 2 lembretes por semana para o mesmo amigo (resposta 'calma');
--      - quem recebe pode desligar lembretes; quem envia vê o MESMO "enviada" (recusa silenciosa), sem saber;
--  * o banco NUNCA diz ao remetente se o amigo já registrou o dia: o lembrete vale a qualquer hora;
--  * cartinhas antigas (mais de 30 dias) são apagadas na próxima gravação (minimização de dados);
--  * tabelas sem acesso direto (RLS ligado, sem políticas); tudo via funções cartinha_*.
--
-- "Cartinha repetida": o que cada pessoa recebeu fica registrado por tipo; receber o mesmo tipo duas vezes
-- é uma "repetida" (a Fase 2, "Fizemos juntos", usa isso para o presente). Nada a mudar aqui para isso.
begin;

create table if not exists public.cartinhas (
  id              uuid primary key default gen_random_uuid(),
  amizade_id      uuid not null references public.amizades(id) on delete cascade,
  remetente_id    uuid not null references public.profiles(id) on delete cascade,
  destinatario_id uuid not null references public.profiles(id) on delete cascade,
  tipo            text not null check (tipo in ('PARABENS', 'ORGULHO', 'FORCA', 'VALEU', 'ABRACO', 'BORA', 'AGUA', 'FRUTA')),
  dia             date not null default ((now() at time zone 'America/Sao_Paulo')::date),
  criado_em       timestamptz not null default now(),
  vista_em        timestamptz,
  check (remetente_id <> destinatario_id),
  unique (remetente_id, destinatario_id, dia)
);
create index if not exists cartinhas_dest_idx on public.cartinhas (destinatario_id, criado_em desc);
create index if not exists cartinhas_rem_dia_idx on public.cartinhas (remetente_id, dia);

create table if not exists public.cartinhas_preferencias (
  usuario_id       uuid primary key references public.profiles(id) on delete cascade,
  aceita_lembretes boolean not null default true,
  atualizado_em    timestamptz not null default now()
);

alter table public.cartinhas enable row level security;
alter table public.cartinhas_preferencias enable row level security;
revoke all on public.cartinhas from anon, authenticated;
revoke all on public.cartinhas_preferencias from anon, authenticated;

-- Conta restrita no social não envia. Só consulta a moderação se ela existir (ver migration_social_jardim.sql).
create or replace function public._cartinha_exigir_livre()
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if to_regprocedure('public._social_exigir_livre()') is not null then
    execute 'select public._social_exigir_livre()';
  end if;
end;
$$;

-- Enviar. Retorno: enviada | sem_amizade | tipo_invalido | ja_enviada | limite | calma
--   ja_enviada = já mandou uma cartinha para esse amigo hoje; limite = 5 no dia; calma = 2 lembretes na semana.
create or replace function public.cartinha_enviar(p_amizade_id uuid, p_tipo text)
returns text
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_eu uuid := auth.uid();
  a public.amizades%rowtype;
  v_outro uuid;
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_lembrete boolean := p_tipo in ('BORA', 'AGUA', 'FRUTA');
begin
  if v_eu is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  perform public._cartinha_exigir_livre();
  if not public._amizade_eh_adolescente(v_eu) then return 'sem_amizade'; end if;
  if p_tipo is null or p_tipo not in ('PARABENS', 'ORGULHO', 'FORCA', 'VALEU', 'ABRACO', 'BORA', 'AGUA', 'FRUTA') then
    return 'tipo_invalido';
  end if;

  select * into a from public.amizades
   where id = p_amizade_id and status = 'aceita' and v_eu in (solicitante_id, destinatario_id);
  if not found then return 'sem_amizade'; end if;
  v_outro := case when a.solicitante_id = v_eu then a.destinatario_id else a.solicitante_id end;
  if public._social_bloqueado(v_eu, v_outro) then return 'sem_amizade'; end if;

  if exists (select 1 from public.cartinhas where remetente_id = v_eu and destinatario_id = v_outro and dia = v_hoje) then
    return 'ja_enviada';
  end if;
  if (select count(*) from public.cartinhas where remetente_id = v_eu and dia = v_hoje) >= 5 then
    return 'limite';
  end if;
  if v_lembrete and (select count(*) from public.cartinhas
                      where remetente_id = v_eu and destinatario_id = v_outro
                        and tipo in ('BORA', 'AGUA', 'FRUTA') and dia > v_hoje - 7) >= 2 then
    return 'calma';
  end if;

  -- limpeza: o que passou de 30 dias não precisa ficar guardado
  delete from public.cartinhas where criado_em < now() - interval '30 days';

  -- recusa silenciosa: quem desligou lembretes não recebe, e o remetente vê o mesmo "enviada"
  if v_lembrete and exists (select 1 from public.cartinhas_preferencias
                             where usuario_id = v_outro and not aceita_lembretes) then
    return 'enviada';
  end if;

  insert into public.cartinhas (amizade_id, remetente_id, destinatario_id, tipo)
  values (a.id, v_eu, v_outro, p_tipo);
  return 'enviada';
end;
$$;

-- Caixa de entrada: últimas 30 recebidas (14 dias), sem amigo bloqueado, e se aceito lembretes.
create or replace function public.cartinha_caixa()
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare v_eu uuid := auth.uid();
begin
  if v_eu is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  return jsonb_build_object(
    'aceita_lembretes', coalesce((select aceita_lembretes from public.cartinhas_preferencias where usuario_id = v_eu), true),
    'itens', coalesce((
      select jsonb_agg(x.item order by x.criado_em desc)
        from (
          select c.criado_em,
                 jsonb_build_object(
                   'id', c.id, 'tipo', c.tipo,
                   'remetente', coalesce(p.apelido, 'Um amigo'), 'avatar', p.avatar_social,
                   'criado_em', c.criado_em, 'vista', c.vista_em is not null) as item
            from public.cartinhas c
            join public.profiles p on p.id = c.remetente_id
           where c.destinatario_id = v_eu
             and c.criado_em > now() - interval '14 days'
             and not public._social_bloqueado(v_eu, c.remetente_id)
           order by c.criado_em desc
           limit 30
        ) x), '[]'::jsonb));
end;
$$;

-- Para o app saber o que já foi enviado hoje (desabilita o botão do amigo). Só ids de amizade e o total.
create or replace function public.cartinha_enviadas_hoje()
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_eu uuid := auth.uid();
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if v_eu is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  return jsonb_build_object(
    'total', (select count(*) from public.cartinhas where remetente_id = v_eu and dia = v_hoje),
    'amizades', coalesce((select jsonb_agg(amizade_id) from public.cartinhas where remetente_id = v_eu and dia = v_hoje), '[]'::jsonb));
end;
$$;

-- Marca tudo como visto (some o aviso). Devolve quantas eram novas.
create or replace function public.cartinha_marcar_vistas()
returns integer
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_eu uuid := auth.uid();
  v_n integer;
begin
  if v_eu is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  update public.cartinhas set vista_em = now() where destinatario_id = v_eu and vista_em is null;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- Ligar/desligar lembretes de amigos. Desligar vale já; não avisa ninguém.
create or replace function public.cartinha_definir_lembretes(p_aceita boolean)
returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_eu uuid := auth.uid();
begin
  if v_eu is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  insert into public.cartinhas_preferencias (usuario_id, aceita_lembretes, atualizado_em)
  values (v_eu, coalesce(p_aceita, true), now())
  on conflict (usuario_id) do update set aceita_lembretes = excluded.aceita_lembretes, atualizado_em = now();
  return coalesce(p_aceita, true);
end;
$$;

revoke all on function public._cartinha_exigir_livre() from public, anon, authenticated;
revoke all on function public.cartinha_enviar(uuid, text) from public, anon;
revoke all on function public.cartinha_caixa() from public, anon;
revoke all on function public.cartinha_enviadas_hoje() from public, anon;
revoke all on function public.cartinha_marcar_vistas() from public, anon;
revoke all on function public.cartinha_definir_lembretes(boolean) from public, anon;
grant execute on function public.cartinha_enviar(uuid, text) to authenticated;
grant execute on function public.cartinha_caixa() to authenticated;
grant execute on function public.cartinha_enviadas_hoje() to authenticated;
grant execute on function public.cartinha_marcar_vistas() to authenticated;
grant execute on function public.cartinha_definir_lembretes(boolean) to authenticated;

commit;
