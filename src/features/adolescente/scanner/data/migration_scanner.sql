-- migration_scanner.sql — Scanner de alimentos (código de barras). VERSÃO DE TESTE / prova de conceito.
-- Idempotente. Rodar DEPOIS de migration_trocas.sql e migration_trocas_painel.sql
-- (usa public.papel_atual() e a lista de eventos de migration_trocas.sql).
--
--  * produtos_scanner: cache de produtos por código de barras. Leitura para qualquer usuário
--    autenticado; escrita direta SÓ da nutricionista/Admin (papel real: 'ADMINISTRADOR').
--  * O app (adolescente) grava o cache da Open Food Facts e o "cadastrar este produto" de teste
--    pela RPC scanner_salvar_produto(): só INSERE, nunca sobrescreve um produto já existente,
--    e só aceita fonte 'OPEN_FOOD_FACTS' (cache). Produto pedido por usuário NÃO entra direto:
--    vira solicitação (migration_scanner_solicitacoes.sql) e a equipe aprova com fonte 'EQUIPE'.
--  * Sem calorias, sem nutriente: só nome, marca, nível de processamento e categoria de troca.
begin;

-- 1. Tabela ----------------------------------------------------------------------------
create table if not exists public.produtos_scanner (
  codigo_barras      text primary key check (codigo_barras ~ '^[0-9]{8,14}$'),
  nome               text not null check (char_length(nome) between 1 and 200),
  marca              text check (marca is null or char_length(marca) <= 120),
  classificacao_nova text check (classificacao_nova in ('IN_NATURA','INGREDIENTE_CULINARIO','PROCESSADO','ULTRAPROCESSADO')),
  categoria_troca    text check (categoria_troca in ('REFRIGERANTE_BEBIDA','DOCE','SALGADINHO','EMBUTIDO','BISCOITO','LANCHE','REFEICAO')),
  fonte              text not null default 'USUARIO' check (fonte in ('OPEN_FOOD_FACTS','USUARIO','EQUIPE')),
  criado_em          timestamptz not null default now()
);

-- dados do rótulo a cada 100 g (açúcar, sal, gordura saturada, fibra, proteína, aditivos, ingredientes, imagem).
-- Sem calorias. Alimenta o "Raio-X do rótulo" da tela de resultado.
alter table public.produtos_scanner add column if not exists detalhes jsonb
  check (detalhes is null or (jsonb_typeof(detalhes) = 'object' and octet_length(detalhes::text) <= 2000));

-- 2. RLS -------------------------------------------------------------------------------
alter table public.produtos_scanner enable row level security;
revoke all on public.produtos_scanner from anon, authenticated;
grant select, insert, update, delete on public.produtos_scanner to authenticated;

drop policy if exists "scanner_le" on public.produtos_scanner;
create policy "scanner_le" on public.produtos_scanner for select to authenticated using (true);

drop policy if exists "scanner_staff" on public.produtos_scanner;
create policy "scanner_staff" on public.produtos_scanner for all to authenticated
  using (public.papel_atual() in ('NUTRICIONISTA','ADMINISTRADOR'))
  with check (public.papel_atual() in ('NUTRICIONISTA','ADMINISTRADOR'));

-- 3. RPC de gravação para o app: só insere, nunca sobrescreve --------------------------------
-- a assinatura mudou (novo p_detalhes): remove a versão antiga para não deixar duas sobrecargas
drop function if exists public.scanner_salvar_produto(text, text, text, text, text, text);

create or replace function public.scanner_salvar_produto(
  p_codigo    text,
  p_nome      text,
  p_marca     text default null,
  p_nova      text default null,
  p_categoria text default null,
  p_fonte     text default 'USUARIO',
  p_detalhes  jsonb default null
) returns public.produtos_scanner
language plpgsql security definer set search_path = public as $$
declare
  v_nome  text := nullif(btrim(coalesce(p_nome, '')), '');
  v_marca text := nullif(btrim(coalesce(p_marca, '')), '');
  v_row   public.produtos_scanner;
begin
  if auth.uid() is null then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  if p_fonte is distinct from 'OPEN_FOOD_FACTS' then
    raise exception 'Fonte inválida.' using errcode = '22023';
  end if;
  if v_nome is null then
    raise exception 'Informe o nome do produto.' using errcode = '22023';
  end if;

  insert into public.produtos_scanner (codigo_barras, nome, marca, classificacao_nova, categoria_troca, fonte, detalhes)
  values (p_codigo, left(v_nome, 200), left(v_marca, 120), p_nova, p_categoria, p_fonte, p_detalhes)
  on conflict (codigo_barras) do nothing;   -- o primeiro registro vale; a equipe ajusta depois

  select * into v_row from public.produtos_scanner where codigo_barras = p_codigo;
  return v_row;
end;
$$;
revoke all on function public.scanner_salvar_produto(text, text, text, text, text, text, jsonb) from public, anon;
grant execute on function public.scanner_salvar_produto(text, text, text, text, text, text, jsonb) to authenticated;

-- 4. Evento (só ids/códigos curtos, sem texto livre) --------------------------------------------
alter table public.eventos_app drop constraint if exists eventos_app_nome_check;
alter table public.eventos_app add constraint eventos_app_nome_check check (nome in (
  'login','cadastro_concluido','onboarding_concluido','triagem_concluida',
  'alimentacao_registrada','agua_registrada','atividade_registrada',
  'desafio_visualizado','desafio_iniciado','desafio_concluido',
  'trilha_visualizada','trilha_iniciada','trilha_concluida','licao_concluida',
  'receita_visualizada','receita_concluida',
  'amizade_solicitada','amizade_aceita','conteudo_abandonado',
  'troca_sugerida','troca_aceita','troca_recusada',
  'scanner_lido'));

commit;
