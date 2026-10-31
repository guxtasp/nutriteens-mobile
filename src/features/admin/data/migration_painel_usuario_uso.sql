-- migration_painel_usuario_uso.sql — P4: Admin/Usuários com uso e melhoria de hábito (sem dado de saúde).
-- Idempotente. Roda DEPOIS de migration_painel_gestao.sql e migration_analytics_eventos.sql.
--
-- painel_usuario_uso(p_id, p_semanas): SÓ ADMINISTRADOR, só de ADOLESCENTE. Série semanal de USO
-- (dias com registro, dias com atividade no app, lições concluídas) e UMA métrica de hábito:
-- % de itens ultraprocessados na semana. Esse % só sai com 5 ou mais itens registrados na semana
-- (senão null) e nenhum alimento, peso, altura, EBIA ou recordatório é devolvido. O Admin vê se o
-- app está funcionando para a pessoa (usa, volta, melhora), sem ver o que ela comeu.
begin;

create or replace function public.painel_usuario_uso(p_id uuid, p_semanas integer default 12)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_sem  integer := greatest(1, least(coalesce(p_semanas, 12), 26));
  v_ini0 date;
  v_semanas jsonb;
begin
  if public.papel_atual() is distinct from 'ADMINISTRADOR' then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_id and papel::text = 'ADOLESCENTE') then
    raise exception 'Participante não encontrado.' using errcode = 'P0002';
  end if;

  v_ini0 := date_trunc('week', v_hoje)::date - 7 * (v_sem - 1);

  with sem as (
    select (v_ini0 + 7 * g)::date as ini, (v_ini0 + 7 * g + 6)::date as fim from generate_series(0, v_sem - 1) g
  ), dia as (
    select rd.data,
           (exists (select 1 from public.registros_agua w where w.registro_diario_id = rd.id)
            or exists (select 1 from public.registros_atividade_fisica f where f.registro_diario_id = rd.id)
            or exists (select 1 from public.refeicoes m where m.registro_diario_id = rd.id and m.realizada)) as tem
      from public.registros_diarios rd
     where rd.user_id = p_id and rd.data between v_ini0 and v_hoje
  ), itens as (
    select rd.data, al.classificacao_nova::text as nova
      from public.registros_diarios rd
      join public.refeicoes m on m.registro_diario_id = rd.id and m.realizada
      join public.refeicao_alimentos ra on ra.refeicao_id = m.id
      join public.alimentos al on al.id = ra.alimento_id
     where rd.user_id = p_id and rd.data between v_ini0 and v_hoje
  ), acesso as (
    select distinct (e.criado_em at time zone 'America/Sao_Paulo')::date as data
      from public.eventos_app e
     where e.user_id = p_id and e.criado_em >= v_ini0::timestamptz
  ), licoes as (
    select (l.concluida_em at time zone 'America/Sao_Paulo')::date as data
      from public.progresso_licao l
     where l.usuario_id = p_id and l.concluida_em >= v_ini0::timestamptz
  )
  select jsonb_agg(jsonb_build_object(
           'inicio', s.ini,
           'dias_com_registro', (select count(*) from dia d where d.data between s.ini and s.fim and d.tem),
           'dias_no_app',       (select count(*) from acesso a where a.data between s.ini and s.fim),
           'licoes',            (select count(*) from licoes l where l.data between s.ini and s.fim),
           'pct_ultra',         (select case when count(*) >= 5
                                          then round(100.0 * count(*) filter (where i.nova = 'ULTRAPROCESSADO') / count(*), 1) end
                                   from itens i where i.data between s.ini and s.fim)
         ) order by s.ini)
    into v_semanas from sem s;

  return jsonb_build_object('semanas', coalesce(v_semanas, '[]'::jsonb));
end;
$$;
revoke all on function public.painel_usuario_uso(uuid, integer) from public, anon;
grant execute on function public.painel_usuario_uso(uuid, integer) to authenticated;

commit;
