-- migration_trocas_painel.sql — alternativas (trocas) no painel da nutricionista (e do Admin).
-- Roda DEPOIS de migration_trocas.sql, migration_trocas_justificativas.sql,
-- migration_permissoes_conteudo.sql e migration_fluxo_versao_unica.sql. Idempotente.
--
-- O que muda:
--  * a nutricionista vê cada troca (categoria, alimento, justificativa e dica) e edita o texto;
--  * trocas entram em conteudo_listar / conteudo_detalhe / conteudo_transicionar como tipo 'TROCA'
--    (aprovar, rejeitar, publicar, arquivar: mesmo fluxo de trilhas e receitas);
--  * editar o texto de uma troca já enviada/publicada segue a regra do fluxo: nutricionista mantém o
--    status (sobe a versão e audita); Admin devolve para rascunho;
--  * corrige a policy de alimento_trocas, que usava 'ADMIN' (o papel real é 'ADMINISTRADOR').
begin;

-- 1. Policy ------------------------------------------------------------------------
drop policy if exists "trocas_staff" on public.alimento_trocas;
create policy "trocas_staff" on public.alimento_trocas for all to authenticated
  using (public.papel_atual() in ('NUTRICIONISTA','ADMINISTRADOR'))
  with check (public.papel_atual() in ('NUTRICIONISTA','ADMINISTRADOR'));

-- 2. Título da troca no painel: "Bebidas → Suco natural" ------------------------------
create or replace function public.fluxo_titulo(p_tipo text, p_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select case p_tipo
    when 'TRILHA'  then (select titulo from public.trilhas  where id = p_id)
    when 'RECEITA' then (select titulo from public.receitas where id = p_id)
    when 'TROCA'   then (select case t.categoria
                                  when 'REFRIGERANTE_BEBIDA' then 'Bebidas' when 'DOCE' then 'Doces'
                                  when 'EMBUTIDO' then 'Embutidos' when 'LANCHE' then 'Lanches'
                                  when 'REFEICAO' then 'Refeições' when 'BISCOITO' then 'Biscoitos'
                                  when 'SALGADINHO' then 'Salgadinhos' else t.categoria end
                                || ' → ' || d.nome
                           from public.alimento_trocas t join public.alimentos d on d.id = t.destino_id
                          where t.id = p_id)
  end
$$;
revoke all on function public.fluxo_titulo(text, uuid) from public;

-- 3. Transição aceita TROCA ---------------------------------------------------------------
create or replace function public.conteudo_transicionar(
  p_tipo text, p_id uuid, p_acao text, p_motivo text default null
) returns public.conteudo_fluxo
language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_papel  text := public.papel_atual();
  v_f      public.conteudo_fluxo;
  v_ant    text;
  v_novo   text;
  v_motivo text := nullif(btrim(coalesce(p_motivo, '')), '');
begin
  if v_uid is null or v_papel not in ('NUTRICIONISTA', 'ADMINISTRADOR') then
    raise exception 'Sem permissão para esta ação.' using errcode = '42501';
  end if;
  if p_tipo not in ('TRILHA', 'RECEITA', 'TROCA') then
    raise exception 'Tipo de conteúdo inválido.' using errcode = '22023';
  end if;

  select * into v_f from public.conteudo_fluxo where tipo = p_tipo and conteudo_id = p_id for update;
  if not found then
    raise exception 'Conteúdo não encontrado no fluxo.' using errcode = 'P0002';
  end if;
  v_ant := v_f.status;

  if p_acao = 'ENVIAR' then
    if v_ant not in ('RASCUNHO', 'REJEITADO') then raise exception 'Só rascunho ou rejeitado pode ser enviado.' using errcode = '22023'; end if;
    v_novo := 'AGUARDANDO_APROVACAO';
    update public.conteudo_fluxo set status = v_novo, enviado_por = v_uid, enviado_em = now(),
           motivo_rejeicao = null, atualizado_em = now() where id = v_f.id;

  elsif p_acao = 'APROVAR' then
    if v_papel <> 'NUTRICIONISTA' then raise exception 'Somente a nutricionista pode aprovar conteúdo.' using errcode = '42501'; end if;
    if v_ant not in ('RASCUNHO', 'AGUARDANDO_APROVACAO', 'REJEITADO') then raise exception 'Este conteúdo não está pendente de aprovação.' using errcode = '22023'; end if;
    v_novo := 'APROVADO';
    update public.conteudo_fluxo set status = v_novo, revisado_por = v_uid, revisado_em = now(),
           motivo_rejeicao = null, atualizado_em = now() where id = v_f.id;

  elsif p_acao = 'REJEITAR' then
    if v_papel <> 'NUTRICIONISTA' then raise exception 'Somente a nutricionista pode rejeitar conteúdo.' using errcode = '42501'; end if;
    if v_ant not in ('AGUARDANDO_APROVACAO', 'APROVADO', 'PUBLICADO') then raise exception 'Este conteúdo não pode ser rejeitado agora.' using errcode = '22023'; end if;
    if v_motivo is null then raise exception 'Informe o motivo da rejeição.' using errcode = '22023'; end if;
    v_novo := 'REJEITADO';
    update public.conteudo_fluxo set status = v_novo, revisado_por = v_uid, revisado_em = now(),
           motivo_rejeicao = v_motivo, publicado_por = null, publicado_em = null, atualizado_em = now() where id = v_f.id;

  elsif p_acao = 'PUBLICAR' then
    -- a nutricionista é a responsável técnica: pode aprovar e publicar numa só ação
    -- (fluxo simplificado). O Admin nunca publica.
    if v_papel <> 'NUTRICIONISTA' then raise exception 'Somente a nutricionista pode publicar conteúdo.' using errcode = '42501'; end if;
    if v_ant not in ('RASCUNHO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'REJEITADO') then raise exception 'Este conteúdo não pode ser publicado agora.' using errcode = '22023'; end if;
    v_novo := 'PUBLICADO';
    update public.conteudo_fluxo set status = v_novo, publicado_por = v_uid, publicado_em = now(),
           revisado_por = case when v_ant = 'APROVADO' then revisado_por else v_uid end,
           revisado_em  = case when v_ant = 'APROVADO' then revisado_em  else now() end,
           motivo_rejeicao = null, atualizado_em = now() where id = v_f.id;

  elsif p_acao = 'ARQUIVAR' then
    if v_ant = 'ARQUIVADO' then raise exception 'Já está arquivado.' using errcode = '22023'; end if;
    v_novo := 'ARQUIVADO';
    update public.conteudo_fluxo set status = v_novo, publicado_por = null, publicado_em = null,
           atualizado_em = now() where id = v_f.id;

  elsif p_acao = 'REABRIR' then
    if v_ant not in ('REJEITADO', 'ARQUIVADO') then raise exception 'Só rejeitado ou arquivado pode ser reaberto.' using errcode = '22023'; end if;
    v_novo := 'RASCUNHO';
    update public.conteudo_fluxo set status = v_novo, atualizado_em = now() where id = v_f.id;

  else
    raise exception 'Ação inválida.' using errcode = '22023';
  end if;

  -- trilha: o app do adolescente só enxerga 'aprovada'
  if p_tipo = 'TRILHA' then
    perform set_config('app.fluxo', '1', true);
    if v_novo = 'PUBLICADO' then
      update public.trilhas set status = 'aprovada', aprovado_por = v_uid, aprovado_em = now() where id = p_id;
    elsif v_ant = 'PUBLICADO' then
      update public.trilhas set status = 'rascunho', aprovado_por = null, aprovado_em = null where id = p_id;
    end if;
    perform set_config('app.fluxo', '', true);

    if p_acao in ('APROVAR', 'REJEITAR') or (p_acao = 'PUBLICAR' and v_ant <> 'APROVADO') then -- histórico de revisões
      insert into public.trilha_revisoes (trilha_id, revisor_id, decisao, comentario)
      values (p_id, v_uid, case when p_acao = 'REJEITAR' then 'DEVOLVIDA' else 'APROVADA' end, v_motivo);
    end if;
  end if;

  insert into public.conteudo_auditoria (tipo, conteudo_id, titulo, versao, acao, status_anterior, status_novo, ator_id, ator_papel, motivo)
  values (p_tipo, p_id, public.fluxo_titulo(p_tipo, p_id), v_f.versao, p_acao, v_ant, v_novo, v_uid, v_papel, v_motivo);

  select * into v_f from public.conteudo_fluxo where id = v_f.id;
  return v_f;
end;
$$;
revoke all on function public.conteudo_transicionar(text, uuid, text, text) from public;
grant execute on function public.conteudo_transicionar(text, uuid, text, text) to authenticated;

-- 4. Editar o texto de uma troca conta como alteração do conteúdo (versão + auditoria) -------
create or replace function public.fluxo_alteracao_relevante()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_row    jsonb := to_jsonb(coalesce(new, old));
  v_tipo   text;
  v_id     uuid;
  v_ant    text;
  v_versao integer;
begin
  if auth.uid() is null or current_setting('app.fluxo', true) = '1' then
    return coalesce(new, old);
  end if;

  -- mudar só a ordem (organizar) não é alteração de conteúdo
  if tg_op = 'UPDATE'
     and (to_jsonb(new) - 'ordem' - 'atualizado_em') = (to_jsonb(old) - 'ordem' - 'atualizado_em') then
    return new;
  end if;

  case tg_table_name
    when 'trilhas' then
      v_tipo := 'TRILHA'; v_id := (v_row->>'id')::uuid;
    when 'modulos_trilha' then
      v_tipo := 'TRILHA'; v_id := (v_row->>'trilha_id')::uuid;
    when 'licoes' then
      v_tipo := 'TRILHA';
      select trilha_id into v_id from public.modulos_trilha where id = (v_row->>'modulo_id')::uuid;
    when 'licao_componentes' then
      v_tipo := 'TRILHA';
      select m.trilha_id into v_id from public.licoes l join public.modulos_trilha m on m.id = l.modulo_id
        where l.id = (v_row->>'licao_id')::uuid;
    when 'questoes_quiz' then
      v_tipo := 'TRILHA';
      select m.trilha_id into v_id from public.licoes l join public.modulos_trilha m on m.id = l.modulo_id
        where l.id = (v_row->>'licao_id')::uuid;
    when 'opcoes_quiz' then
      v_tipo := 'TRILHA';
      select m.trilha_id into v_id from public.questoes_quiz q
        join public.licoes l on l.id = q.licao_id join public.modulos_trilha m on m.id = l.modulo_id
        where q.id = (v_row->>'questao_id')::uuid;
    when 'alimento_trocas' then
      v_tipo := 'TROCA'; v_id := (v_row->>'id')::uuid;
    when 'receitas' then
      v_tipo := 'RECEITA'; v_id := (v_row->>'id')::uuid;
    else -- receita_ingredientes, receita_passos
      v_tipo := 'RECEITA'; v_id := (v_row->>'receita_id')::uuid;
  end case;

  if v_id is null then return coalesce(new, old); end if;

  select status into v_ant from public.conteudo_fluxo
    where tipo = v_tipo and conteudo_id = v_id for update;

  -- nutricionista (responsável técnica) edita livremente: o status é mantido,
  -- só sobe a versão e fica na auditoria. Edição do Admin volta para rascunho.
  if v_ant in ('AGUARDANDO_APROVACAO', 'APROVADO', 'PUBLICADO') and public.papel_atual() = 'NUTRICIONISTA' then
    -- o trigger roda POR LINHA: salvar uma receita com 8 passos subia a versão 16x.
    -- Marca (tipo:id) na transação e só conta a primeira alteração de cada salvamento.
    if position(v_tipo || ':' || v_id::text || ';' in coalesce(current_setting('app.fluxo_edicao', true), '')) > 0 then
      return coalesce(new, old);
    end if;
    perform set_config('app.fluxo_edicao', coalesce(current_setting('app.fluxo_edicao', true), '') || v_tipo || ':' || v_id::text || ';', true);
    update public.conteudo_fluxo set versao = versao + 1, atualizado_em = now()
     where tipo = v_tipo and conteudo_id = v_id
     returning versao into v_versao;
    insert into public.conteudo_auditoria (tipo, conteudo_id, titulo, versao, acao, status_anterior, status_novo, ator_id, ator_papel, motivo)
    values (v_tipo, v_id, public.fluxo_titulo(v_tipo, v_id), v_versao, 'EDICAO', v_ant, v_ant,
            auth.uid(), 'NUTRICIONISTA', 'Editado pela nutricionista responsável.');
  elsif v_ant in ('AGUARDANDO_APROVACAO', 'APROVADO', 'PUBLICADO') then
    update public.conteudo_fluxo
       set status = 'RASCUNHO', versao = versao + 1, motivo_rejeicao = null, atualizado_em = now()
     where tipo = v_tipo and conteudo_id = v_id
     returning versao into v_versao;

    if v_tipo = 'TRILHA' then
      perform set_config('app.fluxo', '1', true);
      update public.trilhas set status = 'rascunho', aprovado_por = null, aprovado_em = null where id = v_id;
      perform set_config('app.fluxo', '', true);
    end if;

    insert into public.conteudo_auditoria (tipo, conteudo_id, titulo, versao, acao, status_anterior, status_novo, ator_id, ator_papel, motivo)
    values (v_tipo, v_id, public.fluxo_titulo(v_tipo, v_id), v_versao, 'ALTERACAO_RELEVANTE', v_ant, 'RASCUNHO',
            auth.uid(), public.papel_atual(), 'Conteúdo alterado: precisa de nova aprovação.');
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists fluxo_alteracao on public.alimento_trocas;
create trigger fluxo_alteracao after update on public.alimento_trocas
  for each row execute function public.fluxo_alteracao_relevante();

-- 5. Detalhe completo da troca para a equipe ----------------------------------------------------
create or replace function public.conteudo_detalhe(p_tipo text, p_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_papel text := public.papel_atual();
  v_f     public.conteudo_fluxo;
  v_corpo jsonb;
  v_hist  jsonb;
begin
  if v_papel is null or v_papel not in ('NUTRICIONISTA', 'ADMINISTRADOR') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  select * into v_f from public.conteudo_fluxo where tipo = p_tipo and conteudo_id = p_id;
  if not found then
    raise exception 'Conteúdo não encontrado.' using errcode = 'P0002';
  end if;

  if p_tipo = 'TRILHA' then
    select jsonb_build_object(
             'titulo', t.titulo, 'descricao', t.descricao, 'tema', t.tema::text,
             'modulos', coalesce((
               select jsonb_agg(jsonb_build_object(
                        'id', m.id, 'titulo', m.titulo, 'ordem', m.ordem,
                        'licoes', coalesce((
                          select jsonb_agg(jsonb_build_object(
                                   'id', l.id, 'titulo', l.titulo, 'ordem', l.ordem,
                                   'tipo', l.tipo::text, 'xp', l.xp_recompensa) order by l.ordem)
                            from public.licoes l where l.modulo_id = m.id), '[]'::jsonb)
                      ) order by m.ordem)
                 from public.modulos_trilha m where m.trilha_id = t.id), '[]'::jsonb))
      into v_corpo from public.trilhas t where t.id = p_id;
  elsif p_tipo = 'RECEITA' then
    select jsonb_build_object(
             'titulo', r.titulo, 'modo_preparo', r.modo_preparo, 'tempo_preparo_min', r.tempo_preparo_min,
             'porcoes', r.porcoes, 'dificuldade', r.dificuldade::text,
             'passos', coalesce((
               select jsonb_agg(jsonb_build_object('ordem', s.ordem, 'titulo', s.titulo, 'descricao', s.descricao)
                                order by s.ordem)
                 from public.receita_passos s where s.receita_id = r.id), '[]'::jsonb),
             'ingredientes', coalesce((
               select jsonb_agg(jsonb_build_object('nome', a.nome, 'proporcao', pi.proporcao) order by a.nome)
                 from public.prato_ingredientes pi
                 join public.alimentos a on a.id = pi.ingrediente_id
                where pi.prato_id = r.alimento_resultante_id), '[]'::jsonb))
      into v_corpo from public.receitas r where r.id = p_id;
  elsif p_tipo = 'TROCA' then
    select jsonb_build_object(
             'titulo', public.fluxo_titulo('TROCA', t.id),
             'categoria', t.categoria,
             'origem_nome', o.nome,
             'destino_nome', d.nome,
             'frase', t.frase,
             'dica', t.dica,
             'rapida', t.rapida,
             'tipos_refeicao', to_jsonb(t.tipos_refeicao::text[]))
      into v_corpo
      from public.alimento_trocas t
      join public.alimentos d on d.id = t.destino_id
      left join public.alimentos o on o.id = t.origem_id
     where t.id = p_id;
  else
    raise exception 'Tipo de conteúdo inválido.' using errcode = '22023';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'acao', a.acao, 'status_anterior', a.status_anterior, 'status_novo', a.status_novo,
           'ator_nome', p.nome, 'ator_papel', a.ator_papel, 'motivo', a.motivo,
           'versao', a.versao, 'criado_em', a.criado_em) order by a.criado_em desc), '[]'::jsonb)
    into v_hist
    from (select * from public.conteudo_auditoria
           where tipo = p_tipo and conteudo_id = p_id order by criado_em desc limit 50) a
    left join public.profiles p on p.id = a.ator_id;

  return jsonb_build_object(
    'tipo', p_tipo, 'conteudo_id', p_id, 'papel', v_papel,
    'status', v_f.status, 'versao', v_f.versao, 'motivo_rejeicao', v_f.motivo_rejeicao,
    'criado_em', v_f.criado_em, 'criador_nome', (select nome from public.profiles where id = v_f.criado_por),
    'revisor_nome', (select nome from public.profiles where id = v_f.revisado_por), 'revisado_em', v_f.revisado_em,
    'publicado_em', v_f.publicado_em, 'atualizado_em', v_f.atualizado_em,
    'corpo', coalesce(v_corpo, '{}'::jsonb), 'historico', v_hist);
end;
$$;
revoke all on function public.conteudo_detalhe(text, uuid) from public;
grant execute on function public.conteudo_detalhe(text, uuid) to authenticated;

commit;
