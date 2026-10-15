-- Fecha o risco de adulteração do XP (RF053). Rode DEPOIS de migration_xp_servidor.sql
-- e SÓ quando a versão antiga do app (que soma XP direto na tabela) não estiver mais em uso;
-- caso contrário ela deixa de conceder XP.
--
-- Depois disto, o app autenticado só lê xp_usuario; quem escreve é conceder_xp() (security definer).

revoke insert, update, delete on public.xp_usuario from anon, authenticated;

-- Resgates de missões semanais/mensais também passam a ser gravados só pela função
-- (antes o app inseria a linha com o valor de pontos que quisesse).
revoke insert, update, delete on public.missoes_periodicas_resgates from anon, authenticated;
drop policy if exists "resgates_insercao" on public.missoes_periodicas_resgates;

-- Verificação (deve retornar zero linhas de privilégio de escrita para authenticated/anon):
-- select grantee, privilege_type from information_schema.role_table_grants
--  where table_name = 'xp_usuario' and grantee in ('anon','authenticated')
--    and privilege_type in ('INSERT','UPDATE','DELETE');
