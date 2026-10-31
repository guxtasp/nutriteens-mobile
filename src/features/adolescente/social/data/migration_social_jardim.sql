-- migration_social_jardim.sql  (idempotente)
-- Jardim do grupo: uma planta compartilhada por 2 a 5 amigos que cresce com os registros de todos.
-- Rodar DEPOIS de migration_amizades.sql (usa _amizade_eh_adolescente e bloqueios).
-- Pode rodar DE NOVO por cima da versão anterior: adiciona a planta BROCOLIS e troca a dependência da moderação.
-- migration_painel_moderacao_acoes.sql agora é OPCIONAL: se ela existir, conta restrita não cria nem convida;
-- se ainda não rodou, o jardim funciona normalmente (antes, criar e convidar davam erro sem ela).
--
-- Regras (desenhadas para o ECA Digital e para nunca gerar culpa):
--  * só AMIGOS entram: o convite usa o id da amizade (o app nunca vê o id do amigo) e precisa ser aceito;
--  * no máximo 5 pessoas por jardim (ativas + convidadas) e 3 jardins ativos por pessoa;
--  * a planta SÓ CRESCE: `pontos` é um contador que nunca diminui (nem quando alguém sai ou fica dias sem registrar);
--  * 1 ponto por pessoa por dia em que o dia contou para a sequência (o app chama jardim_regar_hoje, idempotente);
--  * o banco NUNCA devolve total de regas por pessoa nem quem não regou: só "regou hoje" de cada um, para
--    celebrar. Sem ranking, sem comparação;
--  * sem texto livre: o tema (planta) vem de uma lista fixa (BROCOLIS, GIRASSOL, TOMATEIRO, LARANJEIRA, HORTA);
--  * tabelas sem acesso direto (RLS ligado, sem políticas); tudo via funções jardim_*.
begin;

create table if not exists public.jardins (
  id         uuid primary key default gen_random_uuid(),
  tema       text not null check (tema in ('BROCOLIS', 'GIRASSOL', 'TOMATEIRO', 'LARANJEIRA', 'HORTA')),
  criado_por uuid references public.profiles(id) on delete set null,
  pontos     integer not null default 0 check (pontos >= 0),
  criado_em  timestamptz not null default now()
);

create table if not exists public.jardim_membros (
  jardim_id      uuid not null references public.jardins(id) on delete cascade,
  usuario_id     uuid not null references public.profiles(id) on delete cascade,
  status         text not null default 'convidado' check (status in ('convidado', 'ativo')),
  convidado_por  uuid references public.profiles(id) on delete set null,
  criado_em      timestamptz not null default now(),
  entrou_em      timestamptz,
  ultimo_dia_rega date,
  primary key (jardim_id, usuario_id)
);
create index if not exists jardim_membros_usuario_idx on public.jardim_membros (usuario_id, status);

-- Quem já rodou a versão anterior tem a restrição de tema SEM o brócolis: troca por uma que aceita os 5.
do $$
declare c record;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.jardins'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) ilike '%tema%' loop
    execute format('alter table public.jardins drop constraint %I', c.conname);
  end loop;
  alter table public.jardins add constraint jardins_tema_check
    check (tema in ('BROCOLIS', 'GIRASSOL', 'TOMATEIRO', 'LARANJEIRA', 'HORTA'));
end $$;

alter table public.jardins enable row level security;
alter table public.jardim_membros enable row level security;
revoke all on public.jardins from anon, authenticated;
revoke all on public.jardim_membros from anon, authenticated;

create or replace function public._jardim_hoje()
returns date language sql stable as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;

-- Conta restrita no social não cria nem convida. Chama _social_exigir_livre() SÓ se ela existir
-- (vem de migration_painel_moderacao_acoes.sql); sem ela, não bloqueia ninguém e nada quebra.
create or replace function public._jardim_exigir_livre()
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if to_regprocedure('public._social_exigir_livre()') is not null then
    execute 'select public._social_exigir_livre()';
  end if;
end;
$$;

-- Criar: devolve o id do jardim. Erros: JARDIM_LIMITE (já está em 3 jardins), SEM_PERFIL.
create or replace function public.jardim_criar(p_tema text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_eu uuid := auth.uid();
  v_id uuid;
begin
  if v_eu is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  perform public._jardim_exigir_livre();
  if not public._amizade_eh_adolescente(v_eu) then raise exception 'SEM_PERFIL' using errcode = 'P0001'; end if;
  if p_tema not in ('BROCOLIS', 'GIRASSOL', 'TOMATEIRO', 'LARANJEIRA', 'HORTA') then
    raise exception 'Tema inválido.' using errcode = '22023';
  end if;
  if (select count(*) from public.jardim_membros where usuario_id = v_eu and status = 'ativo') >= 3 then
    raise exception 'JARDIM_LIMITE' using errcode = 'P0001';
  end if;
  insert into public.jardins (tema, criado_por) values (p_tema, v_eu) returning id into v_id;
  insert into public.jardim_membros (jardim_id, usuario_id, status, entrou_em) values (v_id, v_eu, 'ativo', now());
  return v_id;
end;
$$;

-- Convidar um amigo (pelo id da amizade). Retorno: enviado | sem_amizade | nao_membro | cheio | ja_membro | limite_do_amigo
create or replace function public.jardim_convidar(p_jardim uuid, p_amizade_id uuid)
returns text
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_eu uuid := auth.uid();
  a public.amizades%rowtype;
  v_outro uuid;
begin
  if v_eu is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  perform public._jardim_exigir_livre();
  if not public._amizade_eh_adolescente(v_eu) then return 'sem_amizade'; end if;

  perform 1 from public.jardins where id = p_jardim for update;   -- serializa convites do mesmo jardim
  if not exists (select 1 from public.jardim_membros where jardim_id = p_jardim and usuario_id = v_eu and status = 'ativo') then
    return 'nao_membro';
  end if;

  select * into a from public.amizades
   where id = p_amizade_id and status = 'aceita' and v_eu in (solicitante_id, destinatario_id);
  if not found then return 'sem_amizade'; end if;
  v_outro := case when a.solicitante_id = v_eu then a.destinatario_id else a.solicitante_id end;

  if public._social_bloqueado(v_eu, v_outro) then return 'sem_amizade'; end if;
  if exists (select 1 from public.jardim_membros where jardim_id = p_jardim and usuario_id = v_outro) then
    return 'ja_membro';
  end if;
  if (select count(*) from public.jardim_membros where jardim_id = p_jardim) >= 5 then return 'cheio'; end if;
  -- evita encher a caixa de convites de alguém
  if (select count(*) from public.jardim_membros where usuario_id = v_outro and status = 'convidado') >= 5 then
    return 'limite_do_amigo';
  end if;

  insert into public.jardim_membros (jardim_id, usuario_id, status, convidado_por) values (p_jardim, v_outro, 'convidado', v_eu);
  return 'enviado';
end;
$$;

-- Responder convite. Aceitar falha (false) se o jardim encheu ou se já está em 3 jardins. Recusar apaga o convite.
create or replace function public.jardim_responder(p_jardim uuid, p_aceitar boolean)
returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_eu uuid := auth.uid();
begin
  if v_eu is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  if not exists (select 1 from public.jardim_membros where jardim_id = p_jardim and usuario_id = v_eu and status = 'convidado') then
    return false;
  end if;
  if not p_aceitar then
    delete from public.jardim_membros where jardim_id = p_jardim and usuario_id = v_eu and status = 'convidado';
    return true;
  end if;
  perform public._jardim_exigir_livre();
  perform 1 from public.jardins where id = p_jardim for update;
  if (select count(*) from public.jardim_membros where usuario_id = v_eu and status = 'ativo') >= 3 then return false; end if;
  update public.jardim_membros set status = 'ativo', entrou_em = now()
   where jardim_id = p_jardim and usuario_id = v_eu and status = 'convidado';
  return true;
end;
$$;

-- Sair (ou cancelar convite). O jardim fica com os pontos; se ninguém ativo restar, é apagado.
create or replace function public.jardim_sair(p_jardim uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_eu uuid := auth.uid();
  v_linhas integer;
begin
  if v_eu is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  delete from public.jardim_membros where jardim_id = p_jardim and usuario_id = v_eu;
  get diagnostics v_linhas = row_count;
  if not exists (select 1 from public.jardim_membros where jardim_id = p_jardim and status = 'ativo') then
    delete from public.jardins where id = p_jardim;
  end if;
  return v_linhas > 0;
end;
$$;

-- Regar: chamada quando o dia de hoje contou para a sequência. Idempotente (1 ponto por pessoa por dia).
-- Funciona mesmo com conta restrita no social: regar não é contato.
create or replace function public.jardim_regar_hoje()
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_eu uuid := auth.uid();
  v_hoje date := public._jardim_hoje();
  r record;
begin
  if v_eu is null then return; end if;
  for r in select jardim_id from public.jardim_membros
            where usuario_id = v_eu and status = 'ativo'
              and (ultimo_dia_rega is null or ultimo_dia_rega < v_hoje) loop
    update public.jardim_membros set ultimo_dia_rega = v_hoje
     where jardim_id = r.jardim_id and usuario_id = v_eu;
    update public.jardins set pontos = pontos + 1 where id = r.jardim_id;
  end loop;
end;
$$;

-- Listar meus jardins (ativos e convites). Só apelido, avatar e "regou hoje"; sem totais por pessoa.
create or replace function public.jardim_listar()
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_eu uuid := auth.uid();
  v_hoje date := public._jardim_hoje();
begin
  if v_eu is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', j.id, 'tema', j.tema, 'pontos', j.pontos,
      'situacao', me.status,
      'convidado_por', case when me.status = 'convidado' then (select coalesce(p.apelido, 'Um amigo') from public.profiles p where p.id = me.convidado_por) end,
      'membros', coalesce((
        select jsonb_agg(jsonb_build_object(
                 'apelido', coalesce(p.apelido, 'Amigo'), 'avatar', p.avatar_social,
                 'eu', m.usuario_id = v_eu, 'pendente', m.status = 'convidado',
                 'regou_hoje', m.ultimo_dia_rega = v_hoje)
               order by (m.usuario_id = v_eu) desc, m.criado_em)
          from public.jardim_membros m
          join public.profiles p on p.id = m.usuario_id
         where m.jardim_id = j.id
           and (m.usuario_id = v_eu or not public._social_bloqueado(v_eu, m.usuario_id))), '[]'::jsonb)
    ) order by (me.status = 'convidado') desc, j.criado_em desc)
    from public.jardim_membros me
    join public.jardins j on j.id = me.jardim_id
    where me.usuario_id = v_eu), '[]'::jsonb);
end;
$$;

revoke all on function public._jardim_hoje() from public, anon;
revoke all on function public._jardim_exigir_livre() from public, anon, authenticated;
revoke all on function public.jardim_criar(text) from public, anon;
revoke all on function public.jardim_convidar(uuid, uuid) from public, anon;
revoke all on function public.jardim_responder(uuid, boolean) from public, anon;
revoke all on function public.jardim_sair(uuid) from public, anon;
revoke all on function public.jardim_regar_hoje() from public, anon;
revoke all on function public.jardim_listar() from public, anon;
grant execute on function public._jardim_hoje() to authenticated;
grant execute on function public.jardim_criar(text) to authenticated;
grant execute on function public.jardim_convidar(uuid, uuid) to authenticated;
grant execute on function public.jardim_responder(uuid, boolean) to authenticated;
grant execute on function public.jardim_sair(uuid) to authenticated;
grant execute on function public.jardim_regar_hoje() to authenticated;
grant execute on function public.jardim_listar() to authenticated;

commit;
