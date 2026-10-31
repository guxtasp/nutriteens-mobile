-- migration_painel_desafios_metricas.sql
-- 1) Novas métricas para desafios semanais/mensais: DIAS_PASSOS_META, DIAS_VARIEDADE_GRUPOS, REFEICOES_REGISTRADAS
-- 2) Valor extra por métrica (passos por dia, grupos por dia, minutos por dia) no salvar do painel
-- 3) Editar os pontos dos desafios diários do catálogo base
-- Rodar no SQL Editor do Supabase DEPOIS de migration_painel_excluir_diarios.sql. Idempotente.

-- 1) constraint de métricas (o nome pode variar: remove qualquer check que cite "metrica")
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'public.missoes_periodicas_catalogo'::regclass
       and contype = 'c' and pg_get_constraintdef(oid) ilike '%metrica%'
  loop
    execute format('alter table public.missoes_periodicas_catalogo drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.missoes_periodicas_catalogo
  add constraint missoes_periodicas_metrica_chk check (metrica in (
    'DIAS_AGUA_META','DIAS_ATIVIDADE_META','DIAS_COM_REGISTRO','DIAS_FONTE_NUTRIENTE',
    'REFEICOES_SEM_ULTRAPROCESSADO','MINUTOS_ATIVIDADE','LICOES','MISSOES_DIARIAS',
    'DIAS_PASSOS_META','DIAS_VARIEDADE_GRUPOS','REFEICOES_REGISTRADAS'));

-- 2) salvar com valor extra (p_valor): passos/dia, grupos/dia ou minutos/dia, conforme a métrica
drop function if exists public.painel_desafio_periodico_salvar(text, text, text, text, text, text, integer, integer, text);

create or replace function public.painel_desafio_periodico_salvar(
  p_codigo    text,
  p_periodo   text,
  p_titulo    text,
  p_descricao text,
  p_icone     text,
  p_metrica   text,
  p_alvo      integer,
  p_pontos    integer,
  p_nutriente text default null,
  p_valor     integer default null
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
  elsif p_metrica = 'DIAS_PASSOS_META' then
    if coalesce(p_valor, 0) not between 1000 and 30000 then raise exception 'Passos por dia entre 1.000 e 30.000.' using errcode = '22023'; end if;
    v_param := jsonb_build_object('passos', p_valor);
  elsif p_metrica = 'DIAS_VARIEDADE_GRUPOS' then
    if coalesce(p_valor, 0) not between 2 and 7 then raise exception 'Grupos por dia entre 2 e 7.' using errcode = '22023'; end if;
    v_param := jsonb_build_object('grupos', p_valor);
  elsif p_metrica = 'DIAS_ATIVIDADE_META' and p_valor is not null then
    if p_valor not between 5 and 180 then raise exception 'Minutos por dia entre 5 e 180.' using errcode = '22023'; end if;
    v_param := jsonb_build_object('minutos_dia', p_valor);
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
revoke all on function public.painel_desafio_periodico_salvar(text, text, text, text, text, text, integer, integer, text, integer) from public, anon;
grant execute on function public.painel_desafio_periodico_salvar(text, text, text, text, text, text, integer, integer, text, integer) to authenticated;

-- listar: agora devolve também os parâmetros (para editar passos/grupos/minutos)
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
               'ativa', c.ativa, 'nutriente', c.parametros->>'nutriente', 'parametros', c.parametros,
               'resgatada', (select count(*) from public.missoes_periodicas_resgates r where r.codigo = c.codigo)
             ) order by c.periodo, c.ordem)
        from public.missoes_periodicas_catalogo c), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.painel_desafios_listar() from public, anon;
grant execute on function public.painel_desafios_listar() to authenticated;

-- 3) pontos dos desafios diários do catálogo base (valem para todas as variantes daquele tipo)
create or replace function public.painel_desafio_diario_pontos(p_id uuid, p_pontos integer)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if public.papel_atual() not in ('ADMINISTRADOR', 'NUTRICIONISTA') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if coalesce(p_pontos, -1) not between 0 and 1000 then
    raise exception 'Pontos entre 0 e 1000.' using errcode = '22023';
  end if;
  update public.missoes_catalogo set pontos_recompensa = p_pontos where id = p_id;
  if not found then raise exception 'Desafio não encontrado.' using errcode = 'P0002'; end if;
end;
$$;
revoke all on function public.painel_desafio_diario_pontos(uuid, integer) from public, anon;
grant execute on function public.painel_desafio_diario_pontos(uuid, integer) to authenticated;
