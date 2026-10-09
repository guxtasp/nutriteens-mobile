-- MIGRAÇÃO: CARTAS COLECIONÁVEIS DOS 10 PASSOS DO GUIA ALIMENTAR
-- Execute no SQL Editor do Supabase. Idempotente.
-- Requer: profiles, progresso_licao, registros_diarios, refeicoes, refeicao_alimentos,
--         alimentos, eventos_app (e opcionalmente trilhas, para critério 'trilha').
--
-- Regras:
--  * 1 carta por passo do Guia (10 cartas). O catálogo é gerido por esta migration
--    (o app só lê), igual ao catálogo de insígnias;
--  * a carta é concedida pelo banco (avaliar_cartas), nunca pelo app;
--  * cartas são PRIVADAS: não entram em social_perfil_amigo, então nenhum amigo vê;
--  * nada de dado corporal; os critérios usam só hábitos (registros, lições, receitas);
--  * texto ILUSTRATIVO: precisa de revisão do nutricionista antes de ir para os adolescentes.
--
-- Critérios (cartas_guia.criterio):
--   {"tipo":"licoes","min":N}               lições concluídas
--   {"tipo":"in_natura","min":N}            alimentos IN_NATURA registrados em refeições realizadas
--   {"tipo":"refeicoes_sem_ultra","min":N}  refeições realizadas (com itens) sem nenhum ultraprocessado
--   {"tipo":"dias_refeicao","min":N}        dias distintos com refeição registrada
--   {"tipo":"receitas","min":N}             receitas distintas concluídas no passo a passo
--   {"tipo":"trilha"} + trilha_id           trilha inteira concluída (igual às insígnias)
begin;

-- ============================================================
-- 1. TABELAS
-- ============================================================
create table if not exists public.cartas_guia (
  id uuid primary key default gen_random_uuid(),
  passo smallint not null unique check (passo between 1 and 10),
  -- chave da arte no app (cartas/data/cartasArte.ts); a arte NÃO fica no banco
  codigo text not null unique check (codigo ~ '^[a-z0-9_]{1,40}$'),
  titulo text not null check (char_length(titulo) between 1 and 60),
  resumo text not null check (char_length(resumo) between 1 and 400),
  dica text not null check (char_length(dica) between 1 and 240),
  como_ganhar text not null check (char_length(como_ganhar) between 1 and 160),
  criterio jsonb not null default '{}'::jsonb,
  trilha_id uuid references public.trilhas(id) on delete set null,
  ativa boolean not null default true
);

create table if not exists public.cartas_usuario (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.profiles(id) on delete cascade,
  carta_id uuid not null references public.cartas_guia(id) on delete cascade,
  obtida_em timestamptz not null default now(),
  vista boolean not null default false,
  unique (usuario_id, carta_id)
);
create index if not exists cartas_usuario_usuario_idx on public.cartas_usuario (usuario_id);

-- ============================================================
-- 2. ACESSO: só leitura direta; escrita só pelas funções abaixo
-- ============================================================
alter table public.cartas_guia enable row level security;
alter table public.cartas_usuario enable row level security;

revoke all on public.cartas_guia from anon, authenticated;
revoke all on public.cartas_usuario from anon, authenticated;
grant select on public.cartas_guia to authenticated;
grant select on public.cartas_usuario to authenticated;

drop policy if exists "cartas_guia_leitura" on public.cartas_guia;
create policy "cartas_guia_leitura" on public.cartas_guia
  for select to authenticated using (ativa);

drop policy if exists "cartas_usuario_leitura" on public.cartas_usuario;
create policy "cartas_usuario_leitura" on public.cartas_usuario
  for select to authenticated using (usuario_id = auth.uid());

-- ============================================================
-- 3. CATÁLOGO (upsert por passo). Texto ilustrativo, revisar com a nutricionista.
-- ============================================================
insert into public.cartas_guia (passo, codigo, titulo, resumo, dica, como_ganhar, criterio) values
  (1, 'passo_01_comida_de_verdade', 'Comida de verdade',
   'A base do prato é alimento in natura ou minimamente processado: frutas, verduras, legumes, feijão, arroz, ovos, carnes e leite. Eles vêm da natureza ou quase isso.',
   'Monte o prato com bastante cor. Quanto mais comida de verdade, melhor.',
   'Registre 10 alimentos in natura nas suas refeições.',
   '{"tipo":"in_natura","min":10}'),
  (2, 'passo_02_tempero_na_medida', 'Tempero na medida',
   'Óleo, gordura, sal e açúcar entram só em pequenas quantidades, para dar sabor à comida de verdade. Eles ajudam a cozinhar, mas não são o destaque do prato.',
   'Experimente temperar com alho, cebola, ervas e limão.',
   'Conclua 2 lições da trilha.',
   '{"tipo":"licoes","min":2}'),
  (3, 'passo_03_calma_nos_processados', 'Calma nos processados',
   'Alimentos processados, como pão, queijo e conservas, são comida de verdade com sal, açúcar ou óleo a mais. Podem entrar na refeição, mas como complemento e não como base.',
   'Use como acompanhamento: um pouco de queijo no pão, por exemplo.',
   'Conclua 4 lições da trilha.',
   '{"tipo":"licoes","min":4}'),
  (4, 'passo_04_fora_ultraprocessados', 'Ultraprocessados? Fora!',
   'Refrigerante, salgadinho, biscoito recheado e macarrão instantâneo têm muitos ingredientes de fábrica e pouca comida de verdade. O Guia recomenda evitar.',
   'Antes de escolher, pergunte: dá pra imaginar isso na cozinha lá de casa?',
   'Registre 5 refeições sem nenhum ultraprocessado.',
   '{"tipo":"refeicoes_sem_ultra","min":5}'),
  (5, 'passo_05_com_calma_e_companhia', 'Com calma e companhia',
   'Coma em horários regulares, com atenção, em lugares tranquilos e, quando der, com companhia: família ou amigos. Comer sem pressa deixa a comida mais gostosa.',
   'Na próxima refeição, que tal deixar o celular um pouco de lado?',
   'Registre refeições em 7 dias diferentes.',
   '{"tipo":"dias_refeicao","min":7}'),
  (6, 'passo_06_compras_com_variedade', 'Compras com variedade',
   'Prefira comprar em feiras, mercados e lugares que vendem muita variedade de alimentos in natura. Quem escolhe onde comprar ajuda a escolher o que vai para a mesa.',
   'Sugira uma ida à feira com a família e escolha uma fruta nova.',
   'Conclua 6 lições da trilha.',
   '{"tipo":"licoes","min":6}'),
  (7, 'passo_07_mao_na_massa', 'Mão na massa',
   'Cozinhar é uma habilidade que se aprende e se divide. Quanto mais você cozinha, mais fácil fica comer bem, e mais divertido é dividir com os outros.',
   'Peça para alguém da família te ensinar uma receita.',
   'Conclua uma receita pelo passo a passo.',
   '{"tipo":"receitas","min":1}'),
  (8, 'passo_08_tempo_para_comer_bem', 'Tempo para comer bem',
   'Organizar o tempo, como planejar as compras e deixar coisas adiantadas, abre espaço para comer bem sem correria. Alimentação merece lugar na agenda.',
   'Escolha um momento da semana para pensar no que vai comer.',
   'Conclua 8 lições da trilha.',
   '{"tipo":"licoes","min":8}'),
  (9, 'passo_09_fora_de_casa', 'Fora de casa, comida na hora',
   'Quando for comer fora, prefira lugares que servem comida feita na hora, em vez de lanches prontos e ultraprocessados.',
   'Dê uma olhada no cardápio e escolha o prato que parece mais com comida de casa.',
   'Conclua 10 lições da trilha.',
   '{"tipo":"licoes","min":10}'),
  (10, 'passo_10_olho_na_propaganda', 'De olho na propaganda',
   'Propaganda de comida quer vender, nem sempre quer informar. Seja crítico com o que vê e ouve, leia o rótulo e confie em fontes como o Guia e profissionais de saúde.',
   'Na próxima propaganda, pergunte: o que estão tentando me vender?',
   'Conclua 12 lições da trilha.',
   '{"tipo":"licoes","min":12}')
on conflict (passo) do update
  set codigo = excluded.codigo, titulo = excluded.titulo, resumo = excluded.resumo,
      dica = excluded.dica, como_ganhar = excluded.como_ganhar, criterio = excluded.criterio;

-- ============================================================
-- 4. AVALIAÇÃO (concede o que o usuário já merece e ainda não tem)
-- ============================================================
create or replace function public.avaliar_cartas(p_usuario uuid)
returns setof public.cartas_guia
language plpgsql security definer set search_path = public as $$
declare
  v_licoes int; v_in_natura int; v_sem_ultra int; v_dias int; v_receitas int;
begin
  select count(*) into v_licoes from progresso_licao where usuario_id = p_usuario;

  -- alimentos IN_NATURA em refeições realizadas
  select count(*) into v_in_natura
    from refeicao_alimentos ra
    join refeicoes r on r.id = ra.refeicao_id and r.realizada
    join registros_diarios d on d.id = r.registro_diario_id
    join alimentos a on a.id = ra.alimento_id
   where d.user_id = p_usuario and a.classificacao_nova::text = 'IN_NATURA';

  -- refeições realizadas, com pelo menos 1 item, sem nenhum ultraprocessado
  select count(*) into v_sem_ultra
    from refeicoes r
    join registros_diarios d on d.id = r.registro_diario_id
   where d.user_id = p_usuario and r.realizada
     and exists (select 1 from refeicao_alimentos ra where ra.refeicao_id = r.id)
     and not exists (
       select 1 from refeicao_alimentos ra
         join alimentos a on a.id = ra.alimento_id
        where ra.refeicao_id = r.id and a.classificacao_nova::text = 'ULTRAPROCESSADO');

  -- dias distintos com refeição registrada
  select count(distinct d.data) into v_dias
    from refeicoes r
    join registros_diarios d on d.id = r.registro_diario_id
   where d.user_id = p_usuario and r.realizada;

  -- receitas distintas concluídas (eventos_app só aceita o próprio usuário; aqui lemos como definer)
  select count(distinct coalesce(e.props->>'receita_id', e.id::text)) into v_receitas
    from eventos_app e
   where e.user_id = p_usuario and e.nome = 'receita_concluida';

  return query
  with merecidas as (
    select c.id from cartas_guia c
    where c.ativa and not exists (
      select 1 from cartas_usuario cu where cu.usuario_id = p_usuario and cu.carta_id = c.id)
    and (
      (c.criterio->>'tipo' = 'licoes'              and v_licoes    >= (c.criterio->>'min')::int) or
      (c.criterio->>'tipo' = 'in_natura'           and v_in_natura >= (c.criterio->>'min')::int) or
      (c.criterio->>'tipo' = 'refeicoes_sem_ultra' and v_sem_ultra >= (c.criterio->>'min')::int) or
      (c.criterio->>'tipo' = 'dias_refeicao'       and v_dias      >= (c.criterio->>'min')::int) or
      (c.criterio->>'tipo' = 'receitas'            and v_receitas  >= (c.criterio->>'min')::int) or
      (c.criterio->>'tipo' = 'trilha' and c.trilha_id is not null and not exists (
        select 1 from licoes l join modulos_trilha m on m.id = l.modulo_id
        where m.trilha_id = c.trilha_id and not exists (
          select 1 from progresso_licao p where p.licao_id = l.id and p.usuario_id = p_usuario))
        and exists (select 1 from modulos_trilha m where m.trilha_id = c.trilha_id))
    )
  ), novas as (
    insert into cartas_usuario (usuario_id, carta_id)
    select p_usuario, id from merecidas
    on conflict (usuario_id, carta_id) do nothing
    returning carta_id
  )
  select c.* from cartas_guia c join novas n on n.carta_id = c.id;
end $$;

-- RPC chamada pelo app (sempre para o próprio usuário logado)
create or replace function public.avaliar_minhas_cartas()
returns setof public.cartas_guia
language sql security definer set search_path = public as $$
  select * from public.avaliar_cartas(auth.uid());
$$;

-- Marca UMA carta como vista (só se for do próprio usuário)
create or replace function public.cartas_marcar_vista(p_carta_id uuid)
returns void
language sql security definer set search_path = public as $$
  update public.cartas_usuario set vista = true
   where usuario_id = auth.uid() and carta_id = p_carta_id and not vista;
$$;

revoke all on function public.avaliar_cartas(uuid) from public, anon, authenticated;
revoke all on function public.avaliar_minhas_cartas() from public, anon;
revoke all on function public.cartas_marcar_vista(uuid) from public, anon;
grant execute on function public.avaliar_minhas_cartas() to authenticated;
grant execute on function public.cartas_marcar_vista(uuid) to authenticated;

-- Mesmo gatilho das insígnias: toda lição concluída gera XP -> reavalia as cartas ali mesmo.
-- (Cartas de hábito, como refeições e receitas, são reavaliadas ao abrir o álbum/perfil.)
create or replace function public.fn_avaliar_cartas_apos_xp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.avaliar_cartas(new.usuario_id);
  return new;
end $$;

drop trigger if exists trg_xp_cartas on public.xp_usuario;
create trigger trg_xp_cartas
  after insert or update of xp_total on public.xp_usuario
  for each row execute function public.fn_avaliar_cartas_apos_xp();

commit;
