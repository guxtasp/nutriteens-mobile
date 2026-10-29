-- =====================================================================
-- MIGRATION (MVP final): painel da nutricionista + criação de desafios/conquistas
-- Rodar uma vez no SQL Editor do Supabase. Idempotente (create or replace).
--   1. EBIA: se profiles.classificacao_ebia_atual estiver vazia mas existir avaliação
--      EBIA concluída, a lista/detalhe usam a última avaliação (e há um reparo no fim).
--   2. Detalhe do participante: recordatório com os alimentos de cada refeição.
--   3. Criar/editar desafios semanais e mensais (missoes_periodicas_catalogo).
--   4. Criar/editar conquistas e marcos (insignias) + ativar/desativar.
--      Insígnias com arte exclusiva continuam só por código (a arte vive no app).
-- Depende de migration_painel_gestao.sql e migration_conquistas_marcos_insignias.sql.
-- =====================================================================

-- 1. última classificação EBIA concluída de um usuário -------------------------------
create or replace function public._ebia_ultima(p_user uuid)
returns text
language sql stable security definer set search_path = public, pg_temp
as $$
  select e.classificacao::text
    from public.avaliacoes_ebia e
    join public.avaliacoes_nutricionais a on a.id = e.avaliacao_nutricional_id
   where a.user_id = p_user and coalesce(e.concluido, false)
   order by a.data_realizacao desc nulls last
   limit 1;
$$;
revoke all on function public._ebia_ultima(uuid) from public, anon, authenticated;

-- 2. lista de participantes (EBIA com fallback) ----------------------------------------
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
    select p.id, p.nome, p.apelido, p.codigo_participante,
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
            or p.nome ilike '%' || v_busca || '%'
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

-- 3. detalhe do participante (recordatório com alimentos) -------------------------------
create or replace function public.painel_participante_detalhe(p_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
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

-- 4. reparo único do perfil (só quem tem EBIA concluída e perfil vazio) ----------------
update public.profiles p
   set classificacao_ebia_atual = x.classificacao
  from (select distinct on (a.user_id) a.user_id, e.classificacao
          from public.avaliacoes_ebia e
          join public.avaliacoes_nutricionais a on a.id = e.avaliacao_nutricional_id
         where coalesce(e.concluido, false)
         order by a.user_id, a.data_realizacao desc nulls last) x
 where x.user_id = p.id and p.classificacao_ebia_atual is null;

-- 5. DESAFIOS semanais/mensais: criar e editar ------------------------------------------
create or replace function public.painel_desafio_periodico_salvar(
  p_codigo    text,            -- null = criar novo
  p_periodo   text,
  p_titulo    text,
  p_descricao text,
  p_icone     text,
  p_metrica   text,
  p_alvo      integer,
  p_pontos    integer,
  p_nutriente text default null
) returns text
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_codigo text := p_codigo;
  v_param  jsonb := '{}'::jsonb;
begin
  if public.papel_atual() not in ('ADMINISTRADOR', 'NUTRICIONISTA') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if p_periodo not in ('SEMANAL', 'MENSAL') then raise exception 'Período inválido.' using errcode = '22023'; end if;
  if coalesce(btrim(p_titulo), '') = '' or coalesce(btrim(p_descricao), '') = '' then
    raise exception 'Título e descrição são obrigatórios.' using errcode = '22023';
  end if;
  if coalesce(p_alvo, 0) < 1 or coalesce(p_pontos, -1) < 0 or p_pontos > 1000 then
    raise exception 'Meta ou pontos inválidos.' using errcode = '22023';
  end if;
  if p_metrica = 'DIAS_FONTE_NUTRIENTE' then
    if coalesce(btrim(p_nutriente), '') = '' then
      raise exception 'Escolha o nutriente.' using errcode = '22023';
    end if;
    v_param := jsonb_build_object('nutriente', btrim(p_nutriente));
  end if;

  if v_codigo is null then
    v_codigo := 'custom_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
    insert into public.missoes_periodicas_catalogo
      (codigo, periodo, titulo, descricao, icone, metrica, alvo, parametros, pontos_recompensa, ordem, ativa)
    values (v_codigo, p_periodo, btrim(p_titulo), btrim(p_descricao), nullif(btrim(coalesce(p_icone,'')), ''),
            p_metrica, p_alvo, v_param, p_pontos, 900, true);
  else
    update public.missoes_periodicas_catalogo
       set periodo = p_periodo, titulo = btrim(p_titulo), descricao = btrim(p_descricao),
           icone = nullif(btrim(coalesce(p_icone,'')), ''), metrica = p_metrica, alvo = p_alvo,
           parametros = v_param, pontos_recompensa = p_pontos
     where codigo = v_codigo;
    if not found then raise exception 'Desafio não encontrado.' using errcode = 'P0002'; end if;
  end if;
  return v_codigo;
end;
$$;
revoke all on function public.painel_desafio_periodico_salvar(text, text, text, text, text, text, integer, integer, text) from public, anon;
grant execute on function public.painel_desafio_periodico_salvar(text, text, text, text, text, text, integer, integer, text) to authenticated;

-- o painel também precisa do ícone e dos parâmetros (nutriente) ao editar
create or replace function public.painel_desafios_listar()
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  if public.papel_atual() not in ('ADMINISTRADOR', 'NUTRICIONISTA') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'diarios', coalesce((
      select jsonb_agg(jsonb_build_object(
               'ref', m.id, 'tipo', m.tipo::text, 'titulo', m.titulo, 'descricao', m.descricao,
               'icone', m.icone, 'pontos', m.pontos_recompensa, 'ativa', m.ativa,
               'sorteada', (select count(*) from public.missoes_diarias d where d.missao_id = m.id),
               'concluida', (select count(*) from public.missoes_diarias d where d.missao_id = m.id and d.xp_concedido)
             ) order by m.titulo)
        from public.missoes_catalogo m), '[]'::jsonb),
    'periodicos', coalesce((
      select jsonb_agg(jsonb_build_object(
               'ref', c.codigo, 'periodo', c.periodo, 'titulo', c.titulo, 'descricao', c.descricao,
               'icone', c.icone, 'metrica', c.metrica, 'alvo', c.alvo, 'pontos', c.pontos_recompensa,
               'ativa', c.ativa, 'nutriente', c.parametros->>'nutriente',
               'resgatada', (select count(*) from public.missoes_periodicas_resgates r where r.codigo = c.codigo)
             ) order by c.periodo, c.ordem)
        from public.missoes_periodicas_catalogo c), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.painel_desafios_listar() from public, anon;
grant execute on function public.painel_desafios_listar() to authenticated;

-- 6. CONQUISTAS / MARCOS / INSÍGNIAS: listar, criar/editar, ativar --------------------
create or replace function public.painel_insignias_listar()
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  if public.papel_atual() not in ('ADMINISTRADOR', 'NUTRICIONISTA') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', i.id, 'codigo', i.codigo, 'categoria', i.categoria, 'nome', i.nome,
             'descricao', i.descricao, 'icone', i.icone, 'tipo', i.criterio->>'tipo',
             'min', nullif(i.criterio->>'min', '')::int, 'ativa', i.ativa,
             'ganhas', (select count(*) from public.insignias_usuario u where u.insignia_id = i.id)
           ) order by i.ordem, i.nome)
      from public.insignias i), '[]'::jsonb);
end;
$$;
revoke all on function public.painel_insignias_listar() from public, anon;
grant execute on function public.painel_insignias_listar() to authenticated;

-- Só 'conquista' e 'marco' podem ser criadas aqui: 'insignia' tem arte exclusiva no app.
create or replace function public.painel_insignia_salvar(
  p_id        uuid,            -- null = criar
  p_categoria text,
  p_nome      text,
  p_descricao text,
  p_icone     text,
  p_tipo      text,
  p_min       integer
) returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_id uuid := p_id;
  v_crit jsonb;
  v_cat_atual text;
begin
  if public.papel_atual() not in ('ADMINISTRADOR', 'NUTRICIONISTA') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if p_categoria not in ('conquista', 'marco', 'insignia') then
    raise exception 'Categoria inválida.' using errcode = '22023';
  end if;
  if p_tipo not in ('licoes','xp','sequencia','agua','refeicao','alimento','alimentos_distintos',
                    'atividade','registros','missao','amigos') then
    raise exception 'Tipo de critério inválido.' using errcode = '22023';
  end if;
  if coalesce(p_min, 0) < 1 then raise exception 'A meta precisa ser 1 ou mais.' using errcode = '22023'; end if;
  if coalesce(btrim(p_nome), '') = '' then raise exception 'Informe o nome.' using errcode = '22023'; end if;
  v_crit := jsonb_build_object('tipo', p_tipo, 'min', p_min);

  if v_id is null then
    if p_categoria = 'insignia' then
      raise exception 'Insígnias com arte exclusiva só podem ser criadas no código do app.' using errcode = '22023';
    end if;
    insert into public.insignias (codigo, categoria, nome, descricao, icone, criterio, ordem, ativa)
    values ('custom_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10), p_categoria,
            btrim(p_nome), nullif(btrim(coalesce(p_descricao,'')), ''), coalesce(nullif(btrim(coalesce(p_icone,'')), ''), 'ribbon'),
            v_crit, case when p_categoria = 'marco' then 290 else 190 end, true)
    returning id into v_id;
  else
    select categoria into v_cat_atual from public.insignias where id = v_id;
    if not found then raise exception 'Item não encontrado.' using errcode = 'P0002'; end if;
    -- a categoria não muda na edição (insígnia tem arte própria no app)
    update public.insignias
       set nome = btrim(p_nome), descricao = nullif(btrim(coalesce(p_descricao,'')), ''),
           icone = coalesce(nullif(btrim(coalesce(p_icone,'')), ''), icone), criterio = v_crit
     where id = v_id;
  end if;
  return v_id;
end;
$$;
revoke all on function public.painel_insignia_salvar(uuid, text, text, text, text, text, integer) from public, anon;
grant execute on function public.painel_insignia_salvar(uuid, text, text, text, text, text, integer) to authenticated;

create or replace function public.painel_insignia_definir_ativa(p_id uuid, p_ativa boolean)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if public.papel_atual() not in ('ADMINISTRADOR', 'NUTRICIONISTA') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  update public.insignias set ativa = p_ativa where id = p_id;
  if not found then raise exception 'Item não encontrado.' using errcode = 'P0002'; end if;
end;
$$;
revoke all on function public.painel_insignia_definir_ativa(uuid, boolean) from public, anon;
grant execute on function public.painel_insignia_definir_ativa(uuid, boolean) to authenticated;
