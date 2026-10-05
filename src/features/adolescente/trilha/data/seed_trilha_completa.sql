-- SEED DA TRILHA DE TESTE COMPLETA (gerado por gerar_seed_trilha.py — não edite à mão)
-- Execute DEPOIS do reset_trilha_teste.sql, no SQL Editor do Supabase.
--
-- Cria 1 trilha aprovada, 3 módulos, 15 nós. Os nós de leitura e de quiz têm
-- 10 passos (Fechamento do Capítulo: 15) e, juntos, usam todos os formatos:
-- cartao, enquete, meta, multipla_escolha, verdadeiro_falso, completar,
-- ordene, associe, classifique, memoria e prato. Os nós de Prática Real não têm
-- passos (a tela ainda só confere o registro do hábito).
-- Texto ILUSTRATIVO: precisa de revisão do nutricionista.

begin;

do $loader$
declare
  v_seed jsonb := $seed${
 "trilha": {
  "titulo": "Alimentação Saudável",
  "descricao": "[TESTE_TRILHA_COMPLETA] Trilha de teste com todos os formatos de exercício. Conteúdo ilustrativo, sem revisão do nutricionista."
 },
 "modulos": [
  {
   "titulo": "Conhecendo os grupos alimentares",
   "licoes": [
    {
     "titulo": "Ponto de Partida",
     "tipo": "conteudo",
     "icone": "leaf-outline",
     "xp": 20,
     "passos": [
      {
       "formato": "cartao",
       "enunciado": "De onde vem o que você come?",
       "dados_extra": {
        "texto": "Alguns alimentos vêm quase direto da natureza. Outros passam por muitas etapas na indústria. Vamos descobrir a diferença, sem certo ou errado."
       },
       "opcoes": []
      },
      {
       "formato": "enquete",
       "enunciado": "Pensa no que você comeu ontem. O que veio mais perto da natureza e o que veio de pacote?",
       "dados_extra": {
        "feedback": "Sem certo ou errado. É só um ponto de partida."
       },
       "opcoes": [
        {
         "texto": "Mais da natureza",
         "correta": false
        },
        {
         "texto": "Meio a meio",
         "correta": false
        },
        {
         "texto": "Mais de pacote",
         "correta": false
        },
        {
         "texto": "Não lembro",
         "correta": false
        }
       ]
      },
      {
       "formato": "verdadeiro_falso",
       "enunciado": "Todo alimento que vem em pacote é ultraprocessado.",
       "dados_extra": {
        "explicacao": "Arroz e feijão vêm em pacote e são minimamente processados. O que importa é o quanto o alimento foi processado."
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
       "formato": "cartao",
       "enunciado": "Quatro grupos",
       "dados_extra": {
        "texto": "O Guia Alimentar separa os alimentos pelo quanto foram processados: in natura ou minimamente processados, ingredientes culinários, processados e ultraprocessados."
       },
       "opcoes": []
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "Qual destes é um alimento in natura?",
       "dados_extra": {
        "explicacao": "A laranja vem direto da natureza, sem nenhuma etapa industrial."
       },
       "opcoes": [
        {
         "texto": "Laranja",
         "correta": true
        },
        {
         "texto": "Refrigerante",
         "correta": false
        },
        {
         "texto": "Salgadinho de pacote",
         "correta": false
        },
        {
         "texto": "Biscoito recheado",
         "correta": false
        }
       ]
      },
      {
       "formato": "cartao",
       "enunciado": "Perto da natureza",
       "dados_extra": {
        "texto": "Fruta, ovo, arroz, feijão, mandioca e leite são in natura ou minimamente processados. Eles são a base da alimentação e costumam ser acessíveis."
       },
       "opcoes": []
      },
      {
       "formato": "associe",
       "enunciado": "Ligue cada alimento ao grupo dele.",
       "dados_extra": {
        "pares": [
         {
          "id": "p1",
          "esquerda": "Laranja",
          "direita": "In natura"
         },
         {
          "id": "p2",
          "esquerda": "Arroz",
          "direita": "Minimamente processado"
         },
         {
          "id": "p3",
          "esquerda": "Azeite",
          "direita": "Ingrediente culinário"
         },
         {
          "id": "p4",
          "esquerda": "Salgadinho de pacote",
          "direita": "Ultraprocessado"
         }
        ],
        "explicacao": "Cada alimento pertence ao grupo conforme o quanto foi processado."
       },
       "opcoes": []
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "No lanche, qual opção tem mais alimentos in natura ou minimamente processados?",
       "dados_extra": {
        "explicacao": "Ovo e banana vêm perto da natureza e costumam custar pouco."
       },
       "opcoes": [
        {
         "texto": "Bolacha recheada e refrigerante",
         "correta": false
        },
        {
         "texto": "Ovo cozido e uma banana",
         "correta": true
        },
        {
         "texto": "Salgadinho e suco de caixinha",
         "correta": false
        }
       ]
      },
      {
       "formato": "enquete",
       "enunciado": "Como você costuma lanchar na escola?",
       "dados_extra": {
        "feedback": "Cada rotina é diferente, e tudo bem. Vamos partir da sua."
       },
       "opcoes": [
        {
         "texto": "Levo de casa",
         "correta": false
        },
        {
         "texto": "Compro na cantina",
         "correta": false
        },
        {
         "texto": "Depende do dia",
         "correta": false
        },
        {
         "texto": "Nem sempre lancho",
         "correta": false
        }
       ]
      },
      {
       "formato": "cartao",
       "enunciado": "Levo comigo",
       "dados_extra": {
        "texto": "Não é sobre proibir nada. É sobre perceber o quanto cada alimento foi processado e dar mais espaço aos que estão perto da natureza."
       },
       "opcoes": []
      }
     ],
     "conteudo": {
      "texto": "Vamos começar pelo que você já conhece sobre conhecendo os grupos alimentares.",
      "objetivo": "Ativar o que você já sabe e vive."
     },
     "habito": null
    },
    {
     "titulo": "Aprendizado",
     "tipo": "conteudo",
     "icone": "bulb-outline",
     "xp": 30,
     "passos": [
      {
       "formato": "cartao",
       "enunciado": "O que é ultraprocessado?",
       "dados_extra": {
        "texto": "São receitas industriais com ingredientes que não usamos na cozinha, como corantes e aromatizantes. Exemplos: salgadinho de pacote, refrigerante e macarrão instantâneo."
       },
       "opcoes": []
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "O que mais caracteriza um alimento ultraprocessado?",
       "dados_extra": {
        "explicacao": "Ultraprocessados são formulações industriais com ingredientes que não usamos na cozinha."
       },
       "opcoes": [
        {
         "texto": "Ser comprado na feira",
         "correta": false
        },
        {
         "texto": "Receita industrial com aditivos, como corantes e aromatizantes",
         "correta": true
        },
        {
         "texto": "Ser feito em casa",
         "correta": false
        },
        {
         "texto": "Ter um único ingrediente",
         "correta": false
        }
       ]
      },
      {
       "formato": "cartao",
       "enunciado": "Exemplo resolvido",
       "dados_extra": {
        "texto": "O pacote de arroz tem só o grão limpo e embalado: é minimamente processado. Já o biscoito recheado leva açúcar, gordura e aditivos: é ultraprocessado."
       },
       "opcoes": []
      },
      {
       "formato": "associe",
       "enunciado": "Ligue cada alimento ao grupo dele.",
       "dados_extra": {
        "pares": [
         {
          "id": "p1",
          "esquerda": "Ovo",
          "direita": "In natura"
         },
         {
          "id": "p2",
          "esquerda": "Sal",
          "direita": "Ingrediente culinário"
         },
         {
          "id": "p3",
          "esquerda": "Refrigerante",
          "direita": "Ultraprocessado"
         },
         {
          "id": "p4",
          "esquerda": "Farinha de mandioca",
          "direita": "Minimamente processado"
         }
        ],
        "explicacao": "O que importa é o quanto o alimento foi processado."
       },
       "opcoes": []
      },
      {
       "formato": "cartao",
       "enunciado": "Ingredientes culinários",
       "dados_extra": {
        "texto": "Óleo, sal, açúcar e vinagre servem para temperar e cozinhar. Entram em pequenas quantidades para dar sabor à comida de verdade."
       },
       "opcoes": []
      },
      {
       "formato": "verdadeiro_falso",
       "enunciado": "O sal e o óleo de cozinha são ingredientes culinários.",
       "dados_extra": {
        "explicacao": "Eles servem para temperar e cozinhar, e entram em pequenas quantidades."
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
       "formato": "classifique",
       "enunciado": "Classifique cada alimento.",
       "dados_extra": {
        "categorias": [
         "Mais perto da natureza",
         "Mais industrializado"
        ],
        "explicacao": "Simplificação proposital: os processados entram em outra etapa."
       },
       "opcoes": [
        {
         "texto": "Ovo",
         "correta": true,
         "categoria": "Mais perto da natureza"
        },
        {
         "texto": "Macarrão instantâneo",
         "correta": true,
         "categoria": "Mais industrializado"
        },
        {
         "texto": "Mandioca",
         "correta": true,
         "categoria": "Mais perto da natureza"
        },
        {
         "texto": "Biscoito recheado",
         "correta": true,
         "categoria": "Mais industrializado"
        },
        {
         "texto": "Feijão",
         "correta": true,
         "categoria": "Mais perto da natureza"
        },
        {
         "texto": "Nuggets",
         "correta": true,
         "categoria": "Mais industrializado"
        }
       ]
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "Você tem pouco tempo de manhã. Qual escolha continua perto da natureza e é simples?",
       "dados_extra": {
        "explicacao": "Cuscuz, ovo e fruta são rápidos, baratos e perto da natureza. Nem sempre dá para escolher assim, e tudo bem."
       },
       "opcoes": [
        {
         "texto": "Macarrão instantâneo",
         "correta": false
        },
        {
         "texto": "Biscoito recheado com achocolatado",
         "correta": false
        },
        {
         "texto": "Cuscuz com ovo e uma fruta",
         "correta": true
        }
       ]
      },
      {
       "formato": "completar",
       "enunciado": "O Guia sugere que a base da alimentação seja feita de alimentos {lacuna}.",
       "dados_extra": {
        "explicacao": "A base é feita de alimentos in natura ou minimamente processados."
       },
       "opcoes": [
        {
         "texto": "in natura ou minimamente processados",
         "correta": true
        },
        {
         "texto": "ultraprocessados",
         "correta": false
        },
        {
         "texto": "de pacote",
         "correta": false
        }
       ]
      },
      {
       "formato": "meta",
       "enunciado": "Qual pequena troca é possível para você nesta semana?",
       "dados_extra": {
        "feedback": "Pequenos passos contam. Você pode mudar de ideia depois."
       },
       "opcoes": [
        {
         "texto": "Incluir uma fruta em uma refeição",
         "correta": false
        },
        {
         "texto": "Cozinhar algo simples em casa",
         "correta": false
        },
        {
         "texto": "Ainda não sei, e tudo bem",
         "correta": false
        }
       ]
      }
     ],
     "conteudo": {
      "texto": "Hora de aprender algo novo sobre conhecendo os grupos alimentares.",
      "objetivo": "Entender o conceito novo com exemplos."
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
       "formato": "multipla_escolha",
       "enunciado": "O que mais caracteriza um alimento ultraprocessado?",
       "dados_extra": {
        "explicacao": "Ultraprocessados são formulações industriais com ingredientes que não usamos na cozinha."
       },
       "opcoes": [
        {
         "texto": "Ser comprado na feira",
         "correta": false
        },
        {
         "texto": "Receita industrial com aditivos, como corantes e aromatizantes",
         "correta": true
        },
        {
         "texto": "Ser feito em casa",
         "correta": false
        },
        {
         "texto": "Ter um único ingrediente",
         "correta": false
        }
       ]
      },
      {
       "formato": "verdadeiro_falso",
       "enunciado": "O sal e o óleo de cozinha são ingredientes culinários.",
       "dados_extra": {
        "explicacao": "Eles servem para temperar e cozinhar, e entram em pequenas quantidades."
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
       "formato": "associe",
       "enunciado": "Ligue cada alimento ao grupo dele.",
       "dados_extra": {
        "pares": [
         {
          "id": "p1",
          "esquerda": "Laranja",
          "direita": "In natura"
         },
         {
          "id": "p2",
          "esquerda": "Arroz",
          "direita": "Minimamente processado"
         },
         {
          "id": "p3",
          "esquerda": "Azeite",
          "direita": "Ingrediente culinário"
         },
         {
          "id": "p4",
          "esquerda": "Salgadinho de pacote",
          "direita": "Ultraprocessado"
         }
        ],
        "explicacao": "Cada alimento pertence ao grupo conforme o quanto foi processado."
       },
       "opcoes": []
      },
      {
       "formato": "ordene",
       "enunciado": "Coloque em ordem, do mais perto da natureza ao mais industrializado.",
       "dados_extra": {
        "explicacao": "Quanto mais etapas e ingredientes industriais, mais processado."
       },
       "opcoes": [
        {
         "texto": "Batata cozida",
         "correta": true
        },
        {
         "texto": "Batata frita feita em casa",
         "correta": true
        },
        {
         "texto": "Batata chips de pacote",
         "correta": true
        }
       ]
      },
      {
       "formato": "completar",
       "enunciado": "Alimentos {lacuna} passam por muitas etapas na indústria e levam aditivos.",
       "dados_extra": {
        "explicacao": "Ultraprocessados são os mais industrializados."
       },
       "opcoes": [
        {
         "texto": "in natura",
         "correta": false
        },
        {
         "texto": "ultraprocessados",
         "correta": true
        },
        {
         "texto": "minimamente processados",
         "correta": false
        }
       ]
      },
      {
       "formato": "classifique",
       "enunciado": "Classifique cada alimento.",
       "dados_extra": {
        "categorias": [
         "Mais perto da natureza",
         "Mais industrializado"
        ],
        "explicacao": "Quanto menos etapas industriais, mais perto da natureza."
       },
       "opcoes": [
        {
         "texto": "Banana",
         "correta": true,
         "categoria": "Mais perto da natureza"
        },
        {
         "texto": "Salgadinho de pacote",
         "correta": true,
         "categoria": "Mais industrializado"
        },
        {
         "texto": "Arroz",
         "correta": true,
         "categoria": "Mais perto da natureza"
        },
        {
         "texto": "Refrigerante",
         "correta": true,
         "categoria": "Mais industrializado"
        },
        {
         "texto": "Milho",
         "correta": true,
         "categoria": "Mais perto da natureza"
        },
        {
         "texto": "Sopa instantânea",
         "correta": true,
         "categoria": "Mais industrializado"
        }
       ]
      },
      {
       "formato": "verdadeiro_falso",
       "enunciado": "Ultraprocessados costumam ter prazo de validade longo por causa dos aditivos.",
       "dados_extra": {
        "explicacao": "Aditivos e conservantes ajudam esses produtos a durar mais tempo nas prateleiras."
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
       "enunciado": "No lanche, qual opção tem mais alimentos in natura ou minimamente processados?",
       "dados_extra": {
        "explicacao": "Ovo e banana vêm perto da natureza e costumam custar pouco."
       },
       "opcoes": [
        {
         "texto": "Bolacha recheada e refrigerante",
         "correta": false
        },
        {
         "texto": "Ovo cozido e uma banana",
         "correta": true
        },
        {
         "texto": "Salgadinho e suco de caixinha",
         "correta": false
        }
       ]
      },
      {
       "formato": "prato",
       "enunciado": "Vamos montar um almoço? Escolha os alimentos até cumprir a missão.",
       "dados_extra": {
        "alimentos": [
         {
          "id": "arroz",
          "nome": "Arroz",
          "emoji": "🍚",
          "grupo": "cereal"
         },
         {
          "id": "batata",
          "nome": "Batata",
          "emoji": "🥔",
          "grupo": "tuberculo"
         },
         {
          "id": "feijao",
          "nome": "Feijão",
          "emoji": "🍲",
          "grupo": "leguminosa"
         },
         {
          "id": "ovo",
          "nome": "Ovo",
          "emoji": "🥚",
          "grupo": "proteina"
         },
         {
          "id": "frango",
          "nome": "Frango",
          "emoji": "🍗",
          "grupo": "proteina"
         },
         {
          "id": "alface",
          "nome": "Alface",
          "emoji": "🥬",
          "grupo": "vegetal"
         },
         {
          "id": "cenoura",
          "nome": "Cenoura",
          "emoji": "🥕",
          "grupo": "vegetal"
         },
         {
          "id": "salgadinho",
          "nome": "Salgadinho",
          "emoji": "🍟",
          "grupo": "ultraprocessado"
         },
         {
          "id": "refri",
          "nome": "Refrigerante",
          "emoji": "🥤",
          "grupo": "ultraprocessado"
         }
        ],
        "criterios": [
         {
          "id": "c1",
          "texto": "Uma fonte de energia",
          "grupos": [
           "cereal",
           "tuberculo"
          ],
          "minimo": 1
         },
         {
          "id": "c2",
          "texto": "Uma proteína",
          "grupos": [
           "proteina",
           "leguminosa"
          ],
          "minimo": 1
         },
         {
          "id": "c3",
          "texto": "Uma verdura ou legume",
          "grupos": [
           "vegetal"
          ],
          "minimo": 1
         }
        ],
        "capacidade": 6,
        "minimoItens": 3,
        "feedback": "Prato completo! Energia, proteína e verdura juntas deixam a refeição mais equilibrada."
       },
       "opcoes": []
      },
      {
       "formato": "memoria",
       "enunciado": "Jogo da memória: ache o alimento e o grupo dele.",
       "dados_extra": {
        "pares": [
         {
          "id": "p1",
          "esquerda": "Laranja",
          "direita": "In natura"
         },
         {
          "id": "p2",
          "esquerda": "Azeite",
          "direita": "Culinário"
         },
         {
          "id": "p3",
          "esquerda": "Nuggets",
          "direita": "Ultraprocessado"
         }
        ],
        "feedback": "Boa memória! Os alimentos perto da natureza cabem na base da alimentação."
       },
       "opcoes": []
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
      "texto": "Desafio do dia: registre uma refeição no app e observe o quanto dela veio perto da natureza.",
      "objetivo": "Levar o que aprendeu para uma refeição real."
     },
     "habito": "alimentacao"
    },
    {
     "titulo": "Revisão",
     "tipo": "quiz",
     "icone": "trophy-outline",
     "xp": 25,
     "passos": [
      {
       "formato": "verdadeiro_falso",
       "enunciado": "O sal e o óleo de cozinha são ingredientes culinários.",
       "dados_extra": {
        "explicacao": "Eles servem para temperar e cozinhar, e entram em pequenas quantidades."
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
       "enunciado": "Qual destes é um alimento in natura?",
       "dados_extra": {
        "explicacao": "A laranja vem direto da natureza, sem nenhuma etapa industrial."
       },
       "opcoes": [
        {
         "texto": "Laranja",
         "correta": true
        },
        {
         "texto": "Refrigerante",
         "correta": false
        },
        {
         "texto": "Salgadinho de pacote",
         "correta": false
        },
        {
         "texto": "Biscoito recheado",
         "correta": false
        }
       ]
      },
      {
       "formato": "memoria",
       "enunciado": "Jogo da memória: ache o alimento e o grupo dele.",
       "dados_extra": {
        "pares": [
         {
          "id": "p1",
          "esquerda": "Feijão",
          "direita": "Minimamente processado"
         },
         {
          "id": "p2",
          "esquerda": "Óleo",
          "direita": "Culinário"
         },
         {
          "id": "p3",
          "esquerda": "Fruta",
          "direita": "In natura"
         },
         {
          "id": "p4",
          "esquerda": "Biscoito recheado",
          "direita": "Ultraprocessado"
         }
        ],
        "feedback": "Muito bem! Você já reconhece os grupos."
       },
       "opcoes": []
      },
      {
       "formato": "classifique",
       "enunciado": "Classifique cada alimento.",
       "dados_extra": {
        "categorias": [
         "Mais perto da natureza",
         "Mais industrializado"
        ],
        "explicacao": "Simplificação proposital: os processados entram em outra etapa."
       },
       "opcoes": [
        {
         "texto": "Ovo",
         "correta": true,
         "categoria": "Mais perto da natureza"
        },
        {
         "texto": "Macarrão instantâneo",
         "correta": true,
         "categoria": "Mais industrializado"
        },
        {
         "texto": "Mandioca",
         "correta": true,
         "categoria": "Mais perto da natureza"
        },
        {
         "texto": "Biscoito recheado",
         "correta": true,
         "categoria": "Mais industrializado"
        },
        {
         "texto": "Feijão",
         "correta": true,
         "categoria": "Mais perto da natureza"
        },
        {
         "texto": "Nuggets",
         "correta": true,
         "categoria": "Mais industrializado"
        }
       ]
      },
      {
       "formato": "completar",
       "enunciado": "Alimentos {lacuna} passam por muitas etapas na indústria e levam aditivos.",
       "dados_extra": {
        "explicacao": "Ultraprocessados são os mais industrializados."
       },
       "opcoes": [
        {
         "texto": "in natura",
         "correta": false
        },
        {
         "texto": "ultraprocessados",
         "correta": true
        },
        {
         "texto": "minimamente processados",
         "correta": false
        }
       ]
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "Você tem pouco tempo de manhã. Qual escolha continua perto da natureza e é simples?",
       "dados_extra": {
        "explicacao": "Cuscuz, ovo e fruta são rápidos, baratos e perto da natureza. Nem sempre dá para escolher assim, e tudo bem."
       },
       "opcoes": [
        {
         "texto": "Macarrão instantâneo",
         "correta": false
        },
        {
         "texto": "Biscoito recheado com achocolatado",
         "correta": false
        },
        {
         "texto": "Cuscuz com ovo e uma fruta",
         "correta": true
        }
       ]
      },
      {
       "formato": "verdadeiro_falso",
       "enunciado": "Ultraprocessados costumam ter prazo de validade longo por causa dos aditivos.",
       "dados_extra": {
        "explicacao": "Aditivos e conservantes ajudam esses produtos a durar mais tempo nas prateleiras."
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
       "formato": "ordene",
       "enunciado": "Coloque em ordem os passos de um lanche simples.",
       "dados_extra": {
        "explicacao": "Começar pela higiene e terminar com calma deixa o lanche melhor."
       },
       "opcoes": [
        {
         "texto": "Lavar as mãos",
         "correta": true
        },
        {
         "texto": "Escolher os alimentos",
         "correta": true
        },
        {
         "texto": "Montar o lanche",
         "correta": true
        },
        {
         "texto": "Comer com calma",
         "correta": true
        }
       ]
      },
      {
       "formato": "prato",
       "enunciado": "Hora do lanche na escola! Monte um lanche e cumpra a missão.",
       "dados_extra": {
        "alimentos": [
         {
          "id": "banana",
          "nome": "Banana",
          "emoji": "🍌",
          "grupo": "fruta"
         },
         {
          "id": "maca",
          "nome": "Maçã",
          "emoji": "🍎",
          "grupo": "fruta"
         },
         {
          "id": "pao",
          "nome": "Pão",
          "emoji": "🍞",
          "grupo": "cereal"
         },
         {
          "id": "ovo",
          "nome": "Ovo",
          "emoji": "🥚",
          "grupo": "proteina"
         },
         {
          "id": "queijo",
          "nome": "Queijo",
          "emoji": "🧀",
          "grupo": "proteina"
         },
         {
          "id": "leite",
          "nome": "Leite",
          "emoji": "🥛",
          "grupo": "bebida_boa"
         },
         {
          "id": "biscoito",
          "nome": "Biscoito recheado",
          "emoji": "🍪",
          "grupo": "ultraprocessado"
         },
         {
          "id": "salgadinho",
          "nome": "Salgadinho",
          "emoji": "🍟",
          "grupo": "ultraprocessado"
         },
         {
          "id": "caixinha",
          "nome": "Suco de caixinha",
          "emoji": "🧃",
          "grupo": "ultraprocessado"
         }
        ],
        "criterios": [
         {
          "id": "c1",
          "texto": "Uma fruta",
          "grupos": [
           "fruta"
          ],
          "minimo": 1
         },
         {
          "id": "c2",
          "texto": "Algo que dê energia",
          "grupos": [
           "cereal",
           "proteina"
          ],
          "minimo": 1
         },
         {
          "id": "c3",
          "texto": "Até 1 ultraprocessado",
          "grupos": [
           "ultraprocessado"
          ],
          "maximo": 1
         }
        ],
        "capacidade": 5,
        "minimoItens": 3,
        "feedback": "Lanche montado! Quanto mais perto da natureza, melhor para o seu dia."
       },
       "opcoes": []
      },
      {
       "formato": "meta",
       "enunciado": "Escolha um plano do tipo \"se… então…\".",
       "dados_extra": {
        "feedback": "Um plano pequeno e possível vale mais que um grande e difícil."
       },
       "opcoes": [
        {
         "texto": "Se eu for ao mercado, então escolho um alimento in natura novo",
         "correta": false
        },
        {
         "texto": "Se sobrar arroz e feijão, então guardo para o lanche",
         "correta": false
        },
        {
         "texto": "Ainda não sei, e tudo bem",
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
   "titulo": "Hidratação e movimento",
   "licoes": [
    {
     "titulo": "Ponto de Partida",
     "tipo": "conteudo",
     "icone": "leaf-outline",
     "xp": 20,
     "passos": [
      {
       "formato": "cartao",
       "enunciado": "Água, a bebida do dia a dia",
       "dados_extra": {
        "texto": "Seu corpo usa água o tempo todo: para suar, pensar e se mexer. A água é a bebida mais simples, barata e sempre disponível."
       },
       "opcoes": []
      },
      {
       "formato": "enquete",
       "enunciado": "Quantos copos de água você acha que bebeu ontem?",
       "dados_extra": {
        "feedback": "Sem certo ou errado. Só vamos observar."
       },
       "opcoes": [
        {
         "texto": "Quase nenhum",
         "correta": false
        },
        {
         "texto": "Uns 2 ou 3",
         "correta": false
        },
        {
         "texto": "4 ou mais",
         "correta": false
        },
        {
         "texto": "Não sei",
         "correta": false
        }
       ]
      },
      {
       "formato": "verdadeiro_falso",
       "enunciado": "Só se deve beber água quando a sede fica forte.",
       "dados_extra": {
        "explicacao": "Ter água por perto e beber ao longo do dia é uma boa ideia, mesmo antes de a sede apertar."
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
       "formato": "cartao",
       "enunciado": "Por que beber água?",
       "dados_extra": {
        "texto": "A água ajuda o corpo a manter a temperatura, a digerir e a funcionar bem. A sede é um sinal de que ela está fazendo falta."
       },
       "opcoes": []
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "Qual é a bebida mais indicada para o dia a dia?",
       "dados_extra": {
        "explicacao": "A água é simples, barata e não tem açúcar adicionado."
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
         "texto": "Bebida energética",
         "correta": false
        },
        {
         "texto": "Suco de caixinha",
         "correta": false
        }
       ]
      },
      {
       "formato": "cartao",
       "enunciado": "E os outros líquidos?",
       "dados_extra": {
        "texto": "Refrigerante e suco de caixinha costumam ter açúcar adicionado. Água e suco feito na hora com a fruta cabem melhor na rotina."
       },
       "opcoes": []
      },
      {
       "formato": "associe",
       "enunciado": "Ligue cada item ao que ele representa.",
       "dados_extra": {
        "pares": [
         {
          "id": "p1",
          "esquerda": "Água",
          "direita": "Bebida do dia a dia"
         },
         {
          "id": "p2",
          "esquerda": "Refrigerante",
          "direita": "Tem açúcar adicionado"
         },
         {
          "id": "p3",
          "esquerda": "Garrafinha",
          "direita": "Ajuda a lembrar de beber"
         },
         {
          "id": "p4",
          "esquerda": "Sede",
          "direita": "Sinal do corpo"
         }
        ],
        "explicacao": "Cada item tem um papel na hidratação."
       },
       "opcoes": []
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "Você está no recreio com sede. Qual opção cabe melhor no dia a dia?",
       "dados_extra": {
        "explicacao": "A água do bebedouro é grátis e sempre ajuda."
       },
       "opcoes": [
        {
         "texto": "Beber água do bebedouro",
         "correta": true
        },
        {
         "texto": "Comprar um refrigerante",
         "correta": false
        },
        {
         "texto": "Esperar a sede passar",
         "correta": false
        }
       ]
      },
      {
       "formato": "enquete",
       "enunciado": "Qual movimento faz parte da sua semana?",
       "dados_extra": {
        "feedback": "Qualquer movimento conta. Vamos partir do seu."
       },
       "opcoes": [
        {
         "texto": "Caminho bastante",
         "correta": false
        },
        {
         "texto": "Esporte ou educação física",
         "correta": false
        },
        {
         "texto": "Danço ou brinco",
         "correta": false
        },
        {
         "texto": "Quase não me mexo",
         "correta": false
        }
       ]
      },
      {
       "formato": "cartao",
       "enunciado": "Levo comigo",
       "dados_extra": {
        "texto": "Uma garrafinha por perto ajuda a lembrar. Não precisa ser perfeito: o importante é a água estar ao alcance."
       },
       "opcoes": []
      }
     ],
     "conteudo": {
      "texto": "Vamos começar pelo que você já conhece sobre hidratação e movimento.",
      "objetivo": "Ativar o que você já sabe e vive."
     },
     "habito": null
    },
    {
     "titulo": "Aprendizado",
     "tipo": "conteudo",
     "icone": "bulb-outline",
     "xp": 30,
     "passos": [
      {
       "formato": "cartao",
       "enunciado": "Mexer o corpo",
       "dados_extra": {
        "texto": "Atividade física é qualquer movimento: caminhar até a escola, dançar, jogar bola. Para adolescentes, o recomendado é cerca de 60 minutos por dia, somando o dia todo."
       },
       "opcoes": []
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "O que conta como atividade física?",
       "dados_extra": {
        "explicacao": "Todo movimento do dia a dia conta."
       },
       "opcoes": [
        {
         "texto": "Só treino de academia",
         "correta": false
        },
        {
         "texto": "Qualquer movimento, como caminhar, dançar ou jogar bola",
         "correta": true
        },
        {
         "texto": "Só esporte de competição",
         "correta": false
        },
        {
         "texto": "Só a aula de educação física",
         "correta": false
        }
       ]
      },
      {
       "formato": "cartao",
       "enunciado": "Exemplo resolvido",
       "dados_extra": {
        "texto": "Quinze minutos caminhando até a escola, vinte na educação física e vinte dançando em casa somam 55 minutos. Tudo conta."
       },
       "opcoes": []
      },
      {
       "formato": "associe",
       "enunciado": "Ligue cada movimento à sua intensidade.",
       "dados_extra": {
        "pares": [
         {
          "id": "p1",
          "esquerda": "Alongar",
          "direita": "Movimento leve"
         },
         {
          "id": "p2",
          "esquerda": "Caminhar",
          "direita": "Movimento moderado"
         },
         {
          "id": "p3",
          "esquerda": "Correr",
          "direita": "Movimento intenso"
         },
         {
          "id": "p4",
          "esquerda": "Jogar bola",
          "direita": "Atividade em grupo"
         }
        ],
        "explicacao": "Movimento leve, moderado e intenso: todos contam."
       },
       "opcoes": []
      },
      {
       "formato": "cartao",
       "enunciado": "Movimento e alimentação",
       "dados_extra": {
        "texto": "Quando você se mexe, o corpo pede água e energia. Refeições regulares e água por perto ajudam a ter disposição."
       },
       "opcoes": []
      },
      {
       "formato": "verdadeiro_falso",
       "enunciado": "Suco de caixinha é igual à fruta inteira.",
       "dados_extra": {
        "explicacao": "Muitos sucos de caixinha levam açúcar adicionado e não têm as fibras da fruta inteira."
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
       "formato": "classifique",
       "enunciado": "Classifique cada atividade.",
       "dados_extra": {
        "categorias": [
         "Conta como movimento",
         "Fica parado"
        ],
        "explicacao": "Todo movimento do corpo conta, mesmo em pequenos trechos."
       },
       "opcoes": [
        {
         "texto": "Dançar",
         "correta": true,
         "categoria": "Conta como movimento"
        },
        {
         "texto": "Assistir TV sentado",
         "correta": true,
         "categoria": "Fica parado"
        },
        {
         "texto": "Caminhar até a escola",
         "correta": true,
         "categoria": "Conta como movimento"
        },
        {
         "texto": "Esperar o ônibus sentado",
         "correta": true,
         "categoria": "Fica parado"
        },
        {
         "texto": "Jogar bola",
         "correta": true,
         "categoria": "Conta como movimento"
        },
        {
         "texto": "Ficar no celular deitado",
         "correta": true,
         "categoria": "Fica parado"
        }
       ]
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "Está chovendo e você não pode sair. Como se mexer em casa?",
       "dados_extra": {
        "explicacao": "Dá para se mexer em casa, em qualquer espaço pequeno."
       },
       "opcoes": [
        {
         "texto": "Ficar o dia todo parado",
         "correta": false
        },
        {
         "texto": "Dançar ou alongar por 15 minutos",
         "correta": true
        },
        {
         "texto": "Deixar para se mexer só no fim de semana",
         "correta": false
        }
       ]
      },
      {
       "formato": "completar",
       "enunciado": "A bebida mais simples e barata para o dia a dia é a {lacuna}.",
       "dados_extra": {
        "explicacao": "A água é a bebida mais simples e acessível."
       },
       "opcoes": [
        {
         "texto": "refrigerante",
         "correta": false
        },
        {
         "texto": "bebida energética",
         "correta": false
        },
        {
         "texto": "água",
         "correta": true
        }
       ]
      },
      {
       "formato": "meta",
       "enunciado": "Que hábito de água cabe na sua rotina?",
       "dados_extra": {
        "feedback": "Um hábito pequeno já é um bom começo."
       },
       "opcoes": [
        {
         "texto": "Levar uma garrafinha",
         "correta": false
        },
        {
         "texto": "Beber um copo ao acordar",
         "correta": false
        },
        {
         "texto": "Beber água antes do lanche",
         "correta": false
        },
        {
         "texto": "Ainda não sei, e tudo bem",
         "correta": false
        }
       ]
      }
     ],
     "conteudo": {
      "texto": "Hora de aprender algo novo sobre hidratação e movimento.",
      "objetivo": "Entender o conceito novo com exemplos."
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
       "formato": "multipla_escolha",
       "enunciado": "O que conta como atividade física?",
       "dados_extra": {
        "explicacao": "Todo movimento do dia a dia conta."
       },
       "opcoes": [
        {
         "texto": "Só treino de academia",
         "correta": false
        },
        {
         "texto": "Qualquer movimento, como caminhar, dançar ou jogar bola",
         "correta": true
        },
        {
         "texto": "Só esporte de competição",
         "correta": false
        },
        {
         "texto": "Só a aula de educação física",
         "correta": false
        }
       ]
      },
      {
       "formato": "verdadeiro_falso",
       "enunciado": "Suco de caixinha é igual à fruta inteira.",
       "dados_extra": {
        "explicacao": "Muitos sucos de caixinha levam açúcar adicionado e não têm as fibras da fruta inteira."
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
       "formato": "associe",
       "enunciado": "Ligue cada item ao que ele representa.",
       "dados_extra": {
        "pares": [
         {
          "id": "p1",
          "esquerda": "Água",
          "direita": "Bebida do dia a dia"
         },
         {
          "id": "p2",
          "esquerda": "Refrigerante",
          "direita": "Tem açúcar adicionado"
         },
         {
          "id": "p3",
          "esquerda": "Garrafinha",
          "direita": "Ajuda a lembrar de beber"
         },
         {
          "id": "p4",
          "esquerda": "Sede",
          "direita": "Sinal do corpo"
         }
        ],
        "explicacao": "Cada item tem um papel na hidratação."
       },
       "opcoes": []
      },
      {
       "formato": "ordene",
       "enunciado": "Coloque em ordem: o que fazer ao sentir sede.",
       "dados_extra": {
        "explicacao": "Perceber, agir e depois seguir o dia."
       },
       "opcoes": [
        {
         "texto": "Perceber a sede",
         "correta": true
        },
        {
         "texto": "Pegar a garrafinha ou ir ao bebedouro",
         "correta": true
        },
        {
         "texto": "Beber a água devagar",
         "correta": true
        },
        {
         "texto": "Voltar ao que estava fazendo",
         "correta": true
        }
       ]
      },
      {
       "formato": "completar",
       "enunciado": "Para adolescentes, o recomendado é cerca de {lacuna} minutos de movimento por dia.",
       "dados_extra": {
        "explicacao": "A recomendação geral é de cerca de 60 minutos por dia."
       },
       "opcoes": [
        {
         "texto": "60",
         "correta": true
        },
        {
         "texto": "10",
         "correta": false
        },
        {
         "texto": "5",
         "correta": false
        }
       ]
      },
      {
       "formato": "classifique",
       "enunciado": "Classifique cada bebida.",
       "dados_extra": {
        "categorias": [
         "Escolhas do dia a dia",
         "Para de vez em quando"
        ],
        "explicacao": "Bebidas com açúcar adicionado cabem de vez em quando."
       },
       "opcoes": [
        {
         "texto": "Água",
         "correta": true,
         "categoria": "Escolhas do dia a dia"
        },
        {
         "texto": "Refrigerante",
         "correta": true,
         "categoria": "Para de vez em quando"
        },
        {
         "texto": "Suco feito na hora",
         "correta": true,
         "categoria": "Escolhas do dia a dia"
        },
        {
         "texto": "Suco de caixinha",
         "correta": true,
         "categoria": "Para de vez em quando"
        },
        {
         "texto": "Água com limão",
         "correta": true,
         "categoria": "Escolhas do dia a dia"
        },
        {
         "texto": "Bebida energética",
         "correta": true,
         "categoria": "Para de vez em quando"
        }
       ]
      },
      {
       "formato": "verdadeiro_falso",
       "enunciado": "Caminhar até a escola conta como atividade física.",
       "dados_extra": {
        "explicacao": "Qualquer movimento conta e pode ser somado ao longo do dia."
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
       "enunciado": "Você está no recreio com sede. Qual opção cabe melhor no dia a dia?",
       "dados_extra": {
        "explicacao": "A água do bebedouro é grátis e sempre ajuda."
       },
       "opcoes": [
        {
         "texto": "Beber água do bebedouro",
         "correta": true
        },
        {
         "texto": "Comprar um refrigerante",
         "correta": false
        },
        {
         "texto": "Esperar a sede passar",
         "correta": false
        }
       ]
      },
      {
       "formato": "prato",
       "enunciado": "Vai jogar bola depois da aula! Monte um lanche e cumpra a missão.",
       "dados_extra": {
        "alimentos": [
         {
          "id": "pao",
          "nome": "Pão",
          "emoji": "🍞",
          "grupo": "cereal"
         },
         {
          "id": "banana",
          "nome": "Banana",
          "emoji": "🍌",
          "grupo": "fruta"
         },
         {
          "id": "maca",
          "nome": "Maçã",
          "emoji": "🍎",
          "grupo": "fruta"
         },
         {
          "id": "laranja",
          "nome": "Laranja",
          "emoji": "🍊",
          "grupo": "fruta"
         },
         {
          "id": "agua",
          "nome": "Água",
          "emoji": "💧",
          "grupo": "bebida_boa"
         },
         {
          "id": "coco",
          "nome": "Água de coco",
          "emoji": "🥥",
          "grupo": "bebida_boa"
         },
         {
          "id": "leite",
          "nome": "Leite",
          "emoji": "🥛",
          "grupo": "bebida_boa"
         },
         {
          "id": "refri",
          "nome": "Refrigerante",
          "emoji": "🥤",
          "grupo": "ultraprocessado"
         },
         {
          "id": "biscoito",
          "nome": "Biscoito recheado",
          "emoji": "🍪",
          "grupo": "ultraprocessado"
         }
        ],
        "criterios": [
         {
          "id": "c1",
          "texto": "Algo que dê energia",
          "grupos": [
           "cereal",
           "tuberculo"
          ],
          "minimo": 1
         },
         {
          "id": "c2",
          "texto": "Uma fruta",
          "grupos": [
           "fruta"
          ],
          "minimo": 1
         },
         {
          "id": "c3",
          "texto": "Uma bebida que hidrata",
          "grupos": [
           "bebida_boa"
          ],
          "minimo": 1
         },
         {
          "id": "c4",
          "texto": "Até 1 ultraprocessado",
          "grupos": [
           "ultraprocessado"
          ],
          "maximo": 1
         }
        ],
        "capacidade": 5,
        "minimoItens": 3,
        "feedback": "Boa escolha! Energia, fruta e uma bebida para hidratar ajudam no movimento."
       },
       "opcoes": []
      },
      {
       "formato": "memoria",
       "enunciado": "Jogo da memória: ache os pares.",
       "dados_extra": {
        "pares": [
         {
          "id": "p1",
          "esquerda": "Água",
          "direita": "Todo dia"
         },
         {
          "id": "p2",
          "esquerda": "Refrigerante",
          "direita": "De vez em quando"
         },
         {
          "id": "p3",
          "esquerda": "Caminhar",
          "direita": "Movimento leve"
         }
        ],
        "feedback": "Boa memória! A água é a escolha do dia a dia."
       },
       "opcoes": []
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
      "texto": "Desafio do dia: registre a água que você beber hoje.",
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
       "enunciado": "Suco de caixinha é igual à fruta inteira.",
       "dados_extra": {
        "explicacao": "Muitos sucos de caixinha levam açúcar adicionado e não têm as fibras da fruta inteira."
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
       "enunciado": "Qual é a bebida mais indicada para o dia a dia?",
       "dados_extra": {
        "explicacao": "A água é simples, barata e não tem açúcar adicionado."
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
         "texto": "Bebida energética",
         "correta": false
        },
        {
         "texto": "Suco de caixinha",
         "correta": false
        }
       ]
      },
      {
       "formato": "memoria",
       "enunciado": "Jogo da memória: ache os pares.",
       "dados_extra": {
        "pares": [
         {
          "id": "p1",
          "esquerda": "Sede",
          "direita": "Sinal do corpo"
         },
         {
          "id": "p2",
          "esquerda": "Garrafinha",
          "direita": "Lembrete"
         },
         {
          "id": "p3",
          "esquerda": "Dançar",
          "direita": "Atividade física"
         },
         {
          "id": "p4",
          "esquerda": "60 minutos",
          "direita": "Meta do dia"
         }
        ],
        "feedback": "Muito bem! Pequenos movimentos somam."
       },
       "opcoes": []
      },
      {
       "formato": "classifique",
       "enunciado": "Classifique cada atividade.",
       "dados_extra": {
        "categorias": [
         "Conta como movimento",
         "Fica parado"
        ],
        "explicacao": "Todo movimento do corpo conta, mesmo em pequenos trechos."
       },
       "opcoes": [
        {
         "texto": "Dançar",
         "correta": true,
         "categoria": "Conta como movimento"
        },
        {
         "texto": "Assistir TV sentado",
         "correta": true,
         "categoria": "Fica parado"
        },
        {
         "texto": "Caminhar até a escola",
         "correta": true,
         "categoria": "Conta como movimento"
        },
        {
         "texto": "Esperar o ônibus sentado",
         "correta": true,
         "categoria": "Fica parado"
        },
        {
         "texto": "Jogar bola",
         "correta": true,
         "categoria": "Conta como movimento"
        },
        {
         "texto": "Ficar no celular deitado",
         "correta": true,
         "categoria": "Fica parado"
        }
       ]
      },
      {
       "formato": "completar",
       "enunciado": "Para adolescentes, o recomendado é cerca de {lacuna} minutos de movimento por dia.",
       "dados_extra": {
        "explicacao": "A recomendação geral é de cerca de 60 minutos por dia."
       },
       "opcoes": [
        {
         "texto": "60",
         "correta": true
        },
        {
         "texto": "10",
         "correta": false
        },
        {
         "texto": "5",
         "correta": false
        }
       ]
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "Está chovendo e você não pode sair. Como se mexer em casa?",
       "dados_extra": {
        "explicacao": "Dá para se mexer em casa, em qualquer espaço pequeno."
       },
       "opcoes": [
        {
         "texto": "Ficar o dia todo parado",
         "correta": false
        },
        {
         "texto": "Dançar ou alongar por 15 minutos",
         "correta": true
        },
        {
         "texto": "Deixar para se mexer só no fim de semana",
         "correta": false
        }
       ]
      },
      {
       "formato": "verdadeiro_falso",
       "enunciado": "Caminhar até a escola conta como atividade física.",
       "dados_extra": {
        "explicacao": "Qualquer movimento conta e pode ser somado ao longo do dia."
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
       "formato": "ordene",
       "enunciado": "Ordene do movimento mais leve ao mais intenso.",
       "dados_extra": {
        "explicacao": "Quanto mais o coração acelera, mais intenso é o movimento."
       },
       "opcoes": [
        {
         "texto": "Alongar",
         "correta": true
        },
        {
         "texto": "Caminhar devagar",
         "correta": true
        },
        {
         "texto": "Andar de bicicleta",
         "correta": true
        },
        {
         "texto": "Correr",
         "correta": true
        }
       ]
      },
      {
       "formato": "prato",
       "enunciado": "Dia de calor! Monte um lanche fresquinho para o recreio.",
       "dados_extra": {
        "alimentos": [
         {
          "id": "melancia",
          "nome": "Melancia",
          "emoji": "🍉",
          "grupo": "fruta"
         },
         {
          "id": "banana",
          "nome": "Banana",
          "emoji": "🍌",
          "grupo": "fruta"
         },
         {
          "id": "laranja",
          "nome": "Laranja",
          "emoji": "🍊",
          "grupo": "fruta"
         },
         {
          "id": "maca",
          "nome": "Maçã",
          "emoji": "🍎",
          "grupo": "fruta"
         },
         {
          "id": "agua",
          "nome": "Água",
          "emoji": "💧",
          "grupo": "bebida_boa"
         },
         {
          "id": "coco",
          "nome": "Água de coco",
          "emoji": "🥥",
          "grupo": "bebida_boa"
         },
         {
          "id": "caixinha",
          "nome": "Suco de caixinha",
          "emoji": "🧃",
          "grupo": "ultraprocessado"
         },
         {
          "id": "refri",
          "nome": "Refrigerante",
          "emoji": "🥤",
          "grupo": "ultraprocessado"
         },
         {
          "id": "salgadinho",
          "nome": "Salgadinho",
          "emoji": "🍟",
          "grupo": "ultraprocessado"
         }
        ],
        "criterios": [
         {
          "id": "c1",
          "texto": "Duas frutas",
          "grupos": [
           "fruta"
          ],
          "minimo": 2
         },
         {
          "id": "c2",
          "texto": "Uma bebida que hidrata",
          "grupos": [
           "bebida_boa"
          ],
          "minimo": 1
         },
         {
          "id": "c3",
          "texto": "Até 1 ultraprocessado",
          "grupos": [
           "ultraprocessado"
          ],
          "maximo": 1
         }
        ],
        "capacidade": 5,
        "minimoItens": 3,
        "feedback": "Que lanche refrescante! Frutas e água são ótimas companheiras do calor."
       },
       "opcoes": []
      },
      {
       "formato": "meta",
       "enunciado": "Escolha um plano do tipo \"se… então…\".",
       "dados_extra": {
        "feedback": "Planos pequenos e possíveis funcionam melhor."
       },
       "opcoes": [
        {
         "texto": "Se eu for à escola, então caminho uma parte do caminho",
         "correta": false
        },
        {
         "texto": "Se eu tiver 10 minutos livres, então danço uma música",
         "correta": false
        },
        {
         "texto": "Se eu sentir sede, então bebo água primeiro",
         "correta": false
        },
        {
         "texto": "Ainda não sei, e tudo bem",
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
   "titulo": "Comer com atenção e companhia",
   "licoes": [
    {
     "titulo": "Ponto de Partida",
     "tipo": "conteudo",
     "icone": "leaf-outline",
     "xp": 20,
     "passos": [
      {
       "formato": "cartao",
       "enunciado": "Comer é mais que encher o prato",
       "dados_extra": {
        "texto": "Comer também é um momento: de sabor, de pausa e de companhia. Hoje vamos olhar para o como se come, não só para o que se come."
       },
       "opcoes": []
      },
      {
       "formato": "enquete",
       "enunciado": "Como foi sua última refeição?",
       "dados_extra": {
        "feedback": "Sem certo ou errado. Cada rotina é diferente."
       },
       "opcoes": [
        {
         "texto": "Sozinho, com o celular",
         "correta": false
        },
        {
         "texto": "Em família ou com amigos",
         "correta": false
        },
        {
         "texto": "Correndo",
         "correta": false
        },
        {
         "texto": "Não lembro",
         "correta": false
        }
       ]
      },
      {
       "formato": "verdadeiro_falso",
       "enunciado": "Comer olhando a tela ajuda a perceber a hora de parar.",
       "dados_extra": {
        "explicacao": "Com a atenção na tela, fica mais difícil notar o sabor e os sinais de que você já comeu o suficiente."
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
       "formato": "cartao",
       "enunciado": "Regularidade",
       "dados_extra": {
        "texto": "Fazer refeições em horários parecidos ajuda o corpo a se organizar e evita chegar com fome demais. Não precisa ser exato."
       },
       "opcoes": []
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "O que ajuda a comer com mais atenção?",
       "dados_extra": {
        "explicacao": "Sem a tela, dá para perceber o sabor e a hora de parar."
       },
       "opcoes": [
        {
         "texto": "Deixar o celular de lado durante a refeição",
         "correta": true
        },
        {
         "texto": "Comer o mais rápido possível",
         "correta": false
        },
        {
         "texto": "Pular a refeição",
         "correta": false
        },
        {
         "texto": "Comer em pé, correndo",
         "correta": false
        }
       ]
      },
      {
       "formato": "cartao",
       "enunciado": "Com atenção",
       "dados_extra": {
        "texto": "Comer sem tela deixa a gente perceber o sabor e a hora de parar. Se der, deixe o celular um pouco de lado durante a refeição."
       },
       "opcoes": []
      },
      {
       "formato": "associe",
       "enunciado": "Ligue cada hábito ao que ele ajuda.",
       "dados_extra": {
        "pares": [
         {
          "id": "p1",
          "esquerda": "Sem tela",
          "direita": "Mais atenção ao sabor"
         },
         {
          "id": "p2",
          "esquerda": "Horários parecidos",
          "direita": "Corpo mais organizado"
         },
         {
          "id": "p3",
          "esquerda": "Cozinhar junto",
          "direita": "Aproxima as pessoas"
         },
         {
          "id": "p4",
          "esquerda": "Comer devagar",
          "direita": "Perceber a hora de parar"
         }
        ],
        "explicacao": "Pequenos hábitos fazem diferença na refeição."
       },
       "opcoes": []
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "Você chegou com muita pressa e fome. O que ajuda?",
       "dados_extra": {
        "explicacao": "Uma pausa curta já muda a refeição."
       },
       "opcoes": [
        {
         "texto": "Comer em pé olhando o celular",
         "correta": false
        },
        {
         "texto": "Pular a refeição",
         "correta": false
        },
        {
         "texto": "Respirar, sentar e comer a primeira garfada com calma",
         "correta": true
        }
       ]
      },
      {
       "formato": "enquete",
       "enunciado": "O que mais atrapalha comer com calma no seu dia?",
       "dados_extra": {
        "feedback": "Obrigado por contar. Vamos pensar em passos possíveis."
       },
       "opcoes": [
        {
         "texto": "Falta de tempo",
         "correta": false
        },
        {
         "texto": "Barulho ou tela",
         "correta": false
        },
        {
         "texto": "Fome demais",
         "correta": false
        },
        {
         "texto": "Nada atrapalha",
         "correta": false
        }
       ]
      },
      {
       "formato": "cartao",
       "enunciado": "Levo comigo",
       "dados_extra": {
        "texto": "Comer devagar e, quando possível, em companhia faz da refeição um momento melhor. Faça do seu jeito."
       },
       "opcoes": []
      }
     ],
     "conteudo": {
      "texto": "Vamos começar pelo que você já conhece sobre comer com atenção e companhia.",
      "objetivo": "Ativar o que você já sabe e vive."
     },
     "habito": null
    },
    {
     "titulo": "Aprendizado",
     "tipo": "conteudo",
     "icone": "bulb-outline",
     "xp": 30,
     "passos": [
      {
       "formato": "cartao",
       "enunciado": "Comer em companhia",
       "dados_extra": {
        "texto": "Dividir a mesa com família ou amigos ajuda a comer com calma e a conhecer novos sabores. Comer sozinho também é normal."
       },
       "opcoes": []
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "Por que fazer as refeições em horários parecidos?",
       "dados_extra": {
        "explicacao": "Horários parecidos ajudam o corpo a se organizar. Não precisa ser exato."
       },
       "opcoes": [
        {
         "texto": "Para nunca sentir fome",
         "correta": false
        },
        {
         "texto": "Ajuda o corpo a se organizar e evita chegar com fome demais",
         "correta": true
        },
        {
         "texto": "Porque é uma regra obrigatória",
         "correta": false
        },
        {
         "texto": "Não existe motivo",
         "correta": false
        }
       ]
      },
      {
       "formato": "cartao",
       "enunciado": "Exemplo resolvido",
       "dados_extra": {
        "texto": "Ana almoçava com o celular na mão e terminava em cinco minutos. Hoje deixou o celular na mochila, comeu mais devagar e sentiu o gosto do feijão."
       },
       "opcoes": []
      },
      {
       "formato": "associe",
       "enunciado": "Ligue cada situação ao que ela representa.",
       "dados_extra": {
        "pares": [
         {
          "id": "p1",
          "esquerda": "Almoço em família",
          "direita": "Comer em companhia"
         },
         {
          "id": "p2",
          "esquerda": "Celular de lado",
          "direita": "Comer com atenção"
         },
         {
          "id": "p3",
          "esquerda": "Lavar a salada",
          "direita": "Ajudar a cozinhar"
         },
         {
          "id": "p4",
          "esquerda": "Sentar à mesa",
          "direita": "Fazer uma pausa"
         }
        ],
        "explicacao": "Cada gesto ajuda a tornar a refeição melhor."
       },
       "opcoes": []
      },
      {
       "formato": "cartao",
       "enunciado": "Cozinhar junto",
       "dados_extra": {
        "texto": "Ajudar a preparar a refeição, mesmo algo simples como lavar a salada, aproxima a gente da comida e de quem mora com a gente."
       },
       "opcoes": []
      },
      {
       "formato": "verdadeiro_falso",
       "enunciado": "Comer sozinho é errado.",
       "dados_extra": {
        "explicacao": "Não existe certo ou errado. O que ajuda é comer com calma, com ou sem companhia."
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
       "formato": "classifique",
       "enunciado": "Classifique cada atitude.",
       "dados_extra": {
        "categorias": [
         "Ajuda a comer com calma",
         "Atrapalha comer com calma"
        ],
        "explicacao": "Sem julgamento: são só pontos que ajudam ou atrapalham."
       },
       "opcoes": [
        {
         "texto": "Sentar à mesa",
         "correta": true,
         "categoria": "Ajuda a comer com calma"
        },
        {
         "texto": "Comer correndo",
         "correta": true,
         "categoria": "Atrapalha comer com calma"
        },
        {
         "texto": "Deixar o celular de lado",
         "correta": true,
         "categoria": "Ajuda a comer com calma"
        },
        {
         "texto": "Comer olhando a tela",
         "correta": true,
         "categoria": "Atrapalha comer com calma"
        },
        {
         "texto": "Mastigar devagar",
         "correta": true,
         "categoria": "Ajuda a comer com calma"
        },
        {
         "texto": "Comer em pé, com pressa",
         "correta": true,
         "categoria": "Atrapalha comer com calma"
        }
       ]
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "Ninguém está em casa para comer com você. O que dá para fazer?",
       "dados_extra": {
        "explicacao": "Comer sozinho é normal, e dá para fazer disso um momento bom."
       },
       "opcoes": [
        {
         "texto": "Comer com calma, sentado e sem tela",
         "correta": true
        },
        {
         "texto": "Pular a refeição porque está só",
         "correta": false
        },
        {
         "texto": "Comer correndo para acabar logo",
         "correta": false
        }
       ]
      },
      {
       "formato": "completar",
       "enunciado": "Comer sem {lacuna} ajuda a perceber o sabor e a hora de parar.",
       "dados_extra": {
        "explicacao": "Sem tela, a atenção fica na comida."
       },
       "opcoes": [
        {
         "texto": "talher",
         "correta": false
        },
        {
         "texto": "tela",
         "correta": true
        },
        {
         "texto": "sal",
         "correta": false
        }
       ]
      },
      {
       "formato": "meta",
       "enunciado": "Que pequeno passo você quer testar?",
       "dados_extra": {
        "feedback": "Um passo pequeno já é um bom começo."
       },
       "opcoes": [
        {
         "texto": "Comer uma refeição sem tela",
         "correta": false
        },
        {
         "texto": "Comer mais devagar",
         "correta": false
        },
        {
         "texto": "Ajudar a preparar uma refeição",
         "correta": false
        },
        {
         "texto": "Ainda não sei, e tudo bem",
         "correta": false
        }
       ]
      }
     ],
     "conteudo": {
      "texto": "Hora de aprender algo novo sobre comer com atenção e companhia.",
      "objetivo": "Entender o conceito novo com exemplos."
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
       "formato": "multipla_escolha",
       "enunciado": "Por que fazer as refeições em horários parecidos?",
       "dados_extra": {
        "explicacao": "Horários parecidos ajudam o corpo a se organizar. Não precisa ser exato."
       },
       "opcoes": [
        {
         "texto": "Para nunca sentir fome",
         "correta": false
        },
        {
         "texto": "Ajuda o corpo a se organizar e evita chegar com fome demais",
         "correta": true
        },
        {
         "texto": "Porque é uma regra obrigatória",
         "correta": false
        },
        {
         "texto": "Não existe motivo",
         "correta": false
        }
       ]
      },
      {
       "formato": "verdadeiro_falso",
       "enunciado": "Comer sozinho é errado.",
       "dados_extra": {
        "explicacao": "Não existe certo ou errado. O que ajuda é comer com calma, com ou sem companhia."
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
       "formato": "associe",
       "enunciado": "Ligue cada hábito ao que ele ajuda.",
       "dados_extra": {
        "pares": [
         {
          "id": "p1",
          "esquerda": "Sem tela",
          "direita": "Mais atenção ao sabor"
         },
         {
          "id": "p2",
          "esquerda": "Horários parecidos",
          "direita": "Corpo mais organizado"
         },
         {
          "id": "p3",
          "esquerda": "Cozinhar junto",
          "direita": "Aproxima as pessoas"
         },
         {
          "id": "p4",
          "esquerda": "Comer devagar",
          "direita": "Perceber a hora de parar"
         }
        ],
        "explicacao": "Pequenos hábitos fazem diferença na refeição."
       },
       "opcoes": []
      },
      {
       "formato": "ordene",
       "enunciado": "Coloque em ordem: como fazer uma refeição com calma.",
       "dados_extra": {
        "explicacao": "Preparar o momento ajuda a comer com atenção."
       },
       "opcoes": [
        {
         "texto": "Lavar as mãos",
         "correta": true
        },
        {
         "texto": "Montar o prato",
         "correta": true
        },
        {
         "texto": "Sentar e deixar o celular de lado",
         "correta": true
        },
        {
         "texto": "Comer devagar",
         "correta": true
        }
       ]
      },
      {
       "formato": "completar",
       "enunciado": "Fazer refeições em horários {lacuna} ajuda o corpo a se organizar.",
       "dados_extra": {
        "explicacao": "Horários parecidos ajudam o corpo a se organizar."
       },
       "opcoes": [
        {
         "texto": "muito diferentes",
         "correta": false
        },
        {
         "texto": "aleatórios",
         "correta": false
        },
        {
         "texto": "parecidos",
         "correta": true
        }
       ]
      },
      {
       "formato": "classifique",
       "enunciado": "Quando acontece cada atitude?",
       "dados_extra": {
        "categorias": [
         "Antes de comer",
         "Durante a refeição"
        ],
        "explicacao": "Cada momento tem seu cuidado."
       },
       "opcoes": [
        {
         "texto": "Lavar as mãos",
         "correta": true,
         "categoria": "Antes de comer"
        },
        {
         "texto": "Mastigar devagar",
         "correta": true,
         "categoria": "Durante a refeição"
        },
        {
         "texto": "Sentar à mesa",
         "correta": true,
         "categoria": "Antes de comer"
        },
        {
         "texto": "Conversar",
         "correta": true,
         "categoria": "Durante a refeição"
        },
        {
         "texto": "Ajudar a arrumar a mesa",
         "correta": true,
         "categoria": "Antes de comer"
        },
        {
         "texto": "Perceber o sabor",
         "correta": true,
         "categoria": "Durante a refeição"
        }
       ]
      },
      {
       "formato": "verdadeiro_falso",
       "enunciado": "Ajudar a preparar a refeição também faz parte do ato de comer.",
       "dados_extra": {
        "explicacao": "Cozinhar, mesmo algo simples, aproxima a gente da comida."
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
       "enunciado": "Você chegou com muita pressa e fome. O que ajuda?",
       "dados_extra": {
        "explicacao": "Uma pausa curta já muda a refeição."
       },
       "opcoes": [
        {
         "texto": "Comer em pé olhando o celular",
         "correta": false
        },
        {
         "texto": "Pular a refeição",
         "correta": false
        },
        {
         "texto": "Respirar, sentar e comer a primeira garfada com calma",
         "correta": true
        }
       ]
      },
      {
       "formato": "prato",
       "enunciado": "Domingo de almoço em família! Monte o prato e cumpra a missão.",
       "dados_extra": {
        "alimentos": [
         {
          "id": "arroz",
          "nome": "Arroz",
          "emoji": "🍚",
          "grupo": "cereal"
         },
         {
          "id": "batata",
          "nome": "Batata",
          "emoji": "🥔",
          "grupo": "tuberculo"
         },
         {
          "id": "feijao",
          "nome": "Feijão",
          "emoji": "🍲",
          "grupo": "leguminosa"
         },
         {
          "id": "frango",
          "nome": "Frango",
          "emoji": "🍗",
          "grupo": "proteina"
         },
         {
          "id": "tomate",
          "nome": "Tomate",
          "emoji": "🍅",
          "grupo": "vegetal"
         },
         {
          "id": "brocolis",
          "nome": "Brócolis",
          "emoji": "🥦",
          "grupo": "vegetal"
         },
         {
          "id": "laranja",
          "nome": "Laranja",
          "emoji": "🍊",
          "grupo": "fruta"
         },
         {
          "id": "miojo",
          "nome": "Macarrão instantâneo",
          "emoji": "🍜",
          "grupo": "ultraprocessado"
         },
         {
          "id": "refri",
          "nome": "Refrigerante",
          "emoji": "🥤",
          "grupo": "ultraprocessado"
         }
        ],
        "criterios": [
         {
          "id": "c1",
          "texto": "Uma fonte de energia",
          "grupos": [
           "cereal",
           "tuberculo"
          ],
          "minimo": 1
         },
         {
          "id": "c2",
          "texto": "Uma proteína",
          "grupos": [
           "proteina",
           "leguminosa"
          ],
          "minimo": 1
         },
         {
          "id": "c3",
          "texto": "Uma verdura ou legume",
          "grupos": [
           "vegetal"
          ],
          "minimo": 1
         },
         {
          "id": "c4",
          "texto": "Uma fruta de sobremesa",
          "grupos": [
           "fruta"
          ],
          "minimo": 1
         }
        ],
        "capacidade": 6,
        "minimoItens": 3,
        "feedback": "Almoço pronto! Agora é sentar, comer com calma e aproveitar a companhia."
       },
       "opcoes": []
      },
      {
       "formato": "memoria",
       "enunciado": "Jogo da memória: ache os pares.",
       "dados_extra": {
        "pares": [
         {
          "id": "p1",
          "esquerda": "Sem tela",
          "direita": "Mais atenção"
         },
         {
          "id": "p2",
          "esquerda": "Cozinhar junto",
          "direita": "Aproxima"
         },
         {
          "id": "p3",
          "esquerda": "Devagar",
          "direita": "Percebe a saciedade"
         }
        ],
        "feedback": "Boa memória! Pequenos cuidados mudam a refeição."
       },
       "opcoes": []
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
     "icone": "walk-outline",
     "xp": 30,
     "passos": [],
     "conteudo": {
      "texto": "Desafio do dia: registre um movimento que você fez, de qualquer tipo.",
      "objetivo": "Levar o que aprendeu para o seu dia."
     },
     "habito": "atividade_fisica"
    },
    {
     "titulo": "Fechamento do Capítulo",
     "tipo": "quiz",
     "icone": "trophy-outline",
     "xp": 40,
     "passos": [
      {
       "formato": "verdadeiro_falso",
       "enunciado": "Todo alimento que vem em pacote é ultraprocessado.",
       "dados_extra": {
        "explicacao": "Arroz e feijão vêm em pacote e são minimamente processados. O que importa é o quanto o alimento foi processado."
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
       "formato": "associe",
       "enunciado": "Ligue cada alimento ao grupo dele.",
       "dados_extra": {
        "pares": [
         {
          "id": "p1",
          "esquerda": "Laranja",
          "direita": "In natura"
         },
         {
          "id": "p2",
          "esquerda": "Arroz",
          "direita": "Minimamente processado"
         },
         {
          "id": "p3",
          "esquerda": "Azeite",
          "direita": "Ingrediente culinário"
         },
         {
          "id": "p4",
          "esquerda": "Salgadinho de pacote",
          "direita": "Ultraprocessado"
         }
        ],
        "explicacao": "Cada alimento pertence ao grupo conforme o quanto foi processado."
       },
       "opcoes": []
      },
      {
       "formato": "classifique",
       "enunciado": "Classifique cada alimento.",
       "dados_extra": {
        "categorias": [
         "Mais perto da natureza",
         "Mais industrializado"
        ],
        "explicacao": "Simplificação proposital: os processados entram em outra etapa."
       },
       "opcoes": [
        {
         "texto": "Ovo",
         "correta": true,
         "categoria": "Mais perto da natureza"
        },
        {
         "texto": "Macarrão instantâneo",
         "correta": true,
         "categoria": "Mais industrializado"
        },
        {
         "texto": "Mandioca",
         "correta": true,
         "categoria": "Mais perto da natureza"
        },
        {
         "texto": "Biscoito recheado",
         "correta": true,
         "categoria": "Mais industrializado"
        },
        {
         "texto": "Feijão",
         "correta": true,
         "categoria": "Mais perto da natureza"
        },
        {
         "texto": "Nuggets",
         "correta": true,
         "categoria": "Mais industrializado"
        }
       ]
      },
      {
       "formato": "multipla_escolha",
       "enunciado": "Qual é a bebida mais indicada para o dia a dia?",
       "dados_extra": {
        "explicacao": "A água é simples, barata e não tem açúcar adicionado."
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
         "texto": "Bebida energética",
         "correta": false
        },
        {
         "texto": "Suco de caixinha",
         "correta": false
        }
       ]
      },
      {
       "formato": "ordene",
       "enunciado": "Coloque em ordem: o que fazer ao sentir sede.",
       "dados_extra": {
        "explicacao": "Perceber, agir e depois seguir o dia."
       },
       "opcoes": [
        {
         "texto": "Perceber a sede",
         "correta": true
        },
        {
         "texto": "Pegar a garrafinha ou ir ao bebedouro",
         "correta": true
        },
        {
         "texto": "Beber a água devagar",
         "correta": true
        },
        {
         "texto": "Voltar ao que estava fazendo",
         "correta": true
        }
       ]
      },
      {
       "formato": "completar",
       "enunciado": "A bebida mais simples e barata para o dia a dia é a {lacuna}.",
       "dados_extra": {
        "explicacao": "A água é a bebida mais simples e acessível."
       },
       "opcoes": [
        {
         "texto": "refrigerante",
         "correta": false
        },
        {
         "texto": "bebida energética",
         "correta": false
        },
        {
         "texto": "água",
         "correta": true
        }
       ]
      },
      {
       "formato": "memoria",
       "enunciado": "Jogo da memória: ache os pares.",
       "dados_extra": {
        "pares": [
         {
          "id": "p1",
          "esquerda": "Água",
          "direita": "Todo dia"
         },
         {
          "id": "p2",
          "esquerda": "Refrigerante",
          "direita": "De vez em quando"
         },
         {
          "id": "p3",
          "esquerda": "Caminhar",
          "direita": "Movimento leve"
         }
        ],
        "feedback": "Boa memória! A água é a escolha do dia a dia."
       },
       "opcoes": []
      },
      {
       "formato": "prato",
       "enunciado": "Para fechar: monte o prato que você mais gostaria de comer hoje.",
       "dados_extra": {
        "alimentos": [
         {
          "id": "arroz",
          "nome": "Arroz",
          "emoji": "🍚",
          "grupo": "cereal"
         },
         {
          "id": "feijao",
          "nome": "Feijão",
          "emoji": "🍲",
          "grupo": "leguminosa"
         },
         {
          "id": "ovo",
          "nome": "Ovo",
          "emoji": "🥚",
          "grupo": "proteina"
         },
         {
          "id": "frango",
          "nome": "Frango",
          "emoji": "🍗",
          "grupo": "proteina"
         },
         {
          "id": "alface",
          "nome": "Alface",
          "emoji": "🥬",
          "grupo": "vegetal"
         },
         {
          "id": "banana",
          "nome": "Banana",
          "emoji": "🍌",
          "grupo": "fruta"
         },
         {
          "id": "pao",
          "nome": "Pão",
          "emoji": "🍞",
          "grupo": "cereal"
         },
         {
          "id": "leite",
          "nome": "Leite",
          "emoji": "🥛",
          "grupo": "bebida_boa"
         },
         {
          "id": "salgadinho",
          "nome": "Salgadinho",
          "emoji": "🍟",
          "grupo": "ultraprocessado"
         }
        ],
        "criterios": [],
        "capacidade": 6,
        "minimoItens": 3,
        "feedback": "Esse é o seu prato! Cada pessoa monta o seu, e tudo bem. O que importa é perceber o que você escolhe."
       },
       "opcoes": []
      },
      {
       "formato": "associe",
       "enunciado": "Ligue cada situação ao que ela representa.",
       "dados_extra": {
        "pares": [
         {
          "id": "p1",
          "esquerda": "Almoço em família",
          "direita": "Comer em companhia"
         },
         {
          "id": "p2",
          "esquerda": "Celular de lado",
          "direita": "Comer com atenção"
         },
         {
          "id": "p3",
          "esquerda": "Lavar a salada",
          "direita": "Ajudar a cozinhar"
         },
         {
          "id": "p4",
          "esquerda": "Sentar à mesa",
          "direita": "Fazer uma pausa"
         }
        ],
        "explicacao": "Cada gesto ajuda a tornar a refeição melhor."
       },
       "opcoes": []
      },
      {
       "formato": "verdadeiro_falso",
       "enunciado": "Ajudar a preparar a refeição também faz parte do ato de comer.",
       "dados_extra": {
        "explicacao": "Cozinhar, mesmo algo simples, aproxima a gente da comida."
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
       "formato": "ordene",
       "enunciado": "Ordene as etapas de preparar uma salada simples.",
       "dados_extra": {
        "explicacao": "Lavar primeiro e temperar por último."
       },
       "opcoes": [
        {
         "texto": "Lavar os vegetais",
         "correta": true
        },
        {
         "texto": "Cortar os vegetais",
         "correta": true
        },
        {
         "texto": "Temperar",
         "correta": true
        },
        {
         "texto": "Servir",
         "correta": true
        }
       ]
      },
      {
       "formato": "classifique",
       "enunciado": "Quando acontece cada atitude?",
       "dados_extra": {
        "categorias": [
         "Antes de comer",
         "Durante a refeição"
        ],
        "explicacao": "Cada momento tem seu cuidado."
       },
       "opcoes": [
        {
         "texto": "Lavar as mãos",
         "correta": true,
         "categoria": "Antes de comer"
        },
        {
         "texto": "Mastigar devagar",
         "correta": true,
         "categoria": "Durante a refeição"
        },
        {
         "texto": "Sentar à mesa",
         "correta": true,
         "categoria": "Antes de comer"
        },
        {
         "texto": "Conversar",
         "correta": true,
         "categoria": "Durante a refeição"
        },
        {
         "texto": "Ajudar a arrumar a mesa",
         "correta": true,
         "categoria": "Antes de comer"
        },
        {
         "texto": "Perceber o sabor",
         "correta": true,
         "categoria": "Durante a refeição"
        }
       ]
      },
      {
       "formato": "memoria",
       "enunciado": "Jogo da memória: ache os pares.",
       "dados_extra": {
        "pares": [
         {
          "id": "p1",
          "esquerda": "Horários parecidos",
          "direita": "Corpo organizado"
         },
         {
          "id": "p2",
          "esquerda": "Companhia",
          "direita": "Refeição melhor"
         },
         {
          "id": "p3",
          "esquerda": "Mesa",
          "direita": "Pausa"
         },
         {
          "id": "p4",
          "esquerda": "Atenção",
          "direita": "Sabor"
         }
        ],
        "feedback": "Muito bem! Você montou o quadro completo."
       },
       "opcoes": []
      },
      {
       "formato": "enquete",
       "enunciado": "O que mais atrapalha comer com calma no seu dia?",
       "dados_extra": {
        "feedback": "Obrigado por contar. Vamos pensar em passos possíveis."
       },
       "opcoes": [
        {
         "texto": "Falta de tempo",
         "correta": false
        },
        {
         "texto": "Barulho ou tela",
         "correta": false
        },
        {
         "texto": "Fome demais",
         "correta": false
        },
        {
         "texto": "Nada atrapalha",
         "correta": false
        }
       ]
      },
      {
       "formato": "meta",
       "enunciado": "Escolha um plano do tipo \"se… então…\".",
       "dados_extra": {
        "feedback": "Planos pequenos e possíveis funcionam melhor."
       },
       "opcoes": [
        {
         "texto": "Se eu sentar para comer, então deixo o celular de lado",
         "correta": false
        },
        {
         "texto": "Se tiver alguém em casa, então como junto",
         "correta": false
        },
        {
         "texto": "Se estiver com pressa, então mastigo devagar a primeira garfada",
         "correta": false
        },
        {
         "texto": "Ainda não sei, e tudo bem",
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
  if exists (select 1 from public.trilhas where descricao like '[TESTE_TRILHA_COMPLETA]%') then
    raise exception 'A trilha de teste já existe. Rode primeiro o reset_trilha_teste.sql.';
  end if;

  -- autoria é obrigatória no schema: prefere perfil profissional
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

  insert into public.trilhas (titulo, descricao, tema, ordem, status, criado_por, aprovado_por, aprovado_em)
  values (v_seed->'trilha'->>'titulo', v_seed->'trilha'->>'descricao', v_tema, 1, 'aprovada', v_criador, v_criador, now())
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
