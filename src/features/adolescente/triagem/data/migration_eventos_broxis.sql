-- migration_eventos_broxis.sql — acrescenta 'broxis_intro_resposta' à lista de eventos (eventos_app).
-- Idempotente. Rodar DEPOIS de migration_social_desafio_grupo.sql (a última que recriou a lista).
--
-- O evento leva só o código curto da resposta escolhida na conversa com o Bróxis antes do
-- recordatório (props: { resposta: 'oi' | 'quem' | 'bora' | 'porque' | 'entendi' }), nunca texto.
-- A lista abaixo é a COMPLETA (mesma de src/shared/analytics/analytics.ts). Confira no banco se
-- alguma migration mais nova acrescentou outro nome antes de rodar:
--   select pg_get_constraintdef(oid) from pg_constraint
--    where conrelid = 'public.eventos_app'::regclass and contype = 'c';
begin;

do $$
declare c record;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.eventos_app'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) ilike '%alimentacao_registrada%' loop
    execute format('alter table public.eventos_app drop constraint %I', c.conname);
  end loop;
  alter table public.eventos_app add constraint eventos_app_nome_check check (nome = any (array[
    'login','cadastro_concluido','onboarding_concluido','triagem_concluida',
    'alimentacao_registrada','agua_registrada','atividade_registrada',
    'desafio_visualizado','desafio_iniciado','desafio_concluido',
    'trilha_visualizada','trilha_iniciada','trilha_concluida','licao_concluida',
    'receita_visualizada','receita_concluida',
    'amizade_solicitada','amizade_aceita','conteudo_abandonado',
    'troca_sugerida','troca_aceita','troca_recusada',
    'scanner_lido','feed_visualizado','reacao_enviada',
    'desafio_grupo_criado','desafio_grupo_aceito','desafio_grupo_renovado',
    'broxis_intro_resposta'
  ]::text[]));
end $$;

commit;
