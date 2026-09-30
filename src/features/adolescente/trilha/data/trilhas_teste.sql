-- DADOS DE TESTE PARA A TRILHA PEDAGÓGICA
-- Execute no SQL Editor do Supabase em um ambiente de desenvolvimento.
-- O script é idempotente: pode ser executado mais de uma vez sem duplicar
-- trilhas, módulos, lições, componentes, questões ou alternativas.
--
-- Estrutura criada:
--   6 trilhas × 3 módulos × 5 lições = 90 lições de teste.
-- Cada módulo tem, sempre nesta ordem: Ponto de Partida, Aprendizado,
-- Treino, Prática Real e Revisão/Fechamento do Capítulo.

begin;

-- A tabela existente guarda o tipo geral da lição. Estes campos/tabela
-- acrescentam a composição rica necessária para uma lição misturar teoria,
-- quiz, campo de texto e tarefa prática, como no modelo Duolingo.
alter table public.licoes add column if not exists icone text;

create table if not exists public.licao_componentes (
  id uuid primary key default gen_random_uuid(),
  licao_id uuid not null references public.licoes(id) on delete cascade,
  ordem integer not null check (ordem > 0),
  tipo text not null check (tipo in ('texto', 'quiz', 'verdadeiro_falso', 'campo_texto', 'tarefa_pratica')),
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (licao_id, ordem)
);

create index if not exists licao_componentes_licao_id_idx on public.licao_componentes (licao_id, ordem);

do $$
declare
  v_criador uuid;
  v_tema trilha_tema;
  v_tipo_habito text;
  v_tipo_habito_enum text;
  v_trilha_id uuid;
  v_modulo_id uuid;
  v_licao_id uuid;
  v_questao_id uuid;
  v_trilha jsonb;
  v_licao jsonb;
  v_ordem_trilha integer := 0;
  v_ordem_modulo integer;
  v_ordem_licao integer;
  v_ordem_questao integer;
  v_letra text;
  v_titulo_trilha text;
  v_titulo_modulo text;
  v_nome_revisao text;
  v_tipo licao_tipo;
  v_icone text;
  v_tipo_componente text;
  v_descricao text;
  v_trilhas jsonb := jsonb_build_array(
    jsonb_build_object('titulo', 'Princípios', 'descricao', 'Fundamentos para observar a alimentação sem culpa e com curiosidade.'),
    jsonb_build_object('titulo', 'A escolha dos alimentos', 'descricao', 'Estratégias simples para reconhecer e escolher alimentos no dia a dia.'),
    jsonb_build_object('titulo', 'Dos alimentos à refeição', 'descricao', 'Como combinar alimentos e montar refeições possíveis.'),
    jsonb_build_object('titulo', 'Dos alimentos à refeição — na prática', 'descricao', 'Decisões reais entre rotina, escola, casa e preferências.'),
    jsonb_build_object('titulo', 'O ato de comer e a comensalidade', 'descricao', 'Atenção, companhia e prazer nas refeições.'),
    jsonb_build_object('titulo', 'A compreensão e a superação de obstáculos', 'descricao', 'Autonomia para lidar com desafios e continuar aprendendo.')
  );
begin
  -- A autoria é obrigatória no schema. Prioriza perfil profissional e usa o
  -- primeiro perfil disponível somente em ambiente de teste.
  select id into v_criador
  from public.profiles
  where papel::text in ('ADMINISTRADOR', 'NUTRICIONISTA')
  order by created_at
  limit 1;

  if v_criador is null then
    select id into v_criador from public.profiles order by created_at limit 1;
  end if;

  if v_criador is null then
    raise exception 'Crie ao menos um perfil antes de executar este script.';
  end if;

  -- Evita depender do rótulo exato do enum trilha_tema no ambiente.
  select e.enumlabel::trilha_tema into v_tema
  from pg_enum e
  join pg_type t on t.oid = e.enumtypid
  where t.typname = 'trilha_tema'
  order by e.enumsortorder
  limit 1;

  if v_tema is null then
    raise exception 'O enum trilha_tema não foi encontrado.';
  end if;

  select t.typname into v_tipo_habito_enum
  from pg_attribute a
  join pg_type t on t.oid = a.atttypid
  where a.attrelid = 'public.licoes'::regclass
    and a.attname = 'tipo_habito'
    and not a.attisdropped;

  select e.enumlabel into v_tipo_habito
  from pg_enum e
  join pg_type t on t.oid = e.enumtypid
  where t.typname = v_tipo_habito_enum
    and e.enumlabel in ('atividade_fisica', 'agua', 'alimentacao')
  order by case e.enumlabel when 'atividade_fisica' then 1 when 'agua' then 2 else 3 end
  limit 1;

  for v_trilha in select value from jsonb_array_elements(v_trilhas) loop
    v_ordem_trilha := v_ordem_trilha + 1;
    v_letra := chr(64 + v_ordem_trilha);
    v_titulo_trilha := v_trilha->>'titulo';
    v_descricao := '[TESTE_TRILHA_DUOLINGO] ' || (v_trilha->>'descricao');

    select id into v_trilha_id
    from public.trilhas
    where titulo = v_titulo_trilha and descricao = v_descricao
    limit 1;

    if v_trilha_id is null then
      insert into public.trilhas (titulo, descricao, tema, ordem, status, criado_por, aprovado_por, aprovado_em)
      values (v_titulo_trilha, v_descricao, v_tema, v_ordem_trilha, 'aprovada', v_criador, v_criador, now())
      returning id into v_trilha_id;
    end if;

    for v_ordem_modulo in 1..3 loop
      v_titulo_modulo := format(
        '%s%s %s',
        v_letra,
        v_ordem_modulo,
        case v_ordem_modulo when 1 then 'Abertura' when 2 then 'Aprofundamento' else 'Consolidação' end
      );

      select id into v_modulo_id
      from public.modulos_trilha
      where trilha_id = v_trilha_id and ordem = v_ordem_modulo
      limit 1;

      if v_modulo_id is null then
        insert into public.modulos_trilha (trilha_id, titulo, ordem)
        values (v_trilha_id, v_titulo_modulo, v_ordem_modulo)
        returning id into v_modulo_id;
      end if;

      v_nome_revisao := case when v_ordem_modulo = 3 then 'Fechamento do Capítulo' else 'Revisão' end;

      for v_licao in select value from jsonb_array_elements(jsonb_build_array(
        jsonb_build_object('ordem', 1, 'titulo', 'Ponto de Partida', 'tipo', 'conteudo', 'icone', 'leaf-outline'),
        jsonb_build_object('ordem', 2, 'titulo', 'Aprendizado', 'tipo', 'conteudo', 'icone', 'bulb-outline'),
        jsonb_build_object('ordem', 3, 'titulo', 'Treino', 'tipo', 'quiz', 'icone', 'reader-outline'),
        jsonb_build_object('ordem', 4, 'titulo', 'Prática Real', 'tipo', 'atividade_rastreavel', 'icone', 'walk-outline'),
        jsonb_build_object('ordem', 5, 'titulo', v_nome_revisao, 'tipo', 'quiz', 'icone', 'trophy-outline')
      )) loop
        v_ordem_licao := (v_licao->>'ordem')::integer;
        v_tipo := (v_licao->>'tipo')::licao_tipo;
        v_icone := v_licao->>'icone';

        select id into v_licao_id
        from public.licoes
        where modulo_id = v_modulo_id and ordem = v_ordem_licao
        limit 1;

        if v_licao_id is null then
          if v_tipo = 'atividade_rastreavel'::licao_tipo then
            if v_tipo_habito is null or v_tipo_habito_enum is null then
              raise exception 'Não foi encontrado um valor válido para tipo_habito.';
            end if;

            -- O constraint licao_habito_exige_tipo exige tipo_habito no
            -- próprio INSERT, e não em uma atualização posterior.
            execute format(
              'insert into public.licoes (modulo_id, titulo, ordem, tipo, tipo_habito, icone, xp_recompensa, conteudo, criterio_conclusao)
               values ($1, $2, $3, $4, %L::%I, $5, $6, $7, $8) returning id',
              v_tipo_habito,
              v_tipo_habito_enum
            )
            using
              v_modulo_id,
              format('%s — %s', v_licao->>'titulo', v_titulo_trilha),
              v_ordem_licao,
              v_tipo,
              v_icone,
              30,
              jsonb_build_object(
                'texto', format('Nesta etapa de %s, vamos explorar %s de forma prática, respeitando sua rotina e suas possibilidades.', v_titulo_modulo, v_titulo_trilha),
                'objetivo', format('Construir autonomia para refletir sobre %s.', lower(v_titulo_trilha))
              ),
              jsonb_build_object('janela_horas', 24)
            into v_licao_id;
          else
            insert into public.licoes (modulo_id, titulo, ordem, tipo, icone, xp_recompensa, conteudo, criterio_conclusao)
            values (
              v_modulo_id,
              format('%s — %s', v_licao->>'titulo', v_titulo_trilha),
              v_ordem_licao,
              v_tipo,
              v_icone,
              case when v_tipo = 'quiz'::licao_tipo then 25 else 15 end,
              jsonb_build_object(
                'texto', format('Nesta etapa de %s, vamos explorar %s de forma prática, respeitando sua rotina e suas possibilidades.', v_titulo_modulo, v_titulo_trilha),
                'objetivo', format('Construir autonomia para refletir sobre %s.', lower(v_titulo_trilha))
              ),
              null
            )
            returning id into v_licao_id;
          end if;
        end if;

        -- Todas as lições recebem introdução. Aprendizados incluem reflexão;
        -- treinos e revisões somam uma sequência de exercícios; Prática Real
        -- inclui a ação rastreável que o app confere nos registros diários.
        insert into public.licao_componentes (licao_id, ordem, tipo, dados)
        values (
          v_licao_id,
          1,
          'texto',
          jsonb_build_object('titulo', v_licao->>'titulo', 'texto', format('O que você já percebe sobre %s no seu dia a dia?', lower(v_titulo_trilha)))
        ) on conflict (licao_id, ordem) do nothing;

        if v_tipo = 'conteudo'::licao_tipo and v_ordem_licao > 1 then
          insert into public.licao_componentes (licao_id, ordem, tipo, dados)
          values (v_licao_id, 2, 'campo_texto', jsonb_build_object('pergunta', 'Escreva uma situação em que você pode experimentar essa ideia.', 'obrigatorio', false))
          on conflict (licao_id, ordem) do nothing;
        elsif v_tipo = 'atividade_rastreavel'::licao_tipo then
          insert into public.licao_componentes (licao_id, ordem, tipo, dados)
          values (v_licao_id, 2, 'tarefa_pratica', jsonb_build_object('instrucao', 'Faça um registro real no app nas próximas 24 horas para concluir esta etapa.', 'janela_horas', 24))
          on conflict (licao_id, ordem) do nothing;
        elsif v_tipo = 'quiz'::licao_tipo then
          insert into public.licao_componentes (licao_id, ordem, tipo, dados)
          values (v_licao_id, 2, 'quiz', jsonb_build_object('quantidade_questoes', 3, 'feedback_imediato', true))
          on conflict (licao_id, ordem) do nothing;

          for v_ordem_questao in 1..3 loop
            v_tipo_componente := case v_ordem_questao when 1 then 'multipla_escolha' when 2 then 'verdadeiro_falso' else 'completar' end;
            select id into v_questao_id from public.questoes_quiz where licao_id = v_licao_id and ordem = v_ordem_questao limit 1;

            if v_questao_id is null then
              insert into public.questoes_quiz (licao_id, enunciado, ordem, formato, dados_extra)
              values (
                v_licao_id,
                case v_ordem_questao
                  when 1 then format('Qual atitude ajuda a colocar em prática o que você aprendeu sobre %s?', lower(v_titulo_trilha))
                  when 2 then format('Verdadeiro ou falso: pequenas escolhas possíveis fazem parte do aprendizado sobre %s.', lower(v_titulo_trilha))
                  else format('Complete: observar minha rotina pode me ajudar a fazer escolhas mais ______ sobre %s.', lower(v_titulo_trilha))
                end,
                v_ordem_questao,
                v_tipo_componente,
                jsonb_build_object('explicacao', 'Não existe perfeição: a ideia é observar, experimentar e aprender com a própria rotina.')
              ) returning id into v_questao_id;

              insert into public.opcoes_quiz (questao_id, texto, correta, ordem) values
                (v_questao_id, case when v_ordem_questao = 2 then 'Verdadeiro' when v_ordem_questao = 3 then 'possíveis' else 'Observar o contexto e escolher uma mudança possível' end, true, 1),
                (v_questao_id, case when v_ordem_questao = 2 then 'Falso' when v_ordem_questao = 3 then 'iguais' else 'Copiar a escolha de outra pessoa sem pensar na própria rotina' end, false, 2),
                (v_questao_id, case when v_ordem_questao = 2 then 'Depende do aplicativo' when v_ordem_questao = 3 then 'perfeitas' else 'Desistir quando aparecer uma dificuldade' end, false, 3),
                (v_questao_id, 'Nenhuma das anteriores', false, 4);
            end if;
          end loop;
        end if;
      end loop;
    end loop;
  end loop;
end $$;

commit;
