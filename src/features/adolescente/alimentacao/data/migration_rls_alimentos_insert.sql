-- Cadastro de alimento novo pelo adolescente (NovoAlimentoFormScreen -> criarAlimento).
-- O repositório não tinha nenhuma policy de INSERT em public.alimentos (só a de
-- alimento_nutrientes). Se ela também não existe no banco, o cadastro falha com
-- 42501 "new row violates row-level security policy for table alimentos".
-- Idempotente e só ADICIONA permissão (policies são aditivas): não mexe nas
-- policies que já existem (painel, nutricionista, leitura).
-- Rodar no SQL Editor do Supabase.

-- 0. DIAGNÓSTICO (rode antes, só leitura): o que existe hoje em alimentos
-- select policyname, cmd, roles, qual, with_check from pg_policies where tablename = 'alimentos';
-- select relrowsecurity from pg_class where oid = 'public.alimentos'::regclass;

alter table public.alimentos enable row level security;

-- 1. Adolescente cadastra SÓ alimento próprio, simples e sem privilégios:
--    - criado_por = ele mesmo
--    - não é prato composto, nível EBIA padrão (não esconde/mostra por classe)
--    - nome de 2 a 60 caracteres (mesma regra do app)
--    - classificação NOVA e grupo alimentar válidos pelos enums da tabela
drop policy if exists "alimentos_insert_proprio" on public.alimentos;
create policy "alimentos_insert_proprio" on public.alimentos
  for insert to authenticated
  with check (
    criado_por = auth.uid()
    and eh_prato_composto = false
    and nivel_maximo_ebia = 'INSEGURANCA_GRAVE'
    and coalesce(array_length(tipos_refeicao_recordatorio, 1), 0) = 0
    and char_length(btrim(nome)) between 2 and 60
  );

-- 2. Leitura dos próprios (o .insert().select() do app e "Meus alimentos" dependem disso).
--    Se já existe uma policy de SELECT ampla (using true), esta é redundante e inofensiva.
drop policy if exists "alimentos_select_proprio" on public.alimentos;
create policy "alimentos_select_proprio" on public.alimentos
  for select to authenticated
  using (criado_por = auth.uid());

-- 3. Unicidade sem diferenciar maiúsculas ("Pamonha" x "pamonha"): evita duplicata.
--    Se der erro por já existirem duplicados, liste-os com:
--    select lower(btrim(nome)), count(*) from alimentos group by 1 having count(*) > 1;
-- create unique index if not exists alimentos_nome_lower_uk on public.alimentos (lower(btrim(nome)));
