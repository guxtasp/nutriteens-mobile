-- migration_painel_excluir_conteudo.sql
-- Excluir trilha ou receita inteira pelo painel.
-- Regras: só em RASCUNHO, REJEITADO ou ARQUIVADO (publicado/em revisão: arquive antes);
-- trilha com lição já concluída por adolescente não é excluída (arquive).
-- A exclusão entra na auditoria (trigger fluxo_remover já existente). Idempotente.

create or replace function public.conteudo_excluir(p_tipo text, p_id uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_papel text := public.papel_atual();
  v_status text;
  v_concluidas integer;
begin
  if v_papel is null or v_papel not in ('NUTRICIONISTA', 'ADMINISTRADOR') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if p_tipo not in ('TRILHA', 'RECEITA') then
    raise exception 'Tipo inválido.' using errcode = '22023';
  end if;

  select status into v_status from public.conteudo_fluxo where tipo = p_tipo and conteudo_id = p_id;
  if v_status is null then raise exception 'Conteúdo não encontrado.' using errcode = 'P0002'; end if;
  if v_status not in ('RASCUNHO', 'REJEITADO', 'ARQUIVADO') then
    raise exception 'Só dá para excluir conteúdo em rascunho, rejeitado ou arquivado. Arquive este conteúdo primeiro.' using errcode = '23514';
  end if;

  if p_tipo = 'TRILHA' then
    select count(*) into v_concluidas
      from public.progresso_licao pl
      join public.licoes l on l.id = pl.licao_id
      join public.modulos_trilha m on m.id = l.modulo_id
     where m.trilha_id = p_id;
    if v_concluidas > 0 then
      raise exception 'Esta trilha já tem % conclusão(ões) de lições por adolescentes e não pode ser excluída. Mantenha-a arquivada.', v_concluidas
        using errcode = '23503';
    end if;
    delete from public.opcoes_quiz where questao_id in (
      select q.id from public.questoes_quiz q
        join public.licoes l on l.id = q.licao_id
        join public.modulos_trilha m on m.id = l.modulo_id where m.trilha_id = p_id);
    delete from public.questoes_quiz where licao_id in (
      select l.id from public.licoes l join public.modulos_trilha m on m.id = l.modulo_id where m.trilha_id = p_id);
    delete from public.licao_componentes where licao_id in (
      select l.id from public.licoes l join public.modulos_trilha m on m.id = l.modulo_id where m.trilha_id = p_id);
    delete from public.licoes where modulo_id in (select id from public.modulos_trilha where trilha_id = p_id);
    delete from public.modulos_trilha where trilha_id = p_id;
    delete from public.trilhas where id = p_id;
  else
    delete from public.receitas where id = p_id;
  end if;
exception
  when foreign_key_violation then
    raise exception 'Este conteúdo está ligado a outros registros e não pode ser excluído. Mantenha-o arquivado.' using errcode = '23503';
end;
$$;
revoke all on function public.conteudo_excluir(text, uuid) from public, anon;
grant execute on function public.conteudo_excluir(text, uuid) to authenticated;
