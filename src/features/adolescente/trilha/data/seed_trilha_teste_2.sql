-- SEED DA 2ª TRILHA DE TESTE ("Hidratação e Bebidas")
-- Execute no SQL Editor do Supabase. NÃO apaga nada: só ACRESCENTA uma trilha
-- aprovada depois das que já existem (ordem = maior ordem atual + 1), para
-- testar o caminho com várias trilhas (a 2ª só libera quando a 1ª termina).
-- Idempotente: se a trilha já existe (marcador [TESTE_TRILHA_2]), não faz nada.
-- Para remover: rode reset_trilha_teste_2.sql.
--
-- Cria 1 trilha, 2 módulos, 10 nós (leitura, quiz e Prática Real de água/alimentação).
-- Texto ILUSTRATIVO: precisa de revisão do nutricionista.

begin;

do $loader$
declare
  v_seed jsonb := $seed${
 "trilha": {
  "titulo": "Hidratação e Bebidas",
  "descricao": "[TESTE_TRILHA_2] Segunda trilha de teste para validar várias trilhas em sequência. Conteúdo ilustrativo, sem revisão do nutricionista."
 },
 "modulos": [
  {
   "titulo": "Por que beber água",
   "licoes": [
    {
     "titulo": "Ponto de Partida",
     "tipo": "conteudo",
     "icone": "water-outline",
     "xp": 20,
     "passos": [
      {
       "formato": "cartao",
       "enunciado": "Seu corpo pede água",
       "dados_extra": {
        "texto": "O corpo usa água o tempo todo: para regular a temperatura, levar nutrientes e eliminar o que não precisa. Vamos ver como ela entra na sua rotina, sem certo ou errado."
       },
       "opcoes": []
      },
      {
       "formato": "enquete",
       "enunciado": "Como foi sua água ontem?",
       "dados_extra": {
        "feedback": "Sem certo ou errado. É só um ponto de partida."
       },
       "opcoes": [
        {
         "texto": "Bebi bastante",
         "correta": false
        },
        {
         "texto": "Bebi um pouco",
         "correta": false
        },
        {
         "texto": "Quase não bebi",
         "correta": false
        },
        {
         "texto": "Não lembro",
         "correta": false
        }
       ]
      },
      {
       "formato": "cartao",
       "enunciado": "A sede avisa",
       "dados_extra": {
        "texto": "A sede é um aviso do corpo. Em dias quentes ou depois de se mexer bastante, o corpo pede mais água."
       },
       "opcoes": []
      },
      {
       "formato": "verdadeiro_falso",
       "enunciado": "Só devo beber água quando estiver com muita sede.",
       "dados_extra": {
        "explicacao": "Dá para ir bebendo ao longo do dia, aos poucos, sem esperar a sede apertar."
       },
       "opcoes": [
        {
         "texto": "Verdadeiro",
         "correta": false
        },
        {
         "texto": "Falso",
         "correta": true
        }
       ]
      }
     ],
     "conteudo": {
      "texto": "",
      "objetivo": ""
     },
     "habito": null
    },
    {
     "titulo": "Aprendizado",
     "tipo": "conteudo",
     "icone": "bulb-outline",
     "xp": 20,
     "passos": [
      {
       "formato": "cartao",
       "enunciado": "Água no dia a dia",
       "dados_extra": {
        "texto": "Além da água pura, ela também está em frutas, sopas e outros alimentos. Mesmo assim, ter uma garrafinha por perto ajuda a lembrar."
       },
       "opcoes": []
      },
      {
       "formato": "cartao",
       "enunciado": "Sinais do corpo",
       "dados_extra": {
        "texto": "Boca seca, cansaço e dor de cabeça podem aparecer quando falta água. Se algum sinal persistir, vale conversar com um adulto de confiança."
       },
       "opcoes": []
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "Qual é a melhor bebida para matar a sede?",
       "dados_extra": {
        "explicacao": "A água hidrata sem açúcar adicionado e está quase sempre disponível."
       },
       "opcoes": [
        {
         "texto": "Água",
         "correta": true
        },
        {
         "texto": "Refrigerante",
         "correta": false
        },
        {
         "texto": "Bebida em pó adoçada",
         "correta": false
        },
        {
         "texto": "Energético",
         "correta": false
        }
       ]
      },
      {
       "formato": "completar",
       "enunciado": "Uma boa forma de lembrar de beber água é ter uma {lacuna} por perto.",
       "dados_extra": {
        "explicacao": "Ter a garrafinha à vista facilita o hábito."
       },
       "opcoes": [
        {
         "texto": "garrafinha",
         "correta": true
        },
        {
         "texto": "televisão",
         "correta": false
        },
        {
         "texto": "mochila vazia",
         "correta": false
        },
        {
         "texto": "caneta",
         "correta": false
        }
       ]
      }
     ],
     "conteudo": {
      "texto": "",
      "objetivo": ""
     },
     "habito": null
    },
    {
     "titulo": "Treino",
     "tipo": "quiz",
     "icone": "reader-outline",
     "xp": 25,
     "passos": [
      {
       "formato": "verdadeiro_falso",
       "enunciado": "Beber água ajuda o corpo a regular a temperatura.",
       "dados_extra": {
        "explicacao": "A água participa do controle da temperatura, por exemplo pelo suor."
       },
       "opcoes": [
        {
         "texto": "Verdadeiro",
         "correta": true
        },
        {
         "texto": "Falso",
         "correta": false
        }
       ]
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "Em qual situação o corpo costuma pedir mais água?",
       "dados_extra": {
        "explicacao": "Quando suamos mais, perdemos mais água e precisamos repor."
       },
       "opcoes": [
        {
         "texto": "Depois de praticar atividade física",
         "correta": true
        },
        {
         "texto": "Ao assistir uma aula parado",
         "correta": false
        },
        {
         "texto": "Ao dormir",
         "correta": false
        }
       ]
      },
      {
       "formato": "ordene",
       "enunciado": "Coloque em ordem: o que fazer ao sentir sede.",
       "dados_extra": {
        "explicacao": "Perceber o sinal e responder a ele é o caminho mais simples."
       },
       "opcoes": [
        {
         "texto": "Perceber a sede",
         "correta": true
        },
        {
         "texto": "Pegar a garrafinha",
         "correta": true
        },
        {
         "texto": "Beber a água aos poucos",
         "correta": true
        },
        {
         "texto": "Voltar para o que estava fazendo",
         "correta": true
        }
       ]
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "Qual hábito ajuda a beber mais água ao longo do dia?",
       "dados_extra": {
        "explicacao": "Aos poucos e ao longo do dia funciona melhor do que de uma vez só."
       },
       "opcoes": [
        {
         "texto": "Beber um pouco em vários momentos",
         "correta": true
        },
        {
         "texto": "Beber tudo de uma vez à noite",
         "correta": false
        },
        {
         "texto": "Só beber no recreio",
         "correta": false
        }
       ]
      }
     ],
     "conteudo": {
      "texto": "",
      "objetivo": ""
     },
     "habito": null
    },
    {
     "titulo": "Prática Real",
     "tipo": "atividade_rastreavel",
     "icone": "water-outline",
     "xp": 30,
     "passos": [],
     "conteudo": {
      "texto": "Desafio do dia: registre no app um copo ou garrafinha de água que você bebeu hoje.",
      "objetivo": "Levar o que aprendeu para o seu dia."
     },
     "habito": "agua"
    },
    {
     "titulo": "Revisão",
     "tipo": "quiz",
     "icone": "trophy-outline",
     "xp": 25,
     "passos": [
      {
       "formato": "verdadeiro_falso",
       "enunciado": "A água é a melhor escolha para matar a sede no dia a dia.",
       "dados_extra": {
        "explicacao": "Ela hidrata sem açúcar adicionado."
       },
       "opcoes": [
        {
         "texto": "Verdadeiro",
         "correta": true
        },
        {
         "texto": "Falso",
         "correta": false
        }
       ]
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "Qual destes ajuda a lembrar de beber água?",
       "dados_extra": {
        "explicacao": "Facilitar o acesso torna o hábito mais fácil."
       },
       "opcoes": [
        {
         "texto": "Deixar uma garrafinha à vista",
         "correta": true
        },
        {
         "texto": "Esconder a garrafinha",
         "correta": false
        },
        {
         "texto": "Esperar passar mal",
         "correta": false
        }
       ]
      },
      {
       "formato": "completar",
       "enunciado": "A sede é um {lacuna} do corpo.",
       "dados_extra": {
        "explicacao": "O corpo avisa quando precisa de água."
       },
       "opcoes": [
        {
         "texto": "aviso",
         "correta": true
        },
        {
         "texto": "castigo",
         "correta": false
        },
        {
         "texto": "erro",
         "correta": false
        },
        {
         "texto": "segredo",
         "correta": false
        }
       ]
      }
     ],
     "conteudo": {
      "texto": "",
      "objetivo": ""
     },
     "habito": null
    }
   ]
  },
  {
   "titulo": "Escolhendo o que beber",
   "licoes": [
    {
     "titulo": "Ponto de Partida",
     "tipo": "conteudo",
     "icone": "cafe-outline",
     "xp": 20,
     "passos": [
      {
       "formato": "cartao",
       "enunciado": "Nem toda bebida é igual",
       "dados_extra": {
        "texto": "Algumas bebidas hidratam e nutrem; outras têm muito açúcar e pouco valor para o corpo. Vamos aprender a diferença, sem culpa."
       },
       "opcoes": []
      },
      {
       "formato": "enquete",
       "enunciado": "Qual bebida você mais toma além da água?",
       "dados_extra": {
        "feedback": "Sem certo ou errado. Cada resposta ajuda a entender sua rotina."
       },
       "opcoes": [
        {
         "texto": "Suco",
         "correta": false
        },
        {
         "texto": "Refrigerante",
         "correta": false
        },
        {
         "texto": "Leite",
         "correta": false
        },
        {
         "texto": "Outra",
         "correta": false
        },
        {
         "texto": "Quase só água",
         "correta": false
        }
       ]
      },
      {
       "formato": "cartao",
       "enunciado": "Olhe o rótulo",
       "dados_extra": {
        "texto": "Bebidas de caixinha e de garrafa trazem o açúcar na lista de ingredientes. Quanto mais para o começo da lista, maior a quantidade."
       },
       "opcoes": []
      },
      {
       "formato": "verdadeiro_falso",
       "enunciado": "Toda bebida colorida é suco de fruta.",
       "dados_extra": {
        "explicacao": "Muitas são bebidas adoçadas com sabor e corante. Vale conferir o rótulo."
       },
       "opcoes": [
        {
         "texto": "Verdadeiro",
         "correta": false
        },
        {
         "texto": "Falso",
         "correta": true
        }
       ]
      }
     ],
     "conteudo": {
      "texto": "",
      "objetivo": ""
     },
     "habito": null
    },
    {
     "titulo": "Aprendizado",
     "tipo": "conteudo",
     "icone": "bulb-outline",
     "xp": 20,
     "passos": [
      {
       "formato": "cartao",
       "enunciado": "Suco de fruta de verdade",
       "dados_extra": {
        "texto": "O suco feito na hora com a fruta é diferente de bebidas prontas adoçadas. Comer a fruta inteira também traz as fibras."
       },
       "opcoes": []
      },
      {
       "formato": "cartao",
       "enunciado": "Bebidas adoçadas",
       "dados_extra": {
        "texto": "Refrigerantes e bebidas adoçadas têm bastante açúcar e quase nenhum nutriente. Podem ficar para ocasiões especiais."
       },
       "opcoes": []
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "Qual opção é mais próxima da natureza?",
       "dados_extra": {
        "explicacao": "A fruta é um alimento in natura; as outras passam por muita indústria."
       },
       "opcoes": [
        {
         "texto": "Fruta ou suco feito na hora",
         "correta": true
        },
        {
         "texto": "Refrigerante",
         "correta": false
        },
        {
         "texto": "Bebida de caixinha adoçada",
         "correta": false
        },
        {
         "texto": "Isotônico colorido",
         "correta": false
        }
       ]
      },
      {
       "formato": "completar",
       "enunciado": "O leite e a água de coco são bebidas que podem fazer parte da {lacuna}.",
       "dados_extra": {
        "explicacao": "Bebidas simples e próximas da natureza combinam com o dia a dia."
       },
       "opcoes": [
        {
         "texto": "rotina",
         "correta": true
        },
        {
         "texto": "bagunça",
         "correta": false
        },
        {
         "texto": "dúvida",
         "correta": false
        },
        {
         "texto": "fila",
         "correta": false
        }
       ]
      }
     ],
     "conteudo": {
      "texto": "",
      "objetivo": ""
     },
     "habito": null
    },
    {
     "titulo": "Treino",
     "tipo": "quiz",
     "icone": "reader-outline",
     "xp": 25,
     "passos": [
      {
       "formato": "verdadeiro_falso",
       "enunciado": "Ler o rótulo ajuda a descobrir se a bebida tem açúcar adicionado.",
       "dados_extra": {
        "explicacao": "A lista de ingredientes mostra o que foi acrescentado."
       },
       "opcoes": [
        {
         "texto": "Verdadeiro",
         "correta": true
        },
        {
         "texto": "Falso",
         "correta": false
        }
       ]
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "Qual escolha combina com um lanche simples?",
       "dados_extra": {
        "explicacao": "Fruta e água formam um lanche simples e acessível."
       },
       "opcoes": [
        {
         "texto": "Uma fruta e água",
         "correta": true
        },
        {
         "texto": "Salgadinho e refrigerante",
         "correta": false
        },
        {
         "texto": "Biscoito recheado e bebida adoçada",
         "correta": false
        }
       ]
      },
      {
       "formato": "ordene",
       "enunciado": "Coloque em ordem, do mais perto da natureza ao mais industrializado.",
       "dados_extra": {
        "explicacao": "Quanto menos etapas industriais, mais perto da natureza."
       },
       "opcoes": [
        {
         "texto": "Água",
         "correta": true
        },
        {
         "texto": "Suco feito na hora",
         "correta": true
        },
        {
         "texto": "Bebida de caixinha",
         "correta": true
        },
        {
         "texto": "Refrigerante",
         "correta": true
        }
       ]
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "O que fazer se não tiver água por perto?",
       "dados_extra": {
        "explicacao": "Pedir ou procurar água é sempre uma boa saída."
       },
       "opcoes": [
        {
         "texto": "Procurar um bebedouro ou pedir água",
         "correta": true
        },
        {
         "texto": "Esperar a sede passar para sempre",
         "correta": false
        },
        {
         "texto": "Trocar por energético",
         "correta": false
        }
       ]
      }
     ],
     "conteudo": {
      "texto": "",
      "objetivo": ""
     },
     "habito": null
    },
    {
     "titulo": "Prática Real",
     "tipo": "atividade_rastreavel",
     "icone": "restaurant-outline",
     "xp": 30,
     "passos": [],
     "conteudo": {
      "texto": "Desafio do dia: registre uma refeição ou lanche no app e observe qual bebida acompanhou.",
      "objetivo": "Perceber as bebidas que fazem parte da sua rotina."
     },
     "habito": "alimentacao"
    },
    {
     "titulo": "Fechamento do Capítulo",
     "tipo": "quiz",
     "icone": "trophy-outline",
     "xp": 25,
     "passos": [
      {
       "formato": "verdadeiro_falso",
       "enunciado": "Fruta inteira e suco de caixinha adoçado são a mesma coisa.",
       "dados_extra": {
        "explicacao": "A fruta inteira traz fibras e não tem açúcar adicionado."
       },
       "opcoes": [
        {
         "texto": "Verdadeiro",
         "correta": false
        },
        {
         "texto": "Falso",
         "correta": true
        }
       ]
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "Qual bebida é a melhor para o dia a dia?",
       "dados_extra": {
        "explicacao": "Hidrata sem açúcar adicionado."
       },
       "opcoes": [
        {
         "texto": "Água",
         "correta": true
        },
        {
         "texto": "Refrigerante",
         "correta": false
        },
        {
         "texto": "Bebida em pó adoçada",
         "correta": false
        }
       ]
      },
      {
       "formato": "ordene",
       "enunciado": "Coloque em ordem: como escolher uma bebida.",
       "dados_extra": {
        "explicacao": "Escolher com calma ajuda a decidir melhor."
       },
       "opcoes": [
        {
         "texto": "Sentir sede",
         "correta": true
        },
        {
         "texto": "Pensar nas opções",
         "correta": true
        },
        {
         "texto": "Escolher a água ou uma opção natural",
         "correta": true
        },
        {
         "texto": "Beber com calma",
         "correta": true
        }
       ]
      },
      {
       "formato": "completar",
       "enunciado": "Para saber se tem açúcar, é só ler o {lacuna}.",
       "dados_extra": {
        "explicacao": "O rótulo mostra os ingredientes."
       },
       "opcoes": [
        {
         "texto": "rótulo",
         "correta": true
        },
        {
         "texto": "desenho",
         "correta": false
        },
        {
         "texto": "preço",
         "correta": false
        },
        {
         "texto": "tamanho",
         "correta": false
        }
       ]
      }
     ],
     "conteudo": {
      "texto": "",
      "objetivo": ""
     },
     "habito": null
    }
   ]
  }
 ]
}$seed$::jsonb;
  v_criador uuid;
  v_tema trilha_tema;
  v_habito_enum text;
  v_habito text;
  v_ordem_trilha integer;
  v_trilha_id uuid;
  v_modulo_id uuid;
  v_licao_id uuid;
  v_questao_id uuid;
  v_modulo jsonb;
  v_licao jsonb;
  v_passo jsonb;
  v_opcao jsonb;
  v_n_modulo integer;
  v_n_licao integer;
  v_n_passo integer;
  v_n_opcao integer;
  v_tipo licao_tipo;
begin
  if exists (select 1 from public.trilhas where descricao like '[TESTE_TRILHA_2]%') then
    raise notice 'A 2ª trilha de teste já existe. Nada foi feito.';
    return;
  end if;

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

  select e.enumlabel::trilha_tema into v_tema
  from pg_enum e
  join pg_type t on t.oid = e.enumtypid
  where t.typname = 'trilha_tema'
  order by e.enumsortorder
  limit 1;

  if v_tema is null then
    raise exception 'O enum trilha_tema não foi encontrado.';
  end if;

  select t.typname into v_habito_enum
  from pg_attribute a
  join pg_type t on t.oid = a.atttypid
  where a.attrelid = 'public.licoes'::regclass
    and a.attname = 'tipo_habito'
    and not a.attisdropped;

  -- depois de todas as trilhas que já existem
  select coalesce(max(ordem), 0) + 1 into v_ordem_trilha from public.trilhas;

  insert into public.trilhas (titulo, descricao, tema, ordem, status, criado_por, aprovado_por, aprovado_em)
  values (v_seed->'trilha'->>'titulo', v_seed->'trilha'->>'descricao', v_tema, v_ordem_trilha, 'aprovada', v_criador, v_criador, now())
  returning id into v_trilha_id;

  for v_modulo, v_n_modulo in
    select m.valor, m.n from jsonb_array_elements(v_seed->'modulos') with ordinality as m(valor, n)
  loop
    insert into public.modulos_trilha (trilha_id, titulo, ordem)
    values (v_trilha_id, v_modulo->>'titulo', v_n_modulo)
    returning id into v_modulo_id;

    for v_licao, v_n_licao in
      select l.valor, l.n from jsonb_array_elements(v_modulo->'licoes') with ordinality as l(valor, n)
    loop
      v_tipo := (v_licao->>'tipo')::licao_tipo;

      if v_tipo = 'atividade_rastreavel'::licao_tipo then
        -- o constraint licao_habito_exige_tipo exige tipo_habito no próprio INSERT
        select e.enumlabel into v_habito
        from pg_enum e
        join pg_type t on t.oid = e.enumtypid
        where t.typname = v_habito_enum and e.enumlabel = v_licao->>'habito';

        if v_habito is null then
          select e.enumlabel into v_habito
          from pg_enum e
          join pg_type t on t.oid = e.enumtypid
          where t.typname = v_habito_enum
            and e.enumlabel in ('atividade_fisica', 'agua', 'alimentacao')
          order by case e.enumlabel when 'atividade_fisica' then 1 when 'agua' then 2 else 3 end
          limit 1;
        end if;

        if v_habito is null then
          raise exception 'Não foi encontrado um valor válido para tipo_habito.';
        end if;

        execute format(
          'insert into public.licoes (modulo_id, titulo, ordem, tipo, tipo_habito, icone, xp_recompensa, conteudo, criterio_conclusao)
           values ($1, $2, $3, $4, %L::%I, $5, $6, $7, $8) returning id',
          v_habito, v_habito_enum
        )
        using v_modulo_id, v_licao->>'titulo', v_n_licao, v_tipo, v_licao->>'icone',
              (v_licao->>'xp')::integer, v_licao->'conteudo', jsonb_build_object('janela_horas', 24)
        into v_licao_id;
      else
        insert into public.licoes (modulo_id, titulo, ordem, tipo, icone, xp_recompensa, conteudo, criterio_conclusao)
        values (v_modulo_id, v_licao->>'titulo', v_n_licao, v_tipo, v_licao->>'icone',
                (v_licao->>'xp')::integer, v_licao->'conteudo', null)
        returning id into v_licao_id;
      end if;

      for v_passo, v_n_passo in
        select p.valor, p.n from jsonb_array_elements(v_licao->'passos') with ordinality as p(valor, n)
      loop
        insert into public.questoes_quiz (licao_id, enunciado, ordem, formato, dados_extra)
        values (v_licao_id, v_passo->>'enunciado', v_n_passo, v_passo->>'formato',
                coalesce(v_passo->'dados_extra', '{}'::jsonb))
        returning id into v_questao_id;

        for v_opcao, v_n_opcao in
          select o.valor, o.n from jsonb_array_elements(coalesce(v_passo->'opcoes', '[]'::jsonb)) with ordinality as o(valor, n)
        loop
          insert into public.opcoes_quiz (questao_id, texto, correta, ordem, categoria)
          values (v_questao_id, v_opcao->>'texto', coalesce((v_opcao->>'correta')::boolean, false),
                  v_n_opcao, v_opcao->>'categoria');
        end loop;
      end loop;
    end loop;
  end loop;
end
$loader$;

commit;
