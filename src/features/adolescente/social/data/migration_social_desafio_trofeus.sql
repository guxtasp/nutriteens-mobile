-- migration_social_desafio_trofeus.sql  (idempotente)
-- Troféu da temporada: quando um desafio em grupo acaba, cada pessoa que cumpriu pelo menos 1 dia guarda um troféu.
-- Rodar DEPOIS de migration_social_desafio_grupo.sql (esta migration REDEFINE _desafio_encerrar_vencidos).
--
-- Regras (ECA Digital / D2):
--  * NÃO é ranking. O troféu depende só dos dias cumpridos da PRÓPRIA pessoa contra a meta pessoal dela;
--    o banco guarda métrica + dias + tamanho da turma. O TÍTULO (ex.: "Lenda da aguinha") é decidido no app
--    (utils/trofeu.ts), então trocar um nome não exige migration;
--  * quem fez 0 dia não ganha nada e nada aparece sobre isso;
--  * cada pessoa só enxerga os próprios troféus (tabela sem acesso direto; tudo via desafio_trofeus_listar);
--  * sem texto livre. Apaga junto com o perfil (on delete cascade).
begin;

create table if not exists public.desafio_trofeus (
  usuario_id   uuid not null references public.profiles(id) on delete cascade,
  desafio_id   uuid not null references public.desafios_grupo(id) on delete cascade,
  metrica      text not null check (metrica in ('AGUA', 'ATIVIDADE', 'PASSOS', 'REGISTRO')),
  dias         smallint not null check (dias between 1 and 7),
  equipe       smallint not null default 1 check (equipe between 1 and 5),
  encerrado_em timestamptz not null default now(),
  primary key (desafio_id, usuario_id)
);
create index if not exists desafio_trofeus_usuario_idx on public.desafio_trofeus (usuario_id, encerrado_em desc);

alter table public.desafio_trofeus enable row level security;
revoke all on public.desafio_trofeus from anon, authenticated;

-- Fecha desafios vencidos, concede as insígnias E guarda o troféu de cada membro ativo que cumpriu 1+ dia.
-- Igual à versão de migration_social_desafio_grupo.sql, mais o bloco "troféus". Idempotente.
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
  for d in select ds.id, ds.metrica from public.desafios_grupo ds
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
    -- Troféus da temporada: um por pessoa ativa que cumpriu pelo menos 1 dia.
    insert into public.desafio_trofeus (usuario_id, desafio_id, metrica, dias, equipe, encerrado_em)
    select m.usuario_id, d.id, d.metrica, c.dias, greatest(1, least(5, v_ativos)), now()
      from public.desafio_grupo_membros m
      join lateral (select count(*)::smallint as dias from public.desafio_grupo_dias x
                     where x.desafio_id = d.id and x.usuario_id = m.usuario_id) c on c.dias >= 1
     where m.desafio_id = d.id and m.status = 'ativo'
    on conflict (desafio_id, usuario_id) do nothing;
  end loop;
end;
$$;

-- Quem já terminou desafios antes desta migration também recebe os troféus (uma vez só).
insert into public.desafio_trofeus (usuario_id, desafio_id, metrica, dias, equipe, encerrado_em)
select m.usuario_id, g.id, g.metrica, c.dias,
       greatest(1, least(5, (select count(*) from public.desafio_grupo_membros a where a.desafio_id = g.id and a.status = 'ativo')))::smallint,
       g.encerrado_em
  from public.desafios_grupo g
  join public.desafio_grupo_membros m on m.desafio_id = g.id and m.status = 'ativo'
  join lateral (select least(count(*), 7)::smallint as dias from public.desafio_grupo_dias x
                 where x.desafio_id = g.id and x.usuario_id = m.usuario_id) c on c.dias >= 1
 where g.encerrado_em is not null
on conflict (desafio_id, usuario_id) do nothing;

-- Só os troféus de quem chama (mais recentes primeiro).
create or replace function public.desafio_trofeus_listar()
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_eu uuid := auth.uid();
begin
  if v_eu is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'desafio_id', t.desafio_id, 'metrica', t.metrica, 'dias', t.dias,
             'equipe', t.equipe, 'encerrado_em', t.encerrado_em) order by t.encerrado_em desc)
      from (select * from public.desafio_trofeus where usuario_id = v_eu order by encerrado_em desc limit 60) t
  ), '[]'::jsonb);
end;
$$;

grant execute on function public.desafio_trofeus_listar() to authenticated;

commit;
