#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera data/seed_trilha_completa.sql — uma trilha de TESTE completa:

  1 trilha x 3 módulos x 5 nós.  Cada módulo: Ponto de Partida, Aprendizado,
  Treino, Prática Real e Revisão (no módulo 3, Fechamento do Capítulo).
  Os nós de leitura/quiz têm 10 passos (Fechamento: 15), compostos como na
  tabela do modelo-pedagogico-trilha.md, e juntos usam TODOS os formatos:
  cartao, enquete, meta, multipla_escolha (inclui cenário), verdadeiro_falso,
  completar, ordene, associe, classifique, memoria e prato ("monte seu prato").

O TEXTO É ILUSTRATIVO (só para testar o app) e precisa de revisão do
nutricionista antes de virar conteúdo de verdade. Para mudar o conteúdo,
edite os bancos abaixo (BANCOS) e rode de novo:

    python3 gerar_seed_trilha.py

A trilha é criada como 'aprovada' (senão o app não mostra), com a marca
[TESTE_TRILHA_COMPLETA] na descrição.
"""
import json
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
_posicao = {'n': 0}  # faz a opção certa rodar de posição (não ficar sempre na 1ª)


def _com_certa(certa, erradas):
    itens = [(certa, True)] + [(e, False) for e in erradas]
    p = _posicao['n'] % len(itens)
    _posicao['n'] += 1
    itens.insert(p, itens.pop(0))
    return [{'texto': t, 'correta': c} for t, c in itens]


def C(titulo, texto):
    return {'formato': 'cartao', 'enunciado': titulo, 'dados_extra': {'texto': texto}, 'opcoes': []}


def _escolha(formato, q, ops, fb):
    return {'formato': formato, 'enunciado': q, 'dados_extra': {'feedback': fb},
            'opcoes': [{'texto': o, 'correta': False} for o in ops]}


def E(q, ops, fb):
    return _escolha('enquete', q, ops, fb)


def M(q, ops, fb):
    return _escolha('meta', q, ops, fb)


def MC(q, certa, erradas, expl):
    return {'formato': 'multipla_escolha', 'enunciado': q, 'dados_extra': {'explicacao': expl},
            'opcoes': _com_certa(certa, erradas)}


def VF(q, verdadeira, expl):
    return {'formato': 'verdadeiro_falso', 'enunciado': q, 'dados_extra': {'explicacao': expl},
            'opcoes': [{'texto': 'Verdadeiro', 'correta': verdadeira}, {'texto': 'Falso', 'correta': not verdadeira}]}


def CO(q, certa, erradas, expl):
    assert '{lacuna}' in q
    return {'formato': 'completar', 'enunciado': q, 'dados_extra': {'explicacao': expl},
            'opcoes': _com_certa(certa, erradas)}


def OR(q, itens_em_ordem, expl):
    return {'formato': 'ordene', 'enunciado': q, 'dados_extra': {'explicacao': expl},
            'opcoes': [{'texto': t, 'correta': True} for t in itens_em_ordem]}


def _pares(lista):
    return [{'id': f'p{i + 1}', 'esquerda': a, 'direita': b} for i, (a, b) in enumerate(lista)]


def AS(q, pares, expl):
    return {'formato': 'associe', 'enunciado': q, 'dados_extra': {'pares': _pares(pares), 'explicacao': expl}, 'opcoes': []}


def MEM(q, pares, fb):
    return {'formato': 'memoria', 'enunciado': q, 'dados_extra': {'pares': _pares(pares), 'feedback': fb}, 'opcoes': []}


# Catálogo de alimentos do "monte seu prato": id -> (nome, emoji, grupo).
# Os emojis são ilustração provisória; trocar por arte própria quando existir.
ALIMENTOS = {
    'arroz': ('Arroz', '🍚', 'cereal'),
    'pao': ('Pão', '🍞', 'cereal'),
    'batata': ('Batata', '🥔', 'tuberculo'),
    'feijao': ('Feijão', '🍲', 'leguminosa'),
    'ovo': ('Ovo', '🥚', 'proteina'),
    'frango': ('Frango', '🍗', 'proteina'),
    'queijo': ('Queijo', '🧀', 'proteina'),
    'alface': ('Alface', '🥬', 'vegetal'),
    'cenoura': ('Cenoura', '🥕', 'vegetal'),
    'tomate': ('Tomate', '🍅', 'vegetal'),
    'brocolis': ('Brócolis', '🥦', 'vegetal'),
    'banana': ('Banana', '🍌', 'fruta'),
    'maca': ('Maçã', '🍎', 'fruta'),
    'laranja': ('Laranja', '🍊', 'fruta'),
    'melancia': ('Melancia', '🍉', 'fruta'),
    'agua': ('Água', '💧', 'bebida_boa'),
    'coco': ('Água de coco', '🥥', 'bebida_boa'),
    'leite': ('Leite', '🥛', 'bebida_boa'),
    'refri': ('Refrigerante', '🥤', 'ultraprocessado'),
    'caixinha': ('Suco de caixinha', '🧃', 'ultraprocessado'),
    'biscoito': ('Biscoito recheado', '🍪', 'ultraprocessado'),
    'salgadinho': ('Salgadinho', '🍟', 'ultraprocessado'),
    'miojo': ('Macarrão instantâneo', '🍜', 'ultraprocessado'),
}


def K(id_, texto, grupos, minimo=None, maximo=None):
    c = {'id': id_, 'texto': texto, 'grupos': grupos}
    if minimo is not None:
        c['minimo'] = minimo
    if maximo is not None:
        c['maximo'] = maximo
    return c


def PR(q, ids, criterios, capacidade, fb, minimo_itens=3):
    """Monte seu prato (sem nota). `criterios` vazio = prato livre."""
    alimentos = [{'id': i, 'nome': ALIMENTOS[i][0], 'emoji': ALIMENTOS[i][1], 'grupo': ALIMENTOS[i][2]} for i in ids]
    return {'formato': 'prato', 'enunciado': q,
            'dados_extra': {'alimentos': alimentos, 'criterios': criterios, 'capacidade': capacidade,
                            'minimoItens': minimo_itens, 'feedback': fb},
            'opcoes': []}


def CL(q, categorias, itens_a, itens_b, expl):
    # intercala os itens das duas categorias pra não ficarem agrupados
    opcoes = []
    for i in range(max(len(itens_a), len(itens_b))):
        if i < len(itens_a):
            opcoes.append({'texto': itens_a[i], 'correta': True, 'categoria': categorias[0]})
        if i < len(itens_b):
            opcoes.append({'texto': itens_b[i], 'correta': True, 'categoria': categorias[1]})
    return {'formato': 'classifique', 'enunciado': q, 'dados_extra': {'categorias': categorias, 'explicacao': expl},
            'opcoes': opcoes}


# ---------------------------------------------------------------------------
# BANCOS DE CONTEÚDO — um por módulo
# ---------------------------------------------------------------------------

BANCO_1 = {
    'C': [
        C('De onde vem o que você come?', 'Alguns alimentos vêm quase direto da natureza. Outros passam por muitas etapas na indústria. Vamos descobrir a diferença, sem certo ou errado.'),
        C('Quatro grupos', 'O Guia Alimentar separa os alimentos pelo quanto foram processados: in natura ou minimamente processados, ingredientes culinários, processados e ultraprocessados.'),
        C('Perto da natureza', 'Fruta, ovo, arroz, feijão, mandioca e leite são in natura ou minimamente processados. Eles são a base da alimentação e costumam ser acessíveis.'),
        C('Levo comigo', 'Não é sobre proibir nada. É sobre perceber o quanto cada alimento foi processado e dar mais espaço aos que estão perto da natureza.'),
        C('O que é ultraprocessado?', 'São receitas industriais com ingredientes que não usamos na cozinha, como corantes e aromatizantes. Exemplos: salgadinho de pacote, refrigerante e macarrão instantâneo.'),
        C('Exemplo resolvido', 'O pacote de arroz tem só o grão limpo e embalado: é minimamente processado. Já o biscoito recheado leva açúcar, gordura e aditivos: é ultraprocessado.'),
        C('Ingredientes culinários', 'Óleo, sal, açúcar e vinagre servem para temperar e cozinhar. Entram em pequenas quantidades para dar sabor à comida de verdade.'),
    ],
    'E': [
        E('Pensa no que você comeu ontem. O que veio mais perto da natureza e o que veio de pacote?', ['Mais da natureza', 'Meio a meio', 'Mais de pacote', 'Não lembro'], 'Sem certo ou errado. É só um ponto de partida.'),
        E('Como você costuma lanchar na escola?', ['Levo de casa', 'Compro na cantina', 'Depende do dia', 'Nem sempre lancho'], 'Cada rotina é diferente, e tudo bem. Vamos partir da sua.'),
    ],
    'M': [
        M('Qual pequena troca é possível para você nesta semana?', ['Incluir uma fruta em uma refeição', 'Cozinhar algo simples em casa', 'Ainda não sei, e tudo bem'], 'Pequenos passos contam. Você pode mudar de ideia depois.'),
        M('Escolha um plano do tipo "se… então…".', ['Se eu for ao mercado, então escolho um alimento in natura novo', 'Se sobrar arroz e feijão, então guardo para o lanche', 'Ainda não sei, e tudo bem'], 'Um plano pequeno e possível vale mais que um grande e difícil.'),
    ],
    'VF': [
        VF('Todo alimento que vem em pacote é ultraprocessado.', False, 'Arroz e feijão vêm em pacote e são minimamente processados. O que importa é o quanto o alimento foi processado.'),
        VF('O sal e o óleo de cozinha são ingredientes culinários.', True, 'Eles servem para temperar e cozinhar, e entram em pequenas quantidades.'),
        VF('Ultraprocessados costumam ter prazo de validade longo por causa dos aditivos.', True, 'Aditivos e conservantes ajudam esses produtos a durar mais tempo nas prateleiras.'),
    ],
    'MC': [
        MC('Qual destes é um alimento in natura?', 'Laranja', ['Refrigerante', 'Salgadinho de pacote', 'Biscoito recheado'], 'A laranja vem direto da natureza, sem nenhuma etapa industrial.'),
        MC('O que mais caracteriza um alimento ultraprocessado?', 'Receita industrial com aditivos, como corantes e aromatizantes', ['Ser comprado na feira', 'Ser feito em casa', 'Ter um único ingrediente'], 'Ultraprocessados são formulações industriais com ingredientes que não usamos na cozinha.'),
        MC('Em qual grupo entram o azeite e o açúcar?', 'Ingredientes culinários', ['In natura', 'Ultraprocessados', 'Minimamente processados'], 'Azeite, açúcar, sal e óleo servem para temperar e cozinhar.'),
        MC('Qual destes alimentos é minimamente processado?', 'Arroz', ['Nuggets', 'Macarrão instantâneo', 'Bolo de pacote'], 'O arroz só é limpo e embalado, sem acrescentar nada.'),
        MC('No lanche, qual opção tem mais alimentos in natura ou minimamente processados?', 'Ovo cozido e uma banana', ['Bolacha recheada e refrigerante', 'Salgadinho e suco de caixinha'], 'Ovo e banana vêm perto da natureza e costumam custar pouco.'),
        MC('Você tem pouco tempo de manhã. Qual escolha continua perto da natureza e é simples?', 'Cuscuz com ovo e uma fruta', ['Macarrão instantâneo', 'Biscoito recheado com achocolatado'], 'Cuscuz, ovo e fruta são rápidos, baratos e perto da natureza. Nem sempre dá para escolher assim, e tudo bem.'),
    ],
    'CO': [
        CO('O Guia sugere que a base da alimentação seja feita de alimentos {lacuna}.', 'in natura ou minimamente processados', ['ultraprocessados', 'de pacote'], 'A base é feita de alimentos in natura ou minimamente processados.'),
        CO('Alimentos {lacuna} passam por muitas etapas na indústria e levam aditivos.', 'ultraprocessados', ['in natura', 'minimamente processados'], 'Ultraprocessados são os mais industrializados.'),
    ],
    'OR': [
        OR('Coloque em ordem, do mais perto da natureza ao mais industrializado.', ['Batata cozida', 'Batata frita feita em casa', 'Batata chips de pacote'], 'Quanto mais etapas e ingredientes industriais, mais processado.'),
        OR('Coloque em ordem os passos de um lanche simples.', ['Lavar as mãos', 'Escolher os alimentos', 'Montar o lanche', 'Comer com calma'], 'Começar pela higiene e terminar com calma deixa o lanche melhor.'),
    ],
    'AS': [
        AS('Ligue cada alimento ao grupo dele.', [('Laranja', 'In natura'), ('Arroz', 'Minimamente processado'), ('Azeite', 'Ingrediente culinário'), ('Salgadinho de pacote', 'Ultraprocessado')], 'Cada alimento pertence ao grupo conforme o quanto foi processado.'),
        AS('Ligue cada alimento ao grupo dele.', [('Ovo', 'In natura'), ('Sal', 'Ingrediente culinário'), ('Refrigerante', 'Ultraprocessado'), ('Farinha de mandioca', 'Minimamente processado')], 'O que importa é o quanto o alimento foi processado.'),
    ],
    'CL': [
        CL('Classifique cada alimento.', ['Mais perto da natureza', 'Mais industrializado'], ['Ovo', 'Mandioca', 'Feijão'], ['Macarrão instantâneo', 'Biscoito recheado', 'Nuggets'], 'Simplificação proposital: os processados entram em outra etapa.'),
        CL('Classifique cada alimento.', ['Mais perto da natureza', 'Mais industrializado'], ['Banana', 'Arroz', 'Milho'], ['Salgadinho de pacote', 'Refrigerante', 'Sopa instantânea'], 'Quanto menos etapas industriais, mais perto da natureza.'),
    ],
    'MEM': [
        MEM('Jogo da memória: ache o alimento e o grupo dele.', [('Laranja', 'In natura'), ('Azeite', 'Culinário'), ('Nuggets', 'Ultraprocessado')], 'Boa memória! Os alimentos perto da natureza cabem na base da alimentação.'),
        MEM('Jogo da memória: ache o alimento e o grupo dele.', [('Feijão', 'Minimamente processado'), ('Óleo', 'Culinário'), ('Fruta', 'In natura'), ('Biscoito recheado', 'Ultraprocessado')], 'Muito bem! Você já reconhece os grupos.'),
    ],
}

BANCO_2 = {
    'C': [
        C('Água, a bebida do dia a dia', 'Seu corpo usa água o tempo todo: para suar, pensar e se mexer. A água é a bebida mais simples, barata e sempre disponível.'),
        C('Por que beber água?', 'A água ajuda o corpo a manter a temperatura, a digerir e a funcionar bem. A sede é um sinal de que ela está fazendo falta.'),
        C('E os outros líquidos?', 'Refrigerante e suco de caixinha costumam ter açúcar adicionado. Água e suco feito na hora com a fruta cabem melhor na rotina.'),
        C('Levo comigo', 'Uma garrafinha por perto ajuda a lembrar. Não precisa ser perfeito: o importante é a água estar ao alcance.'),
        C('Mexer o corpo', 'Atividade física é qualquer movimento: caminhar até a escola, dançar, jogar bola. Para adolescentes, o recomendado é cerca de 60 minutos por dia, somando o dia todo.'),
        C('Exemplo resolvido', 'Quinze minutos caminhando até a escola, vinte na educação física e vinte dançando em casa somam 55 minutos. Tudo conta.'),
        C('Movimento e alimentação', 'Quando você se mexe, o corpo pede água e energia. Refeições regulares e água por perto ajudam a ter disposição.'),
    ],
    'E': [
        E('Quantos copos de água você acha que bebeu ontem?', ['Quase nenhum', 'Uns 2 ou 3', '4 ou mais', 'Não sei'], 'Sem certo ou errado. Só vamos observar.'),
        E('Qual movimento faz parte da sua semana?', ['Caminho bastante', 'Esporte ou educação física', 'Danço ou brinco', 'Quase não me mexo'], 'Qualquer movimento conta. Vamos partir do seu.'),
    ],
    'M': [
        M('Que hábito de água cabe na sua rotina?', ['Levar uma garrafinha', 'Beber um copo ao acordar', 'Beber água antes do lanche', 'Ainda não sei, e tudo bem'], 'Um hábito pequeno já é um bom começo.'),
        M('Escolha um plano do tipo "se… então…".', ['Se eu for à escola, então caminho uma parte do caminho', 'Se eu tiver 10 minutos livres, então danço uma música', 'Se eu sentir sede, então bebo água primeiro', 'Ainda não sei, e tudo bem'], 'Planos pequenos e possíveis funcionam melhor.'),
    ],
    'VF': [
        VF('Só se deve beber água quando a sede fica forte.', False, 'Ter água por perto e beber ao longo do dia é uma boa ideia, mesmo antes de a sede apertar.'),
        VF('Suco de caixinha é igual à fruta inteira.', False, 'Muitos sucos de caixinha levam açúcar adicionado e não têm as fibras da fruta inteira.'),
        VF('Caminhar até a escola conta como atividade física.', True, 'Qualquer movimento conta e pode ser somado ao longo do dia.'),
    ],
    'MC': [
        MC('Qual é a bebida mais indicada para o dia a dia?', 'Água', ['Refrigerante', 'Bebida energética', 'Suco de caixinha'], 'A água é simples, barata e não tem açúcar adicionado.'),
        MC('O que conta como atividade física?', 'Qualquer movimento, como caminhar, dançar ou jogar bola', ['Só treino de academia', 'Só esporte de competição', 'Só a aula de educação física'], 'Todo movimento do dia a dia conta.'),
        MC('Quanto tempo de movimento por dia é recomendado para adolescentes, somando o dia todo?', 'Cerca de 60 minutos', ['5 minutos', '10 minutos', 'Só no fim de semana'], 'A recomendação geral é de cerca de 60 minutos por dia, que podem ser somados.'),
        MC('Qual escolha ajuda a lembrar de beber água?', 'Deixar uma garrafinha por perto', ['Esperar sentir muita sede', 'Trocar toda água por refrigerante', 'Beber só nas refeições'], 'Ter a água ao alcance ajuda a lembrar.'),
        MC('Você está no recreio com sede. Qual opção cabe melhor no dia a dia?', 'Beber água do bebedouro', ['Comprar um refrigerante', 'Esperar a sede passar'], 'A água do bebedouro é grátis e sempre ajuda.'),
        MC('Está chovendo e você não pode sair. Como se mexer em casa?', 'Dançar ou alongar por 15 minutos', ['Ficar o dia todo parado', 'Deixar para se mexer só no fim de semana'], 'Dá para se mexer em casa, em qualquer espaço pequeno.'),
    ],
    'CO': [
        CO('A bebida mais simples e barata para o dia a dia é a {lacuna}.', 'água', ['refrigerante', 'bebida energética'], 'A água é a bebida mais simples e acessível.'),
        CO('Para adolescentes, o recomendado é cerca de {lacuna} minutos de movimento por dia.', '60', ['10', '5'], 'A recomendação geral é de cerca de 60 minutos por dia.'),
    ],
    'OR': [
        OR('Coloque em ordem: o que fazer ao sentir sede.', ['Perceber a sede', 'Pegar a garrafinha ou ir ao bebedouro', 'Beber a água devagar', 'Voltar ao que estava fazendo'], 'Perceber, agir e depois seguir o dia.'),
        OR('Ordene do movimento mais leve ao mais intenso.', ['Alongar', 'Caminhar devagar', 'Andar de bicicleta', 'Correr'], 'Quanto mais o coração acelera, mais intenso é o movimento.'),
    ],
    'AS': [
        AS('Ligue cada item ao que ele representa.', [('Água', 'Bebida do dia a dia'), ('Refrigerante', 'Tem açúcar adicionado'), ('Garrafinha', 'Ajuda a lembrar de beber'), ('Sede', 'Sinal do corpo')], 'Cada item tem um papel na hidratação.'),
        AS('Ligue cada movimento à sua intensidade.', [('Alongar', 'Movimento leve'), ('Caminhar', 'Movimento moderado'), ('Correr', 'Movimento intenso'), ('Jogar bola', 'Atividade em grupo')], 'Movimento leve, moderado e intenso: todos contam.'),
    ],
    'CL': [
        CL('Classifique cada atividade.', ['Conta como movimento', 'Fica parado'], ['Dançar', 'Caminhar até a escola', 'Jogar bola'], ['Assistir TV sentado', 'Esperar o ônibus sentado', 'Ficar no celular deitado'], 'Todo movimento do corpo conta, mesmo em pequenos trechos.'),
        CL('Classifique cada bebida.', ['Escolhas do dia a dia', 'Para de vez em quando'], ['Água', 'Suco feito na hora', 'Água com limão'], ['Refrigerante', 'Suco de caixinha', 'Bebida energética'], 'Bebidas com açúcar adicionado cabem de vez em quando.'),
    ],
    'MEM': [
        MEM('Jogo da memória: ache os pares.', [('Água', 'Todo dia'), ('Refrigerante', 'De vez em quando'), ('Caminhar', 'Movimento leve')], 'Boa memória! A água é a escolha do dia a dia.'),
        MEM('Jogo da memória: ache os pares.', [('Sede', 'Sinal do corpo'), ('Garrafinha', 'Lembrete'), ('Dançar', 'Atividade física'), ('60 minutos', 'Meta do dia')], 'Muito bem! Pequenos movimentos somam.'),
    ],
}

BANCO_3 = {
    'C': [
        C('Comer é mais que encher o prato', 'Comer também é um momento: de sabor, de pausa e de companhia. Hoje vamos olhar para o como se come, não só para o que se come.'),
        C('Regularidade', 'Fazer refeições em horários parecidos ajuda o corpo a se organizar e evita chegar com fome demais. Não precisa ser exato.'),
        C('Com atenção', 'Comer sem tela deixa a gente perceber o sabor e a hora de parar. Se der, deixe o celular um pouco de lado durante a refeição.'),
        C('Levo comigo', 'Comer devagar e, quando possível, em companhia faz da refeição um momento melhor. Faça do seu jeito.'),
        C('Comer em companhia', 'Dividir a mesa com família ou amigos ajuda a comer com calma e a conhecer novos sabores. Comer sozinho também é normal.'),
        C('Exemplo resolvido', 'Ana almoçava com o celular na mão e terminava em cinco minutos. Hoje deixou o celular na mochila, comeu mais devagar e sentiu o gosto do feijão.'),
        C('Cozinhar junto', 'Ajudar a preparar a refeição, mesmo algo simples como lavar a salada, aproxima a gente da comida e de quem mora com a gente.'),
    ],
    'E': [
        E('Como foi sua última refeição?', ['Sozinho, com o celular', 'Em família ou com amigos', 'Correndo', 'Não lembro'], 'Sem certo ou errado. Cada rotina é diferente.'),
        E('O que mais atrapalha comer com calma no seu dia?', ['Falta de tempo', 'Barulho ou tela', 'Fome demais', 'Nada atrapalha'], 'Obrigado por contar. Vamos pensar em passos possíveis.'),
    ],
    'M': [
        M('Que pequeno passo você quer testar?', ['Comer uma refeição sem tela', 'Comer mais devagar', 'Ajudar a preparar uma refeição', 'Ainda não sei, e tudo bem'], 'Um passo pequeno já é um bom começo.'),
        M('Escolha um plano do tipo "se… então…".', ['Se eu sentar para comer, então deixo o celular de lado', 'Se tiver alguém em casa, então como junto', 'Se estiver com pressa, então mastigo devagar a primeira garfada', 'Ainda não sei, e tudo bem'], 'Planos pequenos e possíveis funcionam melhor.'),
    ],
    'VF': [
        VF('Comer olhando a tela ajuda a perceber a hora de parar.', False, 'Com a atenção na tela, fica mais difícil notar o sabor e os sinais de que você já comeu o suficiente.'),
        VF('Comer sozinho é errado.', False, 'Não existe certo ou errado. O que ajuda é comer com calma, com ou sem companhia.'),
        VF('Ajudar a preparar a refeição também faz parte do ato de comer.', True, 'Cozinhar, mesmo algo simples, aproxima a gente da comida.'),
    ],
    'MC': [
        MC('O que ajuda a comer com mais atenção?', 'Deixar o celular de lado durante a refeição', ['Comer o mais rápido possível', 'Pular a refeição', 'Comer em pé, correndo'], 'Sem a tela, dá para perceber o sabor e a hora de parar.'),
        MC('Por que fazer as refeições em horários parecidos?', 'Ajuda o corpo a se organizar e evita chegar com fome demais', ['Para nunca sentir fome', 'Porque é uma regra obrigatória', 'Não existe motivo'], 'Horários parecidos ajudam o corpo a se organizar. Não precisa ser exato.'),
        MC('Qual é um benefício de comer em companhia?', 'Ajuda a comer com calma e a conhecer novos sabores', ['Obriga a comer mais', 'Deixa a comida sem gosto', 'Não tem nenhum benefício'], 'A companhia deixa a refeição mais tranquila e variada.'),
        MC('O que significa comer devagar?', 'Mastigar bem e perceber o sabor', ['Demorar uma hora em cada refeição', 'Comer pouco', 'Esperar a comida esfriar'], 'Comer devagar é prestar atenção, não demorar demais.'),
        MC('Você chegou com muita pressa e fome. O que ajuda?', 'Respirar, sentar e comer a primeira garfada com calma', ['Comer em pé olhando o celular', 'Pular a refeição'], 'Uma pausa curta já muda a refeição.'),
        MC('Ninguém está em casa para comer com você. O que dá para fazer?', 'Comer com calma, sentado e sem tela', ['Pular a refeição porque está só', 'Comer correndo para acabar logo'], 'Comer sozinho é normal, e dá para fazer disso um momento bom.'),
    ],
    'CO': [
        CO('Comer sem {lacuna} ajuda a perceber o sabor e a hora de parar.', 'tela', ['talher', 'sal'], 'Sem tela, a atenção fica na comida.'),
        CO('Fazer refeições em horários {lacuna} ajuda o corpo a se organizar.', 'parecidos', ['muito diferentes', 'aleatórios'], 'Horários parecidos ajudam o corpo a se organizar.'),
    ],
    'OR': [
        OR('Coloque em ordem: como fazer uma refeição com calma.', ['Lavar as mãos', 'Montar o prato', 'Sentar e deixar o celular de lado', 'Comer devagar'], 'Preparar o momento ajuda a comer com atenção.'),
        OR('Ordene as etapas de preparar uma salada simples.', ['Lavar os vegetais', 'Cortar os vegetais', 'Temperar', 'Servir'], 'Lavar primeiro e temperar por último.'),
    ],
    'AS': [
        AS('Ligue cada hábito ao que ele ajuda.', [('Sem tela', 'Mais atenção ao sabor'), ('Horários parecidos', 'Corpo mais organizado'), ('Cozinhar junto', 'Aproxima as pessoas'), ('Comer devagar', 'Perceber a hora de parar')], 'Pequenos hábitos fazem diferença na refeição.'),
        AS('Ligue cada situação ao que ela representa.', [('Almoço em família', 'Comer em companhia'), ('Celular de lado', 'Comer com atenção'), ('Lavar a salada', 'Ajudar a cozinhar'), ('Sentar à mesa', 'Fazer uma pausa')], 'Cada gesto ajuda a tornar a refeição melhor.'),
    ],
    'CL': [
        CL('Classifique cada atitude.', ['Ajuda a comer com calma', 'Atrapalha comer com calma'], ['Sentar à mesa', 'Deixar o celular de lado', 'Mastigar devagar'], ['Comer correndo', 'Comer olhando a tela', 'Comer em pé, com pressa'], 'Sem julgamento: são só pontos que ajudam ou atrapalham.'),
        CL('Quando acontece cada atitude?', ['Antes de comer', 'Durante a refeição'], ['Lavar as mãos', 'Sentar à mesa', 'Ajudar a arrumar a mesa'], ['Mastigar devagar', 'Conversar', 'Perceber o sabor'], 'Cada momento tem seu cuidado.'),
    ],
    'MEM': [
        MEM('Jogo da memória: ache os pares.', [('Sem tela', 'Mais atenção'), ('Cozinhar junto', 'Aproxima'), ('Devagar', 'Percebe a saciedade')], 'Boa memória! Pequenos cuidados mudam a refeição.'),
        MEM('Jogo da memória: ache os pares.', [('Horários parecidos', 'Corpo organizado'), ('Companhia', 'Refeição melhor'), ('Mesa', 'Pausa'), ('Atenção', 'Sabor')], 'Muito bem! Você montou o quadro completo.'),
    ],
}


# "Monte seu prato": PR[0] entra no Treino e PR[1] na Revisão (no módulo 3, no
# Fechamento do Capítulo). Cada missão é possível de cumprir e nunca "reprova".
BANCO_1['PR'] = [
    PR('Vamos montar um almoço? Escolha os alimentos até cumprir a missão.',
       ['arroz', 'batata', 'feijao', 'ovo', 'frango', 'alface', 'cenoura', 'salgadinho', 'refri'],
       [K('c1', 'Uma fonte de energia', ['cereal', 'tuberculo'], minimo=1),
        K('c2', 'Uma proteína', ['proteina', 'leguminosa'], minimo=1),
        K('c3', 'Uma verdura ou legume', ['vegetal'], minimo=1)],
       6, 'Prato completo! Energia, proteína e verdura juntas deixam a refeição mais equilibrada.'),
    PR('Hora do lanche na escola! Monte um lanche e cumpra a missão.',
       ['banana', 'maca', 'pao', 'ovo', 'queijo', 'leite', 'biscoito', 'salgadinho', 'caixinha'],
       [K('c1', 'Uma fruta', ['fruta'], minimo=1),
        K('c2', 'Algo que dê energia', ['cereal', 'proteina'], minimo=1),
        K('c3', 'Até 1 ultraprocessado', ['ultraprocessado'], maximo=1)],
       5, 'Lanche montado! Quanto mais perto da natureza, melhor para o seu dia.'),
]

BANCO_2['PR'] = [
    PR('Vai jogar bola depois da aula! Monte um lanche e cumpra a missão.',
       ['pao', 'banana', 'maca', 'laranja', 'agua', 'coco', 'leite', 'refri', 'biscoito'],
       [K('c1', 'Algo que dê energia', ['cereal', 'tuberculo'], minimo=1),
        K('c2', 'Uma fruta', ['fruta'], minimo=1),
        K('c3', 'Uma bebida que hidrata', ['bebida_boa'], minimo=1),
        K('c4', 'Até 1 ultraprocessado', ['ultraprocessado'], maximo=1)],
       5, 'Boa escolha! Energia, fruta e uma bebida para hidratar ajudam no movimento.'),
    PR('Dia de calor! Monte um lanche fresquinho para o recreio.',
       ['melancia', 'banana', 'laranja', 'maca', 'agua', 'coco', 'caixinha', 'refri', 'salgadinho'],
       [K('c1', 'Duas frutas', ['fruta'], minimo=2),
        K('c2', 'Uma bebida que hidrata', ['bebida_boa'], minimo=1),
        K('c3', 'Até 1 ultraprocessado', ['ultraprocessado'], maximo=1)],
       5, 'Que lanche refrescante! Frutas e água são ótimas companheiras do calor.'),
]

BANCO_3['PR'] = [
    PR('Domingo de almoço em família! Monte o prato e cumpra a missão.',
       ['arroz', 'batata', 'feijao', 'frango', 'tomate', 'brocolis', 'laranja', 'miojo', 'refri'],
       [K('c1', 'Uma fonte de energia', ['cereal', 'tuberculo'], minimo=1),
        K('c2', 'Uma proteína', ['proteina', 'leguminosa'], minimo=1),
        K('c3', 'Uma verdura ou legume', ['vegetal'], minimo=1),
        K('c4', 'Uma fruta de sobremesa', ['fruta'], minimo=1)],
       6, 'Almoço pronto! Agora é sentar, comer com calma e aproveitar a companhia.'),
    # prato livre: sem critérios, só um mínimo de alimentos
    PR('Para fechar: monte o prato que você mais gostaria de comer hoje.',
       ['arroz', 'feijao', 'ovo', 'frango', 'alface', 'banana', 'pao', 'leite', 'salgadinho'],
       [], 6, 'Esse é o seu prato! Cada pessoa monta o seu, e tudo bem. O que importa é perceber o que você escolhe.'),
]


# ---------------------------------------------------------------------------
# COMPOSIÇÃO DOS NÓS (modelo-pedagogico-trilha.md, seção 3)
# ---------------------------------------------------------------------------

def passo(b, tipo, i):
    return b[tipo][i]


def ponto_de_partida(b):
    return [passo(b, 'C', 0), passo(b, 'E', 0), passo(b, 'VF', 0), passo(b, 'C', 1), passo(b, 'MC', 0),
            passo(b, 'C', 2), passo(b, 'AS', 0), passo(b, 'MC', 4), passo(b, 'E', 1), passo(b, 'C', 3)]


def aprendizado(b):
    return [passo(b, 'C', 4), passo(b, 'MC', 1), passo(b, 'C', 5), passo(b, 'AS', 1), passo(b, 'C', 6),
            passo(b, 'VF', 1), passo(b, 'CL', 0), passo(b, 'MC', 5), passo(b, 'CO', 0), passo(b, 'M', 0)]


def treino(b):
    # 1, 2 e 8 são revisão de nós anteriores (aprendizado e ponto de partida)
    return [passo(b, 'MC', 1), passo(b, 'VF', 1), passo(b, 'AS', 0), passo(b, 'OR', 0), passo(b, 'CO', 1),
            passo(b, 'CL', 1), passo(b, 'VF', 2), passo(b, 'MC', 4), passo(b, 'PR', 0), passo(b, 'MEM', 0)]


def revisao(b):
    return [passo(b, 'VF', 1), passo(b, 'MC', 0), passo(b, 'MEM', 1), passo(b, 'CL', 0), passo(b, 'CO', 1),
            passo(b, 'MC', 5), passo(b, 'VF', 2), passo(b, 'OR', 1), passo(b, 'PR', 1), passo(b, 'M', 1)]


def fechamento(b1, b2, b3):
    # revisão do capítulo inteiro (15 passos) + meta pessoal
    return [passo(b1, 'VF', 0), passo(b1, 'AS', 0), passo(b1, 'CL', 0),
            passo(b2, 'MC', 0), passo(b2, 'OR', 0), passo(b2, 'CO', 0), passo(b2, 'MEM', 0),
            passo(b3, 'PR', 1), passo(b3, 'AS', 1), passo(b3, 'VF', 2), passo(b3, 'OR', 1),
            passo(b3, 'CL', 1), passo(b3, 'MEM', 1), passo(b3, 'E', 1), passo(b3, 'M', 1)]


def no(titulo, tipo, icone, xp, passos=None, texto='', objetivo='', habito=None):
    return {'titulo': titulo, 'tipo': tipo, 'icone': icone, 'xp': xp, 'passos': passos or [],
            'conteudo': {'texto': texto, 'objetivo': objetivo}, 'habito': habito}


def modulo(titulo, banco, pratica, ultimo=None):
    return {
        'titulo': titulo,
        'licoes': [
            no('Ponto de Partida', 'conteudo', 'leaf-outline', 20, ponto_de_partida(banco),
               f'Vamos começar pelo que você já conhece sobre {titulo.lower()}.', 'Ativar o que você já sabe e vive.'),
            no('Aprendizado', 'conteudo', 'bulb-outline', 30, aprendizado(banco),
               f'Hora de aprender algo novo sobre {titulo.lower()}.', 'Entender o conceito novo com exemplos.'),
            no('Treino', 'quiz', 'reader-outline', 25, treino(banco)),
            pratica,
            ultimo if ultimo else no('Revisão', 'quiz', 'trophy-outline', 25, revisao(banco)),
        ],
    }


SEED = {
    'trilha': {
        'titulo': 'Alimentação Saudável',
        'descricao': '[TESTE_TRILHA_COMPLETA] Trilha de teste com todos os formatos de exercício. Conteúdo ilustrativo, sem revisão do nutricionista.',
    },
    'modulos': [
        modulo('Conhecendo os grupos alimentares', BANCO_1,
               no('Prática Real', 'atividade_rastreavel', 'restaurant-outline', 30, None,
                  'Desafio do dia: registre uma refeição no app e observe o quanto dela veio perto da natureza.',
                  'Levar o que aprendeu para uma refeição real.', 'alimentacao')),
        modulo('Hidratação e movimento', BANCO_2,
               no('Prática Real', 'atividade_rastreavel', 'water-outline', 30, None,
                  'Desafio do dia: registre a água que você beber hoje.',
                  'Levar o que aprendeu para o seu dia.', 'agua')),
        modulo('Comer com atenção e companhia', BANCO_3,
               no('Prática Real', 'atividade_rastreavel', 'walk-outline', 30, None,
                  'Desafio do dia: registre um movimento que você fez, de qualquer tipo.',
                  'Levar o que aprendeu para o seu dia.', 'atividade_fisica'),
               ultimo=no('Fechamento do Capítulo', 'quiz', 'trophy-outline', 40,
                         fechamento(BANCO_1, BANCO_2, BANCO_3))),
    ],
}

# ---------------------------------------------------------------------------
# SAÍDA
# ---------------------------------------------------------------------------

RESET_SQL = """-- RESET DO CONTEÚDO E DO PROGRESSO DA TRILHA (ambiente de teste)
-- Execute no SQL Editor do Supabase ANTES do seed_trilha_completa.sql.
--
-- APAGA: todas as trilhas, módulos, lições, passos/exercícios e o progresso
--        de lições de TODOS os usuários.
-- MANTÉM: contas, perfis, triagem (EBIA e recordatório), alimentos, registros
--        de água/atividade/refeição, sequência e XP.
-- Tudo roda numa transação: se qualquer comando falhar, nada é apagado.

begin;

delete from public.progresso_licao;
delete from public.opcoes_quiz;
delete from public.questoes_quiz;

-- tabela criada por um seed antigo; nunca foi lida pelo app (pode não existir)
do $$
begin
  if to_regclass('public.licao_componentes') is not null then
    execute 'delete from public.licao_componentes';
  end if;
end $$;

delete from public.licoes;
delete from public.modulos_trilha;
delete from public.trilhas;

-- OPCIONAL — recomeçar também o XP e a sequência (tire o "--" para usar).
-- Sem isso o XP que já veio das lições apagadas continua somado.
-- update public.xp_usuario set xp_total = 0;
-- update public.profiles set sequencia_atual = 0, maior_sequencia = 0, ultimo_dia_mantido = null;

commit;
"""

LOADER_SQL = """-- SEED DA TRILHA DE TESTE COMPLETA (gerado por gerar_seed_trilha.py — não edite à mão)
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
  v_seed jsonb := $seed$__SEED__$seed$::jsonb;
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
"""


def validar():
    formatos = set()
    for m in SEED['modulos']:
        assert len(m['licoes']) == 5
        for l in m['licoes']:
            n = len(l['passos'])
            if l['tipo'] == 'atividade_rastreavel':
                assert n == 0
                continue
            assert n in (10, 15), (m['titulo'], l['titulo'], n)
            # no máximo 2 cartões seguidos e pelo menos 60% interativos
            seguidos = 0
            for p in l['passos']:
                seguidos = seguidos + 1 if p['formato'] == 'cartao' else 0
                assert seguidos <= 2
                formatos.add(p['formato'])
            interativos = sum(1 for p in l['passos'] if p['formato'] != 'cartao')
            assert interativos / n >= 0.6, (m['titulo'], l['titulo'])
            for p in l['passos']:
                if p['formato'] == 'prato':
                    de = p['dados_extra']
                    ali = de['alimentos']
                    assert len({a['id'] for a in ali}) == len(ali), 'alimento repetido'
                    assert 3 <= de['capacidade'] <= 7 and de['minimoItens'] <= de['capacidade']
                    # a missão precisa caber no prato e ser possível com os alimentos oferecidos
                    soma_minimos = 0
                    for c in de['criterios']:
                        disponiveis = sum(1 for a in ali if a['grupo'] in c['grupos'])
                        assert disponiveis >= c.get('minimo', 0), (p['enunciado'], c['texto'])
                        soma_minimos += c.get('minimo', 0)
                    assert soma_minimos <= de['capacidade'], p['enunciado']
                if p['formato'] in ('multipla_escolha', 'verdadeiro_falso', 'completar'):
                    assert sum(1 for o in p['opcoes'] if o['correta']) == 1, p['enunciado']
    esperados = {'cartao', 'enquete', 'meta', 'multipla_escolha', 'verdadeiro_falso', 'completar',
                 'ordene', 'associe', 'classifique', 'memoria', 'prato'}
    assert formatos == esperados, esperados ^ formatos
    return formatos


if __name__ == '__main__':
    formatos = validar()
    saida_seed = LOADER_SQL.replace('__SEED__', json.dumps(SEED, ensure_ascii=False, indent=1))
    with open(os.path.join(AQUI, 'reset_trilha_teste.sql'), 'w', encoding='utf-8') as f:
        f.write(RESET_SQL)
    with open(os.path.join(AQUI, 'seed_trilha_completa.sql'), 'w', encoding='utf-8') as f:
        f.write(saida_seed)
    total = sum(len(l['passos']) for m in SEED['modulos'] for l in m['licoes'])
    print(f'OK: {len(SEED["modulos"])} módulos, {total} passos, formatos: {sorted(formatos)}')
