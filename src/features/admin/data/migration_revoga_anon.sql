-- migration_revoga_anon.sql
--
-- Achado do verificar_painel.sql: 8 funções do painel ainda podem ser executadas
-- pelo papel anon (visitante sem login). Causa: as migrations faziam
-- "revoke ... from public", mas o Supabase concede EXECUTE ao anon DIRETAMENTE
-- (default privileges), e isso não é removido por "from public".
--
-- Não vazava dados (cada função recusa quem não tem papel), mas expõe a função
-- a chamadas anônimas. Aqui o EXECUTE é retirado de public e anon e mantido
-- só para authenticated — em TODAS as sobrecargas existentes de cada nome, sem
-- depender da assinatura exata. Idempotente.

do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as assinatura
      from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and p.proname in (
         'analytics_painel',
         'conteudo_auditoria_listar',
         'conteudo_detalhe',
         'conteudo_licao_detalhe',
         'conteudo_listar',
         'conteudo_transicionar',
         'substituir_ingredientes_prato',
         'substituir_passos_receita'
       )
  loop
    execute format('revoke all on function %s from public, anon', r.assinatura);
    execute format('grant execute on function %s to authenticated', r.assinatura);
    raise notice 'protegida: %', r.assinatura;
  end loop;
end $$;
