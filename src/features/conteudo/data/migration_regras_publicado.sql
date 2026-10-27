-- migration_regras_publicado.sql
--
-- Duas regras de negócio sobre conteúdo PUBLICADO (decididas na Fase 1/Fase 3 da auditoria):
--
--  1. Só a nutricionista tira do ar um conteúdo publicado. O Administrador "consulta e organiza";
--     arquivar um conteúdo PUBLICADO o remove do aplicativo dos adolescentes (a trilha volta a
--     rascunho), o que equivale a despublicar. Era a regra da migration_revisao_trilhas.sql
--     ("somente a nutricionista despublica"), que o fluxo novo (conteudo_transicionar) deixou passar.
--     O Administrador continua podendo arquivar rascunho, em revisão, aprovado ou rejeitado.
--
--  2. Mudar a ORDEM ou o XP BÔNUS de uma trilha conta como edição de conteúdo, igual a título,
--     descrição e tema: a ordem decide qual trilha os adolescentes veem, e o XP bônus muda a
--     pontuação. Admin editando trilha enviada/publicada -> volta para rascunho (nova aprovação);
--     nutricionista -> mantém o status e a versão sobe. (XP bônus de MÓDULO já contava: o trigger
--     de modulos_trilha dispara em qualquer alteração.)
--
-- Não redefine conteudo_transicionar nem fluxo_alteracao_relevante, então não depende da ordem
-- em que as outras migrations foram aplicadas. Atualizações feitas direto no SQL Editor (sem
-- usuário logado no app) não são afetadas. Idempotente.

-- 1. Administrador não despublica -------------------------------------------------------------
create or replace function public.fluxo_guarda_despublicar()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.status = 'PUBLICADO' and new.status = 'ARQUIVADO' and public.papel_atual() = 'ADMINISTRADOR' then
    raise exception 'Somente a nutricionista pode arquivar conteúdo publicado.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists fluxo_guarda_despublicar on public.conteudo_fluxo;
create trigger fluxo_guarda_despublicar
  before update of status on public.conteudo_fluxo
  for each row execute function public.fluxo_guarda_despublicar();

-- 2. Ordem e XP bônus da trilha contam como alteração relevante --------------------------------
drop trigger if exists fluxo_alteracao on public.trilhas;
create trigger fluxo_alteracao
  after update of titulo, descricao, tema, ordem, xp_bonus on public.trilhas
  for each row execute function public.fluxo_alteracao_relevante();

-- Conferência rápida:
--   select tgname from pg_trigger where tgname in ('fluxo_guarda_despublicar', 'fluxo_alteracao')
--     and tgrelid in ('public.conteudo_fluxo'::regclass, 'public.trilhas'::regclass);
