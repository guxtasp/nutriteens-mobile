-- Jogo de memória Nutriente x Alimento. Rode UMA vez no SQL Editor do Supabase
-- (depois do migration_jogos.sql, que cria o bucket "jogos" e a função de papel).
-- A imagem opcional de cada par usa o mesmo bucket: jogos/alimentos/<id do par>.
create table if not exists public.jogo_pares_nutriente (
  id text primary key,
  nutriente text not null,          -- chave do nutriente (vitamina_c, calcio, ferro...)
  nome text not null,               -- nome do alimento
  icone text not null default 'food-variant',
  cor text not null default '#8A7F6A',
  ativo boolean not null default true,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.jogo_pares_nutriente enable row level security;

drop policy if exists jogo_pares_leitura on public.jogo_pares_nutriente;
create policy jogo_pares_leitura on public.jogo_pares_nutriente for select to authenticated using (true);
drop policy if exists jogo_pares_escrita on public.jogo_pares_nutriente;
create policy jogo_pares_escrita on public.jogo_pares_nutriente for all to authenticated
  using (public.papel_atual() in ('ADMINISTRADOR','NUTRICIONISTA'))
  with check (public.papel_atual() in ('ADMINISTRADOR','NUTRICIONISTA'));

insert into public.jogo_pares_nutriente (id, nutriente, nome, icone, cor, ordem) values
  ('par_vitamina_a_cenoura', 'vitamina_a', 'Cenoura', 'carrot', '#F2761B', 0),
  ('par_vitamina_a_abobora', 'vitamina_a', 'Abóbora', 'pumpkin', '#E8890C', 1),
  ('par_vitamina_c_laranja', 'vitamina_c', 'Laranja', 'fruit-citrus', '#F59E0B', 2),
  ('par_vitamina_c_acerola', 'vitamina_c', 'Acerola', 'fruit-cherries', '#DC2626', 3),
  ('par_vitamina_d_ovo', 'vitamina_d', 'Ovo', 'egg', '#E8A33D', 4),
  ('par_vitamina_d_sardinha', 'vitamina_d', 'Sardinha', 'fish', '#3B82A0', 5),
  ('par_calcio_leite', 'calcio', 'Leite', 'glass-mug-variant', '#5B8DB8', 6),
  ('par_calcio_queijo', 'calcio', 'Queijo', 'cheese', '#E2A400', 7),
  ('par_calcio_iogurte', 'calcio', 'Iogurte natural', 'cup', '#7C9CB8', 8),
  ('par_ferro_feijao', 'ferro', 'Feijão', 'seed', '#7B4B2A', 9),
  ('par_ferro_carne', 'ferro', 'Carne bovina', 'food-steak', '#B91C1C', 10),
  ('par_magnesio_amendoim', 'magnesio', 'Amendoim', 'peanut', '#A16207', 11),
  ('par_magnesio_castanha', 'magnesio', 'Castanha', 'nut', '#7C3F1D', 12),
  ('par_potassio_banana', 'potassio', 'Banana', 'food-apple', '#F5B800', 13),
  ('par_zinco_carne', 'zinco', 'Carne bovina', 'food-steak', '#B91C1C', 14),
  ('par_zinco_feijao', 'zinco', 'Feijão', 'seed', '#7B4B2A', 15),
  ('par_niacina_frango', 'niacina', 'Frango', 'food-drumstick', '#B45309', 16),
  ('par_niacina_amendoim', 'niacina', 'Amendoim', 'peanut', '#A16207', 17)
on conflict (id) do nothing;
