-- migration_analytics_jornada.sql — uso PROGRESSIVO do app: jornada geral (agregada) e individual (só uso).
-- Idempotente. Rodar DEPOIS de migration_painel_dashboard.sql (papel_atual), migration_analytics_eventos.sql
-- (eventos_app) e migration_painel_evolucao.sql. Não cria tabela nem altera constraint: só lê.
--
--  * analytics_jornada(p_inicio, p_fim): ADMIN e NUTRICIONISTA, SÓ AGREGADOS (nenhum id sai do banco).
--      estagios  : por semana, quantos adolescentes estão novos / frequentes (3+ dias ativos) / ocasionais (1-2) /
--                  em pausa (0 dias, mas ativos nas 3 semanas anteriores) / inativos (0 dias e nada nas 3 anteriores).
--      coortes   : retenção por turma de entrada (semana de cadastro) nas semanas 0..7 de conta, em %.
--                  Turma com menos de 5 pessoas vem sem números.
--      adocao    : % de adolescentes que já usaram cada recurso até a 1ª, 2ª, 4ª e 8ª semana de conta
--                  (só conta quem já tem aquela idade de conta; menos de 5 elegíveis = sem número).
--      horarios  : pessoas ativas por dia da semana x faixa de 3 horas no período (célula com menos de 5 = sem número).
--      progresso_trilhas: quantos adolescentes estão em cada faixa de lições concluídas (desde sempre).
--  * painel_participante_jornada(p_id): ADMIN e NUTRICIONISTA, de UM adolescente, SÓ DADOS DE USO (dias ativos,
--    recursos usados, marcos e horário). Nada de alimentação, medidas, EBIA ou recordatório: por isso pode ir
--    também para a Administração, como o painel_usuario_uso.
--
-- "Ativo num dia" = teve algum evento do app (eventos_app) OU um registro de água/atividade/refeição naquele dia.
begin;

-- volatile (não stable): usa tabelas temporárias para não recalcular os dias ativos em cada bloco
create or replace function public.analytics_jornada(p_inicio date, p_fim date)
returns jsonb
language plpgsql volatile security definer set search_path = public, pg_temp
as $$
declare
  v_tz    constant text := 'America/Sao_Paulo';
  v_hoje  date := (now() at time zone 'America/Sao_Paulo')::date;
  v_min   constant integer := 5;
  v_fim   date;
  v_ini   date;
  v_nsem  integer;
  v_est   jsonb;
  v_coo   jsonb;
  v_ado   jsonb;
  v_hor   jsonb;
  v_tri   jsonb;
  v_pessoas_periodo integer;
begin
  if coalesce(public.papel_atual()::text, '') not in ('ADMINISTRADOR', 'NUTRICIONISTA') then
    raise exception 'acesso negado' using errcode = '42501';
  end if;
  if p_inicio is null or p_fim is null or p_fim < p_inicio or (p_fim - p_inicio) > 365 then
    raise exception 'período inválido' using errcode = '22023';
  end if;

  v_fim  := least(p_fim, v_hoje);
  -- no máximo 26 semanas (as mais recentes do período)
  v_nsem := least(26, ((date_trunc('week', v_fim)::date - date_trunc('week', p_inicio)::date) / 7) + 1);
  v_ini  := date_trunc('week', v_fim)::date - 7 * (v_nsem - 1);

  create temp table if not exists _jor_adol (id uuid primary key, d0 date) on commit drop;
  create temp table if not exists _jor_ativ (user_id uuid, d date) on commit drop;
  create temp table if not exists _jor_uso (user_id uuid, recurso text, d date) on commit drop;
  truncate _jor_adol, _jor_ativ, _jor_uso;

  insert into _jor_adol
  select p.id, (p.created_at at time zone v_tz)::date from public.profiles p where p.papel::text = 'ADOLESCENTE';

  insert into _jor_ativ
  select distinct x.user_id, x.d from (
    select e.user_id, (e.criado_em at time zone v_tz)::date as d
      from public.eventos_app e join _jor_adol a on a.id = e.user_id
    union
    select rd.user_id, rd.data
      from public.registros_diarios rd join _jor_adol a on a.id = rd.user_id
     where exists (select 1 from public.registros_agua w where w.registro_diario_id = rd.id)
        or exists (select 1 from public.registros_atividade_fisica f where f.registro_diario_id = rd.id)
        or exists (select 1 from public.refeicoes m where m.registro_diario_id = rd.id and m.realizada)
  ) x;
  create index if not exists _jor_ativ_idx on _jor_ativ (user_id, d);

  -- recursos (primeiro uso de cada um, por pessoa)
  insert into _jor_uso
  select e.user_id,
         case
           when e.nome in ('alimentacao_registrada', 'agua_registrada', 'atividade_registrada') then 'registro'
           when e.nome in ('licao_concluida', 'trilha_iniciada', 'trilha_concluida') then 'trilha'
           when e.nome in ('desafio_iniciado', 'desafio_concluido') then 'desafio'
           when e.nome in ('receita_visualizada', 'receita_concluida') then 'receita'
           when e.nome in ('amizade_solicitada', 'amizade_aceita', 'reacao_enviada', 'feed_visualizado',
                           'desafio_grupo_criado', 'desafio_grupo_aceito') then 'social'
           when e.nome = 'scanner_lido' then 'scanner'
           when e.nome in ('troca_aceita', 'troca_recusada') then 'trocas'
         end,
         (e.criado_em at time zone v_tz)::date
    from public.eventos_app e join _jor_adol a on a.id = e.user_id
   where e.nome in ('alimentacao_registrada', 'agua_registrada', 'atividade_registrada', 'licao_concluida', 'trilha_iniciada',
                    'trilha_concluida', 'desafio_iniciado', 'desafio_concluido', 'receita_visualizada', 'receita_concluida',
                    'amizade_solicitada', 'amizade_aceita', 'reacao_enviada', 'feed_visualizado', 'desafio_grupo_criado',
                    'desafio_grupo_aceito', 'scanner_lido', 'troca_aceita', 'troca_recusada');
  -- registros e lições anteriores aos eventos de analytics também contam
  insert into _jor_uso
  select rd.user_id, 'registro', rd.data
    from public.registros_diarios rd join _jor_adol a on a.id = rd.user_id
   where exists (select 1 from public.registros_agua w where w.registro_diario_id = rd.id)
      or exists (select 1 from public.registros_atividade_fisica f where f.registro_diario_id = rd.id)
      or exists (select 1 from public.refeicoes m where m.registro_diario_id = rd.id and m.realizada);
  insert into _jor_uso
  select pl.usuario_id, 'trilha', (pl.concluida_em at time zone v_tz)::date
    from public.progresso_licao pl join _jor_adol a on a.id = pl.usuario_id
   where pl.concluida_em is not null;

  -- 1. estágios por semana ----------------------------------------------------------------------
  with sem as (
    select (v_ini + 7 * g)::date as ini from generate_series(0, v_nsem - 1) g
  ), por as (
    select s.ini, a.d0,
           (select count(*) from _jor_ativ x where x.user_id = a.id and x.d between s.ini and s.ini + 6) as dias,
           exists (select 1 from _jor_ativ x where x.user_id = a.id and x.d between s.ini - 21 and s.ini - 1) as antes
      from sem s join _jor_adol a on a.d0 <= s.ini + 6
  ), agg as (
    select ini,
           count(*) filter (where d0 >= ini)                              as novos,
           count(*) filter (where d0 < ini and dias >= 3)                 as frequentes,
           count(*) filter (where d0 < ini and dias between 1 and 2)      as ocasionais,
           count(*) filter (where d0 < ini and dias = 0 and antes)        as pausa,
           count(*) filter (where d0 < ini and dias = 0 and not antes)    as inativos
      from por group by ini
  )
  select jsonb_agg(jsonb_build_object(
           'inicio', s.ini,
           'novos', coalesce(g.novos, 0), 'frequentes', coalesce(g.frequentes, 0), 'ocasionais', coalesce(g.ocasionais, 0),
           'pausa', coalesce(g.pausa, 0), 'inativos', coalesce(g.inativos, 0)
         ) order by s.ini)
    into v_est
    from sem s left join agg g on g.ini = s.ini;

  -- 2. coortes (até 12 turmas mais recentes dentro do período) ------------------------------------
  with coorte as (
    select a.id, date_trunc('week', a.d0)::date as cw from _jor_adol a
     where date_trunc('week', a.d0)::date between greatest(v_ini, date_trunc('week', v_fim)::date - 77) and date_trunc('week', v_fim)::date
  ), tam as (
    select cw, count(*) as n from coorte group by cw
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'semana', t.cw,
           'tamanho', t.n,
           'retencao', (
             select jsonb_agg(
                      case when t.cw + 7 * k > v_hoje or t.n < v_min then null
                           else round(100.0 * (select count(*) from coorte c
                                                where c.cw = t.cw
                                                  and exists (select 1 from _jor_ativ x where x.user_id = c.id
                                                               and x.d between t.cw + 7 * k and t.cw + 7 * k + 6)) / t.n)
                      end order by k)
               from generate_series(0, 7) k)
         ) order by t.cw), '[]'::jsonb)
    into v_coo
    from tam t;

  -- 3. adoção de recursos por idade da conta ------------------------------------------------------
  with primeiro as (
    select user_id, recurso, min(d) as d from _jor_uso where recurso is not null group by user_id, recurso
  ), rec as (
    select unnest(array['registro', 'trilha', 'desafio', 'receita', 'social', 'scanner', 'trocas']) as recurso
  ), marco as (
    select unnest(array[1, 2, 4, 8]) as sem
  )
  select jsonb_agg(jsonb_build_object(
           'recurso', r.recurso,
           'pontos', (
             select jsonb_agg(jsonb_build_object(
                      'semana', m.sem,
                      'elegiveis', el.n,
                      'pct', case when el.n >= v_min then round(100.0 * (
                                select count(*) from _jor_adol a
                                  join primeiro p on p.user_id = a.id and p.recurso = r.recurso and p.d < a.d0 + 7 * m.sem
                                 where a.d0 + 7 * m.sem <= v_hoje) / el.n) end
                    ) order by m.sem)
               from marco m
               cross join lateral (select count(*) as n from _jor_adol a where a.d0 + 7 * m.sem <= v_hoje) el)
         ))
    into v_ado
    from rec r;

  -- 4. horários (pessoas ativas por dia da semana x faixa de 3h) ----------------------------------
  select count(distinct e.user_id) into v_pessoas_periodo
    from public.eventos_app e join _jor_adol a on a.id = e.user_id
   where (e.criado_em at time zone v_tz)::date between p_inicio and v_fim;

  select coalesce(jsonb_agg(jsonb_build_object(
           'dia', dia, 'faixa', faixa,
           'pessoas', case when pessoas >= v_min then pessoas end,
           'eventos', case when pessoas >= v_min then eventos end
         )), '[]'::jsonb)
    into v_hor
    from (
      select (extract(isodow from e.criado_em at time zone v_tz)::int - 1) as dia,
             (extract(hour from e.criado_em at time zone v_tz)::int / 3)   as faixa,
             count(distinct e.user_id) as pessoas,
             count(*) as eventos
        from public.eventos_app e join _jor_adol a on a.id = e.user_id
       where (e.criado_em at time zone v_tz)::date between p_inicio and v_fim
       group by 1, 2
    ) h;

  -- 5. progresso nas trilhas (lições concluídas por pessoa, desde sempre) --------------------------
  with c as (
    select a.id, (select count(*) from public.progresso_licao pl where pl.usuario_id = a.id and pl.concluida_em is not null) as n
      from _jor_adol a
  ), faixas(ordem, faixa, minimo, maximo) as (
    values (1, '0', 0, 0), (2, '1 a 2', 1, 2), (3, '3 a 5', 3, 5), (4, '6 a 10', 6, 10), (5, '11 ou mais', 11, 1000000)
  )
  select jsonb_agg(jsonb_build_object('faixa', f.faixa, 'pessoas', (select count(*) from c where c.n between f.minimo and f.maximo)) order by f.ordem)
    into v_tri
    from faixas f;

  return jsonb_build_object(
    'semanas', v_nsem,
    'estagios', coalesce(v_est, '[]'::jsonb),
    'coortes', v_coo,
    'adocao', coalesce(v_ado, '[]'::jsonb),
    'horarios', v_hor,
    'pessoas_periodo', coalesce(v_pessoas_periodo, 0),
    'progresso_trilhas', coalesce(v_tri, '[]'::jsonb),
    'total_adolescentes', (select count(*) from _jor_adol),
    'minimo_pessoas', v_min
  );
end;
$$;
revoke all on function public.analytics_jornada(date, date) from public, anon;
grant execute on function public.analytics_jornada(date, date) to authenticated;


create or replace function public.painel_participante_jornada(p_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_tz   constant text := 'America/Sao_Paulo';
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_ini  date := (now() at time zone 'America/Sao_Paulo')::date - 83;   -- 12 semanas
  v_d0   date;
  v_cal  jsonb;
  v_rec  jsonb;
  v_mar  jsonb;
  v_per  jsonb;
begin
  if coalesce(public.papel_atual()::text, '') not in ('ADMINISTRADOR', 'NUTRICIONISTA') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  select (p.created_at at time zone v_tz)::date into v_d0 from public.profiles p where p.id = p_id and p.papel::text = 'ADOLESCENTE';
  if v_d0 is null then
    raise exception 'Participante não encontrado.' using errcode = 'P0002';
  end if;

  -- calendário das últimas 12 semanas: usou o app? registrou? concluiu lição?
  with dias as (
    select (v_ini + g)::date as d from generate_series(0, 83) g
  ), app as (
    select (e.criado_em at time zone v_tz)::date as d, count(*) as n
      from public.eventos_app e where e.user_id = p_id and e.criado_em >= (v_ini::timestamp at time zone v_tz)
     group by 1
  ), reg as (
    select rd.data as d from public.registros_diarios rd
     where rd.user_id = p_id and rd.data >= v_ini
       and (exists (select 1 from public.registros_agua w where w.registro_diario_id = rd.id)
         or exists (select 1 from public.registros_atividade_fisica f where f.registro_diario_id = rd.id)
         or exists (select 1 from public.refeicoes m where m.registro_diario_id = rd.id and m.realizada))
  ), lic as (
    select (pl.concluida_em at time zone v_tz)::date as d, count(*) as n
      from public.progresso_licao pl where pl.usuario_id = p_id and pl.concluida_em >= (v_ini::timestamp at time zone v_tz)
     group by 1
  )
  select jsonb_agg(jsonb_build_object(
           'data', dias.d,
           'acoes', coalesce(app.n, 0),
           'registro', exists (select 1 from reg where reg.d = dias.d),
           'licoes', coalesce(lic.n, 0),
           'antes_do_cadastro', dias.d < v_d0
         ) order by dias.d)
    into v_cal
    from dias left join app on app.d = dias.d left join lic on lic.d = dias.d;

  -- recursos: em quantos dias usou cada um, primeiro e último uso (desde sempre)
  with uso as (
    select case
             when e.nome in ('alimentacao_registrada', 'agua_registrada', 'atividade_registrada') then 'registro'
             when e.nome in ('licao_concluida', 'trilha_iniciada', 'trilha_concluida') then 'trilha'
             when e.nome in ('desafio_iniciado', 'desafio_concluido') then 'desafio'
             when e.nome in ('receita_visualizada', 'receita_concluida') then 'receita'
             when e.nome in ('amizade_solicitada', 'amizade_aceita', 'reacao_enviada', 'feed_visualizado',
                             'desafio_grupo_criado', 'desafio_grupo_aceito') then 'social'
             when e.nome = 'scanner_lido' then 'scanner'
             when e.nome in ('troca_aceita', 'troca_recusada') then 'trocas'
           end as recurso,
           (e.criado_em at time zone v_tz)::date as d
      from public.eventos_app e where e.user_id = p_id
    union all
    select 'registro', rd.data from public.registros_diarios rd
     where rd.user_id = p_id
       and (exists (select 1 from public.registros_agua w where w.registro_diario_id = rd.id)
         or exists (select 1 from public.registros_atividade_fisica f where f.registro_diario_id = rd.id)
         or exists (select 1 from public.refeicoes m where m.registro_diario_id = rd.id and m.realizada))
    union all
    select 'trilha', (pl.concluida_em at time zone v_tz)::date from public.progresso_licao pl
     where pl.usuario_id = p_id and pl.concluida_em is not null
  ), rec as (
    select unnest(array['registro', 'trilha', 'desafio', 'receita', 'social', 'scanner', 'trocas']) as recurso
  )
  select jsonb_agg(jsonb_build_object(
           'recurso', r.recurso,
           'dias', (select count(distinct u.d) from uso u where u.recurso = r.recurso),
           'dias_12_semanas', (select count(distinct u.d) from uso u where u.recurso = r.recurso and u.d >= v_ini),
           'primeiro', (select min(u.d) from uso u where u.recurso = r.recurso),
           'ultimo', (select max(u.d) from uso u where u.recurso = r.recurso)
         ))
    into v_rec
    from rec r;

  -- marcos da jornada (só datas)
  select jsonb_build_array(
    jsonb_build_object('chave', 'cadastro', 'data', v_d0),
    jsonb_build_object('chave', 'onboarding', 'data', (select min((e.criado_em at time zone v_tz)::date) from public.eventos_app e where e.user_id = p_id and e.nome = 'onboarding_concluido')),
    jsonb_build_object('chave', 'triagem', 'data', (select min((e.criado_em at time zone v_tz)::date) from public.eventos_app e where e.user_id = p_id and e.nome = 'triagem_concluida')),
    jsonb_build_object('chave', 'primeiro_registro', 'data', (
      select min(rd.data) from public.registros_diarios rd
       where rd.user_id = p_id
         and (exists (select 1 from public.registros_agua w where w.registro_diario_id = rd.id)
           or exists (select 1 from public.registros_atividade_fisica f where f.registro_diario_id = rd.id)
           or exists (select 1 from public.refeicoes m where m.registro_diario_id = rd.id and m.realizada)))),
    jsonb_build_object('chave', 'primeira_licao', 'data', (select min((pl.concluida_em at time zone v_tz)::date) from public.progresso_licao pl where pl.usuario_id = p_id and pl.concluida_em is not null)),
    jsonb_build_object('chave', 'primeiro_desafio', 'data', (select min((e.criado_em at time zone v_tz)::date) from public.eventos_app e where e.user_id = p_id and e.nome = 'desafio_concluido')),
    jsonb_build_object('chave', 'primeira_trilha', 'data', (select min((e.criado_em at time zone v_tz)::date) from public.eventos_app e where e.user_id = p_id and e.nome = 'trilha_concluida')),
    jsonb_build_object('chave', 'primeira_amizade', 'data', (select min((e.criado_em at time zone v_tz)::date) from public.eventos_app e where e.user_id = p_id and e.nome = 'amizade_aceita'))
  ) into v_mar;

  -- período do dia em que costuma usar (12 semanas)
  select jsonb_build_object(
           'madrugada', count(*) filter (where h between 0 and 5),
           'manha',     count(*) filter (where h between 6 and 11),
           'tarde',     count(*) filter (where h between 12 and 17),
           'noite',     count(*) filter (where h between 18 and 23))
    into v_per
    from (select extract(hour from e.criado_em at time zone v_tz)::int as h
            from public.eventos_app e where e.user_id = p_id and e.criado_em >= (v_ini::timestamp at time zone v_tz)) x;

  return jsonb_build_object('inicio', v_ini, 'cadastro', v_d0, 'calendario', coalesce(v_cal, '[]'::jsonb),
                            'recursos', coalesce(v_rec, '[]'::jsonb), 'marcos', v_mar, 'periodos', v_per);
end;
$$;
revoke all on function public.painel_participante_jornada(uuid) from public, anon;
grant execute on function public.painel_participante_jornada(uuid) to authenticated;

commit;

-- Teste rápido (SQL Editor, logado como admin/nutricionista no app não se aplica aqui; no editor o papel é nulo):
--   select public.analytics_jornada(current_date - 90, current_date);  -- deve dar "acesso negado" fora do app
