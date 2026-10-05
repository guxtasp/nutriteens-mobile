# Modelo pedagógico da Trilha — v2 (PROPOSTA para aprovação)

> **Status:** proposta aprovada em parte (ver seção 12). A base técnica dos passos já está no app; o conteúdo das lições ainda não. A seção "Anexo" resume como a Trilha funciona hoje.
> O `modelo-pedagogico-trilha.md` original (citado no código) não veio no projeto: se existir com a equipe, comparar com este.
>
> Legenda: ✅ já existe no app · 🆕 novo · ❓ decisão em aberto

---

## 1. Objetivo e princípios

**Objetivo:** o adolescente aprender os princípios do Guia Alimentar **fazendo**, e não só lendo, de modo que cada nó seja uma sessão de estudo de verdade (~5 min), não um toque rápido.

Hoje um nó de leitura é um texto + botão, e um quiz tem 3 questões: dá para concluir em cerca de 1 minuto. O modelo abaixo troca isso por **sessões de ~10 passos intercalando conteúdo curto e prática**.

| Princípio | Como aparece na Trilha |
|---|---|
| **Aprender fazendo** (recuperação ativa) | Pelo menos 6 de cada 10 passos pedem uma resposta, nunca só leitura |
| **Conteúdo em doses pequenas** | Cartão de no máximo ~40 palavras; nunca 2 cartões seguidos sem uma atividade no meio |
| **Feedback imediato e explicado** | Toda resposta mostra o porquê, sem punição |
| **Revisão espaçada e intercalada** | Cada Treino e Revisão traz perguntas de nós anteriores |
| **Do exemplo à autonomia** | Aprendizado vai de exemplo resolvido para exercício guiado e depois livre |
| **Ação no mundo real** | Prática Real registra um hábito de verdade e o adolescente decide uma pequena meta (plano "se… então…") |
| **Sem culpa e sem medo de errar** | Sem "vidas"; erro volta para nova tentativa; linguagem neutra sobre o que a pessoa come |

---

## 2. Hierarquia e volume

```
Trilha (= capítulo do Guia Alimentar)            6 no seed de teste
 └─ Módulo                                       3 por trilha: Abertura, Aprofundamento, Consolidação
     └─ Nó (lição, círculo no caminho)           5 por módulo, ordem fixa
         └─ Passo (cada tela dentro do nó)       ~10 por nó  🆕
```

| Nível | Quantidade | Tempo estimado* |
|---|---|---|
| Passos por nó | 10 (Prática Real: 6 + a ação real; Fechamento do Capítulo: 15) | 4 a 6 min |
| Nós por módulo | 5 | ~25 min + a ação real |
| Passos por módulo | 46 (módulo 3: 51) | |
| Passos por trilha | ~143 | ~75 a 80 min |
| Passos nas 6 trilhas | ~860 | |

\* Estimativa de partida (cartão ~20 s, exercício ~30 a 45 s). **Validar com adolescentes de verdade** e ajustar.

❓ **Como entendi seu pedido:** "10 lições por nó" = **10 passos dentro de cada nó** (como uma lição do Duolingo), e não 10 nós por módulo. Se a intenção era a segunda, o volume e o caminho mudam bastante.

---

## 3. Anatomia dos 5 nós de cada módulo

Todo módulo repete esta ordem, com função pedagógica diferente em cada nó.

| # | Nó | Função pedagógica | Passos | Tempo | XP* |
|---|---|---|---|---|---|
| 1 | **Ponto de Partida** | Ativar o que a pessoa já sabe e vive; criar curiosidade. Quase sem certo/errado | 10 | ~4 min | 20 |
| 2 | **Aprendizado** | Ensinar o conceito novo: exemplo resolvido → prática guiada | 10 | ~6 min | 30 |
| 3 | **Treino** | Prática variada do que foi aprendido, com perguntas de nós anteriores | 10 | ~5 min | 25 |
| 4 | **Prática Real** | Levar para a vida: planejar, fazer (registro no app) e refletir | 6 + ação | ~3 min + ação | 30 |
| 5 | **Revisão** | Consolidar o módulo todo, intercalando temas | 10 | ~5 min | 25 |
| 5 | **Fechamento do Capítulo** (só no módulo 3) | Revisão do capítulo inteiro + meta pessoal | 15 | ~8 min | 40 |

\* XP proposto: sobe só Ponto de Partida (15→20) e Aprendizado (15→30), que deixam de ser leituras de 1 minuto. Os demais ficam como estão. Bônus de módulo (100) e de trilha (125) não mudam. ❓

### Composição sugerida dos 10 passos

Legenda: **C** = cartão de conteúdo · **E** = enquete/reflexão sem nota · **Q** = exercício pontuado · **M** = meta/compromisso

| Passo | Ponto de Partida | Aprendizado | Treino | Revisão |
|---|---|---|---|---|
| 1 | C gancho (pergunta/história) | C conceito | Q aquecimento (nó anterior) | Q (módulo anterior) |
| 2 | E enquete | Q múltipla escolha | Q (nó anterior) | Q intercalado |
| 3 | Q V/F diagnóstico | C exemplo resolvido | Q associe | Q associe |
| 4 | C | Q associe | Q ordene | Q classifique |
| 5 | Q múltipla escolha | C aprofundamento | Q completar | Q completar |
| 6 | C | Q V/F (mito) | Q classifique | Q cenário |
| 7 | Q classifique ou associe | Q classifique | Q V/F | Q V/F |
| 8 | Q cenário do dia a dia | Q cenário | Q cenário | Q ordene |
| 9 | E reflexão curta (opcional) | Q completar | Q múltipla escolha | Q múltipla escolha |
| 10 | C "levo comigo" | M meta | Q mista | M meta |

**Regras de composição**
- No máximo **2 cartões seguidos**; depois deles, sempre uma atividade.
- Mínimo de **60% de passos interativos** em todo nó.
- Treino e Revisão: pelo menos **30% das perguntas vêm de nós anteriores** (revisão espaçada).
- Cada cartão tem **uma ideia só**, linguagem de adolescente, no máximo ~40 palavras.

### Prática Real (6 passos + ação)

1. C: o desafio do dia, em uma frase.
2. Q ou E: escolher qual hábito vai registrar (atividade física, água ou refeição), quando a lição permitir.
3. M: plano "se… então…" (ex.: "se for ao lanche da escola, então inclua uma fruta").
4. **Ação real:** registrar no app. O nó só fecha quando o app encontra o registro (regra que já existe ✅).
5. E: como foi? (opções, sem julgamento).
6. C: "o que isso mostra" + reforço positivo.

---

## 4. Catálogo de passos

| Passo | Pontua? | Existe? |
|---|---|---|
| Múltipla escolha | sim | ✅ |
| Verdadeiro ou falso | sim | ✅ |
| Completar frase | sim | ✅ |
| Ordene | sim | ✅ |
| Associe | sim | ✅ |
| Classifique | sim | ✅ |
| Cenário do dia a dia (múltipla escolha com situação) | sim | ✅ (é uma múltipla escolha com enunciado narrativo) |
| **Cartão de conteúdo** (título + texto curto + imagem opcional) | não | 🆕 |
| **Enquete/reflexão** (escolher opção, sem certo/errado, com feedback neutro) | não | 🆕 |
| **Meta/compromisso** (escolher um plano "se… então…") | não | 🆕 |
| **Monte seu prato** (toca nos alimentos e eles vão para um prato ilustrado; missão em pílulas; só libera o CONTINUAR ao cumprir) | não | ✅ |
| **Jogo da memória** (virar cartas e achar os pares; termina quando acha todos) | não | ✅ |
| Registro real (Prática Real) | não | ✅ |

O percentual de acertos considera **só os passos pontuados**.

---

## 5. Regras de progressão e domínio

- **Sem "vidas" e sem perder XP por erro.** O público é adolescente, e parte vive insegurança alimentar: o app não deve gerar ansiedade.
- **Erro volta para nova tentativa** 🆕: toda questão pontuada errada é reapresentada **1 vez** no fim da sessão. Depois da segunda tentativa ela é considerada vista e a sessão segue (ninguém fica preso).
- **Acertos %** = acertos na **primeira tentativa** ÷ passos pontuados.
- **Concluir o nó** = terminar todos os passos. XP integral, sem nota mínima.
- **Desbloqueio** continua linear: o próximo nó só abre ao concluir o atual ✅.
- ❓ Alternativas para o erro: (A) reapresentar 1 vez [recomendado], (B) nota mínima de 70% para concluir, (C) manter como hoje, sem nenhuma consequência.

---

## 6. Revisão espaçada

- O **primeiro passo** de Treino e Revisão é um aquecimento com perguntas do nó/módulo anterior.
- A **Revisão** intercala temas do módulo inteiro em vez de seguir a ordem do conteúdo.
- O **Fechamento do Capítulo** cobre os 3 módulos da trilha.
- Não há nó extra de revisão: ela já está dentro dos 10 passos.

---

## 7. XP e telas de conclusão

| Evento | XP |
|---|---|
| Concluir nó | valor da tabela da seção 3 (só na 1ª vez) |
| Fechar módulo | +100 (`modulos_trilha.xp_bonus` sobrescreve) |
| Fechar trilha | +125 (`trilhas.xp_bonus` sobrescreve) |

Telas de conclusão (já existem ✅): **Lição completa** (só XP), **Módulo completo** (XP + acertos), **Trilha completa** (XP + acertos).

---

## 8. Tom e acessibilidade

- **Sem culpa:** nunca classificar a pessoa ou o prato dela como "bom" ou "ruim"; falar do alimento e da possibilidade.
- **Realista:** exemplos e metas acessíveis a quem tem pouco dinheiro, pouco tempo ou pouca estrutura em casa.
- **Alinhado à EBIA:** o conteúdo não pode depender de alimento caro. Sempre oferecer alternativa de baixo custo.
- **Texto curto, tela de celular, fonte legível.** Cada cartão cabe em uma tela sem rolagem.
- Todo conteúdo passa por **revisão do nutricionista** antes de virar `aprovada`.

---

## 9. Exemplo completo de um nó

**Trilha A — Princípios · A1 Abertura · nó "Aprendizado"** (tema: grau de processamento dos alimentos).
Conteúdo ilustrativo para validação com o nutricionista, **não é texto final**.

| # | Tipo | Conteúdo |
|---|---|---|
| 1 | C | **De onde vem o que você come?** Alguns alimentos vêm quase direto da natureza. Outros passam por muitas etapas na indústria. Vamos descobrir a diferença. |
| 2 | E (sem nota) | Pensa no que você comeu ontem. O que veio mais perto da natureza (fruta, ovo, feijão) e o que veio de pacote? → *Mais da natureza · Meio a meio · Mais de pacote · Não lembro.* Feedback: "Sem certo ou errado. É só um ponto de partida." |
| 3 | C | **Quatro grupos.** Alimentos *in natura* ou *minimamente processados* (fruta, ovo, arroz, feijão) · *Ingredientes culinários* (óleo, sal, açúcar) · *Processados* · *Ultraprocessados*. |
| 4 | Associe | Laranja ↔ in natura · Arroz ↔ minimamente processado · Azeite ↔ ingrediente culinário · Salgadinho de pacote ↔ ultraprocessado |
| 5 | C | **O que torna um alimento ultraprocessado?** Receitas industriais com ingredientes que não usamos na cozinha, como corantes e aromatizantes. |
| 6 | V/F | "Todo alimento que vem em pacote é ultraprocessado." → **Falso.** Arroz e feijão vêm em pacote e são minimamente processados. O que importa é o quanto foi processado. |
| 7 | Classifique | *Mais perto da natureza:* ovo, mandioca, feijão · *Mais industrializado:* macarrão instantâneo, biscoito recheado, nuggets. (Simplificação proposital: os processados entram no módulo A2.) |
| 8 | Cenário | Qual lanche tem mais alimentos *in natura* ou minimamente processados? → **Ovo cozido e uma banana** · Bolacha recheada e refrigerante · Salgadinho e suco de caixinha. |
| 9 | Completar | O Guia sugere que a base da alimentação seja feita de alimentos {lacuna}. → **in natura ou minimamente processados** · ultraprocessados · de pacote. |
| 10 | M | Qual pequena troca é possível para você nesta semana? → *Incluir uma fruta em uma refeição · Cozinhar algo simples em casa · Ainda não sei, e tudo bem.* |

Composição: 3 cartões, 2 passos sem nota, 5 exercícios pontuados. Tempo estimado: ~6 min.

---

## 10. Produção de conteúdo

- ~860 passos no total. **O maior esforço do projeto é escrever e revisar o conteúdo**, não programar.
- Sugestão: escrever em planilha ou JSON (uma linha por passo) e importar por script, no lugar do seed atual de textos genéricos `[TESTE_TRILHA_DUOLINGO]`.
- Fluxo de qualidade: `rascunho` → revisão do nutricionista → `aprovada` (os status e os campos de autoria já existem ✅).
- Começar por **1 trilha completa (A, 3 módulos, ~143 passos)** para validar o formato com usuários antes de produzir as outras 5.

---

## 11. O que muda no app e no banco (se aprovado)

**Banco**
- Exercícios: `questoes_quiz` já guarda N questões por lição. Ir de 3 para 10 **não exige mudança de tabela**.
- Novos tipos de passo (`cartao`, `enquete`, `meta`): a coluna `formato` já é texto livre, então **não precisa de migration**. O conteúdo do cartão/meta vai em `dados_extra` (JSON).
- `licao_componentes` (criada pelo seed de teste, nunca lida pelo app): **abandonar**, para não manter dois modelos em paralelo.
- ❓ Guardar as respostas de reflexão/meta? Exigiria uma tabela nova com RLS, e é dado sensível de menor de idade. Proposta: **não guardar na primeira versão**.

**App**
- `ExercicioQuizContainer` passa a rodar todo nó (hoje só quiz): ganha os 3 passos sem nota, a reapresentação de erros e o acerto só nos pontuados.
- Nós de leitura (`conteudo`) deixam de ser "texto + botão" e passam a usar o mesmo container.
- Prática Real continua com a verificação de registro; ganha os passos de plano e reflexão ao redor.
- Corrigir os problemas listados no Anexo (encadeamento de trilhas, nível ao reabrir, rótulos).

---

## 12. Decisões

**Decididas**
1. ✅ "10 lições por nó" = **10 passos dentro de cada nó**.
2. ✅ Erro: a questão **volta 1 vez no fim** da sessão (seção 5).
3. ✅ Reflexões e metas: **não guardar na primeira versão** (padrão recomendado, fácil de acrescentar depois; guardar dado de menor pode exigir revisão do termo de consentimento).

**Ainda em aberto**
4. ❓ A trilha seguinte (B, C…) libera ao concluir a anterior?
5. ❓ XP proposto na seção 3 (Ponto de Partida 20, Aprendizado 30)? Só o nó de exemplo usa 30 por enquanto.
6. ❓ Começar produzindo só a trilha A (~143 passos) para testar?

**Implementado até aqui:** passos sem nota (cartão, enquete, meta), reapresentação de erros e sessões nos nós de **conteúdo** e **quiz**, mais 1 nó de exemplo completo. **Ainda não:** os passos antes/depois da ação na Prática Real, a revisão espaçada automática entre nós e o conteúdo das demais lições.

---

## Anexo: como a Trilha funciona hoje

- **Estrutura:** trilha → 3 módulos (A1 Abertura, A2 Aprofundamento, A3 Consolidação) → 5 lições (Ponto de Partida, Aprendizado, Treino, Prática Real, Revisão; no módulo 3, "Fechamento do Capítulo").
- **Progressão:** fila linear única; só o primeiro nó não concluído está liberado; o serviço revalida o bloqueio ao concluir.
- **Conteúdo:** texto + botão. **Quiz:** 6 formatos, sem nota mínima, XP só no fim. **Prática Real:** exige registro de atividade, água ou refeição nas últimas 24h.
- **XP atual:** leitura 15, quiz 25, prática 30; bônus 100 por módulo e 125 por trilha (só na primeira conclusão).
- O seed de teste cria 3 questões por quiz com texto genérico.

**Problemas conhecidos (a corrigir junto)**
1. O app mostra só a trilha aprovada de menor `ordem`; a seguinte nunca aparece.
2. `ehUltimaLicao` compara a `ordem` da lição, que reinicia a cada módulo (1 a 5): ao **reabrir** uma lição concluída, o app pode abrir a tela de conclusão errada (XP não é afetado).
3. `conteudo.objetivo` existe nos dados e o app não o mostra.
4. O card do topo mostra "A1 Abertura", mas a divisória do caminho mostra "Módulo 1".
5. A Prática Real aceita qualquer registro das últimas 24h (inclusive anterior ao desbloqueio) e compara datas em UTC.
6. `LICOES_POR_MODULO = 5` e os nós de teste em modo de desenvolvimento estão fixos no código.
7. Comentário desatualizado em `trilhaService.ts` sobre `modulos_trilha` não ter título.
8. O XP é lido e somado em duas chamadas; cliques simultâneos podem perder XP (risco baixo).
