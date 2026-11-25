# Rebranding (proposta do Claude Design): decisões, riscos e pendências

Implementação por fase, conforme o `HANDOFF_REBRAND.md`. Nada aqui foi testado com usuários.

- **Fase 1 (Termos de Uso e Privacidade v2.0):** implementada.
- **Fase 2 (Bróxis antes do recordatório):** implementada.
- **Fase 3 (Trocas: hub, baralho e "Testei?"):** implementada.
- **Fase 4 (Vitaminas e minerais):** implementada.

### Ordem das migrations (todas idempotentes)

| # | Arquivo | Fase | Depende de |
|---|---------|------|------------|
| 1 | `src/features/legal/data/migration_consentimentos_reaceite.sql` | 1 | nada do repositório (tabela criada no painel) |
| 2 | `src/features/adolescente/triagem/data/migration_eventos_broxis.sql` | 2 | `migration_social_desafio_grupo.sql` (última lista de eventos) |
| 3 | `src/features/adolescente/trocas/data/migration_trocas_avaliacao.sql` | 3 | `migration_trocas.sql`, `migration_trocas_categorias.sql`, `migration_trocas_justificativas.sql` |
| 4 | `src/features/adolescente/perfil/data/migration_xp_rebrand.sql` | 3 e 4 | `migration_xp_servidor.sql` e a nº 3 |
| 5 | `src/features/adolescente/perfil/data/migration_exclusao_conta.sql` | 5 | `papel_atual()` e a nº 1 (lê `consentimentos`); depois dela, `supabase functions deploy excluir-conta` |

Rodar **antes** de publicar a versão do app correspondente. Sem a nº 3, o hub e o baralho continuam funcionando (os campos novos vêm vazios), mas "Testei?" falha ao salvar `CURTI/MEIO/NAO_ROLOU`. Sem a nº 4, a resposta é salva e o XP simplesmente não aparece.

---

## Fase 1: Termos e Privacidade v2.0

### 1. O que afeta tudo (leia primeiro)

| # | Assunto | Por que importa | O que fazer |
|---|---------|-----------------|-------------|
| A | **`VERSAO_TERMOS` passou para `'2.0'`** | Todo adolescente que só aceitou a 1.0 vai ver o reaceite na próxima abertura do app (depois da triagem). | Publicar só depois de rodar a migration (B). |
| B | **`consentimentos` não está em nenhum `.sql` do repositório** | Não deu para conferir colunas, RLS nem unicidade. O reaceite precisa ler os próprios aceites, inserir um segundo aceite e não pode existir unicidade só em `user_id`. | Rodar `src/features/legal/data/migration_consentimentos_reaceite.sql` (idempotente, não depende de outra migration). Antes, rodar as duas consultas de conferência que estão no topo do arquivo. |
| C | **A migration liga RLS na tabela** | Se a RLS estivesse desligada, quem lia `consentimentos` direto (fora de RPC `security definer`) deixa de ver as linhas dos outros. No app, ninguém faz isso hoje. | Conferir se algum painel/script lê a tabela com a chave `anon`/`authenticated`. |
| D | **Textos legais continuam minuta** | `TEXTO_EM_REVISAO = true`: o aviso e o destaque amarelo dos `[COLCHETES]` aparecem na tela. | Trocar para `false` só depois da aprovação da orientadora/jurídico. |

### 2. Decisões tomadas (edite as que discordar)

| # | Decisão | Alternativa |
|---|---------|-------------|
| D1 | O reaceite pergunta **"existe aceite da versão atual?"** (`count` com `user_id` + `versao_termo`), e não "o aceite mais recente é da versão atual?". A resposta é a mesma e não depende do nome da coluna de data, que não aparece no repositório. | Ordenar pela data (`order ... desc limit 1`), como no handoff, quando a coluna estiver confirmada. |
| D2 | Cada aceite é **uma linha nova** (a da 1.0 fica como histórico). A migration só cria `select` e `insert` do próprio usuário; sem `update`/`delete`. | Atualizar a linha antiga (perde o histórico de qual versão foi aceita quando). |
| D3 | A folha de resumo foi separada em `ResumoTermosFolha` (conteúdo) e `ResumoTermosSheet` (Modal). O reaceite usa **um Modal só** com dois modos (cartão / resumo), porque trocar dois Modals do React Native de lugar ao mesmo tempo falha no iOS. | Dois Modals independentes. |
| D4 | Ao tocar em "Termos completos" / "Privacidade completa", a folha **fecha antes de navegar** (o Modal ficaria por cima da tela do documento). Na volta, o checkbox continua como estava; a pessoa marca ou abre o resumo de novo. | Reabrir a folha ao voltar (precisa ouvir o `focus` da tela). |
| D5 | O reaceite só aparece em **telas calmas** (`Home`, `Trilha`, `Alimentacao`, `Missoes`, `Social`, `Mais`), ~0,9 s depois de a tela assentar, e nunca junto com outra celebração (pausa a fila de recompensas e espera a de sequência da Home). | Mostrar logo ao abrir o app, em qualquer tela. |
| D6 | "Tenho dúvidas" abre a Política (seção 11 tem os contatos). O modal some enquanto a pessoa lê e volta quando ela retorna. | Abrir direto um e-mail para a pesquisadora (`mailto:`). |
| D7 | Botão voltar do Android no cartão = **"agora não"**: fecha até a próxima abertura do app, sem aceitar. No iOS não há como dispensar sem aceitar (o design não tem "fechar"). | Adicionar um link "Depois" visível (melhor para autonomia; pede validação do design). |
| D8 | Se a consulta do aceite falhar (offline), o reaceite **não aparece** nesta sessão. O aceite **não vai para a fila offline**: precisa de internet e mostra mensagem amigável se falhar. | Enfileirar o aceite (mas aí o app mostraria "aceito" sem o servidor saber). |
| D9 | Pendências `[ENTRE COLCHETES]` destacadas com `partirPendencias` (`legal/utils/textoLegal.ts`); o colchete sem par fica como texto normal. Os colchetes continuam visíveis dentro do destaque. | Esconder os colchetes. |
| D10 | Tokens novos em `colors.ts` além dos do handoff: `divisoriaSuave`, `divisoriaLista`, `textoCorrido`, `avisoRevisaoFundo`/`avisoRevisaoTexto` (o aviso já usava esses valores soltos), `sobreposicaoModal`, `primaryDarkShadow`. | Valores soltos nos componentes. |
| D11 | As rotas `TermosDeUso` e `PoliticaPrivacidade` foram adicionadas ao `AdolescenteNavigator` (antes só existiam no fluxo deslogado e no `CompletarCadastro`). | Abrir os documentos dentro do próprio Modal. |
| D12 | Nenhum evento de analytics novo nesta fase (não mexe em `eventos_app_nome_check`). | Registrar `termos_reaceite` com a versão. |

### 3. Pontos para revisão (orientadora / jurídico / design)

- **Jurídico/orientadora:** todo o texto v2.0 de `textosLegais.ts`, os 6 itens de `RESUMO_COMBINADO` (precisam continuar fiéis ao texto completo) e os 3 de `MUDANCAS_DA_VERSAO`. Pendências em colchetes: encarregado/DPO da UFV, base legal (estudo por órgão de pesquisa, menores de 12 anos), região do servidor Supabase, prazo de exclusão, prazo de resposta e o que cada perfil vê no painel. Também `ATUALIZADO_EM`.
- **Textos de interface novos (tom/LGPD):** "Atualizamos o nosso combinado", "Nada muda no jeito de usar o app. Só deixamos mais claro:", "Tenho dúvidas · falar com a equipe" e as mensagens de erro do reaceite.
- **Design:** D4, D7 (não há como dispensar sem aceitar no iOS).

### 4. Riscos conhecidos

- **Schema não confirmado (B):** se `consentimentos` tiver outra coluna obrigatória sem default, o reaceite falharia — mas o cadastro já grava exatamente as mesmas colunas, então o risco é baixo.
- **Unicidade composta:** a migration só remove unicidade de **uma** coluna (`user_id`). Se existir um índice único criado com `create unique index` (não constraint), ele não é detectado; confira com `\d public.consentimentos`.
- **Modal no iOS com outra celebração:** o host espera a pausa `sequencia` da Home, mas outra tela com Modal próprio aberto no mesmo instante ainda poderia colidir.
- **Telas não testadas em aparelho** neste ambiente: `tsc` e Jest passam; o layout foi feito pelas referências HTML.

### 5. Como validar

1. Rodar `migration_consentimentos_reaceite.sql` no SQL Editor (ver consultas de conferência no topo).
2. Cadastro por e-mail, etapa 2: tocar em "Termos de Uso" abre a folha; "CONCORDO" marca o checkbox e fecha; "Termos completos" abre o documento.
3. Documento completo: chips de "PULAR PARA" rolam até a seção; trechos em colchetes aparecem em amarelo.
4. Conta antiga (só aceite `'1.0'`), depois da triagem: o reaceite aparece na Home; "Ver o resumo" troca para a folha; "CONCORDO" grava uma linha `'2.0'` e o modal não volta.

---

## Fase 2: Bróxis antes do recordatório

### 1. O que afeta tudo

| # | Assunto | Por que importa | O que fazer |
|---|---------|-----------------|-------------|
| A | `TriagemIntroScreen` e `TriagemApresentacaoScreen` foram **apagadas** | A rota `TriagemIntro` agora abre `BroxisConversaScreen`; `TriagemApresentacao` saiu do `AdolescenteStackParamList`, do navegador e do `triagemStack.ts`. | Nada: nenhum outro ponto navegava para elas. |
| B | **Evento novo** `broxis_intro_resposta` | Sem a migration nº 2, o insert do evento é recusado pelo banco (o analytics falha em silêncio, a tela não quebra). | Rodar a migration nº 2. Ela recria a lista **completa** de `eventos_app_nome_check`. |

### 2. Decisões

| # | Decisão | Alternativa |
|---|---------|-------------|
| D1 | Roteiro como dados (`triagem/data/roteiroBroxis.ts`) com `seguir` para encadear nós sem resposta (`oi`/`quem` → `combinado`). Validação do grafo e tempos em `triagem/utils/roteiroBroxis.ts`, com teste. | Roteiro dentro da tela. |
| D2 | `SpeechBubble` ganhou `children` (para as duas falas com pesos diferentes no mesmo balão) e a borda passou a usar o token `bordaBalao`. Uso antigo (`text`) não muda. | Um balão novo só para essa tela. |
| D3 | Transição herói → chat com Reanimated: a altura medida do herói anima até 0 (550 ms, `bezier(.4,0,.2,1)`), o Bróxis escala para 0,3 e o topo do chat sobe com fade. As falas do herói entram no histórico sem animar de novo. | Trocar de tela. |
| D4 | Analytics: só o código da resposta (`oi`, `quem`, `bora`, `porque`, `entendi`). | Sem evento. |
| D5 | O link "Ler a política de privacidade" do cartão abre a rota `PoliticaPrivacidade`, adicionada também ao ramo da triagem. | Abrir a folha de resumo. |

### 3. Revisão
- **Nutricionista:** todas as falas e os dois cartões de `roteiroBroxis.ts`.

---

## Fase 3: Trocas

### 1. O que afeta tudo

| # | Assunto | Por que importa | O que fazer |
|---|---------|-----------------|-------------|
| A | `trocas_listar()` é **recriada** (muda o tipo de retorno) | Copiei a versão de `migration_trocas_justificativas.sql` e acrescentei `curtida_recente` e `nao_rolou_recente`. Se a função foi mudada direto no banco, a mudança se perde. | Comparar com `pg_get_functiondef` antes de rodar a nº 3. |
| B | **"Não tinha em casa" passa a contar em `destino_acessivel`** (30 dias, mesmo destino) | Vale também para o "não tenho" antigo do retorno da refeição. Só reordena; nunca exclui. | Confirmar com a nutricionista. |
| C | `conceder_xp()` é **recriada** com 2 origens novas | É cópia exata da única definição no repositório + `troca_avaliada` e `teste_nutriente`. A lista de `xp_lancamentos.origem` é recriada inteira. | Comparar com o banco antes de rodar a nº 4. |

### 2. Decisões

| # | Decisão | Alternativa |
|---|---------|-------------|
| D1 | XP do "Testei?" com referência = **id da troca** (não o id da resposta): 1x por troca. Com o id da resposta, dava para ganhar XP inserindo várias avaliações. O servidor exige um `TENTAR` anterior e a avaliação nas últimas 24 h. | `trocaRespostaId`, como no handoff. |
| D2 | Gatilho do "Testei?" = **cartão na Home** (`TesteiHomeCard`). Não criei notificação local: o planejador de lembretes (`escolherLembrete`) tem regras próprias de frequência, e mexer nele está fora do escopo. "Me lembra amanhã" adia o cartão até a meia-noite seguinte (guardado só no aparelho). | Novo tipo de lembrete local. |
| D3 | Tocar numa categoria (ou chegar com `categoria` vindo do retorno da refeição ou do scanner) abre o **baralho** (`TrocaBaralho`). O `AlternativasGrade` do retorno da refeição e a lista do scanner não mudaram. | Manter a lista na mesma tela. |
| D4 | Sem swipe nas cartas (era opcional): os botões fazem tudo. | Swipe com `react-native-gesture-handler`. |
| D5 | "OUTRA IDEIA" usa o outline em `destaqueTexto` (#3F6B12): o `AppButton` outline pinta o texto com a cor da borda, e o verde `primary` no branco não tem contraste AA. Não alterei o `AppButton` (afetaria outras telas). | Mudar o `AppButton`. |
| D6 | Ideia do dia: determinística pela data, prefere destino acessível e sem "não rolou" recente, sem excluir. Subtítulo "No lugar do X. {frase}". | Escolha aleatória. |
| D7 | "Minhas ideias pra testar" abre a nova `TrocasGuardadasScreen`; de lá, qualquer troca guardada abre o "Testei?" (dá para contar antes dos 2 dias). | Só depois dos 2 dias. |
| D8 | Personalização em `ordenarTrocas`: depois das regras do RF015 (acessível, específica, combina com a refeição), "não rolou" desce e "curti" sobe. Testado. | Peso maior. |
| D9 | Respostas `CURTI/MEIO/NAO_ROLOU` não geram evento de analytics (já ficam em `troca_respostas`). `TENTAR`/`NAO_TENHO` continuam como antes. | Evento `troca_avaliada`. |
| D10 | Painel da nutricionista: bloco "Como os adolescentes responderam" no detalhe da troca (`ConteudoDetalheScreen` > aba Ler), com a RPC `trocas_avaliacao_resumo` (contagens de pessoas, sem ids). A taxa só aparece com 5+ pessoas. | Tela própria de relatório. |
| D11 | **Fora:** o item 3.5.3 (adesão por escola e faixa etária para a pesquisa). Os dados já ficam em `troca_respostas`; o relatório agregado pode ser uma RPC no estilo de `analytics_jornada`. | — |

### 3. Revisão
- **Nutricionista:** `textosTestei.ts` (retornos e rótulos), "Bateu vontade de quê?", o banner "Guardei em...", as dicas das cartas (coluna `dica`; sem dica, o verso só mostra os outros dois blocos) e a regra B acima.

### 4. Riscos
- O cartão da Home faz 2 consultas (trocas + respostas) a cada vez que a Home ganha foco.
- `diasDesde` conta blocos de 24 h, não dias de calendário.

---

## Fase 4: Vitaminas e minerais

### 2. Decisões

| # | Decisão | Alternativa |
|---|---------|-------------|
| D1 | `resumo`, `superpoder` e `combo` entraram em `nutrientesInfo.ts` exatamente como na tabela do handoff. | — |
| D2 | Abas como controle segmentado próprio (`accessibilityRole="tab"`), porque o `FiltroChips` desmarca ao tocar no chip ativo. | `FiltroChips`. |
| D3 | `CartaoHub` aceita `corTag` (uma cor ou uma por tag) e `tituloNatural` (sem caixa alta), para "+10 XP" e "IDEIA DO DIA" saírem amarelos. Padrão inalterado. | Novo cartão. |
| D4 | Teste rápido **ligado** (`TESTE_RAPIDO_ATIVO = true` em `perguntasNutriente.ts`). As 3 perguntas são **geradas** dos textos que já existem: superpoder (as outras opções são superpoderes de outros nutrientes), onde encontrar (a certa vem da `dica` ou do `combo`, conferido em teste) e vitamina ou mineral. As opções erradas de "onde encontrar" são sempre Açúcar, Água e Óleo de cozinha. O "Quase!" só aponta a certa, sem falar mal da escolhida. | 39 perguntas escritas à mão. |
| D5 | Não reaproveitei os exercícios da trilha: eles pintam a opção errada de vermelho (`exercicioErro`), e aqui a regra é amarelo e "Quase!". | Adaptar os da trilha. |
| D6 | XP de 10 por terminar o teste (qualquer resultado), 1x por nutriente (`teste_nutriente`). Risco aceito: o servidor não tem como provar que o teste foi feito; o teto é 130 XP por pessoa. | Sem XP. |

### 3. Revisão
- **Nutricionista:** `resumo`, `superpoder` e `combo` dos 13 nutrientes; fontes certas e opções de `perguntasNutriente.ts`; enunciados e explicações geradas em `utils/testeRapido.ts`.

---

## Fase 5: Apagar meus dados

### 1. O que afeta tudo
- **Apaga de verdade e não tem volta.** A Edge Function `excluir-conta` usa a `service_role` (só no servidor) e faz três coisas, nesta ordem: apaga os dados (RPC `excluir_conta_dados`, numa transação só), apaga os arquivos do Storage e apaga o login (`auth.admin.deleteUser`). Só apaga a conta **de quem chamou**, e só se o papel for `ADOLESCENTE` (conferido na função e de novo na RPC).
- **O schema do núcleo não está no repositório** (`profiles`, refeições, água, atividade, `progresso_licao`, `missoes_diarias`, `xp_usuario`, `consentimentos`, triagem). Por isso a RPC não confia só na cascata:
  1. FKs para `profiles` ou `auth.users` **sem** cascata viram `null` (coluna opcional) ou têm a linha apagada (coluna obrigatória). Hoje o caso conhecido é `missoes_periodicas_resgates.user_id`, que bloquearia o delete.
  2. Apaga `profiles`, e a cascata leva o resto. A lista do que é cascade e do que é set null está no topo da migration.
  3. Varre as tabelas de `public` com coluna `user_id` ou `usuario_id` sem FK e apaga as linhas da pessoa. Ficam de fora `acessos_dados_log` (sobrevive de propósito: é a prova de quem leu dados de quem), `exportacoes_log` (o id é da equipe) e `exclusoes_conta_log`.
- **Registro (LGPD art. 18):** `exclusoes_conta_log` guarda só o código aleatório de 8 caracteres, o **dia** (sem hora) e a última versão dos termos aceita. Não guarda id, nome nem e-mail. A RLS está ligada e não há policy; só a RPC `listar_exclusoes_conta()` lê, e só para `ADMINISTRADOR`. A tela no painel ainda não existe.

### 2. Decisões
- **"Mandamos a confirmação pro seu e-mail" saiu da tela "Pronto".** Nada no projeto envia e-mail; mandar um exigiria um serviço de terceiros recebendo o e-mail da pessoa. No lugar, a tela mostra o **código da solicitação** (o mesmo do registro) e o contato `maria.villela@ufv.br`. Se quiserem o e-mail de verdade, é um serviço novo e precisa de revisão LGPD.
- **Sem o evento de analytics `conta_excluida`.** Os eventos ficam em `eventos_app`, que tem cascata para `profiles`: o evento seria apagado junto com a conta. O próprio `exclusoes_conta_log` já conta quantas exclusões houve, sem dado nenhum. Por isso a lista de `eventos_app_nome_check` não foi mexida.
- **Segurar 2 s:** o tempo é contado por um timer em JS, não pelo fim da animação, então "reduzir movimento" desliga só a barra. Com leitor de tela, vira um toque seguido do alerta "Apagar tudo?". Há haptics leve no início e de sucesso ao completar.
- **Offline:** a exclusão nunca entra na fila. O `FunctionsFetchError` do `functions.invoke` não casa com `ehErroDeRede`, então `classificarErroExclusao` trata esse caso.
- **Depois de apagar:** a pilha é resetada para `ApagarPronto`, sem volta. Na hora, o app limpa do aparelho a fila offline, o cache e toda chave do AsyncStorage com o id da pessoa; também zera a store de recompensas. "VOLTAR PRO INÍCIO" faz `signOut({ scope: 'local' })`: o login já não existe, e o signOut global falharia. O `SIGNED_OUT` leva ao Onboarding e cancela os lembretes.
- **Se o login falhar depois dos dados apagados:** a pessoa pode tentar de novo. Sem perfil, `papel_atual()` devolve null, e a função pula direto para o Storage e o login.

### 3. Revisão
- **Orientadora:** confirmar "O que já virou dado anônimo da pesquisa (sem seu nome) pode continuar no estudo." (`perfil/data/textosExclusao.ts`).
- **LGPD:** a troca do aviso de e-mail pelo código; manter `acessos_dados_log` com o `participante_id` de uma conta apagada (o id é pseudônimo, mas é o id da pessoa); e o fato de os `consentimentos` também serem apagados (só a versão vai para o registro).
- **Textos novos:** todos em `perfil/data/textosExclusao.ts`.

### 4. Riscos
- Se o banco tiver alguma tabela do núcleo com FK sem cascata **entre tabelas filhas**, a transação falha e nada é apagado. A pessoa vê "Não deu pra apagar agora" e o log da função mostra só o código do erro. Rode a consulta do topo da migration antes de publicar.
- O token da sessão continua válido no aparelho até vencer. As consultas devolvem vazio (não há mais linhas), e se a renovação acontecer na tela "Pronto", o `RootNavigator` leva ao Onboarding sozinho.

### 5. Como validar
1. Crie um adolescente de teste, registre uma refeição, água, uma troca "Testei?" e uma amizade.
2. Perfil → Apagar meus dados → Continuar → segure. Solte antes dos 2 s: nada acontece.
3. Depois de apagar: `select count(*) from profiles where id = '<id>'` dá 0, `auth.users` também, e `exclusoes_conta_log` tem uma linha com o código mostrado na tela.
4. Repita com o modo avião ligado: aparece o aviso de internet e nada é apagado.
5. Com TalkBack ou VoiceOver: o botão abre o alerta "Apagar tudo?".

