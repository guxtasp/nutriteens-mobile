-- Sistema de Conquistas / Marcos / Insígnias.
-- Roda DEPOIS de migration_gamificacao_perfil.sql. Idempotente.
--
--   Conquista -> ação comum        -> componente padrão (ícone Ionicons)
--   Marco     -> grande progresso  -> componente padrão com destaque + número
--   Insígnia  -> reconhecimento especial -> arte exclusiva (PLACEHOLDER por enquanto)

-- ============================================================
-- 1. CATEGORIA + VISUAL (a arte da insígnia NÃO fica no banco)
-- ============================================================
alter table public.insignias
  add column if not exists categoria text not null default 'conquista';

do $$ begin
  alter table public.insignias
    add constraint insignias_categoria_chk check (categoria in ('conquista','marco','insignia'));
exception when duplicate_object then null; end $$;

-- A arte das insígnias é um asset do app, mapeado por `codigo`
-- (perfil/data/insigniasArte.ts). Assim nenhuma tela/rota de admin consegue
-- trocá-la: só quem mexe no código/design.

-- ============================================================
-- 2. CATÁLOGO (upsert por codigo)
--    icone = nome Ionicons (conquista/marco). Para insígnia é só fallback.
--    criterio.min vira o número exibido no Marco.
-- ============================================================
insert into public.insignias (codigo, categoria, nome, descricao, icone, criterio, ordem) values
  -- CONQUISTAS: ação comum
  ('primeiro_passo', 'conquista', 'Primeira lição',      'Concluiu sua primeira lição.',            'school',     '{"tipo":"licoes","min":1}',      10),
  ('primeira_atividade','conquista','Primeira atividade','Registrou sua primeira atividade física.','walk',       '{"tipo":"atividade","min":1}',   20),
  ('primeiro_alimento','conquista','Primeiro alimento',  'Registrou seu primeiro alimento.',        'nutrition',  '{"tipo":"alimento","min":1}',    30),
  ('hidratado',      'conquista', 'Hidratado',           'Registrou água pela primeira vez.',       'water',      '{"tipo":"agua","min":1}',        40),
  ('primeiro_desafio','conquista','Desafio cumprido',    'Completou um desafio do dia.',            'flag',       '{"tipo":"missao","min":1}',      50),
  ('atividade_10',   'conquista', '10 atividades',       'Realizou 10 atividades físicas.',         'fitness',    '{"tipo":"atividade","min":10}',  60),
  ('estudioso',      'conquista', 'Estudioso',           'Concluiu 10 lições.',                     'book',       '{"tipo":"licoes","min":10}',     70),
  ('prato_colorido', 'conquista', 'Prato colorido',      'Registrou 5 refeições.',                  'restaurant', '{"tipo":"refeicao","min":5}',    80),
  ('fogo_3',         'conquista', 'Pegando fogo',        '3 dias seguidos cuidando de você.',       'flame',      '{"tipo":"sequencia","min":3}',   90),
  ('fogo_7',         'conquista', 'Semana de ouro',      '7 dias seguidos!',                        'flame',      '{"tipo":"sequencia","min":7}',   100),
  ('parceria',       'conquista', 'Parceria',            'Fez seu primeiro amigo no app.',          'people',     '{"tipo":"amigos","min":1}',      110),
  ('xp_500',         'conquista', 'Broxis cresceu!',     'Chegou a 500 XP.',                        'sparkles',   '{"tipo":"xp","min":500}',        120),
  -- MARCOS: grande progresso (mesmo componente, com destaque e número)
  ('atividade_50',   'marco',     '50 atividades',       'Concluiu 50 atividades físicas.',         'fitness',    '{"tipo":"atividade","min":50}',  200),
  ('mestre_trilha',  'marco',     '30 lições',           'Concluiu 30 lições.',                     'book',       '{"tipo":"licoes","min":30}',     210),
  ('fogo_30',        'marco',     '30 dias de sequência','30 dias seguidos cuidando de você!',      'flame',      '{"tipo":"sequencia","min":30}',  220),
  ('registros_100',  'marco',     '100 registros',       'Fez 100 registros diários.',              'create',     '{"tipo":"registros","min":100}', 230),
  -- INSÍGNIAS: arte exclusiva (placeholder até o design entregar)
  ('explorador_alimentos','insignia','Explorador dos Alimentos','Registrou 30 alimentos diferentes.','nutrition','{"tipo":"alimentos_distintos","min":30}', 300),
  ('mestre_movimento','insignia','Mestre do Movimento',  'Concluiu 100 atividades físicas.',        'trophy',     '{"tipo":"atividade","min":100}', 310),
  ('super_broxis',   'insignia',  'Super Broxis',        'Chegou a 1500 XP e fez o Broxis crescer por completo.','star','{"tipo":"xp","min":1500}', 320)
on conflict (codigo) do update
  set categoria = excluded.categoria, nome = excluded.nome, descricao = excluded.descricao,
      icone = excluded.icone, criterio = excluded.criterio, ordem = excluded.ordem;

-- ============================================================
-- 3. SOMENTE LEITURA para o app (inclusive admin): catálogo é gerido por migration
-- ============================================================
revoke insert, update, delete on public.insignias from anon, authenticated;
revoke insert, delete on public.insignias_usuario from anon, authenticated;
revoke update on public.insignias_usuario from anon, authenticated;
grant  update (vista) on public.insignias_usuario to authenticated;

-- ============================================================
-- 4. AVALIAÇÃO com os novos critérios
--    novos tipos: alimento, alimentos_distintos, registros, missao
-- ============================================================
create or replace function public.avaliar_insignias(p_usuario uuid)
returns setof public.insignias
language plpgsql security definer set search_path = public as $$
declare
  v_licoes int; v_xp int; v_seq int; v_agua int; v_refeicao int; v_ativ int; v_amigos int;
  v_alimento int; v_distintos int; v_registros int; v_missao int;
begin
  select count(*) into v_licoes from progresso_licao where usuario_id = p_usuario;
  select coalesce(max(xp_total),0) into v_xp from xp_usuario where usuario_id = p_usuario;
  select coalesce(max(maior_sequencia),0) into v_seq from profiles where id = p_usuario;
  select count(*) into v_agua from registros_agua a
    join registros_diarios d on d.id = a.registro_diario_id where d.user_id = p_usuario;
  select count(*) into v_refeicao from refeicoes r
    join registros_diarios d on d.id = r.registro_diario_id
    where d.user_id = p_usuario and r.realizada;
  select count(*), count(distinct ra.alimento_id) into v_alimento, v_distintos
    from refeicao_alimentos ra
    join refeicoes r on r.id = ra.refeicao_id
    join registros_diarios d on d.id = r.registro_diario_id
    where d.user_id = p_usuario;
  select count(*) into v_ativ from registros_atividade_fisica a
    join registros_diarios d on d.id = a.registro_diario_id where d.user_id = p_usuario;
  select count(*) into v_registros from registros_diarios where user_id = p_usuario;
  select count(*) into v_missao from missoes_diarias where user_id = p_usuario and xp_concedido;
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
      (i.criterio->>'tipo' = 'alimento'  and v_alimento >= (i.criterio->>'min')::int) or
      (i.criterio->>'tipo' = 'alimentos_distintos' and v_distintos >= (i.criterio->>'min')::int) or
      (i.criterio->>'tipo' = 'atividade' and v_ativ     >= (i.criterio->>'min')::int) or
      (i.criterio->>'tipo' = 'registros' and v_registros >= (i.criterio->>'min')::int) or
      (i.criterio->>'tipo' = 'missao'    and v_missao   >= (i.criterio->>'min')::int) or
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

revoke all on function public.avaliar_insignias(uuid) from public, anon, authenticated;
