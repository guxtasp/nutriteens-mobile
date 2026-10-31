-- migration_painel_evolucao.sql — P4: evolução do participante (Nutricionista) e eficácia do app (Analytics agregado).
-- Idempotente. Rodar DEPOIS de migration_painel_mvp_final.sql e migration_analytics_eventos.sql
-- (usa papel_atual(), registros_diarios/agua/atividade/refeicoes, avaliacoes_ebia, recordatorios_alimentares, eventos_app).
--
--  * painel_participante_evolucao(p_id, p_semanas): SÓ NUTRICIONISTA (como o detalhe). Série SEMANAL do participante:
--    dias com registro, refeições, água média, atividade, % de itens ultraprocessados, mais todas as EBIA e
--    recordatórios concluídos (para comparar as reavaliações).
--  * analytics_eficacia(p_inicio, p_fim): ADMIN e NUTRICIONISTA, SÓ AGREGADOS (nenhum id sai). Retenção D1/D7/D30 por
--    coorte de entrada e hábitos médios por semana. Semana com menos de 5 participantes ativos vira "sem dados"
--    (null), para não expor o hábito de uma pessoa só.
begin;

-- 1. Evolução de um participante -----------------------------------------------------------------
create or replace function public.painel_participante_evolucao(p_id uuid, p_semanas integer default 12)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_sem  integer := greatest(1, least(coalesce(p_semanas, 12), 26));
  v_ini0 date;
  v_semanas jsonb;
  v_ebia jsonb;
  v_recs jsonb;
begin
  if public.papel_atual() is distinct from 'NUTRICIONISTA' then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_id and papel::text = 'ADOLESCENTE') then
    raise exception 'Participante não encontrado.' using errcode = 'P0002';
  end if;

  v_ini0 := date_trunc('week', v_hoje)::date - 7 * (v_sem - 1);

  with sem as (
    select (v_ini0 + 7 * g)::date as ini, (v_ini0 + 7 * g + 6)::date as fim from generate_series(0, v_sem - 1) g
  ), dia as (
    select rd.id, rd.data,
           coalesce((select sum(w.quantidade_ml) from public.registros_agua w where w.registro_diario_id = rd.id), 0)            as agua,
           coalesce((select sum(f.duracao_minutos) from public.registros_atividade_fisica f where f.registro_diario_id = rd.id), 0) as ativ,
           (select count(*) from public.refeicoes m where m.registro_diario_id = rd.id and m.realizada)                           as refs
      from public.registros_diarios rd
     where rd.user_id = p_id and rd.data between v_ini0 and v_hoje
  ), itens as (
    select rd.data, al.classificacao_nova::text as nova
      from public.registros_diarios rd
      join public.refeicoes m on m.registro_diario_id = rd.id and m.realizada
      join public.refeicao_alimentos ra on ra.refeicao_id = m.id
      join public.alimentos al on al.id = ra.alimento_id
     where rd.user_id = p_id and rd.data between v_ini0 and v_hoje
  )
  select jsonb_agg(jsonb_build_object(
           'inicio', s.ini,
           'dias_com_registro', (select count(*) from dia d where d.data between s.ini and s.fim and (d.agua > 0 or d.ativ > 0 or d.refs > 0)),
           'refeicoes',         (select coalesce(sum(d.refs), 0) from dia d where d.data between s.ini and s.fim),
           'agua_media_ml',     (select coalesce(round(avg(d.agua)), 0) from dia d where d.data between s.ini and s.fim and d.agua > 0),
           'atividade_min',     (select coalesce(sum(d.ativ), 0) from dia d where d.data between s.ini and s.fim),
           'itens',             (select count(*) from itens i where i.data between s.ini and s.fim),
           'itens_ultra',       (select count(*) from itens i where i.data between s.ini and s.fim and i.nova = 'ULTRAPROCESSADO'),
           'itens_in_natura',   (select count(*) from itens i where i.data between s.ini and s.fim and i.nova = 'IN_NATURA')
         ) order by s.ini)
    into v_semanas from sem s;

  select coalesce(jsonb_agg(jsonb_build_object(
           'data', a.data_realizacao, 'pontuacao', e.pontuacao_total, 'classificacao', e.classificacao::text
         ) order by a.data_realizacao), '[]'::jsonb)
    into v_ebia
    from public.avaliacoes_ebia e
    join public.avaliacoes_nutricionais a on a.id = e.avaliacao_nutricional_id
   where a.user_id = p_id and coalesce(e.concluido, false);

  select coalesce(jsonb_agg(jsonb_build_object(
           'data', r.data_referencia, 'saudavel', r.escore_saudavel, 'nao_saudavel', r.escore_nao_saudavel
         ) order by r.data_referencia), '[]'::jsonb)
    into v_recs
    from public.recordatorios_alimentares r
    join public.avaliacoes_nutricionais a on a.id = r.avaliacao_nutricional_id
   where a.user_id = p_id and r.concluido;

  return jsonb_build_object('semanas', coalesce(v_semanas, '[]'::jsonb), 'ebia', v_ebia, 'recordatorios', v_recs);
end;
$$;
revoke all on function public.painel_participante_evolucao(uuid, integer) from public, anon;
grant execute on function public.painel_participante_evolucao(uuid, integer) to authenticated;

-- 2. Eficácia do app (agregado) ---------------------------------------------------------------------
create or replace function public.analytics_eficacia(p_inicio date, p_fim date)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_tz   text := 'America/Sao_Paulo';
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_min  constant integer := 5;     -- mínimo de pessoas para mostrar uma média
  v_ret  jsonb;
  v_hab  jsonb;
  v_sem7 integer;
begin
  if coalesce(public.papel_atual()::text, '') not in ('ADMINISTRADOR', 'NUTRICIONISTA') then
    raise exception 'acesso negado' using errcode = '42501';
  end if;
  if p_inicio is null or p_fim is null or p_fim < p_inicio or (p_fim - p_inicio) > 365 then
    raise exception 'período inválido' using errcode = '22023';
  end if;

  -- retenção: coorte = adolescentes cujo 1º evento caiu no período; "voltou no dia N" = teve evento exatamente no dia N depois do 1º.
  with primeiro as (
    select e.user_id, min((e.criado_em at time zone v_tz)::date) as d0
      from public.eventos_app e
      join public.profiles p on p.id = e.user_id and p.papel::text = 'ADOLESCENTE'
     group by e.user_id
  ), coorte as (
    select * from primeiro where d0 between p_inicio and p_fim
  ), ativos as (
    select distinct e.user_id, (e.criado_em at time zone v_tz)::date as d
      from public.eventos_app e join coorte c on c.user_id = e.user_id
  ), n as (select unnest(array[1, 7, 30]) as dias)
  select jsonb_agg(jsonb_build_object(
           'dia', n.dias,
           'elegiveis', (select count(*) from coorte c where c.d0 + n.dias <= v_hoje),
           'retidos',   (select count(*) from coorte c where c.d0 + n.dias <= v_hoje
                            and exists (select 1 from ativos a where a.user_id = c.user_id and a.d = c.d0 + n.dias))
         ) order by n.dias)
    into v_ret from n;

  -- hábitos por semana (todas as pessoas com registro na semana)
  with sem as (
    select (date_trunc('week', p_inicio)::date + 7 * g)::date as ini
      from generate_series(0, ((date_trunc('week', p_fim)::date - date_trunc('week', p_inicio)::date) / 7)) g
  ), dia as (
    select rd.user_id, rd.data,
           (exists (select 1 from public.registros_agua w where w.registro_diario_id = rd.id)
            or exists (select 1 from public.registros_atividade_fisica f where f.registro_diario_id = rd.id)
            or exists (select 1 from public.refeicoes m where m.registro_diario_id = rd.id and m.realizada)) as tem
      from public.registros_diarios rd
      join public.profiles p on p.id = rd.user_id and p.papel::text = 'ADOLESCENTE'
     where rd.data between date_trunc('week', p_inicio)::date and p_fim
  ), itens as (
    select rd.user_id, rd.data, al.classificacao_nova::text as nova
      from public.registros_diarios rd
      join public.profiles p on p.id = rd.user_id and p.papel::text = 'ADOLESCENTE'
      join public.refeicoes m on m.registro_diario_id = rd.id and m.realizada
      join public.refeicao_alimentos ra on ra.refeicao_id = m.id
      join public.alimentos al on al.id = ra.alimento_id
     where rd.data between date_trunc('week', p_inicio)::date and p_fim
  ), por_sem as (
    select s.ini,
           (select count(distinct d.user_id) from dia d where d.tem and d.data between s.ini and s.ini + 6) as pessoas,
           (select count(*) from dia d where d.tem and d.data between s.ini and s.ini + 6)                  as dias_reg,
           (select count(*) from itens i where i.data between s.ini and s.ini + 6)                           as itens,
           (select count(*) from itens i where i.data between s.ini and s.ini + 6 and i.nova = 'ULTRAPROCESSADO') as ultra,
           (select count(*) from itens i where i.data between s.ini and s.ini + 6 and i.nova = 'IN_NATURA')       as natura
      from sem s
  )
  select jsonb_agg(jsonb_build_object(
           'inicio', ini,
           'pessoas', pessoas,
           'dias_com_registro_medio', case when pessoas >= v_min then round(dias_reg::numeric / pessoas, 1) end,
           'pct_ultraprocessados',    case when pessoas >= v_min and itens > 0 then round(100.0 * ultra / itens) end,
           'pct_in_natura',           case when pessoas >= v_min and itens > 0 then round(100.0 * natura / itens) end
         ) order by ini)
    into v_hab from por_sem;

  -- quem já registrou alguma vez mas está há 7+ dias sem registro (só o número)
  select count(*) into v_sem7 from (
    select rd.user_id from public.registros_diarios rd
      join public.profiles p on p.id = rd.user_id and p.papel::text = 'ADOLESCENTE'
     group by rd.user_id having max(rd.data) < v_hoje - 6
  ) x;

  return jsonb_build_object('retencao', coalesce(v_ret, '[]'::jsonb), 'habitos', coalesce(v_hab, '[]'::jsonb),
                            'sem_registro_7d', v_sem7, 'minimo_pessoas', v_min);
end;
$$;
revoke all on function public.analytics_eficacia(date, date) from public, anon;
grant execute on function public.analytics_eficacia(date, date) to authenticated;

commit;
