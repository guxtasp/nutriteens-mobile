-- migration_painel_gestao.sql
-- Painéis Admin/Nutricionista: usuários, participantes, nutricionistas, moderação,
-- desafios e permissão de ESCRITA da equipe no conteúdo. Idempotente.
-- Rodar no SQL Editor DEPOIS de migration_fluxo_conteudo.sql, migration_permissoes_conteudo.sql
-- e migration_painel_dashboard.sql (usa papel_atual()).
--
-- Princípios:
--  * Nada de tabela nova. Só funções security definer que checam o papel NO BANCO.
--  * Admin enxerga dados de gestão (sem peso, altura, gênero, EBIA, alimentação).
--  * Nutricionista enxerga dados clínicos dos adolescentes (EBIA, recordatório, registros),
--    mas não vê contas de equipe nem denúncias.
--  * Adolescente não executa nenhuma destas funções (erro 42501).

begin;

-- 1. ADMIN — lista paginada de usuários ---------------------------------------------
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
    select p.id, p.nome, p.apelido, p.papel::text as papel, p.codigo_participante,
           p.instituicao_ensino, p.tipo_instituicao::text as tipo_instituicao,
           p.created_at as criado_em,
           (select max(e.criado_em) from public.eventos_app e where e.user_id = p.id) as ultimo_acesso
      from public.profiles p
     where (p_papel is null or p.papel::text = p_papel)
       and (v_busca is null
            or p.nome ilike '%' || v_busca || '%'
            or p.apelido ilike '%' || v_busca || '%'
            or p.codigo_participante ilike '%' || v_busca || '%')
  ), tot as (select count(*) as c from base)
  select b.id, b.nome, b.apelido, b.papel, b.codigo_participante, b.instituicao_ensino,
         b.tipo_instituicao, b.criado_em, b.ultimo_acesso,
         coalesce(b.ultimo_acesso >= now() - interval '30 days', false) as ativo,
         tot.c
    from base b cross join tot
   order by case when p_ordem = 'nome'   then lower(b.nome) end asc,
            case when p_ordem = 'acesso' then b.ultimo_acesso end desc nulls last,
            b.criado_em desc
   limit v_lim offset v_off;
end;
$$;
revoke all on function public.painel_usuarios_listar(text, text, text, integer, integer) from public, anon;
grant execute on function public.painel_usuarios_listar(text, text, text, integer, integer) to authenticated;

-- 2. ADMIN — detalhe do usuário (sem dados de saúde) ---------------------------------
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
    'id', p.id, 'nome', p.nome, 'apelido', p.apelido, 'papel', p.papel::text,
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

-- 3. NUTRICIONISTA — lista de participantes -----------------------------------------
-- Obs.: o projeto não tem tabela de vínculo nutricionista↔adolescente; "participantes
-- com acesso" = todos os adolescentes. Se o vínculo for criado depois, o filtro entra aqui.
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
           p.classificacao_ebia_atual::text as classificacao_ebia,
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
            or (p_ebia = 'SEM_AVALIACAO' and p.classificacao_ebia_atual is null)
            or p.classificacao_ebia_atual::text = p_ebia)
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

-- 4. NUTRICIONISTA — detalhe do participante (clínico) ------------------------------
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
    select r.data_referencia, r.concluido, r.escore_saudavel, r.escore_nao_saudavel
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
    'classificacao_ebia_atual', p.classificacao_ebia_atual::text,
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

-- 5. ADMIN — nutricionistas e o trabalho de cada uma ---------------------------------
create or replace function public.painel_nutricionistas_listar()
returns table (
  id uuid, nome text, apelido text, criado_em timestamptz, ultimo_acesso timestamptz,
  conteudos_criados bigint, revisoes_feitas bigint, publicados bigint
)
language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  if public.papel_atual() is distinct from 'ADMINISTRADOR' then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  return query
    select p.id, p.nome, p.apelido, p.created_at,
           (select max(e.criado_em) from public.eventos_app e where e.user_id = p.id),
           (select count(*) from public.conteudo_fluxo f where f.criado_por = p.id),
           (select count(*) from public.conteudo_fluxo f where f.revisado_por = p.id),
           (select count(*) from public.conteudo_fluxo f where f.publicado_por = p.id)
      from public.profiles p
     where p.papel::text = 'NUTRICIONISTA'
     order by lower(p.nome);
end;
$$;
revoke all on function public.painel_nutricionistas_listar() from public, anon;
grant execute on function public.painel_nutricionistas_listar() to authenticated;

-- 6. ADMIN — moderação do módulo social ----------------------------------------------
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
    'denuncias_30d', (select count(*) from public.denuncias_sociais where criado_em >= now() - interval '30 days'),
    'total_bloqueios', (select count(*) from public.bloqueios),
    'reincidentes', (select count(*) from (
        select denunciado_id from public.denuncias_sociais group by 1 having count(*) >= 2) r),
    'denuncias', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', d.id, 'criado_em', d.criado_em, 'motivo', d.motivo,
               'denunciante_id', d.denunciante_id,
               'denunciante', coalesce(a.apelido, a.nome),
               'denunciado_id', d.denunciado_id,
               'denunciado', coalesce(b.apelido, b.nome),
               'total_do_denunciado', (select count(*) from public.denuncias_sociais x where x.denunciado_id = d.denunciado_id)
             ) order by d.criado_em desc)
        from (select * from public.denuncias_sociais order by criado_em desc limit v_lim) d
        left join public.profiles a on a.id = d.denunciante_id
        left join public.profiles b on b.id = d.denunciado_id), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.painel_moderacao(integer) from public, anon;
grant execute on function public.painel_moderacao(integer) to authenticated;

-- 7. Desafios (missões): catálogo + uso, e ativar/desativar --------------------------
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
               'ativa', c.ativa,
               'resgatada', (select count(*) from public.missoes_periodicas_resgates r where r.codigo = c.codigo)
             ) order by c.periodo, c.ordem)
        from public.missoes_periodicas_catalogo c), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.painel_desafios_listar() from public, anon;
grant execute on function public.painel_desafios_listar() to authenticated;

create or replace function public.painel_desafio_definir_ativo(p_origem text, p_ref text, p_ativa boolean)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if public.papel_atual() not in ('ADMINISTRADOR', 'NUTRICIONISTA') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if p_origem = 'DIARIO' then
    update public.missoes_catalogo set ativa = p_ativa where id = p_ref::uuid;
  elsif p_origem = 'PERIODICO' then
    update public.missoes_periodicas_catalogo set ativa = p_ativa where codigo = p_ref;
  else
    raise exception 'Origem inválida.' using errcode = '22023';
  end if;
  if not found then raise exception 'Desafio não encontrado.' using errcode = 'P0002'; end if;
end;
$$;
revoke all on function public.painel_desafio_definir_ativo(text, text, boolean) from public, anon;
grant execute on function public.painel_desafio_definir_ativo(text, text, boolean) to authenticated;

-- 8. Temas de trilha (enum) para o formulário de nova trilha -------------------------
create or replace function public.painel_trilha_temas()
returns text[]
language sql stable security definer set search_path = public, pg_temp
as $$
  select case when public.papel_atual() in ('ADMINISTRADOR', 'NUTRICIONISTA')
              then (select coalesce(array_agg(e.enumlabel::text order by e.enumsortorder), '{}')
                      from pg_enum e join pg_type t on t.oid = e.enumtypid
                     where t.typname = 'trilha_tema')
         end
$$;
revoke all on function public.painel_trilha_temas() from public, anon;
grant execute on function public.painel_trilha_temas() to authenticated;

-- 9. Escrita da equipe no conteúdo (criar/editar) ------------------------------------
-- Status/aprovação continuam protegidos pelos triggers do fluxo: o conteúdo nasce como
-- rascunho e só muda de status por conteudo_transicionar. Edição da nutricionista mantém
-- o status (sobe a versão); edição do Admin devolve para rascunho (fluxo_alteracao_relevante).
do $$
declare t text;
begin
  foreach t in array array['modulos_trilha', 'licoes', 'licao_componentes', 'questoes_quiz', 'opcoes_quiz']
  loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format('drop policy if exists %I on public.%I', 'staff_escreve_' || t, t);
    execute format($p$create policy %I on public.%I for all to authenticated
                      using (public.papel_atual() in ('NUTRICIONISTA', 'ADMINISTRADOR'))
                      with check (public.papel_atual() in ('NUTRICIONISTA', 'ADMINISTRADOR'))$p$,
                   'staff_escreve_' || t, t);
  end loop;
end $$;

drop policy if exists "staff_insere_trilhas" on public.trilhas;
create policy "staff_insere_trilhas" on public.trilhas
  for insert to authenticated
  with check (public.papel_atual() in ('NUTRICIONISTA', 'ADMINISTRADOR') and criado_por = auth.uid());

drop policy if exists "staff_atualiza_trilhas" on public.trilhas;
create policy "staff_atualiza_trilhas" on public.trilhas
  for update to authenticated
  using (public.papel_atual() in ('NUTRICIONISTA', 'ADMINISTRADOR'))
  with check (public.papel_atual() in ('NUTRICIONISTA', 'ADMINISTRADOR'));

do $$
begin
  if to_regclass('public.receitas') is not null then
    drop policy if exists "receitas_escrita_staff" on public.receitas;
    create policy "receitas_escrita_staff" on public.receitas
      for all to authenticated
      using (public.papel_atual() in ('NUTRICIONISTA', 'ADMINISTRADOR'))
      with check (public.papel_atual() in ('NUTRICIONISTA', 'ADMINISTRADOR'));
  end if;
end $$;

commit;
