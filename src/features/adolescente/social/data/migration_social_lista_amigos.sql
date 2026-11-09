-- Lista paginada de amigos (tela "Sua turma"): busca por apelido no servidor,
-- filtros (todos | hoje | recentes) e páginas de 30, para funcionar com qualquer quantidade.
begin;

create or replace function public.social_listar_amigos_pagina(
  p_busca text default null,
  p_filtro text default 'todos',
  p_limite int default 30,
  p_offset int default 0
)
returns table (amizade_id uuid, apelido text, avatar text, desde timestamptz, manteve_hoje boolean, total bigint)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_busca text := nullif(btrim(coalesce(p_busca, '')), '');
  v_limite int := least(greatest(coalesce(p_limite, 30), 1), 60);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
begin
  if v_uid is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  if v_busca is not null then
    v_busca := replace(replace(replace(v_busca, '\', '\\'), '%', '\%'), '_', '\_');
  end if;
  return query
    with base as (
      select a.id as aid, p.apelido as ap, p.avatar_social as av, a.respondido_em as ds,
             (p.ultimo_dia_mantido is not null and p.ultimo_dia_mantido >= v_hoje) as hoje
      from public.amizades a
      join public.profiles p
        on p.id = case when a.solicitante_id = v_uid then a.destinatario_id else a.solicitante_id end
      where a.status = 'aceita'
        and (a.solicitante_id = v_uid or a.destinatario_id = v_uid)
        and not public._social_bloqueado(v_uid, p.id)
        and (v_busca is null or p.apelido ilike '%' || v_busca || '%')
        and (p_filtro is distinct from 'hoje'
             or (p.ultimo_dia_mantido is not null and p.ultimo_dia_mantido >= v_hoje))
    )
    select aid, ap, av, ds, hoje, count(*) over ()
    from base
    order by case when p_filtro = 'recentes' then ds end desc nulls last, lower(ap), aid
    limit v_limite offset v_offset;
end $$;

revoke all on function public.social_listar_amigos_pagina(text, text, int, int) from public, anon;
grant execute on function public.social_listar_amigos_pagina(text, text, int, int) to authenticated;

commit;
