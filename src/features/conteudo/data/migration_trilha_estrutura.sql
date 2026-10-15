-- migration_trilha_estrutura.sql
--
-- Organizar a estrutura de uma trilha pelo painel: REORDENAR e EXCLUIR módulos e lições.
-- Antes só dava para criar; a ordem era fixa e nada podia ser removido.
--
-- Por que funções e não UPDATE/DELETE direto pelo app:
--  * reordenar é várias linhas: precisa ser atômico (ou muda tudo, ou nada);
--  * excluir precisa limpar passos/alternativas na ordem certa (não há ON DELETE CASCADE) e
--    NÃO pode apagar lição que adolescentes já concluíram (progresso_licao) nem o XP/histórico
--    ligado a ela. Esse bloqueio a RLS não consegue expressar.
--
-- Segurança (mesmo padrão de conteudo_salvar_licao / substituir_passos_receita): security
-- definer + checagem de papel DENTRO da função (só NUTRICIONISTA/ADMINISTRADOR). Os triggers do
-- fluxo continuam valendo: mexer na estrutura de conteúdo enviado/publicado volta o Admin para
-- rascunho e mantém o status da nutricionista (sobe a versão, uma vez por operação).
--
-- Rodar DEPOIS de migration_licao_atomica.sql (ou de qualquer ordem após as migrations de fluxo).
-- Idempotente.

-- 1. Reordenar ----------------------------------------------------------------------------------
-- p_nivel  : 'MODULO' (p_pai_id = id da trilha) ou 'LICAO' (p_pai_id = id do módulo)
-- p_ids    : TODOS os filhos do pai, na nova ordem (a ordem passa a ser 1..n)
create or replace function public.conteudo_reordenar(p_nivel text, p_pai_id uuid, p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_papel text := public.papel_atual();
  v_atuais uuid[];
begin
  if v_papel is null or v_papel not in ('NUTRICIONISTA', 'ADMINISTRADOR') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if p_ids is null or coalesce(array_length(p_ids, 1), 0) = 0 then
    raise exception 'Lista de itens vazia.' using errcode = '22023';
  end if;
  if (select count(distinct x) from unnest(p_ids) x) <> array_length(p_ids, 1) then
    raise exception 'A lista tem itens repetidos.' using errcode = '22023';
  end if;

  if p_nivel = 'MODULO' then
    if not exists (select 1 from public.trilhas where id = p_pai_id) then raise exception 'Trilha não encontrada.' using errcode = 'P0002'; end if;
    select array_agg(id) into v_atuais from public.modulos_trilha where trilha_id = p_pai_id;
    if v_atuais is null or not (v_atuais @> p_ids and p_ids @> v_atuais) then
      raise exception 'A lista não bate com os módulos atuais da trilha. Recarregue a tela.' using errcode = '22023';
    end if;
    update public.modulos_trilha m set ordem = o.n
      from unnest(p_ids) with ordinality as o(id, n)
     where m.id = o.id and m.ordem is distinct from o.n;

  elsif p_nivel = 'LICAO' then
    if not exists (select 1 from public.modulos_trilha where id = p_pai_id) then raise exception 'Módulo não encontrado.' using errcode = 'P0002'; end if;
    select array_agg(id) into v_atuais from public.licoes where modulo_id = p_pai_id;
    if v_atuais is null or not (v_atuais @> p_ids and p_ids @> v_atuais) then
      raise exception 'A lista não bate com as lições atuais do módulo. Recarregue a tela.' using errcode = '22023';
    end if;
    update public.licoes l set ordem = o.n
      from unnest(p_ids) with ordinality as o(id, n)
     where l.id = o.id and l.ordem is distinct from o.n;

  else
    raise exception 'Nível inválido.' using errcode = '22023';
  end if;
end;
$$;
revoke all on function public.conteudo_reordenar(text, uuid, uuid[]) from public, anon;
grant execute on function public.conteudo_reordenar(text, uuid, uuid[]) to authenticated;

-- 2. Excluir módulo ou lição ------------------------------------------------------------------------
-- Bloqueia se algum adolescente já concluiu a lição (ou alguma lição do módulo): excluir apagaria o
-- histórico dele. Nesse caso o caminho é editar o conteúdo ou arquivar a trilha.
-- Depois de excluir, renumera os irmãos restantes (1..n) para não sobrar buraco na ordem.
create or replace function public.conteudo_excluir_item(p_nivel text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_papel text := public.papel_atual();
  v_pai uuid;
  v_concluidas integer;
begin
  if v_papel is null or v_papel not in ('NUTRICIONISTA', 'ADMINISTRADOR') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  if p_nivel = 'LICAO' then
    select modulo_id into v_pai from public.licoes where id = p_id for update;
    if not found then raise exception 'Lição não encontrada.' using errcode = 'P0002'; end if;

    select count(*) into v_concluidas from public.progresso_licao where licao_id = p_id;
    if v_concluidas > 0 then
      raise exception 'Esta lição já foi concluída por % adolescente(s) e não pode ser excluída. Edite o conteúdo ou arquive a trilha.', v_concluidas
        using errcode = '23503';
    end if;

    delete from public.opcoes_quiz where questao_id in (select id from public.questoes_quiz where licao_id = p_id);
    delete from public.questoes_quiz where licao_id = p_id;
    delete from public.licao_componentes where licao_id = p_id;
    delete from public.licoes where id = p_id;

    update public.licoes l set ordem = r.n
      from (select id, row_number() over (order by ordem, criado_em) as n from public.licoes where modulo_id = v_pai) r
     where l.id = r.id and l.ordem is distinct from r.n;

  elsif p_nivel = 'MODULO' then
    select trilha_id into v_pai from public.modulos_trilha where id = p_id for update;
    if not found then raise exception 'Módulo não encontrado.' using errcode = 'P0002'; end if;

    select count(*) into v_concluidas
      from public.progresso_licao pl join public.licoes l on l.id = pl.licao_id
     where l.modulo_id = p_id;
    if v_concluidas > 0 then
      raise exception 'Alguma lição deste módulo já foi concluída por adolescentes (% conclusões) e o módulo não pode ser excluído. Edite o conteúdo ou arquive a trilha.', v_concluidas
        using errcode = '23503';
    end if;

    delete from public.opcoes_quiz where questao_id in (
      select q.id from public.questoes_quiz q join public.licoes l on l.id = q.licao_id where l.modulo_id = p_id);
    delete from public.questoes_quiz where licao_id in (select id from public.licoes where modulo_id = p_id);
    delete from public.licao_componentes where licao_id in (select id from public.licoes where modulo_id = p_id);
    delete from public.licoes where modulo_id = p_id;
    delete from public.modulos_trilha where id = p_id;

    update public.modulos_trilha m set ordem = r.n
      from (select id, row_number() over (order by ordem, criado_em) as n from public.modulos_trilha where trilha_id = v_pai) r
     where m.id = r.id and m.ordem is distinct from r.n;

  else
    raise exception 'Nível inválido.' using errcode = '22023';
  end if;
end;
$$;
revoke all on function public.conteudo_excluir_item(text, uuid) from public, anon;
grant execute on function public.conteudo_excluir_item(text, uuid) to authenticated;

-- Conferência rápida:
--   select proname from pg_proc where proname in ('conteudo_reordenar', 'conteudo_excluir_item');
