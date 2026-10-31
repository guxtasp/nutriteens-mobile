-- migration_painel_lgpd.sql — decisão D4 (LGPD / minimização nos painéis). Idempotente.
-- Roda DEPOIS de migration_painel_gestao.sql, migration_painel_mvp_final.sql e migration_painel_moderacao.sql.
--
-- Regra adotada (opção B reforçada):
--  * ADMIN não vê o nome real de adolescentes: lista, detalhe e Moderação mostram apelido e código do
--    participante (a busca por nome só vale para a equipe). Nome de nutricionista/admin continua visível.
--  * NUTRICIONISTA: a lista devolve só o primeiro nome (o banco já corta o resto) e a busca casa com o
--    início do primeiro nome, apelido ou código. O nome completo só vem no detalhe.
--  * Abrir o detalhe do participante (nome completo, peso, altura, EBIA, recordatório) é registrado em
--    acessos_dados_log (1 registro a cada 10 minutos por leitora/participante). O Admin consulta em
--    Auditoria > Acessos a dados de participantes. Registro imutável: sem update/delete para o app.
begin;

create table if not exists public.acessos_dados_log (
  id              uuid primary key default gen_random_uuid(),
  leitor_id       uuid not null,            -- sem FK de propósito: o registro sobrevive à exclusão da conta
  leitor_papel    text not null,
  participante_id uuid not null,
  recurso         text not null default 'DETALHE',
  criado_em       timestamptz not null default now()
);
create index if not exists acessos_dados_log_idx on public.acessos_dados_log (criado_em desc);
create index if not exists acessos_dados_log_dedupe_idx on public.acessos_dados_log (leitor_id, participante_id, criado_em desc);
alter table public.acessos_dados_log enable row level security;
revoke all on public.acessos_dados_log from anon, authenticated;   -- sem policy: só as funções abaixo acessam

-- 1. Admin: lista de usuários ------------------------------------------------------------
create or replace function public.painel_usuarios_listar(
  p_busca  text    default null,
  p_papel  text    default null,
  p_ordem  text    default 'recentes',   -- recentes | nome | acesso
  p_limite integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid, nome text, apelido text, papel text, codigo_participante text,
  instituicao_ensino text, tipo_instituicao text, criado_em timestamptz,
  ultimo_acesso timestamptz, ativo boolean, total bigint
)
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_busca text := nullif(btrim(coalesce(p_busca, '')), '');
  v_lim   integer := greatest(1, least(coalesce(p_limite, 25), 100));
  v_off   integer := greatest(0, coalesce(p_offset, 0));
begin
  if public.papel_atual() is distinct from 'ADMINISTRADOR' then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  return query
  with base as (
    select p.id, case when p.papel::text = 'ADOLESCENTE' then null else p.nome end as nome, p.apelido, p.papel::text as papel, p.codigo_participante,
           p.instituicao_ensino, p.tipo_instituicao::text as tipo_instituicao,
           p.created_at as criado_em,
           (select max(e.criado_em) from public.eventos_app e where e.user_id = p.id) as ultimo_acesso
      from public.profiles p
     where (p_papel is null or p.papel::text = p_papel)
       and (v_busca is null
            or (p.papel::text <> 'ADOLESCENTE' and p.nome ilike '%' || v_busca || '%')
            or p.apelido ilike '%' || v_busca || '%'
            or p.codigo_participante ilike '%' || v_busca || '%')
  ), tot as (select count(*) as c from base)
  select b.id, b.nome, b.apelido, b.papel, b.codigo_participante, b.instituicao_ensino,
         b.tipo_instituicao, b.criado_em, b.ultimo_acesso,
         coalesce(b.ultimo_acesso >= now() - interval '30 days', false) as ativo,
         tot.c
    from base b cross join tot
   order by case when p_ordem = 'nome'   then lower(coalesce(b.nome, b.apelido, b.codigo_participante)) end asc,
            case when p_ordem = 'acesso' then b.ultimo_acesso end desc nulls last,
            b.criado_em desc
   limit v_lim offset v_off;
end;
$$;
revoke all on function public.painel_usuarios_listar(text, text, text, integer, integer) from public, anon;
grant execute on function public.painel_usuarios_listar(text, text, text, integer, integer) to authenticated;

-- 2. Admin: detalhe do usuário -----------------------------------------------------------
create or replace function public.painel_usuario_detalhe(p_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  p public.profiles;
  v_ult timestamptz;
begin
  if public.papel_atual() is distinct from 'ADMINISTRADOR' then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  select * into p from public.profiles where id = p_id;
  if not found then raise exception 'Usuário não encontrado.' using errcode = 'P0002'; end if;
  select max(criado_em) into v_ult from public.eventos_app where user_id = p_id;

  return jsonb_build_object(
    'id', p.id, 'nome', case when p.papel::text = 'ADOLESCENTE' then null else p.nome end, 'apelido', p.apelido, 'papel', p.papel::text,
    'codigo_participante', p.codigo_participante,
    'instituicao_ensino', p.instituicao_ensino, 'tipo_instituicao', p.tipo_instituicao::text,
    'etapa_onboarding', p.etapa_onboarding::text, 'criado_em', p.created_at,
    'ultimo_acesso', v_ult,
    'ativo', coalesce(v_ult >= now() - interval '30 days', false),
    'sequencia_atual', p.sequencia_atual, 'maior_sequencia', p.maior_sequencia,
    'xp_total', coalesce((select x.xp_total from public.xp_usuario x where x.usuario_id = p.id), 0),
    'fase_atual', (select x.fase_atual from public.xp_usuario x where x.usuario_id = p.id),
    'licoes_concluidas', (select count(*) from public.progresso_licao l where l.usuario_id = p.id),
    'dias_com_registro', (select count(*) from public.registros_diarios r where r.user_id = p.id),
    'insignias', (select count(*) from public.insignias_usuario i where i.usuario_id = p.id),
    'amigos', (select count(*) from public.amizades a
                where a.status = 'aceita' and p.id in (a.solicitante_id, a.destinatario_id)),
    'denuncias_recebidas', (select count(*) from public.denuncias_sociais d where d.denunciado_id = p.id),
    'conteudos_criados', (select count(*) from public.conteudo_fluxo f where f.criado_por = p.id),
    'revisoes_feitas', (select count(*) from public.conteudo_fluxo f where f.revisado_por = p.id)
  );
end;
$$;
revoke all on function public.painel_usuario_detalhe(uuid) from public, anon;
grant execute on function public.painel_usuario_detalhe(uuid) to authenticated;

-- 3. Nutricionista: lista de participantes (primeiro nome) ---------------------------------
create or replace function public.painel_participantes_listar(
  p_busca  text    default null,
  p_ebia   text    default null,       -- classificação, ou 'SEM_AVALIACAO'
  p_ordem  text    default 'recentes', -- recentes | nome | acesso
  p_limite integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid, nome text, apelido text, codigo_participante text, idade integer,
  instituicao_ensino text, tipo_instituicao text, etapa_onboarding text,
  classificacao_ebia text, sequencia_atual integer, xp_total integer,
  ultimo_acesso timestamptz, criado_em timestamptz, total bigint
)
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_busca text := nullif(btrim(coalesce(p_busca, '')), '');
  v_lim   integer := greatest(1, least(coalesce(p_limite, 25), 100));
  v_off   integer := greatest(0, coalesce(p_offset, 0));
begin
  if public.papel_atual() is distinct from 'NUTRICIONISTA' then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  return query
  with base as (
    select p.id, split_part(btrim(p.nome), ' ', 1) as nome, p.apelido, p.codigo_participante,
           date_part('year', age(p.data_nascimento))::integer as idade,
           p.instituicao_ensino, p.tipo_instituicao::text as tipo_instituicao,
           p.etapa_onboarding::text as etapa_onboarding,
           coalesce(p.classificacao_ebia_atual::text, public._ebia_ultima(p.id)) as classificacao_ebia,
           p.sequencia_atual,
           coalesce((select x.xp_total from public.xp_usuario x where x.usuario_id = p.id), 0) as xp_total,
           (select max(e.criado_em) from public.eventos_app e where e.user_id = p.id) as ultimo_acesso,
           p.created_at as criado_em
      from public.profiles p
     where p.papel::text = 'ADOLESCENTE'
       and (v_busca is null
            or split_part(btrim(p.nome), ' ', 1) ilike v_busca || '%'
            or p.apelido ilike '%' || v_busca || '%'
            or p.codigo_participante ilike '%' || v_busca || '%')
       and (p_ebia is null
            or (p_ebia = 'SEM_AVALIACAO' and coalesce(p.classificacao_ebia_atual::text, public._ebia_ultima(p.id)) is null)
            or coalesce(p.classificacao_ebia_atual::text, public._ebia_ultima(p.id)) = p_ebia)
  ), tot as (select count(*) as c from base)
  select b.id, b.nome, b.apelido, b.codigo_participante, b.idade, b.instituicao_ensino,
         b.tipo_instituicao, b.etapa_onboarding, b.classificacao_ebia, b.sequencia_atual,
         b.xp_total, b.ultimo_acesso, b.criado_em, tot.c
    from base b cross join tot
   order by case when p_ordem = 'nome'   then lower(b.nome) end asc,
            case when p_ordem = 'acesso' then b.ultimo_acesso end desc nulls last,
            b.criado_em desc
   limit v_lim offset v_off;
end;
$$;
revoke all on function public.painel_participantes_listar(text, text, text, integer, integer) from public, anon;
grant execute on function public.painel_participantes_listar(text, text, text, integer, integer) to authenticated;

-- 4. Nutricionista: detalhe do participante (com registro de acesso) ------------------------
create or replace function public.painel_participante_detalhe(p_id uuid)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  p       public.profiles;
  v_hoje  date := (now() at time zone 'America/Sao_Paulo')::date;
  v_ebia  jsonb;
  v_recs  jsonb;
  v_serie jsonb;
  v_ult   timestamptz;
begin
  if public.papel_atual() is distinct from 'NUTRICIONISTA' then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  select * into p from public.profiles where id = p_id and papel::text = 'ADOLESCENTE';
  if not found then raise exception 'Participante não encontrado.' using errcode = 'P0002'; end if;

  -- LGPD: abrir o nome completo e os dados de saúde fica registrado (1 registro a cada 10 min por leitora)
  insert into public.acessos_dados_log (leitor_id, leitor_papel, participante_id, recurso)
  select auth.uid(), 'NUTRICIONISTA', p_id, 'DETALHE'
   where not exists (select 1 from public.acessos_dados_log l
                      where l.leitor_id = auth.uid() and l.participante_id = p_id and l.recurso = 'DETALHE'
                        and l.criado_em > now() - interval '10 minutes');
  select max(criado_em) into v_ult from public.eventos_app where user_id = p_id;

  select to_jsonb(x) into v_ebia from (
    select e.pontuacao_total, e.classificacao::text as classificacao, a.data_realizacao
      from public.avaliacoes_ebia e
      join public.avaliacoes_nutricionais a on a.id = e.avaliacao_nutricional_id
     where a.user_id = p_id and coalesce(e.concluido, false)
     order by a.data_realizacao desc limit 1) x;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.data_referencia desc), '[]'::jsonb) into v_recs from (
    select r.data_referencia, r.concluido, r.escore_saudavel, r.escore_nao_saudavel,
           coalesce((select jsonb_agg(jsonb_build_object(
                       'tipo', m.tipo::text, 'realizada', m.realizada,
                       'alimentos', coalesce((select jsonb_agg(al.nome order by al.nome)
                                                from public.refeicao_alimentos ra
                                                join public.alimentos al on al.id = ra.alimento_id
                                               where ra.refeicao_id = m.id), '[]'::jsonb)
                     ) order by m.tipo::text)
                       from public.refeicoes m where m.recordatorio_id = r.id), '[]'::jsonb) as refeicoes
      from public.recordatorios_alimentares r
      join public.avaliacoes_nutricionais a on a.id = r.avaliacao_nutricional_id
     where a.user_id = p_id
     order by r.data_referencia desc limit 5) x;

  -- últimos 14 dias: água, atividade e refeições registradas
  select coalesce(jsonb_agg(jsonb_build_object(
           'data', d.dia,
           'agua_ml', coalesce((select sum(w.quantidade_ml) from public.registros_diarios rd
                                  join public.registros_agua w on w.registro_diario_id = rd.id
                                 where rd.user_id = p_id and rd.data = d.dia), 0),
           'atividade_min', coalesce((select sum(f.duracao_minutos) from public.registros_diarios rd
                                  join public.registros_atividade_fisica f on f.registro_diario_id = rd.id
                                 where rd.user_id = p_id and rd.data = d.dia), 0),
           'refeicoes', coalesce((select count(*) from public.registros_diarios rd
                                  join public.refeicoes m on m.registro_diario_id = rd.id
                                 where rd.user_id = p_id and rd.data = d.dia and m.realizada), 0)
         ) order by d.dia), '[]'::jsonb)
    into v_serie
    from (select (v_hoje - g)::date as dia from generate_series(0, 13) g) d;

  return jsonb_build_object(
    'id', p.id, 'nome', p.nome, 'apelido', p.apelido, 'codigo_participante', p.codigo_participante,
    'idade', date_part('year', age(p.data_nascimento))::integer,
    'genero', p.genero::text, 'peso_kg', p.peso_kg, 'altura_cm', p.altura_cm,
    'instituicao_ensino', p.instituicao_ensino, 'tipo_instituicao', p.tipo_instituicao::text,
    'etapa_onboarding', p.etapa_onboarding::text,
    'classificacao_ebia_atual', coalesce(p.classificacao_ebia_atual::text, public._ebia_ultima(p.id)),
    'criado_em', p.created_at, 'ultimo_acesso', v_ult,
    'sequencia_atual', p.sequencia_atual, 'maior_sequencia', p.maior_sequencia,
    'xp_total', coalesce((select x.xp_total from public.xp_usuario x where x.usuario_id = p.id), 0),
    'fase_atual', (select x.fase_atual from public.xp_usuario x where x.usuario_id = p.id),
    'licoes_concluidas', (select count(*) from public.progresso_licao l where l.usuario_id = p.id),
    'insignias', (select count(*) from public.insignias_usuario i where i.usuario_id = p.id),
    'ebia', v_ebia, 'recordatorios', v_recs, 'ultimos_14_dias', v_serie
  );
end;
$$;
revoke all on function public.painel_participante_detalhe(uuid) from public, anon;
grant execute on function public.painel_participante_detalhe(uuid) to authenticated;

-- 5. Moderação: apelido/código no lugar do nome ----------------------------------------------
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
               'denunciante', coalesce(a.apelido, a.codigo_participante, 'Sem apelido'),
               'denunciado_id', d.denunciado_id,
               'denunciado', coalesce(b.apelido, b.codigo_participante, 'Sem apelido'),
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

-- Consulta do Admin: quem abriu os dados de quais participantes -------------------------
create or replace function public.painel_acessos_dados_listar(p_limite integer default 100)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare v_lim integer := greatest(1, least(coalesce(p_limite, 100), 300));
begin
  if public.papel_atual() is distinct from 'ADMINISTRADOR' then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'total_30d', (select count(*) from public.acessos_dados_log where criado_em >= now() - interval '30 days'),
    'registros', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', l.id, 'criado_em', l.criado_em, 'recurso', l.recurso,
               'leitor', coalesce(r.nome, r.apelido, 'Conta removida'), 'leitor_papel', l.leitor_papel,
               'participante', coalesce(p.codigo_participante, p.apelido, 'Conta removida')
             ) order by l.criado_em desc)
        from (select * from public.acessos_dados_log order by criado_em desc limit v_lim) l
        left join public.profiles r on r.id = l.leitor_id
        left join public.profiles p on p.id = l.participante_id), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.painel_acessos_dados_listar(integer) from public, anon;
grant execute on function public.painel_acessos_dados_listar(integer) to authenticated;

commit;
