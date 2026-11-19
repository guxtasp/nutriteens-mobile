-- CATÁLOGO DE ALIMENTOS E PRATOS: ESCRITA PELA EQUIPE (ADMINISTRADOR E NUTRICIONISTA)
--
-- Antes, só existia a policy "alimentos: administrador pode inserir" (criada direto no banco,
-- fora do repositório), então a nutricionista não conseguia cadastrar alimentos nem pratos,
-- embora seja a responsável técnica pelo conteúdo nutricional.
--
-- Regra: a equipe (papel ADMINISTRADOR ou NUTRICIONISTA) cria, edita e exclui SÓ itens do
-- catálogo: sem dono (criado_por null) ou criados pela equipe. Alimentos privados de
-- adolescentes (migration_alimentos_privados.sql) continuam invisíveis e intocáveis.
-- As policies são PERMISSIVAS: somam-se às que já existem, não removem nada.
--
-- Já cobertos por outras migrations (não mexer aqui):
--   * receitas: "receitas_escrita_staff" (migration_fluxo_conteudo.sql)
--   * ingredientes do prato: RPC substituir_ingredientes_prato (migration_funcoes_substituir.sql)
--
-- Depende de: migration_painel_dashboard.sql (papel_atual) e
--             migration_alimentos_privados.sql (usuario_eh_staff).
-- Idempotente. Rodar no SQL Editor do Supabase.
--
-- DIAGNÓSTICO (só leitura), antes:
--   select policyname, cmd, roles, qual, with_check from pg_policies
--    where tablename in ('alimentos', 'alimento_nutrientes') order by tablename, cmd;

-- 1. alimentos -----------------------------------------------------------------------------

drop policy if exists "alimentos_insert_equipe" on public.alimentos;
create policy "alimentos_insert_equipe" on public.alimentos
  for insert to authenticated
  with check (
    public.papel_atual() in ('ADMINISTRADOR', 'NUTRICIONISTA')
    and (criado_por is null or criado_por = auth.uid())
  );

drop policy if exists "alimentos_update_equipe" on public.alimentos;
create policy "alimentos_update_equipe" on public.alimentos
  for update to authenticated
  using (
    public.papel_atual() in ('ADMINISTRADOR', 'NUTRICIONISTA')
    and (criado_por is null or public.usuario_eh_staff(criado_por))
  )
  with check (
    public.papel_atual() in ('ADMINISTRADOR', 'NUTRICIONISTA')
    and (criado_por is null or public.usuario_eh_staff(criado_por))
  );

drop policy if exists "alimentos_delete_equipe" on public.alimentos;
create policy "alimentos_delete_equipe" on public.alimentos
  for delete to authenticated
  using (
    public.papel_atual() in ('ADMINISTRADOR', 'NUTRICIONISTA')
    and (criado_por is null or public.usuario_eh_staff(criado_por))
  );

-- 2. alimento_nutrientes (níveis categóricos do alimento do catálogo) -----------------------

drop policy if exists "alimento_nutrientes_escrita_equipe" on public.alimento_nutrientes;
create policy "alimento_nutrientes_escrita_equipe" on public.alimento_nutrientes
  for all to authenticated
  using (
    public.papel_atual() in ('ADMINISTRADOR', 'NUTRICIONISTA')
    and exists (
      select 1 from public.alimentos a
       where a.id = alimento_nutrientes.alimento_id
         and (a.criado_por is null or public.usuario_eh_staff(a.criado_por))
    )
  )
  with check (
    public.papel_atual() in ('ADMINISTRADOR', 'NUTRICIONISTA')
    and exists (
      select 1 from public.alimentos a
       where a.id = alimento_nutrientes.alimento_id
         and (a.criado_por is null or public.usuario_eh_staff(a.criado_por))
    )
  );

-- Teste: logado como nutricionista, cadastrar um alimento pelo painel (Catálogo > + Novo alimento),
-- marcar um nutriente e salvar; editar; excluir. Logado como adolescente, tentar
-- `update alimentos set nome = 'x' where criado_por is null` deve afetar 0 linhas.
