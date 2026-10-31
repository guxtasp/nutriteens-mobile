-- migration_painel_moderacao.sql  (idempotente)
-- Moderação: fila de denúncias com status, decisão e nota da equipe (ECA Digital, art. 29).
-- Rodar DEPOIS de migration_social_amizades.sql e migration_painel_gestao.sql.
--
-- O que muda:
--   * denuncias_sociais ganha: status (ABERTA/RESOLVIDA), decisao (SEM_ACAO/ADVERTENCIA/IMPROCEDENTE),
--     nota_equipe, resolvido_por, resolvido_em.
--   * painel_moderacao() passa a devolver esses campos e o total de abertas.
--   * painel_moderacao_resolver(id, decisao, nota): só Administrador; só denúncia ABERTA; decisão definitiva.
-- O que NÃO muda: não há suspensão automática de conta (ver MELHORIAS_PAINEL.md, 4b/P5).

alter table public.denuncias_sociais add column if not exists status text not null default 'ABERTA';
alter table public.denuncias_sociais add column if not exists decisao text;
alter table public.denuncias_sociais add column if not exists nota_equipe text;
alter table public.denuncias_sociais add column if not exists resolvido_por uuid references public.profiles(id) on delete set null;
alter table public.denuncias_sociais add column if not exists resolvido_em timestamptz;

alter table public.denuncias_sociais drop constraint if exists denuncias_sociais_status_check;
alter table public.denuncias_sociais add constraint denuncias_sociais_status_check check (status in ('ABERTA', 'RESOLVIDA'));
alter table public.denuncias_sociais drop constraint if exists denuncias_sociais_decisao_check;
alter table public.denuncias_sociais add constraint denuncias_sociais_decisao_check
  check (decisao is null or decisao in ('SEM_ACAO', 'ADVERTENCIA', 'IMPROCEDENTE'));
alter table public.denuncias_sociais drop constraint if exists denuncias_sociais_nota_check;
alter table public.denuncias_sociais add constraint denuncias_sociais_nota_check
  check (nota_equipe is null or char_length(nota_equipe) <= 500);

create index if not exists denuncias_sociais_status_idx on public.denuncias_sociais (status, criado_em desc);

create or replace function public.painel_moderacao(p_limite integer default 100)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare v_lim integer := greatest(1, least(coalesce(p_limite, 100), 300));
begin
  if public.papel_atual() is distinct from 'ADMINISTRADOR' then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'total_denuncias', (select count(*) from public.denuncias_sociais),
    'denuncias_abertas', (select count(*) from public.denuncias_sociais where status = 'ABERTA'),
    'denuncias_30d', (select count(*) from public.denuncias_sociais where criado_em >= now() - interval '30 days'),
    'total_bloqueios', (select count(*) from public.bloqueios),
    'reincidentes', (select count(*) from (
        select denunciado_id from public.denuncias_sociais group by 1 having count(*) >= 2) r),
    'denuncias', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', d.id, 'criado_em', d.criado_em, 'motivo', d.motivo,
               'status', d.status, 'decisao', d.decisao, 'nota_equipe', d.nota_equipe,
               'resolvido_em', d.resolvido_em,
               'resolvido_por', coalesce(r.apelido, r.nome),
               'denunciante_id', d.denunciante_id,
               'denunciante', coalesce(a.apelido, a.nome),
               'denunciado_id', d.denunciado_id,
               'denunciado', coalesce(b.apelido, b.nome),
               'total_do_denunciado', (select count(*) from public.denuncias_sociais x where x.denunciado_id = d.denunciado_id)
             ) order by (d.status = 'ABERTA') desc, d.criado_em desc)
        from (select * from public.denuncias_sociais order by (status = 'ABERTA') desc, criado_em desc limit v_lim) d
        left join public.profiles a on a.id = d.denunciante_id
        left join public.profiles b on b.id = d.denunciado_id
        left join public.profiles r on r.id = d.resolvido_por), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.painel_moderacao(integer) from public, anon;
grant execute on function public.painel_moderacao(integer) to authenticated;

create or replace function public.painel_moderacao_resolver(p_id uuid, p_decisao text, p_nota text default null)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_status text;
begin
  if public.papel_atual() is distinct from 'ADMINISTRADOR' then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if p_decisao not in ('SEM_ACAO', 'ADVERTENCIA', 'IMPROCEDENTE') then
    raise exception 'Decisão inválida.' using errcode = '22023';
  end if;
  select status into v_status from public.denuncias_sociais where id = p_id for update;
  if not found then raise exception 'Denúncia não encontrada.' using errcode = 'P0002'; end if;
  if v_status <> 'ABERTA' then raise exception 'Denúncia já resolvida.' using errcode = 'P0001'; end if;
  update public.denuncias_sociais set
    status = 'RESOLVIDA', decisao = p_decisao,
    nota_equipe = left(nullif(btrim(coalesce(p_nota, '')), ''), 500),
    resolvido_por = auth.uid(), resolvido_em = now()
  where id = p_id;
end;
$$;
revoke all on function public.painel_moderacao_resolver(uuid, text, text) from public, anon;
grant execute on function public.painel_moderacao_resolver(uuid, text, text) to authenticated;
