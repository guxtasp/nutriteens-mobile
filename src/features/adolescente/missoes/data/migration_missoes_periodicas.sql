-- Missões SEMANAIS e MENSAIS. Idempotente (pode rodar mais de uma vez).
-- As missões DIÁRIAS continuam em missoes_catalogo / missoes_diarias.
-- Os números de `alvo` e `pontos_recompensa` abaixo são sugestões: ajuste à vontade
-- com UPDATE, sem lançar versão nova do app.

-- ============================================================
-- 1. CATÁLOGO (somente leitura para o app)
-- ============================================================
create table if not exists public.missoes_periodicas_catalogo (
  codigo            text primary key,
  periodo           text not null check (periodo in ('SEMANAL','MENSAL')),
  titulo            text not null,
  descricao         text not null,
  icone             text,                                   -- emoji
  metrica           text not null check (metrica in (
    'DIAS_AGUA_META','DIAS_ATIVIDADE_META','DIAS_COM_REGISTRO','DIAS_FONTE_NUTRIENTE',
    'REFEICOES_SEM_ULTRAPROCESSADO','MINUTOS_ATIVIDADE','LICOES','MISSOES_DIARIAS')),
  alvo              integer not null check (alvo > 0),
  parametros        jsonb not null default '{}'::jsonb,     -- ex.: {"nutriente":"proteina"}
  pontos_recompensa integer not null default 30 check (pontos_recompensa >= 0),
  ordem             integer not null default 0,
  ativa             boolean not null default true
);

insert into public.missoes_periodicas_catalogo
  (codigo, periodo, titulo, descricao, icone, metrica, alvo, parametros, pontos_recompensa, ordem) values
  -- SEMANAIS (semana = segunda a domingo)
  ('sem_agua_5',      'SEMANAL', 'Semana hidratada',   'Bata sua meta de água em 5 dias da semana.',                 '💧', 'DIAS_AGUA_META',      5, '{}',                       40, 10),
  ('sem_atividade_4', 'SEMANAL', 'Semana em movimento','Fique ativo o suficiente em 4 dias da semana.',              '🏃', 'DIAS_ATIVIDADE_META', 4, '{}',                       40, 20),
  ('sem_proteina_4',  'SEMANAL', 'Proteína em dia',    'Coma uma boa fonte de proteína em 4 dias da semana.',        '🥚', 'DIAS_FONTE_NUTRIENTE',4, '{"nutriente":"proteina"}', 30, 30),
  ('sem_registro_5',  'SEMANAL', 'Diário em dia',      'Registre algo (água, comida ou atividade) em 5 dias.',       '📝', 'DIAS_COM_REGISTRO',   5, '{}',                       30, 40),
  ('sem_missoes_4',   'SEMANAL', 'Mestre das missões', 'Cumpra a missão do dia em 4 dias da semana.',                '🎯', 'MISSOES_DIARIAS',     4, '{}',                       50, 50),
  ('sem_licoes_3',    'SEMANAL', 'Hora de aprender',   'Conclua 3 lições da trilha nesta semana.',                   '📚', 'LICOES',              3, '{}',                       30, 60),
  -- MENSAIS (mês corrido)
  ('men_agua_20',     'MENSAL',  'Mês hidratado',      'Bata sua meta de água em 20 dias do mês.',                   '💧', 'DIAS_AGUA_META',      20,'{}',                       150,10),
  ('men_atividade_12','MENSAL',  'Mês em movimento',   'Fique ativo o suficiente em 12 dias do mês.',                '🏃', 'DIAS_ATIVIDADE_META', 12,'{}',                       150,20),
  ('men_fibra_15',    'MENSAL',  'Fibras no prato',    'Coma uma boa fonte de fibra em 15 dias do mês.',             '🥦', 'DIAS_FONTE_NUTRIENTE',15,'{"nutriente":"fibra"}',    100,30),
  ('men_ultra_20',    'MENSAL',  'Prato de verdade',   'Faça 20 refeições sem ultraprocessados no mês.',             '🥗', 'REFEICOES_SEM_ULTRAPROCESSADO',20,'{}',              120,40),
  ('men_registro_20', 'MENSAL',  'Hábito firme',       'Registre algo em 20 dias do mês.',                           '📝', 'DIAS_COM_REGISTRO',   20,'{}',                       120,50),
  ('men_missoes_15',  'MENSAL',  'Campeão das missões','Cumpra a missão do dia em 15 dias do mês.',                  '🏆', 'MISSOES_DIARIAS',     15,'{}',                       200,60),
  ('men_licoes_10',   'MENSAL',  'Estudante do mês',   'Conclua 10 lições da trilha neste mês.',                     '🎓', 'LICOES',              10,'{}',                       100,70)
on conflict (codigo) do update
  set periodo = excluded.periodo, titulo = excluded.titulo, descricao = excluded.descricao,
      icone = excluded.icone, metrica = excluded.metrica, alvo = excluded.alvo,
      parametros = excluded.parametros, pontos_recompensa = excluded.pontos_recompensa,
      ordem = excluded.ordem;

alter table public.missoes_periodicas_catalogo enable row level security;
drop policy if exists "missoes_periodicas_leitura" on public.missoes_periodicas_catalogo;
create policy "missoes_periodicas_leitura" on public.missoes_periodicas_catalogo
  for select to authenticated using (true);
revoke insert, update, delete on public.missoes_periodicas_catalogo from anon, authenticated;

-- ============================================================
-- 2. RESGATES: garante que os pontos de cada missão saem UMA vez por período
-- ============================================================
create table if not exists public.missoes_periodicas_resgates (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id),
  codigo         text not null references public.missoes_periodicas_catalogo(codigo),
  periodo_inicio date not null,                 -- 1º dia da semana (segunda) ou do mês
  pontos         integer not null check (pontos >= 0),
  criado_em      timestamptz not null default now(),
  unique (user_id, codigo, periodo_inicio)
);

alter table public.missoes_periodicas_resgates enable row level security;
drop policy if exists "resgates_leitura" on public.missoes_periodicas_resgates;
create policy "resgates_leitura" on public.missoes_periodicas_resgates
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "resgates_insercao" on public.missoes_periodicas_resgates;
create policy "resgates_insercao" on public.missoes_periodicas_resgates
  for insert to authenticated with check (user_id = auth.uid());
revoke update, delete on public.missoes_periodicas_resgates from anon, authenticated;
