-- migration_social_juntos.sql  (idempotente)
-- "Fizemos juntos" + presente de cartinha repetida (Fase 3B). Rodar DEPOIS de migration_social_cartinhas.sql
-- (a versão com a coluna `presente`).
--
-- Regras:
--  * "Fizemos juntos" = os DOIS amigos mantiveram a sequência hoje (profiles.ultimo_dia_mantido >= hoje).
--    O banco só devolve quem fez junto com você: nunca diz quem não fez, então não há cobrança;
--  * "repetida" = cartinha de CELEBRAR recebida mais de uma vez. Disponíveis por tipo =
--    recebidas - 1 - presentes que você já deu desse tipo (nunca negativo). Lembretes não viram presente;
--  * presentear = reenviar uma repetida a um amigo com quem você fez junto hoje; 1 presente por amigo por dia;
--    não gasta o limite diário de cartinhas (índice parcial em `not presente`);
--  * não é sorteio nem compra: nada de aleatoriedade (ECA Digital, art. 20), sem texto livre;
--  * conta restrita no social não presenteia.
begin;

create or replace function public._juntos_hoje(p_a uuid, p_b uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select coalesce((
    select count(*) = 2 from public.profiles
     where id in (p_a, p_b)
       and ultimo_dia_mantido is not null
       and ultimo_dia_mantido >= (now() at time zone 'America/Sao_Paulo')::date
  ), false);
$$;

-- Amigos com quem fiz junto hoje: [{amizade_id, presenteado}] (presenteado = já dei presente hoje).
create or replace function public.cartinha_juntos_hoje()
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_eu uuid := auth.uid();
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if v_eu is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  if not public._amizade_eh_adolescente(v_eu) then return '[]'::jsonb; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'amizade_id', a.id,
             'presenteado', exists (select 1 from public.cartinhas c
                                     where c.amizade_id = a.id and c.remetente_id = v_eu and c.presente and c.dia = v_hoje)))
      from public.amizades a
     where a.status = 'aceita' and v_eu in (a.solicitante_id, a.destinatario_id)
       and not public._social_bloqueado(v_eu, case when a.solicitante_id = v_eu then a.destinatario_id else a.solicitante_id end)
       and public._juntos_hoje(v_eu, case when a.solicitante_id = v_eu then a.destinatario_id else a.solicitante_id end)
  ), '[]'::jsonb);
end;
$$;

-- Minhas repetidas por tipo: {"PARABENS": 1, ...} (só tipos com pelo menos 1 disponível).
create or replace function public.cartinha_repetidas()
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare v_eu uuid := auth.uid();
begin
  if v_eu is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  return coalesce((
    select jsonb_object_agg(t.tipo, t.disponiveis)
      from (
        select r.tipo,
               r.recebidas - 1 - coalesce((select count(*) from public.cartinhas g
                                            where g.remetente_id = v_eu and g.presente and g.tipo = r.tipo), 0) as disponiveis
          from (select tipo, count(*) as recebidas
                  from public.cartinhas
                 where destinatario_id = v_eu and tipo in ('PARABENS', 'ORGULHO', 'FORCA', 'VALEU', 'ABRACO')
                 group by tipo) r
      ) t
     where t.disponiveis > 0), '{}'::jsonb);
end;
$$;

-- Presentear. Retorno: enviada | sem_amizade | tipo_invalido | nao_juntos | sem_repetida | ja_presenteou
create or replace function public.cartinha_presentear(p_amizade_id uuid, p_tipo text)
returns text
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_eu uuid := auth.uid();
  a public.amizades%rowtype;
  v_outro uuid;
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_disp integer;
begin
  if v_eu is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  perform public._cartinha_exigir_livre();
  if not public._amizade_eh_adolescente(v_eu) then return 'sem_amizade'; end if;
  if p_tipo is null or p_tipo not in ('PARABENS', 'ORGULHO', 'FORCA', 'VALEU', 'ABRACO') then return 'tipo_invalido'; end if;

  select * into a from public.amizades
   where id = p_amizade_id and status = 'aceita' and v_eu in (solicitante_id, destinatario_id);
  if not found then return 'sem_amizade'; end if;
  v_outro := case when a.solicitante_id = v_eu then a.destinatario_id else a.solicitante_id end;
  if public._social_bloqueado(v_eu, v_outro) then return 'sem_amizade'; end if;
  if not public._juntos_hoje(v_eu, v_outro) then return 'nao_juntos'; end if;

  if exists (select 1 from public.cartinhas where remetente_id = v_eu and destinatario_id = v_outro and presente and dia = v_hoje) then
    return 'ja_presenteou';
  end if;

  select (count(*) filter (where destinatario_id = v_eu))
         - 1 - (count(*) filter (where remetente_id = v_eu and presente))
    into v_disp
    from public.cartinhas
   where tipo = p_tipo and (destinatario_id = v_eu or (remetente_id = v_eu and presente));
  if coalesce(v_disp, 0) < 1 then return 'sem_repetida'; end if;

  insert into public.cartinhas (amizade_id, remetente_id, destinatario_id, tipo, presente)
  values (a.id, v_eu, v_outro, p_tipo, true);
  return 'enviada';
end;
$$;

revoke all on function public._juntos_hoje(uuid, uuid) from public, anon, authenticated;
revoke all on function public.cartinha_juntos_hoje() from public, anon;
revoke all on function public.cartinha_repetidas() from public, anon;
revoke all on function public.cartinha_presentear(uuid, text) from public, anon;
grant execute on function public.cartinha_juntos_hoje() to authenticated;
grant execute on function public.cartinha_repetidas() to authenticated;
grant execute on function public.cartinha_presentear(uuid, text) to authenticated;

commit;
