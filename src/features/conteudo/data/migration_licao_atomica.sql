-- migration_licao_atomica.sql
--
-- Gravação ATÔMICA de uma lição (dados da lição + todos os passos e alternativas) pelo
-- editor do painel. Antes o app gravava lição, enunciados e opções em chamadas separadas:
-- se uma falhasse no meio, ficava conteúdo pela metade. Agora é uma única função (uma
-- transação): ou grava tudo, ou não grava nada.
--
-- Segurança (mesmo padrão de substituir_passos_receita): security definer + checagem de
-- papel DENTRO da função (só NUTRICIONISTA/ADMINISTRADOR). Os triggers do fluxo continuam
-- disparando como antes (auth.uid() é o do usuário logado): editar conteúdo já enviado
-- volta o Admin para rascunho e mantém o status da nutricionista (sobe a versão, uma vez).
--
-- Regras de validação espelham utils/passosEdicao.ts (o banco é quem garante).
-- Formatos e convenções: ver migration_formato_exercicios.sql e o seed da trilha.
--
-- Rodar DEPOIS de migration_revisao_trilhas.sql (usa papel_atual()) e de
-- migration_fluxo_conteudo.sql / migration_permissoes_conteudo.sql / migration_fluxo_versao_unica.sql.
-- Idempotente.

-- 1. Validação de UM passo ----------------------------------------------------------------
create or replace function public._licao_validar_passo(p_passo jsonb, p_n integer)
returns void
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_formato text := p_passo->>'formato';
  v_enun    text := btrim(coalesce(p_passo->>'enunciado', ''));
  v_extra   jsonb := coalesce(p_passo->'dados_extra', '{}'::jsonb);
  v_ops     jsonb := coalesce(p_passo->'opcoes', '[]'::jsonb);
  v_nops    integer;
  v_corr    integer;
  v_cats    jsonb;
  v_pares   jsonb;
  v_alim    jsonb;
  v_crit    jsonb;
  v_cap     numeric;
  v_min     numeric;
  v_pref    text := 'Passo ' || p_n || ': ';
begin
  if jsonb_typeof(v_extra) <> 'object' then raise exception '%dados extras inválidos.', v_pref using errcode = '22023'; end if;
  if jsonb_typeof(v_ops) <> 'array' then raise exception '%lista de alternativas inválida.', v_pref using errcode = '22023'; end if;
  if v_formato is null or v_formato not in ('cartao','enquete','meta','multipla_escolha','verdadeiro_falso',
                                            'completar','ordene','associe','classifique','memoria','prato') then
    raise exception '%formato inválido.', v_pref using errcode = '22023';
  end if;
  if v_enun = '' then raise exception '%o enunciado está vazio.', v_pref using errcode = '22023'; end if;

  v_nops := jsonb_array_length(v_ops);
  select count(*) into v_corr from jsonb_array_elements(v_ops) o where coalesce((o->>'correta')::boolean, false);

  if v_formato in ('multipla_escolha','verdadeiro_falso','completar','ordene','enquete','meta','classifique')
     and exists (select 1 from jsonb_array_elements(v_ops) o where btrim(coalesce(o->>'texto', '')) = '') then
    raise exception '%há alternativa em branco.', v_pref using errcode = '22023';
  end if;

  if v_formato = 'cartao' then
    if btrim(coalesce(v_extra->>'texto', '')) = '' then raise exception '%o cartão precisa de texto.', v_pref using errcode = '22023'; end if;

  elsif v_formato = 'multipla_escolha' then
    if v_nops < 2 or v_nops > 6 then raise exception '%use de 2 a 6 alternativas.', v_pref using errcode = '22023'; end if;
    if v_corr <> 1 then raise exception '%marque exatamente uma alternativa correta.', v_pref using errcode = '22023'; end if;

  elsif v_formato = 'verdadeiro_falso' then
    if v_nops <> 2 then raise exception '%verdadeiro ou falso tem exatamente 2 opções.', v_pref using errcode = '22023'; end if;
    if v_corr <> 1 then raise exception '%marque exatamente uma opção correta.', v_pref using errcode = '22023'; end if;

  elsif v_formato = 'completar' then
    if array_length(string_to_array(v_enun, '{lacuna}'), 1) <> 2 then
      raise exception '%use {lacuna} exatamente uma vez no enunciado.', v_pref using errcode = '22023';
    end if;
    if v_nops < 2 or v_nops > 6 then raise exception '%use de 2 a 6 palavras no banco.', v_pref using errcode = '22023'; end if;
    if v_corr <> 1 then raise exception '%marque exatamente uma palavra correta.', v_pref using errcode = '22023'; end if;

  elsif v_formato = 'ordene' then
    if v_nops < 2 or v_nops > 8 then raise exception '%use de 2 a 8 itens para ordenar.', v_pref using errcode = '22023'; end if;

  elsif v_formato in ('enquete','meta') then
    if v_nops < 2 or v_nops > 6 then raise exception '%use de 2 a 6 opções.', v_pref using errcode = '22023'; end if;

  elsif v_formato in ('associe','memoria') then
    v_pares := coalesce(v_extra->'pares', '[]'::jsonb);
    if jsonb_typeof(v_pares) <> 'array' or jsonb_array_length(v_pares) < 2 or jsonb_array_length(v_pares) > 8 then
      raise exception '%use de 2 a 8 pares.', v_pref using errcode = '22023';
    end if;
    if exists (select 1 from jsonb_array_elements(v_pares) x
                where btrim(coalesce(x->>'esquerda', '')) = '' or btrim(coalesce(x->>'direita', '')) = ''
                   or btrim(coalesce(x->>'id', '')) = '') then
      raise exception '%há par com um lado em branco.', v_pref using errcode = '22023';
    end if;

  elsif v_formato = 'classifique' then
    v_cats := coalesce(v_extra->'categorias', '[]'::jsonb);
    if jsonb_typeof(v_cats) <> 'array' or jsonb_array_length(v_cats) < 2 or jsonb_array_length(v_cats) > 4 then
      raise exception '%use de 2 a 4 colunas.', v_pref using errcode = '22023';
    end if;
    if exists (select 1 from jsonb_array_elements_text(v_cats) c where btrim(c) = '') then
      raise exception '%há coluna sem nome.', v_pref using errcode = '22023';
    end if;
    if v_nops < 2 or v_nops > 12 then raise exception '%use de 2 a 12 itens para classificar.', v_pref using errcode = '22023'; end if;
    if exists (select 1 from jsonb_array_elements(v_ops) o
                where coalesce(o->>'categoria', '') = '' or not (v_cats @> to_jsonb(o->>'categoria'))) then
      raise exception '%há item sem coluna válida.', v_pref using errcode = '22023';
    end if;

  elsif v_formato = 'prato' then
    v_alim := coalesce(v_extra->'alimentos', '[]'::jsonb);
    v_crit := coalesce(v_extra->'criterios', '[]'::jsonb);
    if jsonb_typeof(v_alim) <> 'array' or jsonb_array_length(v_alim) < 3 then
      raise exception '%coloque pelo menos 3 alimentos na bandeja.', v_pref using errcode = '22023';
    end if;
    if exists (select 1 from jsonb_array_elements(v_alim) a
                where btrim(coalesce(a->>'id', '')) = '' or btrim(coalesce(a->>'nome', '')) = '' or btrim(coalesce(a->>'grupo', '')) = '') then
      raise exception '%todo alimento precisa de nome e grupo.', v_pref using errcode = '22023';
    end if;
    -- critérios são opcionais (prato livre, sem missão); se houver, precisam estar completos
    if jsonb_typeof(v_crit) <> 'array' then
      raise exception '%lista de critérios inválida.', v_pref using errcode = '22023';
    end if;
    if exists (select 1 from jsonb_array_elements(v_crit) c
                where btrim(coalesce(c->>'texto', '')) = ''
                   or jsonb_typeof(c->'grupos') is distinct from 'array'
                   or jsonb_array_length(coalesce(c->'grupos', '[]'::jsonb)) = 0
                   or (c->>'minimo' is null and c->>'maximo' is null)) then
      raise exception '%todo critério precisa de texto, grupos e mínimo ou máximo.', v_pref using errcode = '22023';
    end if;
    if (v_extra->>'capacidade') is null or (v_extra->>'capacidade') !~ '^\d+$'
       or (v_extra->>'minimoItens') is null or (v_extra->>'minimoItens') !~ '^\d+$' then
      raise exception '%capacidade e mínimo de itens devem ser números inteiros.', v_pref using errcode = '22023';
    end if;
    v_cap := (v_extra->>'capacidade')::numeric;
    v_min := (v_extra->>'minimoItens')::numeric;
    if v_cap < 3 or v_cap > 7 then raise exception '%a capacidade do prato vai de 3 a 7.', v_pref using errcode = '22023'; end if;
    if v_min < 1 or v_min > v_cap then raise exception '%o mínimo de itens vai de 1 até a capacidade.', v_pref using errcode = '22023'; end if;
  end if;
end;
$$;
revoke all on function public._licao_validar_passo(jsonb, integer) from public, anon, authenticated;

-- 2. Criar ou atualizar uma lição com todos os passos -----------------------------------------
-- p_licao  : { tipo, titulo, xp, icone, texto, objetivo, habito, janela_horas, ordem? }
-- p_passos : [ { enunciado, formato, dados_extra, opcoes: [ { texto, correta, categoria } ] } ]
-- Com p_licao_id: atualiza (o tipo da lição não muda). Sem p_licao_id: cria em p_modulo_id.
-- Os passos são SUBSTITUÍDOS pela lista enviada (o app sempre envia a lista completa).
create or replace function public.conteudo_salvar_licao(
  p_licao_id uuid,
  p_modulo_id uuid,
  p_licao jsonb,
  p_passos jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_papel    text := public.papel_atual();
  v_id       uuid := p_licao_id;
  v_modulo   uuid;
  v_tipo     text;
  v_titulo   text;
  v_xp       integer;
  v_icone    text;
  v_conteudo jsonb;
  v_existente jsonb;
  v_habito   text;
  v_janela   integer;
  v_enum     text;
  v_ordem    integer;
  v_passos   jsonb := coalesce(p_passos, '[]'::jsonb);
  v_passo    jsonb;
  v_opcao    jsonb;
  v_n        integer;
  v_no       integer;
  v_q        uuid;
  v_texto    text;
begin
  if v_papel is null or v_papel not in ('NUTRICIONISTA', 'ADMINISTRADOR') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if p_licao is null or jsonb_typeof(p_licao) <> 'object' then
    raise exception 'Dados da lição inválidos.' using errcode = '22023';
  end if;
  if jsonb_typeof(v_passos) <> 'array' then
    raise exception 'Lista de passos inválida.' using errcode = '22023';
  end if;

  -- qual lição / módulo / tipo
  if v_id is not null then
    select modulo_id, tipo::text, conteudo into v_modulo, v_tipo, v_existente
      from public.licoes where id = v_id for update;
    if not found then raise exception 'Lição não encontrada.' using errcode = 'P0002'; end if;
  else
    if p_modulo_id is null or not exists (select 1 from public.modulos_trilha where id = p_modulo_id) then
      raise exception 'Módulo não encontrado.' using errcode = 'P0002';
    end if;
    v_modulo := p_modulo_id;
    v_tipo := p_licao->>'tipo';
    if v_tipo is null or v_tipo not in ('conteudo', 'quiz', 'atividade_rastreavel') then
      raise exception 'Tipo de lição inválido.' using errcode = '22023';
    end if;
  end if;

  -- dados da lição
  v_titulo := btrim(coalesce(p_licao->>'titulo', ''));
  if char_length(v_titulo) < 2 or char_length(v_titulo) > 120 then
    raise exception 'O título da lição deve ter de 2 a 120 letras.' using errcode = '22023';
  end if;
  if coalesce(p_licao->>'xp', '') !~ '^\d+$' or (p_licao->>'xp')::numeric > 500 then
    raise exception 'XP deve ser um número inteiro entre 0 e 500.' using errcode = '22023';
  end if;
  v_xp := (p_licao->>'xp')::integer;
  v_icone := nullif(btrim(coalesce(p_licao->>'icone', '')), '');
  v_texto := btrim(coalesce(p_licao->>'texto', ''));
  v_conteudo := coalesce(v_existente, '{}'::jsonb)
                || jsonb_build_object('texto', v_texto, 'objetivo', btrim(coalesce(p_licao->>'objetivo', '')));

  if jsonb_array_length(v_passos) > 30 then
    raise exception 'No máximo 30 passos por lição.' using errcode = '22023';
  end if;

  if v_tipo = 'atividade_rastreavel' then
    if jsonb_array_length(v_passos) > 0 then
      raise exception 'Lição de prática real não tem passos.' using errcode = '22023';
    end if;
    if char_length(v_texto) < 10 then
      raise exception 'Escreva o desafio do dia (mínimo de 10 letras).' using errcode = '22023';
    end if;
    v_habito := nullif(btrim(coalesce(p_licao->>'habito', '')), '');
    if coalesce(p_licao->>'janela_horas', '') !~ '^\d+$' or (p_licao->>'janela_horas')::numeric not between 1 and 168 then
      raise exception 'A janela do hábito vai de 1 a 168 horas.' using errcode = '22023';
    end if;
    v_janela := (p_licao->>'janela_horas')::integer;

    select t.typname into v_enum
      from pg_attribute a join pg_type t on t.oid = a.atttypid
     where a.attrelid = 'public.licoes'::regclass and a.attname = 'tipo_habito' and not a.attisdropped;
    if v_enum is null or v_habito is null or not exists (
         select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
          where t.typname = v_enum and e.enumlabel = v_habito) then
      raise exception 'Tipo de hábito inválido.' using errcode = '22023';
    end if;
  elsif v_tipo = 'quiz' then
    if jsonb_array_length(v_passos) = 0 then raise exception 'Um quiz precisa de pelo menos 1 passo.' using errcode = '22023'; end if;
  elsif jsonb_array_length(v_passos) = 0 and char_length(v_texto) < 10 then
    raise exception 'Escreva o texto da lição (mínimo de 10 letras) ou adicione passos.' using errcode = '22023';
  end if;

  -- valida todos os passos antes de gravar qualquer coisa
  for v_passo, v_n in select p.valor, p.n from jsonb_array_elements(v_passos) with ordinality as p(valor, n) loop
    perform public._licao_validar_passo(v_passo, v_n);
  end loop;

  -- grava a lição
  if v_id is null then
    v_ordem := case when coalesce(p_licao->>'ordem', '') ~ '^\d+$' then (p_licao->>'ordem')::integer
                    else (select coalesce(max(ordem), 0) + 1 from public.licoes where modulo_id = v_modulo) end;
    if v_tipo = 'atividade_rastreavel' then
      -- o constraint licao_habito_exige_tipo exige tipo_habito no próprio INSERT
      execute format(
        'insert into public.licoes (modulo_id, titulo, ordem, tipo, tipo_habito, icone, xp_recompensa, conteudo, criterio_conclusao)
         values ($1, $2, $3, $4::licao_tipo, %L::%I, $5, $6, $7, $8) returning id', v_habito, v_enum)
        using v_modulo, v_titulo, v_ordem, v_tipo, v_icone, v_xp, v_conteudo, jsonb_build_object('janela_horas', v_janela)
        into v_id;
    else
      insert into public.licoes (modulo_id, titulo, ordem, tipo, icone, xp_recompensa, conteudo, criterio_conclusao)
      values (v_modulo, v_titulo, v_ordem, v_tipo::licao_tipo, v_icone, v_xp, v_conteudo, null)
      returning id into v_id;
    end if;
  else
    if v_tipo = 'atividade_rastreavel' then
      execute format(
        'update public.licoes set titulo = $2, icone = $3, xp_recompensa = $4, conteudo = $5,
                tipo_habito = %L::%I, criterio_conclusao = coalesce(criterio_conclusao, ''{}''::jsonb) || $6
          where id = $1', v_habito, v_enum)
        using v_id, v_titulo, v_icone, v_xp, v_conteudo, jsonb_build_object('janela_horas', v_janela);
    else
      update public.licoes
         set titulo = v_titulo, icone = v_icone, xp_recompensa = v_xp, conteudo = v_conteudo
       where id = v_id;
    end if;
  end if;

  -- substitui os passos (alternativas primeiro, por causa da chave estrangeira)
  delete from public.opcoes_quiz where questao_id in (select id from public.questoes_quiz where licao_id = v_id);
  delete from public.questoes_quiz where licao_id = v_id;

  for v_passo, v_n in select p.valor, p.n from jsonb_array_elements(v_passos) with ordinality as p(valor, n) loop
    insert into public.questoes_quiz (licao_id, enunciado, ordem, formato, dados_extra)
    values (v_id, btrim(v_passo->>'enunciado'), v_n, v_passo->>'formato', coalesce(v_passo->'dados_extra', '{}'::jsonb))
    returning id into v_q;

    for v_opcao, v_no in
      select o.valor, o.n from jsonb_array_elements(coalesce(v_passo->'opcoes', '[]'::jsonb)) with ordinality as o(valor, n)
    loop
      insert into public.opcoes_quiz (questao_id, texto, correta, ordem, categoria)
      values (v_q, btrim(v_opcao->>'texto'), coalesce((v_opcao->>'correta')::boolean, false), v_no,
              nullif(btrim(coalesce(v_opcao->>'categoria', '')), ''));
    end loop;
  end loop;

  return v_id;
end;
$$;

revoke all on function public.conteudo_salvar_licao(uuid, uuid, jsonb, jsonb) from public, anon;
grant execute on function public.conteudo_salvar_licao(uuid, uuid, jsonb, jsonb) to authenticated;

-- Conferência rápida (SQL Editor, logada como nutricionista/admin no app):
--   select proname from pg_proc where proname in ('conteudo_salvar_licao', '_licao_validar_passo');
