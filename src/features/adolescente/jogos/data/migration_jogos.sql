-- Jogos: tabela dos alimentos + bucket de imagens. Rode UMA vez no SQL Editor do Supabase.
-- Leitura: qualquer usuário logado. Escrita: só ADMINISTRADOR e NUTRICIONISTA (via painel).
create table if not exists public.jogo_alimentos (
  id text primary key,
  nome text not null,
  icone text not null default 'food-variant',   -- nome do ícone MaterialCommunityIcons (fallback sem imagem)
  cor text not null default '#8A7F6A',
  grupo text not null check (grupo in ('IN_NATURA','INGREDIENTE_CULINARIO','PROCESSADO','ULTRAPROCESSADO')),
  dica text not null,
  ativo boolean not null default true,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.jogo_alimentos enable row level security;

drop policy if exists jogo_alimentos_leitura on public.jogo_alimentos;
create policy jogo_alimentos_leitura on public.jogo_alimentos for select to authenticated using (true);
drop policy if exists jogo_alimentos_escrita on public.jogo_alimentos;
create policy jogo_alimentos_escrita on public.jogo_alimentos for all to authenticated
  using (public.papel_atual() in ('ADMINISTRADOR','NUTRICIONISTA'))
  with check (public.papel_atual() in ('ADMINISTRADOR','NUTRICIONISTA'));

insert into public.jogo_alimentos (id, nome, icone, cor, grupo, dica, ordem) values
  ('banana', 'Banana', 'food-apple', '#F5B800', 'IN_NATURA', 'Fruta inteira, do jeito que vem da árvore.', 0),
  ('arroz', 'Arroz branco (grão)', 'rice', '#8A7F6A', 'IN_NATURA', 'Grão só beneficiado, sem nada adicionado.', 1),
  ('feijao', 'Feijão (grão)', 'seed', '#7B4B2A', 'IN_NATURA', 'Semente seca, sem aditivos.', 2),
  ('ovo', 'Ovo', 'egg', '#E8A33D', 'IN_NATURA', 'Alimento inteiro, sem transformação industrial.', 3),
  ('cenoura', 'Cenoura', 'carrot', '#F2761B', 'IN_NATURA', 'Raiz fresca.', 4),
  ('laranja', 'Laranja', 'fruit-citrus', '#F59E0B', 'IN_NATURA', 'Fruta fresca.', 5),
  ('leite', 'Leite', 'glass-mug-variant', '#5B8DB8', 'IN_NATURA', 'Leite pasteurizado é considerado in natura/minimamente processado.', 6),
  ('acucar', 'Açúcar', 'spoon-sugar', '#8A7F6A', 'INGREDIENTE_CULINARIO', 'Usado para adoçar preparações, não como alimento sozinho.', 7),
  ('sal', 'Sal de cozinha', 'shaker', '#6B7280', 'INGREDIENTE_CULINARIO', 'Tempero usado na cozinha.', 8),
  ('oleo', 'Óleo de soja', 'oil', '#B8860B', 'INGREDIENTE_CULINARIO', 'Gordura usada para cozinhar.', 9),
  ('manteiga', 'Manteiga', 'food-variant', '#D9A404', 'INGREDIENTE_CULINARIO', 'Extraída do leite, usada para cozinhar.', 10),
  ('conserva', 'Milho em conserva', 'corn', '#E2B100', 'PROCESSADO', 'In natura com água e sal.', 11),
  ('atum', 'Atum em lata', 'fish', '#3B82A0', 'PROCESSADO', 'Peixe com óleo e sal, poucos ingredientes.', 12),
  ('queijo_minas', 'Queijo minas curado', 'cheese', '#E2A400', 'PROCESSADO', 'Leite, sal e fermento: poucos ingredientes.', 13),
  ('fruta_calda', 'Pêssego em calda', 'food-apple', '#F08A4B', 'PROCESSADO', 'Fruta com açúcar, em conserva.', 14),
  ('refri', 'Refrigerante', 'bottle-soda', '#C0392B', 'ULTRAPROCESSADO', 'Água, açúcar e aditivos como corante e aromatizante.', 15),
  ('salgadinho', 'Salgadinho de pacote', 'french-fries', '#D97706', 'ULTRAPROCESSADO', 'Realçador de sabor e aromatizantes.', 16),
  ('nuggets', 'Nuggets', 'food-drumstick', '#B45309', 'ULTRAPROCESSADO', 'Carne reconstituída com muitos aditivos.', 17),
  ('macarrao_inst', 'Macarrão instantâneo', 'noodles', '#CA8A04', 'ULTRAPROCESSADO', 'Tempero pronto com realçadores de sabor.', 18),
  ('biscoito_rech', 'Biscoito recheado', 'cookie', '#7C3F1D', 'ULTRAPROCESSADO', 'Gordura vegetal, açúcar e aromatizantes.', 19),
  ('salsicha', 'Salsicha', 'food-hot-dog', '#B91C1C', 'ULTRAPROCESSADO', 'Embutido com conservantes e corantes.', 20),
  ('iogurte_sabor', 'Iogurte com sabor de frutas', 'cup', '#DB2777', 'ULTRAPROCESSADO', 'Corante e aromatizante no lugar da fruta.', 21)
on conflict (id) do nothing;

-- Bucket público "jogos" para imagens dos alimentos dos jogos.
-- Leitura: qualquer pessoa (as imagens são só ilustração). Escrita: só ADMINISTRADOR e NUTRICIONISTA.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('jogos', 'jogos', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists jogos_leitura on storage.objects;
create policy jogos_leitura on storage.objects for select
  using (bucket_id = 'jogos');

drop policy if exists jogos_escrita on storage.objects;
create policy jogos_escrita on storage.objects for insert to authenticated
  with check (bucket_id = 'jogos' and public.papel_atual() in ('ADMINISTRADOR','NUTRICIONISTA'));

drop policy if exists jogos_atualiza on storage.objects;
create policy jogos_atualiza on storage.objects for update to authenticated
  using (bucket_id = 'jogos' and public.papel_atual() in ('ADMINISTRADOR','NUTRICIONISTA'))
  with check (bucket_id = 'jogos' and public.papel_atual() in ('ADMINISTRADOR','NUTRICIONISTA'));

drop policy if exists jogos_apaga on storage.objects;
create policy jogos_apaga on storage.objects for delete to authenticated
  using (bucket_id = 'jogos' and public.papel_atual() in ('ADMINISTRADOR','NUTRICIONISTA'));
