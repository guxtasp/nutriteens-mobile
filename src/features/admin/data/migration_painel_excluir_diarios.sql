-- migration_painel_excluir_diarios.sql
-- 1) Desafios DIÁRIOS criados pelo painel (variantes com regra pronta, sem mexer em código)
-- 2) Excluir desafio periódico e conquista/marco (só se ninguém usou; senão, desativar)
-- Rodar no SQL Editor do Supabase. Idempotente.

create table if not exists public.missoes_variantes_custom (
  codigo     text primary key,
  area       text not null check (area in ('AGUA', 'ATIVIDADE', 'ALIMENTACAO')),
  tipo_base  text not null,
  titulo     text not null,
  descricao  text not null,
  icone      text,
  regra      jsonb not null,
  ativa      boolean not null default true,
  criado_por uuid default auth.uid(),
  criado_em  timestamptz not null default now()
);
alter table public.missoes_variantes_custom enable row level security;

drop policy if exists variantes_custom_leitura on public.missoes_variantes_custom;
create policy variantes_custom_leitura on public.missoes_variantes_custom
  for select to authenticated using (ativa);
-- sem policy de escrita: só as funções abaixo (security definer) gravam.

create or replace function public.painel_variantes_custom_listar()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if public.papel_atual() not in ('ADMINISTRADOR', 'NUTRICIONISTA') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'codigo', v.codigo, 'area', v.area, 'titulo', v.titulo, 'descricao', v.descricao,
      'icone', v.icone, 'regra', v.regra, 'ativa', v.ativa,
      'sorteada', (select count(*) from public.missoes_diarias d where d.parametros->>'variante' = v.codigo)
    ) order by v.criado_em desc)
    from public.missoes_variantes_custom v), '[]'::jsonb);
end;
$$;

create or replace function public.painel_variante_custom_salvar(
  p_codigo    text,     -- null = criar
  p_titulo    text,
  p_descricao text,
  p_icone     text,
  p_regra     jsonb,    -- {"regra":"AGUA_PCT_META","pct":70} etc.
  p_ativa     boolean default true
) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_codigo text := p_codigo;
  v_regra  text := p_regra->>'regra';
  v_valor  integer;
  v_area   text;
  v_base   text;
  v_sel    text;
  v_rotulo text;
  v_final  jsonb;
begin
  if public.papel_atual() not in ('ADMINISTRADOR', 'NUTRICIONISTA') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if coalesce(btrim(p_titulo), '') = '' or coalesce(btrim(p_descricao), '') = '' then
    raise exception 'Título e descrição são obrigatórios.' using errcode = '22023';
  end if;

  if v_regra = 'AGUA_PCT_META' then
    v_valor := (p_regra->>'pct')::int;       v_area := 'AGUA';        v_base := 'AGUA_ML';
    if v_valor not between 10 and 150 then raise exception 'Percentual entre 10 e 150.' using errcode = '22023'; end if;
    v_final := jsonb_build_object('regra', v_regra, 'pct', v_valor);
  elsif v_regra = 'ATIVIDADE_MIN' then
    v_valor := (p_regra->>'min')::int;       v_area := 'ATIVIDADE';   v_base := 'ATIVIDADE_MIN';
    if v_valor not between 5 and 180 then raise exception 'Minutos entre 5 e 180.' using errcode = '22023'; end if;
    v_final := jsonb_build_object('regra', v_regra, 'min', v_valor);
  elsif v_regra = 'ATIVIDADE_PASSOS' then
    v_valor := (p_regra->>'passos')::int;    v_area := 'ATIVIDADE';   v_base := 'ATIVIDADE_MIN';
    if v_valor not between 1000 and 30000 then raise exception 'Passos entre 1.000 e 30.000.' using errcode = '22023'; end if;
    v_final := jsonb_build_object('regra', v_regra, 'passos', v_valor);
  elsif v_regra = 'NATURAIS_QTD' then
    v_valor := (p_regra->>'qtd')::int;       v_area := 'ALIMENTACAO'; v_base := 'ALIMENTO_NATURAL_QTD';
    if v_valor not between 1 and 10 then raise exception 'Porções entre 1 e 10.' using errcode = '22023'; end if;
    v_final := jsonb_build_object('regra', v_regra, 'qtd', v_valor);
  elsif v_regra = 'SEM_ULTRA' then
    v_valor := (p_regra->>'refeicoes')::int; v_area := 'ALIMENTACAO'; v_base := 'REFEICAO_SEM_ULTRAPROCESSADO';
    if v_valor not between 1 and 5 then raise exception 'Refeições entre 1 e 5.' using errcode = '22023'; end if;
    v_final := jsonb_build_object('regra', v_regra, 'refeicoes', v_valor);
  elsif v_regra = 'REFEICOES_QTD' then
    v_valor := (p_regra->>'qtd')::int;       v_area := 'ALIMENTACAO'; v_base := 'ALIMENTO_NATURAL_QTD';
    if v_valor not between 1 and 6 then raise exception 'Refeições entre 1 e 6.' using errcode = '22023'; end if;
    v_final := jsonb_build_object('regra', v_regra, 'qtd', v_valor);
  elsif v_regra = 'REFEICAO_TIPO' then
    v_sel := p_regra->>'tipo';               v_area := 'ALIMENTACAO'; v_base := 'ALIMENTO_NATURAL_QTD';
    if v_sel not in ('CAFE_DA_MANHA','LANCHE_MANHA','ALMOCO','LANCHE_TARDE','JANTAR','CEIA') then
      raise exception 'Tipo de refeição inválido.' using errcode = '22023';
    end if;
    v_final := jsonb_build_object('regra', v_regra, 'tipo', v_sel);
  elsif v_regra = 'VARIEDADE_GRUPOS' then
    v_valor := (p_regra->>'grupos')::int;    v_area := 'ALIMENTACAO'; v_base := 'ALIMENTO_NATURAL_QTD';
    if v_valor not between 2 and 7 then raise exception 'Grupos entre 2 e 7.' using errcode = '22023'; end if;
    v_final := jsonb_build_object('regra', v_regra, 'grupos', v_valor);
  elsif v_regra = 'GRUPO' then
    v_valor := (p_regra->>'qtd')::int;       v_sel := p_regra->>'grupo';
    v_area := 'ALIMENTACAO'; v_base := 'ALIMENTO_NATURAL_QTD';
    if v_valor not between 1 and 5 then raise exception 'Itens entre 1 e 5.' using errcode = '22023'; end if;
    if v_sel not in ('FRUTAS','LEGUMES_E_VERDURAS','LEGUMINOSAS','CARNES_E_OVOS','LEITE_E_DERIVADOS','CEREAIS_E_TUBERCULOS','OLEAGINOSAS_E_SEMENTES') then
      raise exception 'Grupo alimentar inválido.' using errcode = '22023';
    end if;
    v_final := jsonb_build_object('regra', v_regra, 'grupo', v_sel, 'qtd', v_valor);
  elsif v_regra = 'FONTE_NUTRIENTE' then
    v_valor := (p_regra->>'qtd')::int;       v_sel := p_regra->>'nutriente';
    v_area := 'ALIMENTACAO'; v_base := 'ALIMENTO_NATURAL_QTD';
    if v_valor not between 1 and 5 then raise exception 'Alimentos entre 1 e 5.' using errcode = '22023'; end if;
    v_rotulo := case v_sel
      when 'vitamina_a' then 'vitamina A' when 'vitamina_c' then 'vitamina C' when 'vitamina_d' then 'vitamina D'
      when 'calcio' then 'cálcio' when 'ferro' then 'ferro' when 'zinco' then 'zinco'
      when 'magnesio' then 'magnésio' when 'proteina' then 'proteína' when 'fibra' then 'fibra' end;
    if v_rotulo is null then raise exception 'Nutriente inválido.' using errcode = '22023'; end if;
    v_final := jsonb_build_object('regra', v_regra, 'nutriente', v_sel, 'qtd', v_valor, 'rotulo', v_rotulo);
  else
    raise exception 'Tipo de desafio inválido.' using errcode = '22023';
  end if;

  if v_codigo is null then
    v_codigo := 'custom_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
    insert into public.missoes_variantes_custom (codigo, area, tipo_base, titulo, descricao, icone, regra, ativa)
    values (v_codigo, v_area, v_base, btrim(p_titulo), btrim(p_descricao),
            nullif(btrim(coalesce(p_icone, '')), ''), v_final, coalesce(p_ativa, true));
  else
    update public.missoes_variantes_custom
       set area = v_area, tipo_base = v_base, titulo = btrim(p_titulo), descricao = btrim(p_descricao),
           icone = nullif(btrim(coalesce(p_icone, '')), ''), regra = v_final, ativa = coalesce(p_ativa, ativa)
     where codigo = v_codigo;
    if not found then raise exception 'Desafio não encontrado.' using errcode = 'P0002'; end if;
  end if;
  return v_codigo;
end;
$$;

-- Excluir desafio diário criado pelo painel. Missões já sorteadas guardam só o código
-- e passam a usar o texto base do catálogo; nenhum histórico de pontos se perde.
create or replace function public.painel_variante_custom_excluir(p_codigo text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if public.papel_atual() not in ('ADMINISTRADOR', 'NUTRICIONISTA') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  delete from public.missoes_variantes_custom where codigo = p_codigo;
  if not found then raise exception 'Desafio não encontrado.' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.painel_desafio_periodico_excluir(p_codigo text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if public.papel_atual() not in ('ADMINISTRADOR', 'NUTRICIONISTA') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if exists (select 1 from public.missoes_periodicas_resgates r where r.codigo = p_codigo) then
    raise exception 'Este desafio já foi resgatado por adolescentes. Desative em vez de excluir, para manter o histórico.' using errcode = '23503';
  end if;
  delete from public.missoes_periodicas_catalogo where codigo = p_codigo;
  if not found then raise exception 'Desafio não encontrado.' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.painel_insignia_excluir(p_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_cat text;
begin
  if public.papel_atual() not in ('ADMINISTRADOR', 'NUTRICIONISTA') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  select categoria into v_cat from public.insignias where id = p_id;
  if v_cat is null then raise exception 'Item não encontrado.' using errcode = 'P0002'; end if;
  if v_cat = 'insignia' then
    raise exception 'Insígnias têm arte exclusiva no app e não podem ser excluídas. Use Desativar.' using errcode = '42501';
  end if;
  if exists (select 1 from public.insignias_usuario u where u.insignia_id = p_id) then
    raise exception 'Já foi conquistado por adolescentes. Desative em vez de excluir, para manter o histórico.' using errcode = '23503';
  end if;
  delete from public.insignias where id = p_id;
end;
$$;

revoke all on function public.painel_variantes_custom_listar() from public, anon;
revoke all on function public.painel_variante_custom_salvar(text, text, text, text, jsonb, boolean) from public, anon;
revoke all on function public.painel_variante_custom_excluir(text) from public, anon;
revoke all on function public.painel_desafio_periodico_excluir(text) from public, anon;
revoke all on function public.painel_insignia_excluir(uuid) from public, anon;
grant execute on function public.painel_variantes_custom_listar() to authenticated;
grant execute on function public.painel_variante_custom_salvar(text, text, text, text, jsonb, boolean) to authenticated;
grant execute on function public.painel_variante_custom_excluir(text) to authenticated;
grant execute on function public.painel_desafio_periodico_excluir(text) to authenticated;
grant execute on function public.painel_insignia_excluir(uuid) to authenticated;
