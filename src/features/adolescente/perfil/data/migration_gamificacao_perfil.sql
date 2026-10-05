-- Gamificação do perfil: fases do Broxis (filhote -> jovem -> adulto) e insígnias.
-- As tabelas `insignias`, `insignias_usuario` e `xp_usuario` já existem; aqui só
-- adicionamos o que falta. Pode rodar mais de uma vez (idempotente).

-- ============================================================
-- 1. FASES DO BROXIS (limiares de XP ajustáveis sem novo release)
-- ============================================================
create table if not exists public.fases_mascote (
  fase       text primary key,            -- bate com xp_usuario.fase_atual
  titulo     text not null,
  xp_minimo  integer not null unique check (xp_minimo >= 0),
  ordem      integer not null unique
);

insert into public.fases_mascote (fase, titulo, xp_minimo, ordem) values
  ('filhote', 'Broxinho',  0,    1),   -- bebê: até 499 XP (~2 módulos)
  ('jovem',   'Broxis',    500,  2),   -- 500 a 1499 XP
  ('adulto',  'Super Broxis', 1500, 3) -- 1500+ XP
on conflict (fase) do update
  set titulo = excluded.titulo, xp_minimo = excluded.xp_minimo, ordem = excluded.ordem;

alter table public.fases_mascote enable row level security;
drop policy if exists "fases_leitura" on public.fases_mascote;
create policy "fases_leitura" on public.fases_mascote
  for select to authenticated using (true);

-- Mantém xp_usuario.fase_atual sempre coerente com xp_total
create or replace function public.fn_atualizar_fase_mascote()
returns trigger language plpgsql as $$
begin
  select f.fase into new.fase_atual
  from public.fases_mascote f
  where f.xp_minimo <= new.xp_total
  order by f.xp_minimo desc
  limit 1;
  return new;
end $$;

drop trigger if exists trg_xp_fase on public.xp_usuario;
create trigger trg_xp_fase
  before insert or update of xp_total on public.xp_usuario
  for each row execute function public.fn_atualizar_fase_mascote();

-- Corrige quem já tem XP
update public.xp_usuario set xp_total = xp_total;

-- ============================================================
-- 2. INSÍGNIAS: critério declarativo + "vista"
-- ============================================================
alter table public.insignias
  add column if not exists codigo   text unique,
  add column if not exists criterio jsonb not null default '{}'::jsonb,
  add column if not exists ordem    integer not null default 0,
  add column if not exists ativa    boolean not null default true;

alter table public.insignias_usuario
  add column if not exists vista boolean not null default false;

-- um usuário não ganha a mesma insígnia duas vezes
do $$ begin
  alter table public.insignias_usuario
    add constraint insignias_usuario_unico unique (usuario_id, insignia_id);
exception when duplicate_table or duplicate_object then null; end $$;

-- Tipos de critério suportados por avaliar_insignias():
--   licoes      {"tipo":"licoes","min":N}            lições concluídas
--   xp          {"tipo":"xp","min":N}                XP total
--   sequencia   {"tipo":"sequencia","min":N}         maior sequência de dias
--   agua        {"tipo":"agua","min":N}              registros de água
--   refeicao    {"tipo":"refeicao","min":N}          refeições registradas
--   atividade   {"tipo":"atividade","min":N}         atividades físicas registradas
--   amigos      {"tipo":"amigos","min":N}            amizades aceitas
--   trilha      {"tipo":"trilha"} + insignias.trilha_id   trilha 100% concluída
insert into public.insignias (codigo, nome, descricao, icone, criterio, ordem) values
  ('primeiro_passo', 'Primeiro passo',   'Concluiu sua primeira lição.',        'school',          '{"tipo":"licoes","min":1}',     10),
  ('estudioso',      'Estudioso',        'Concluiu 10 lições.',                 'book',            '{"tipo":"licoes","min":10}',    20),
  ('mestre_trilha',  'Mestre das trilhas','Concluiu 30 lições.',                'trophy',          '{"tipo":"licoes","min":30}',    30),
  ('fogo_3',         'Pegando fogo',     '3 dias seguidos cuidando de você.',   'flame',           '{"tipo":"sequencia","min":3}',  40),
  ('fogo_7',         'Semana de ouro',   '7 dias seguidos!',                    'medal',           '{"tipo":"sequencia","min":7}',  50),
  ('fogo_30',        'Imparável',        '30 dias seguidos!',                   'rocket',          '{"tipo":"sequencia","min":30}', 60),
  ('hidratado',      'Hidratado',        'Registrou água pela primeira vez.',   'water',           '{"tipo":"agua","min":1}',       70),
  ('prato_colorido', 'Prato colorido',   'Registrou 5 refeições.',              'restaurant',      '{"tipo":"refeicao","min":5}',   80),
  ('em_movimento',   'Em movimento',     'Registrou sua primeira atividade.',   'bicycle',         '{"tipo":"atividade","min":1}',  90),
  ('parceria',       'Parceria',         'Fez seu primeiro amigo no app.',      'people',          '{"tipo":"amigos","min":1}',     100),
  ('xp_500',         'Broxis cresceu!',  'Chegou a 500 XP.',                    'sparkles',        '{"tipo":"xp","min":500}',       110)
on conflict (codigo) do update
  set nome = excluded.nome, descricao = excluded.descricao, icone = excluded.icone,
      criterio = excluded.criterio, ordem = excluded.ordem;

alter table public.insignias enable row level security;
drop policy if exists "insignias_leitura" on public.insignias;
create policy "insignias_leitura" on public.insignias
  for select to authenticated using (ativa);

alter table public.insignias_usuario enable row level security;
drop policy if exists "insignias_usuario_leitura" on public.insignias_usuario;
create policy "insignias_usuario_leitura" on public.insignias_usuario
  for select to authenticated using (usuario_id = auth.uid());
drop policy if exists "insignias_usuario_marcar_vista" on public.insignias_usuario;
create policy "insignias_usuario_marcar_vista" on public.insignias_usuario
  for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
-- INSERT só pela função abaixo (security definer): o app não consegue se dar insígnia.

-- ============================================================
-- 3. AVALIAÇÃO (concede o que o usuário já merece e ainda não tem)
-- ============================================================
create or replace function public.avaliar_insignias(p_usuario uuid)
returns setof public.insignias
language plpgsql security definer set search_path = public as $$
declare
  v_licoes int; v_xp int; v_seq int; v_agua int; v_refeicao int; v_ativ int; v_amigos int;
begin
  select count(*) into v_licoes from progresso_licao where usuario_id = p_usuario;
  select coalesce(max(xp_total),0) into v_xp from xp_usuario where usuario_id = p_usuario;
  select coalesce(max(maior_sequencia),0) into v_seq from profiles where id = p_usuario;
  select count(*) into v_agua from registros_agua a
    join registros_diarios d on d.id = a.registro_diario_id where d.user_id = p_usuario;
  select count(*) into v_refeicao from refeicoes r
    join registros_diarios d on d.id = r.registro_diario_id
    where d.user_id = p_usuario and r.realizada;
  select count(*) into v_ativ from registros_atividade_fisica a
    join registros_diarios d on d.id = a.registro_diario_id where d.user_id = p_usuario;
  select count(*) into v_amigos from amizades
    where status = 'aceita' and p_usuario in (solicitante_id, destinatario_id);

  return query
  with merecidas as (
    select i.id from insignias i
    where i.ativa and not exists (
      select 1 from insignias_usuario iu where iu.usuario_id = p_usuario and iu.insignia_id = i.id)
    and (
      (i.criterio->>'tipo' = 'licoes'    and v_licoes   >= (i.criterio->>'min')::int) or
      (i.criterio->>'tipo' = 'xp'        and v_xp       >= (i.criterio->>'min')::int) or
      (i.criterio->>'tipo' = 'sequencia' and v_seq      >= (i.criterio->>'min')::int) or
      (i.criterio->>'tipo' = 'agua'      and v_agua     >= (i.criterio->>'min')::int) or
      (i.criterio->>'tipo' = 'refeicao'  and v_refeicao >= (i.criterio->>'min')::int) or
      (i.criterio->>'tipo' = 'atividade' and v_ativ     >= (i.criterio->>'min')::int) or
      (i.criterio->>'tipo' = 'amigos'    and v_amigos   >= (i.criterio->>'min')::int) or
      (i.criterio->>'tipo' = 'trilha' and i.trilha_id is not null and not exists (
        select 1 from licoes l join modulos_trilha m on m.id = l.modulo_id
        where m.trilha_id = i.trilha_id and not exists (
          select 1 from progresso_licao p where p.licao_id = l.id and p.usuario_id = p_usuario))
        and exists (select 1 from modulos_trilha m where m.trilha_id = i.trilha_id))
    )
  ), novas as (
    insert into insignias_usuario (usuario_id, insignia_id)
    select p_usuario, id from merecidas
    on conflict (usuario_id, insignia_id) do nothing
    returning insignia_id
  )
  select i.* from insignias i join novas n on n.insignia_id = i.id;
end $$;

-- RPC chamada pelo app (sempre para o próprio usuário logado)
create or replace function public.avaliar_minhas_insignias()
returns setof public.insignias
language sql security definer set search_path = public as $$
  select * from public.avaliar_insignias(auth.uid());
$$;
revoke all on function public.avaliar_insignias(uuid) from public, anon, authenticated;
grant execute on function public.avaliar_minhas_insignias() to authenticated;

-- Toda lição concluída gera XP -> reavalia ali mesmo (cobre lições e trilhas)
create or replace function public.fn_avaliar_apos_xp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.avaliar_insignias(new.usuario_id);
  return new;
end $$;

drop trigger if exists trg_xp_insignias on public.xp_usuario;
create trigger trg_xp_insignias
  after insert or update of xp_total on public.xp_usuario
  for each row execute function public.fn_avaliar_apos_xp();
