-- migration_painel_dashboard.sql  (Etapa 1 — dashboards Admin/Nutricionista)
--
-- Por que existe: o RLS das tabelas de uso (registros_*, progresso_licao,
-- missoes_diarias...) é por dono (auth.uid()). Admin/nutricionista não leem
-- linhas de adolescentes — e não devem. Esta função devolve SÓ AGREGADOS, e
-- só para ADMINISTRADOR/NUTRICIONISTA (checado no banco, não na interface).
--
-- Sem tabela nova. Rode no SQL Editor (como postgres).

begin;

-- Papel do usuário logado (texto, para não depender do nome do enum).
create or replace function public.papel_atual()
returns text
language sql stable security definer set search_path = public, pg_temp
as $$ select p.papel::text from public.profiles p where p.id = auth.uid() $$;

revoke all on function public.papel_atual() from public, anon;
grant execute on function public.papel_atual() to authenticated;

create or replace function public.painel_dashboard(p_dias integer default 30)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_papel text := public.papel_atual();
  v_dias  integer := greatest(1, least(coalesce(p_dias, 30), 365));
  v_hoje  date := (now() at time zone 'America/Sao_Paulo')::date;
  v_ini   date;
  v_kpis jsonb; v_serie_uso jsonb; v_recursos jsonb; v_serie_desafios jsonb;
  v_trilhas jsonb; v_recentes jsonb; v_atividades jsonb;
begin
  if v_papel is null or v_papel not in ('ADMINISTRADOR', 'NUTRICIONISTA') then
    raise exception 'acesso negado' using errcode = '42501';
  end if;
  v_ini := v_hoje - (v_dias - 1);

  -- KPIs -------------------------------------------------------------------
  -- "publicado" = trilhas com status aprovada/publicada + receitas (receitas
  -- ainda não têm fluxo de aprovação; passa a valer na Etapa 2).
  select jsonb_build_object(
    'adolescentes',  (select count(*) from public.profiles where papel::text = 'ADOLESCENTE'),
    'nutricionistas',(select count(*) from public.profiles where papel::text = 'NUTRICIONISTA'),
    'novos',         (select count(*) from public.profiles
                       where papel::text = 'ADOLESCENTE'
                         and (created_at at time zone 'America/Sao_Paulo')::date >= v_ini),
    'ativos',        (select count(distinct a.u) from (
                         select rd.user_id as u from public.registros_diarios rd
                          where rd.data between v_ini and v_hoje
                         union
                         select pl.usuario_id from public.progresso_licao pl
                          where (pl.concluida_em at time zone 'America/Sao_Paulo')::date between v_ini and v_hoje
                       ) a),
    'trilhas_ativas',(select count(*) from public.trilhas where status::text in ('aprovada', 'publicada')),
    -- fluxo de aprovação (Etapa 2): exige migration_fluxo_conteudo.sql
    'conteudos_publicados',
                     (select count(*) from public.conteudo_fluxo where status = 'PUBLICADO'),
    'conteudos_aguardando',
                     (select count(*) from public.conteudo_fluxo where status = 'AGUARDANDO_APROVACAO'),
    'desafios_ativos',
                     (select count(*) from public.missoes_catalogo where ativa)
                     + (select count(*) from public.missoes_periodicas_catalogo where ativa)
  ) into v_kpis;

  -- Uso por dia: usuários ativos + registros (alimentação/água/atividade) ----
  with dias as (
    select generate_series(v_ini::timestamp, v_hoje::timestamp, interval '1 day')::date as dia
  ), ativ as (
    select rd.data as dia, rd.user_id as u from public.registros_diarios rd
     where rd.data between v_ini and v_hoje
    union
    select (pl.concluida_em at time zone 'America/Sao_Paulo')::date, pl.usuario_id from public.progresso_licao pl
     where (pl.concluida_em at time zone 'America/Sao_Paulo')::date between v_ini and v_hoje
  ), uu as (
    select dia, count(distinct u) as n from ativ group by dia
  ), regs as (
    select rd.data as dia, count(*) as n
      from public.registros_diarios rd
      join (
        select f.registro_diario_id as rid from public.refeicoes f
         where f.registro_diario_id is not null and f.realizada
        union all select a.registro_diario_id from public.registros_agua a
        union all select t.registro_diario_id from public.registros_atividade_fisica t
      ) x on x.rid = rd.id
     where rd.data between v_ini and v_hoje
     group by rd.data
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'dia', to_char(d.dia, 'YYYY-MM-DD'),
           'usuarios', coalesce(uu.n, 0),
           'registros', coalesce(regs.n, 0)) order by d.dia), '[]'::jsonb)
    into v_serie_uso
    from dias d left join uu on uu.dia = d.dia left join regs on regs.dia = d.dia;

  -- Recursos mais utilizados no período --------------------------------------
  select coalesce(jsonb_agg(jsonb_build_object('recurso', r.recurso, 'total', r.total) order by r.total desc), '[]'::jsonb)
    into v_recursos
    from (
      select 'Alimentação'::text as recurso, count(*) as total
        from public.refeicoes f join public.registros_diarios rd on rd.id = f.registro_diario_id
       where f.realizada and rd.data between v_ini and v_hoje
      union all
      select 'Água', count(*)
        from public.registros_agua a join public.registros_diarios rd on rd.id = a.registro_diario_id
       where rd.data between v_ini and v_hoje
      union all
      select 'Atividade física', count(*)
        from public.registros_atividade_fisica t join public.registros_diarios rd on rd.id = t.registro_diario_id
       where rd.data between v_ini and v_hoje
      union all
      select 'Lições da trilha', count(*) from public.progresso_licao pl
       where (pl.concluida_em at time zone 'America/Sao_Paulo')::date between v_ini and v_hoje
      union all
      select 'Desafios concluídos', count(*) from public.missoes_diarias md
       where md.xp_concedido and md.data between v_ini and v_hoje
      union all
      select 'Amizades aceitas', count(*) from public.amizades am
       where am.status = 'aceita'
         and (am.respondido_em at time zone 'America/Sao_Paulo')::date between v_ini and v_hoje
    ) r;

  -- Desafios por dia: atribuídos (iniciados) x concluídos (xp concedido) -----
  with dias as (
    select generate_series(v_ini::timestamp, v_hoje::timestamp, interval '1 day')::date as dia
  ), md as (
    select m.data as dia, count(*) as atrib, count(*) filter (where m.xp_concedido) as concl
      from public.missoes_diarias m
     where m.data between v_ini and v_hoje
     group by m.data
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'dia', to_char(d.dia, 'YYYY-MM-DD'),
           'iniciados', coalesce(md.atrib, 0),
           'concluidos', coalesce(md.concl, 0)) order by d.dia), '[]'::jsonb)
    into v_serie_desafios
    from dias d left join md on md.dia = d.dia;

  -- Trilhas: iniciadas (>=1 lição feita) x concluídas (todas as lições) -------
  with lt as (
    select m.trilha_id, l.id as licao_id
      from public.licoes l join public.modulos_trilha m on m.id = l.modulo_id
  ), tot as (
    select trilha_id, count(*) as n from lt group by trilha_id
  ), prog as (
    select lt.trilha_id, pl.usuario_id, count(distinct pl.licao_id) as feitas
      from public.progresso_licao pl join lt on lt.licao_id = pl.licao_id
     group by lt.trilha_id, pl.usuario_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'titulo', x.titulo, 'iniciadas', x.iniciadas, 'concluidas', x.concluidas) order by x.ordem), '[]'::jsonb)
    into v_trilhas
    from (
      select t.titulo, t.ordem,
             count(p.usuario_id) as iniciadas,
             count(*) filter (where p.feitas >= tot.n) as concluidas
        from public.trilhas t
        join tot on tot.trilha_id = t.id
        left join prog p on p.trilha_id = t.id
       where t.status::text in ('aprovada', 'publicada')
       group by t.id, t.titulo, t.ordem
    ) x;

  -- Registros recentes (só código do participante, sem nome) ------------------
  select coalesce(jsonb_agg(jsonb_build_object('tipo', x.tipo, 'codigo', x.codigo, 'quando', x.quando) order by x.quando desc), '[]'::jsonb)
    into v_recentes
    from (
      select * from (
        select 'alimentacao'::text as tipo, p.codigo_participante as codigo,
               (rd.data + coalesce(f.horario_registro, time '00:00')) as quando
          from public.refeicoes f
          join public.registros_diarios rd on rd.id = f.registro_diario_id
          join public.profiles p on p.id = rd.user_id
         where f.realizada
        union all
        select 'agua', p.codigo_participante, (rd.data + a.horario_registro)
          from public.registros_agua a
          join public.registros_diarios rd on rd.id = a.registro_diario_id
          join public.profiles p on p.id = rd.user_id
        union all
        select 'atividade', p.codigo_participante, (rd.data + t.horario_registro)
          from public.registros_atividade_fisica t
          join public.registros_diarios rd on rd.id = t.registro_diario_id
          join public.profiles p on p.id = rd.user_id
      ) u
      order by u.quando desc
      limit 10
    ) x;

  -- Atividades recentes (novos cadastros + revisões de trilha) ----------------
  select coalesce(jsonb_agg(jsonb_build_object('tipo', x.tipo, 'titulo', x.titulo, 'quando', x.quando) order by x.quando desc), '[]'::jsonb)
    into v_atividades
    from (
      select * from (
        select 'cadastro'::text as tipo,
               ('Novo participante ' || coalesce(p.codigo_participante, '')) as titulo,
               p.created_at as quando
          from public.profiles p where p.papel::text = 'ADOLESCENTE'
        union all
        select 'revisao', ('Trilha "' || t.titulo || '" ' || lower(r.decisao)), r.criado_em
          from public.trilha_revisoes r join public.trilhas t on t.id = r.trilha_id
      ) u
      order by u.quando desc
      limit 10
    ) x;

  return jsonb_build_object(
    'periodo_dias', v_dias,
    'inicio', to_char(v_ini, 'YYYY-MM-DD'),
    'kpis', v_kpis,
    'serie_uso', v_serie_uso,
    'recursos', v_recursos,
    'serie_desafios', v_serie_desafios,
    'trilhas', v_trilhas,
    'recentes', v_recentes,
    'atividades', v_atividades
  );
end;
$$;

revoke all on function public.painel_dashboard(integer) from public, anon;
grant execute on function public.painel_dashboard(integer) to authenticated;

commit;
