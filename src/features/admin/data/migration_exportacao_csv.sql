-- =====================================================================
-- MIGRATION: exportação de dados em CSV para pesquisa (Admin e Nutricionista)
-- Rodar uma vez no SQL Editor do Supabase. Idempotente (create or replace).
--
-- O que faz:
--   1. Cria o log de exportações (quem exportou o quê, quando e de que período).
--   2. painel_exportar(conjunto, inicio, fim, limite, offset): devolve os dados
--      de UM conjunto, em páginas, já ANONIMIZADOS (só código do participante;
--      sem nome, e-mail, apelido, nome da escola ou data de nascimento).
--   3. painel_exportacoes_recentes(): últimas exportações, para a tela.
--
-- Conjuntos: usuarios, triagem_ebia, recordatorio, alimentacao, agua,
--            atividade_fisica, eventos, sessoes, gamificacao, social
-- Período: p_inicio/p_fim em dias civis de São Paulo; null = sem limite ("tudo").
-- Depende de: papel_atual() (migration_painel_dashboard.sql).
-- =====================================================================

-- 1. log ---------------------------------------------------------------------------
create table if not exists public.exportacoes_log (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null,
  papel      text not null,
  conjunto   text not null,
  inicio     date,
  fim        date,
  linhas     integer,
  criado_em  timestamptz not null default now()
);
alter table public.exportacoes_log enable row level security;
-- sem policies: ninguém lê/escreve direto; só as funções abaixo (security definer)
revoke all on public.exportacoes_log from anon, authenticated;

-- 2. exportar -----------------------------------------------------------------------
create or replace function public.painel_exportar(
  p_conjunto text,
  p_inicio   date    default null,
  p_fim      date    default null,
  p_limite   integer default 2000,
  p_offset   integer default 0
)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_papel  text    := public.papel_atual();
  v_ini    date    := coalesce(p_inicio, date '2000-01-01');
  v_fim    date    := coalesce(p_fim,    date '2100-01-01');
  v_lim    integer := greatest(1, least(coalesce(p_limite, 2000), 5000));
  v_off    integer := greatest(0, coalesce(p_offset, 0));
  v_sql    text;
  v_total  bigint;
  v_linhas jsonb;
begin
  if v_papel is null or v_papel not in ('ADMINISTRADOR', 'NUTRICIONISTA') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if v_fim < v_ini then
    raise exception 'Período inválido.' using errcode = '22023';
  end if;

  -- $1 = início, $2 = fim (dias civis em America/Sao_Paulo). Cada consulta termina
  -- com ORDER BY estável, porque a leitura é paginada.
  v_sql := case p_conjunto

  when 'usuarios' then $q$
    select p.codigo_participante as participante,
           date_part('year', age(p.data_nascimento))::int as idade,
           p.genero::text as genero,
           p.tipo_instituicao::text as tipo_instituicao,
           p.classificacao_ebia_atual::text as classificacao_ebia,
           p.etapa_onboarding::text as etapa_onboarding,
           p.peso_kg, p.altura_cm,
           to_char(p.created_at at time zone 'America/Sao_Paulo', 'YYYY-MM-DD') as data_cadastro,
           (select to_char(max(e.criado_em) at time zone 'America/Sao_Paulo', 'YYYY-MM-DD HH24:MI')
              from public.eventos_app e where e.user_id = p.id) as ultimo_acesso,
           coalesce(p.sequencia_atual, 0) as sequencia_atual,
           coalesce(p.maior_sequencia, 0) as maior_sequencia,
           coalesce(x.xp_total, 0) as xp_total,
           x.fase_atual
      from public.profiles p
      left join public.xp_usuario x on x.usuario_id = p.id
     where p.papel::text = 'ADOLESCENTE'
       and (p.created_at at time zone 'America/Sao_Paulo')::date <= $2
     order by p.created_at, p.id $q$

  when 'triagem_ebia' then $q$
    select p.codigo_participante as participante,
           to_char(a.data_realizacao at time zone 'America/Sao_Paulo', 'YYYY-MM-DD HH24:MI') as data_avaliacao,
           e.pontuacao_total,
           e.classificacao::text as classificacao,
           (select r.resposta::int from public.respostas_ebia r where r.avaliacao_ebia_id = e.id and r.numero_pergunta = 1) as pergunta_1,
           (select r.resposta::int from public.respostas_ebia r where r.avaliacao_ebia_id = e.id and r.numero_pergunta = 2) as pergunta_2,
           (select r.resposta::int from public.respostas_ebia r where r.avaliacao_ebia_id = e.id and r.numero_pergunta = 3) as pergunta_3,
           (select r.resposta::int from public.respostas_ebia r where r.avaliacao_ebia_id = e.id and r.numero_pergunta = 4) as pergunta_4,
           (select r.resposta::int from public.respostas_ebia r where r.avaliacao_ebia_id = e.id and r.numero_pergunta = 5) as pergunta_5
      from public.avaliacoes_ebia e
      join public.avaliacoes_nutricionais a on a.id = e.avaliacao_nutricional_id
      join public.profiles p on p.id = a.user_id and p.papel::text = 'ADOLESCENTE'
     where coalesce(e.concluido, false)
       and (a.data_realizacao at time zone 'America/Sao_Paulo')::date between $1 and $2
     order by a.data_realizacao, e.id $q$

  when 'recordatorio' then $q$
    select p.codigo_participante as participante,
           r.data_referencia::text as data_referencia,
           coalesce(r.concluido, false)::int as concluido,
           r.escore_saudavel, r.escore_nao_saudavel,
           rf.tipo::text as refeicao,
           al.nome as alimento,
           ra.quantidade,
           al.classificacao_nova::text as classificacao_nova,
           array_to_string(al.grupos_alimentares::text[], '|') as grupos_alimentares
      from public.recordatorios_alimentares r
      join public.avaliacoes_nutricionais a on a.id = r.avaliacao_nutricional_id
      join public.profiles p on p.id = a.user_id and p.papel::text = 'ADOLESCENTE'
      left join public.refeicoes rf on rf.recordatorio_id = r.id
      left join public.refeicao_alimentos ra on ra.refeicao_id = rf.id
      left join public.alimentos al on al.id = ra.alimento_id
     where r.data_referencia between $1 and $2
     order by r.data_referencia, p.codigo_participante, r.id, rf.id, al.nome $q$

  when 'alimentacao' then $q$
    select p.codigo_participante as participante,
           d.data::text as data,
           rf.tipo::text as refeicao,
           coalesce(rf.realizada, true)::int as realizada,
           rf.horario_registro::text as horario,
           al.nome as alimento,
           ra.quantidade,
           al.classificacao_nova::text as classificacao_nova,
           (al.classificacao_nova::text = 'ULTRAPROCESSADO')::int as ultraprocessado,
           array_to_string(al.grupos_alimentares::text[], '|') as grupos_alimentares
      from public.registros_diarios d
      join public.profiles p on p.id = d.user_id and p.papel::text = 'ADOLESCENTE'
      join public.refeicoes rf on rf.registro_diario_id = d.id
      left join public.refeicao_alimentos ra on ra.refeicao_id = rf.id
      left join public.alimentos al on al.id = ra.alimento_id
     where d.data between $1 and $2
     order by d.data, p.codigo_participante, rf.horario_registro nulls last, rf.id, al.nome $q$

  when 'agua' then $q$
    select p.codigo_participante as participante,
           d.data::text as data,
           ag.horario_registro::text as horario,
           ag.quantidade_ml
      from public.registros_agua ag
      join public.registros_diarios d on d.id = ag.registro_diario_id
      join public.profiles p on p.id = d.user_id and p.papel::text = 'ADOLESCENTE'
     where d.data between $1 and $2
     order by d.data, p.codigo_participante, ag.horario_registro, ag.id $q$

  when 'atividade_fisica' then $q$
    select p.codigo_participante as participante,
           d.data::text as data,
           af.horario_registro::text as horario,
           af.tipo_atividade,
           af.duracao_minutos,
           af.quantidade_passos
      from public.registros_atividade_fisica af
      join public.registros_diarios d on d.id = af.registro_diario_id
      join public.profiles p on p.id = d.user_id and p.papel::text = 'ADOLESCENTE'
     where d.data between $1 and $2
     order by d.data, p.codigo_participante, af.horario_registro, af.id $q$

  when 'eventos' then $q$
    select p.codigo_participante as participante,
           e.nome as evento,
           to_char(e.criado_em at time zone 'America/Sao_Paulo', 'YYYY-MM-DD HH24:MI:SS') as data_hora,
           case when e.sessao_id is null then null else left(md5(e.sessao_id), 12) end as sessao
      from public.eventos_app e
      join public.profiles p on p.id = e.user_id and p.papel::text = 'ADOLESCENTE'
     where (e.criado_em at time zone 'America/Sao_Paulo')::date between $1 and $2
     order by e.criado_em, e.id $q$

  when 'sessoes' then $q$
    select p.codigo_participante as participante,
           left(md5(e.sessao_id), 12) as sessao,
           to_char(min(e.criado_em) at time zone 'America/Sao_Paulo', 'YYYY-MM-DD HH24:MI:SS') as inicio,
           to_char(max(e.criado_em) at time zone 'America/Sao_Paulo', 'YYYY-MM-DD HH24:MI:SS') as fim,
           round((extract(epoch from (max(e.criado_em) - min(e.criado_em))) / 60)::numeric, 1) as duracao_min,
           count(*) as eventos
      from public.eventos_app e
      join public.profiles p on p.id = e.user_id and p.papel::text = 'ADOLESCENTE'
     where e.sessao_id is not null
       and (e.criado_em at time zone 'America/Sao_Paulo')::date between $1 and $2
     group by p.codigo_participante, e.sessao_id
     order by min(e.criado_em), p.codigo_participante $q$

  when 'gamificacao' then $q$
    select p.codigo_participante as participante,
           coalesce(x.xp_total, 0) as xp_total,
           x.fase_atual,
           coalesce(p.sequencia_atual, 0) as sequencia_atual,
           coalesce(p.maior_sequencia, 0) as maior_sequencia,
           (select count(*) from public.progresso_licao l
             where l.usuario_id = p.id
               and (l.concluida_em at time zone 'America/Sao_Paulo')::date between $1 and $2) as licoes_no_periodo,
           (select coalesce(sum(l.xp_ganho), 0) from public.progresso_licao l
             where l.usuario_id = p.id
               and (l.concluida_em at time zone 'America/Sao_Paulo')::date between $1 and $2) as xp_licoes_no_periodo,
           (select count(*) from public.insignias_usuario i
             where i.usuario_id = p.id
               and (i.obtida_em at time zone 'America/Sao_Paulo')::date between $1 and $2) as insignias_no_periodo,
           (select count(*) from public.missoes_diarias m
             where m.user_id = p.id and m.xp_concedido and m.data between $1 and $2) as missoes_diarias_concluidas,
           (select count(*) from public.registros_diarios d
             where d.user_id = p.id and d.data between $1 and $2) as dias_com_registro
      from public.profiles p
      left join public.xp_usuario x on x.usuario_id = p.id
     where p.papel::text = 'ADOLESCENTE'
     order by p.created_at, p.id $q$

  when 'social' then $q$
    select p.codigo_participante as participante,
           coalesce(p.feed_visivel, false)::int as feed_visivel,
           (select count(*) from public.amizades a
             where a.status = 'aceita' and p.id in (a.solicitante_id, a.destinatario_id)) as amigos,
           (select count(*) from public.feed_eventos fe
             where fe.usuario_id = p.id and fe.dia between $1 and $2) as eventos_no_feed,
           (select count(*) from public.feed_reacoes fr
             where fr.usuario_id = p.id
               and (fr.criado_em at time zone 'America/Sao_Paulo')::date between $1 and $2) as reacoes_enviadas,
           (select count(*) from public.chamas_dupla c
             where c.status = 'ativa' and p.id in (c.convidante_id, c.convidado_id)) as chamas_em_dupla_ativas
      from public.profiles p
     where p.papel::text = 'ADOLESCENTE'
     order by p.created_at, p.id $q$

  else null end;

  if v_sql is null then
    raise exception 'Conjunto de dados desconhecido.' using errcode = '22023';
  end if;

  execute format('select count(*) from (%s) q', v_sql) into v_total using v_ini, v_fim;
  execute format('select coalesce(jsonb_agg(to_jsonb(q)), ''[]''::jsonb) from (%s limit %s offset %s) q',
                 v_sql, v_lim, v_off) into v_linhas using v_ini, v_fim;

  -- registra só a primeira página de cada exportação
  if v_off = 0 then
    insert into public.exportacoes_log (usuario_id, papel, conjunto, inicio, fim, linhas)
    values (auth.uid(), v_papel, p_conjunto, p_inicio, p_fim, v_total::integer);
  end if;

  return jsonb_build_object('conjunto', p_conjunto, 'total', v_total, 'offset', v_off, 'linhas', v_linhas);
end;
$$;

revoke all on function public.painel_exportar(text, date, date, integer, integer) from public, anon;
grant execute on function public.painel_exportar(text, date, date, integer, integer) to authenticated;

-- 3. últimas exportações ---------------------------------------------------------------
-- Admin vê as de todos; nutricionista, só as próprias.
create or replace function public.painel_exportacoes_recentes(p_limite integer default 15)
returns table (conjunto text, inicio date, fim date, linhas integer, criado_em timestamptz, quem text)
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_papel text := public.papel_atual();
begin
  if v_papel is null or v_papel not in ('ADMINISTRADOR', 'NUTRICIONISTA') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  return query
  select l.conjunto, l.inicio, l.fim, l.linhas, l.criado_em, pr.nome
    from public.exportacoes_log l
    left join public.profiles pr on pr.id = l.usuario_id
   where v_papel = 'ADMINISTRADOR' or l.usuario_id = auth.uid()
   order by l.criado_em desc
   limit greatest(1, least(coalesce(p_limite, 15), 50));
end;
$$;

revoke all on function public.painel_exportacoes_recentes(integer) from public, anon;
grant execute on function public.painel_exportacoes_recentes(integer) to authenticated;
