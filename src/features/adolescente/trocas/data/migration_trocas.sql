-- migration_trocas.sql — RF015 (Fase 1): trocas saudáveis / módulo Comer
-- Idempotente. Rodar DEPOIS de migration_permissoes_conteudo.sql e migration_analytics_eventos.sql.
--
--  * EBIA ordena, nunca exclui: a RPC devolve só um booleano (destino_acessivel);
--    o nível EBIA nunca sai do banco para o adolescente.
--  * Troca só chega ao adolescente PUBLICADA (conteudo_fluxo, tipo TROCA).
--  * Tabela de trocas sem acesso direto do adolescente; leitura via trocas_listar().
begin;

-- 1. Categoria de troca no catálogo ------------------------------------------
alter table public.alimentos add column if not exists categoria_troca text
  check (categoria_troca in ('REFRIGERANTE_BEBIDA','DOCE','SALGADINHO','EMBUTIDO'));

-- preenche só o que está vazio, por nome; o resto usa o fallback por grupo no app
update public.alimentos set categoria_troca = case
  when nome ~* '(refrigerante|suco de caixinha|suco em p[óo]|n[ée]ctar|energ[ée]tico|achocolatado|refresco)' then 'REFRIGERANTE_BEBIDA'
  when nome ~* '(salsicha|lingui[çc]a|presunto|mortadela|salame|apresuntado|peito de peru|nugget|empanado)' then 'EMBUTIDO'
  when nome ~* '(salgadinho|chips|snack)' then 'SALGADINHO'
  when nome ~* '(bala|doce|chocolate|sorvete|bolo de pacote|biscoito recheado|bolacha recheada|pirulito|goma|chiclete)' then 'DOCE'
end
where categoria_troca is null;

-- 2. Trocas ---------------------------------------------------------------------
create table if not exists public.alimento_trocas (
  id             uuid primary key default gen_random_uuid(),
  categoria      text not null check (categoria in ('REFRIGERANTE_BEBIDA','DOCE','SALGADINHO','EMBUTIDO')),
  origem_id      uuid references public.alimentos(id) on delete cascade,   -- null = troca genérica da categoria
  destino_id     uuid not null references public.alimentos(id) on delete cascade,
  tipos_refeicao public.enum_tipo_refeicao[] not null default '{}',        -- vazio = vale para qualquer refeição
  frase          text not null check (char_length(frase) between 1 and 240),
  rapida         boolean not null default false,                           -- "rápido de levar"
  ordem          integer not null default 0,
  criado_por     uuid references public.profiles(id),
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  unique nulls not distinct (categoria, origem_id, destino_id)
);
create index if not exists alimento_trocas_categoria_idx on public.alimento_trocas (categoria, ordem);

alter table public.alimento_trocas enable row level security;
revoke all on public.alimento_trocas from anon, authenticated;
grant select, insert, update, delete on public.alimento_trocas to authenticated;
drop policy if exists "trocas_staff" on public.alimento_trocas;
create policy "trocas_staff" on public.alimento_trocas for all to authenticated
  using (public.papel_atual() in ('NUTRICIONISTA','ADMIN'))
  with check (public.papel_atual() in ('NUTRICIONISTA','ADMIN'));

-- 3. Fluxo de aprovação: tipo TROCA -------------------------------------------
alter table public.conteudo_fluxo drop constraint if exists conteudo_fluxo_tipo_check;
alter table public.conteudo_fluxo add constraint conteudo_fluxo_tipo_check
  check (tipo in ('TRILHA','RECEITA','TROCA'));

drop trigger if exists trocas_fluxo_criar on public.alimento_trocas;
create trigger trocas_fluxo_criar after insert on public.alimento_trocas
  for each row execute function public.fluxo_criar('TROCA');   -- nasce RASCUNHO (inclusive via SQL Editor)
drop trigger if exists trocas_fluxo_remover on public.alimento_trocas;
create trigger trocas_fluxo_remover after delete on public.alimento_trocas
  for each row execute function public.fluxo_remover('TROCA');

-- 4. Respostas do aluno ---------------------------------------------------------
create table if not exists public.troca_respostas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  troca_id   uuid not null references public.alimento_trocas(id) on delete cascade,
  resposta   text not null check (resposta in ('TENTAR','NAO_TENHO')),
  criado_em  timestamptz not null default now()
);
create index if not exists troca_respostas_user_idx on public.troca_respostas (user_id, criado_em desc);

alter table public.troca_respostas enable row level security;
revoke all on public.troca_respostas from anon, authenticated;
grant select, insert on public.troca_respostas to authenticated;
drop policy if exists "troca_resp_le_proprio" on public.troca_respostas;
create policy "troca_resp_le_proprio" on public.troca_respostas for select to authenticated using (user_id = auth.uid());
drop policy if exists "troca_resp_insere_proprio" on public.troca_respostas;
create policy "troca_resp_insere_proprio" on public.troca_respostas for insert to authenticated with check (user_id = auth.uid());

-- 5. Leitura para o adolescente: só PUBLICADAS, com flags já calculados ---------
create or replace function public._ebia_rank(p text)
returns integer language sql immutable as $$
  select case p when 'SEGURANCA_ALIMENTAR' then 0 when 'INSEGURANCA_LEVE' then 1
                when 'INSEGURANCA_MODERADA' then 2 when 'INSEGURANCA_GRAVE' then 3 end
$$;

create or replace function public.trocas_listar(p_categoria text default null)
returns table (
  id uuid, categoria text, origem_id uuid, origem_nome text,
  destino_id uuid, destino_nome text, tipos_refeicao text[],
  frase text, rapida boolean, ordem integer,
  destino_acessivel boolean, destino_recente boolean, respondida_recente boolean
) language sql stable security definer set search_path = public as $$
  with eu as (
    select public._ebia_rank(p.classificacao_ebia_atual::text) as rank_ebia
    from public.profiles p where p.id = auth.uid()
  ),
  recentes as (   -- destinos que o aluno registrou nos últimos 30 dias
    select distinct ra.alimento_id
    from public.registros_diarios rd
    join public.refeicoes r on r.registro_diario_id = rd.id
    join public.refeicao_alimentos ra on ra.refeicao_id = r.id
    where rd.user_id = auth.uid() and rd.data >= (now() at time zone 'America/Sao_Paulo')::date - 30
  )
  select t.id, t.categoria, t.origem_id, o.nome, t.destino_id, d.nome,
         t.tipos_refeicao::text[], t.frase, t.rapida, t.ordem,
         -- sem triagem (rank nulo) => tudo conta como acessível
         coalesce((select rank_ebia from eu) is null
                  or public._ebia_rank(d.nivel_maximo_ebia::text) >= (select rank_ebia from eu), true),
         d.id in (select alimento_id from recentes),
         exists (select 1 from public.troca_respostas tr
                 where tr.user_id = auth.uid() and tr.troca_id = t.id
                   and tr.criado_em > now() - interval '3 days')
  from public.alimento_trocas t
  join public.conteudo_fluxo f on f.tipo = 'TROCA' and f.conteudo_id = t.id and f.status = 'PUBLICADO'
  join public.alimentos d on d.id = t.destino_id
  left join public.alimentos o on o.id = t.origem_id
  where auth.uid() is not null and (p_categoria is null or t.categoria = p_categoria)
$$;
revoke all on function public.trocas_listar(text) from public, anon;
grant execute on function public.trocas_listar(text) to authenticated;

-- 6. Eventos (só ids, RNF015) -----------------------------------------------------
alter table public.eventos_app drop constraint if exists eventos_app_nome_check;
alter table public.eventos_app add constraint eventos_app_nome_check check (nome in (
  'login','cadastro_concluido','onboarding_concluido','triagem_concluida',
  'alimentacao_registrada','agua_registrada','atividade_registrada',
  'desafio_visualizado','desafio_iniciado','desafio_concluido',
  'trilha_visualizada','trilha_iniciada','trilha_concluida','licao_concluida',
  'receita_visualizada','receita_concluida',
  'amizade_solicitada','amizade_aceita','conteudo_abandonado',
  'troca_sugerida','troca_aceita','troca_recusada'));

commit;
