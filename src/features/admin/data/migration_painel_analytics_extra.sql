-- migration_painel_analytics_extra.sql — P4: dois widgets novos do Analytics (Admin e Nutricionista), SÓ AGREGADOS.
-- Idempotente. Rodar DEPOIS de migration_painel_evolucao.sql (mesmas tabelas; usa papel_atual()).
--
--  * analytics_habitos_escola(p_inicio, p_fim):
--      habitos: quantas PESSOAS e quantos REGISTROS por hábito no período (refeições, água, atividade física,
--               itens in natura, itens ultraprocessados). Hábito com 1 a 4 pessoas vira null ("poucos dados").
--      por_tipo_escola: pública / privada / filantrópica: cadastrados, ativos no período, % ativos, dias com registro (média).
--      por_escola: pelo nome da instituição (instituicao_ensino). Escola com menos de 5 participantes cadastrados entra
--               no grupo "Outras", e métricas de grupo com menos de 5 pessoas viram null, para não expor ninguém.
--    Nenhum id, nome ou código de pessoa sai da função. Admin e Nutricionista (como analytics_eficacia).
begin;

create or replace function public.analytics_habitos_escola(p_inicio date, p_fim date)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_min    constant integer := 5;   -- mínimo de pessoas para mostrar um número
  v_hab    jsonb;
  v_tipo   jsonb;
  v_escola jsonb;
begin
  if coalesce(public.papel_atual()::text, '') not in ('ADMINISTRADOR', 'NUTRICIONISTA') then
    raise exception 'acesso negado' using errcode = '42501';
  end if;
  if p_inicio is null or p_fim is null or p_fim < p_inicio or (p_fim - p_inicio) > 365 then
    raise exception 'período inválido' using errcode = '22023';
  end if;

  -- 1. hábitos mais registrados -------------------------------------------------------------------
  with dia as (
    select rd.id, rd.user_id
      from public.registros_diarios rd
      join public.profiles p on p.id = rd.user_id and p.papel::text = 'ADOLESCENTE'
     where rd.data between p_inicio and p_fim
  ), ev as (
    select d.user_id, 'REFEICOES'::text as chave
      from dia d join public.refeicoes m on m.registro_diario_id = d.id and m.realizada
    union all
    select d.user_id, 'AGUA'::text
      from dia d join public.registros_agua w on w.registro_diario_id = d.id
    union all
    select d.user_id, 'ATIVIDADE'::text
      from dia d join public.registros_atividade_fisica f on f.registro_diario_id = d.id
    union all
    select d.user_id, 'IN_NATURA'::text
      from dia d
      join public.refeicoes m on m.registro_diario_id = d.id and m.realizada
      join public.refeicao_alimentos ra on ra.refeicao_id = m.id
      join public.alimentos al on al.id = ra.alimento_id and al.classificacao_nova::text = 'IN_NATURA'
    union all
    select d.user_id, 'ULTRAPROCESSADO'::text
      from dia d
      join public.refeicoes m on m.registro_diario_id = d.id and m.realizada
      join public.refeicao_alimentos ra on ra.refeicao_id = m.id
      join public.alimentos al on al.id = ra.alimento_id and al.classificacao_nova::text = 'ULTRAPROCESSADO'
  ), agg as (
    select chave, count(distinct user_id) as pessoas, count(*) as registros from ev group by chave
  ), todas(chave, rotulo, ordem) as (
    values ('REFEICOES', 'Refeições', 1), ('AGUA', 'Água', 2), ('ATIVIDADE', 'Atividade física', 3),
           ('IN_NATURA', 'Alimentos in natura', 4), ('ULTRAPROCESSADO', 'Ultraprocessados', 5)
  )
  select jsonb_agg(jsonb_build_object(
           'chave', t.chave, 'rotulo', t.rotulo,
           'pessoas',   case when coalesce(a.pessoas, 0) = 0 or a.pessoas >= v_min then coalesce(a.pessoas, 0) end,
           'registros', case when coalesce(a.pessoas, 0) = 0 or a.pessoas >= v_min then coalesce(a.registros, 0) end
         ) order by t.ordem)
    into v_hab
    from todas t left join agg a on a.chave = t.chave;

  -- 2. engajamento por tipo de escola e por escola ------------------------------------------------
  with cad as (
    select p.id,
           coalesce(nullif(p.tipo_instituicao::text, ''), 'NAO_INFORMADO') as tipo,
           nullif(btrim(p.instituicao_ensino), '') as escola
      from public.profiles p where p.papel::text = 'ADOLESCENTE'
  ), grupos as (
    select escola, count(*) as n from cad where escola is not null group by escola
  ), cad_rot as (
    select c.id, c.tipo,
           case when c.escola is null then null
                when g.n >= v_min then c.escola
                else 'Outras (escolas com poucos participantes)' end as escola_rot
      from cad c left join grupos g on g.escola = c.escola
  ), dia as (
    select rd.user_id, rd.data,
           (exists (select 1 from public.registros_agua w where w.registro_diario_id = rd.id)
            or exists (select 1 from public.registros_atividade_fisica f where f.registro_diario_id = rd.id)
            or exists (select 1 from public.refeicoes m where m.registro_diario_id = rd.id and m.realizada)) as tem
      from public.registros_diarios rd
      join cad on cad.id = rd.user_id
     where rd.data between p_inicio and p_fim
  ), por_pessoa as (
    select user_id, count(*) filter (where tem) as dias from dia group by user_id
  ), pp as (
    select c.tipo, c.escola_rot, coalesce(x.dias, 0) as dias
      from cad_rot c left join por_pessoa x on x.user_id = c.id
  )
  select
    (select jsonb_agg(jsonb_build_object(
              'tipo', t.tipo, 'cadastrados', t.cadastrados,
              'ativos',     case when t.cadastrados >= v_min then t.ativos end,
              'pct_ativos', case when t.cadastrados >= v_min then round(100.0 * t.ativos / t.cadastrados) end,
              'dias_com_registro_medio', case when t.cadastrados >= v_min and t.ativos >= v_min
                                              then round(t.dias_total::numeric / t.ativos, 1) end
            ) order by t.cadastrados desc)
       from (select tipo, count(*) as cadastrados, count(*) filter (where dias > 0) as ativos, sum(dias) as dias_total
               from pp group by tipo) t),
    (select jsonb_agg(jsonb_build_object(
              'escola', e.escola, 'cadastrados', e.cadastrados,
              'ativos',     case when e.cadastrados >= v_min then e.ativos end,
              'pct_ativos', case when e.cadastrados >= v_min then round(100.0 * e.ativos / e.cadastrados) end,
              'dias_com_registro_medio', case when e.cadastrados >= v_min and e.ativos >= v_min
                                              then round(e.dias_total::numeric / e.ativos, 1) end
            ) order by e.cadastrados desc)
       from (select escola_rot as escola, count(*) as cadastrados, count(*) filter (where dias > 0) as ativos, sum(dias) as dias_total
               from pp where escola_rot is not null group by escola_rot order by count(*) desc limit 15) e)
    into v_tipo, v_escola;

  return jsonb_build_object('habitos', coalesce(v_hab, '[]'::jsonb),
                            'por_tipo_escola', coalesce(v_tipo, '[]'::jsonb),
                            'por_escola', coalesce(v_escola, '[]'::jsonb),
                            'minimo_pessoas', v_min);
end;
$$;
revoke all on function public.analytics_habitos_escola(date, date) from public, anon;
grant execute on function public.analytics_habitos_escola(date, date) to authenticated;

commit;
