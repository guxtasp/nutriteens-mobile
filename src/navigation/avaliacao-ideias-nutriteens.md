# NutriTeens: avaliação de complexidade de 6 ideias de interação e comunicação

Data: 2026-10-08. Documento de registro: tudo o que foi levantado no código e no banco está aqui, para retomar sem depender da conversa.

## 0. Como ler este documento

- **Base da análise:** o zip `nutriteens-mobile.zip` (migrations `.sql` em `src/**/data/`, services, hooks e telas). Nada foi executado: o `node_modules` não estava no zip e não houve acesso ao Supabase.
- **Limite importante:** `backup_completo.sql` está **vazio (0 linhas)**. Tabelas como `alimentos`, `registros_agua`, `registros_diarios`, `refeicoes`, `receitas`, `profiles` e `xp_usuario` **não têm migration no repositório**. As colunas dessas tabelas foram inferidas pelo código do app. Antes de implementar qualquer item, confira o schema real no Supabase (`\d tabela`).
- **Escala de complexidade:** Baixa (até ~1 dia), Média (2 a 5 dias), Alta (mais de 1 semana ou infraestrutura nova). São estimativas de uma pessoa que já conhece o código, sem contar revisão de conteúdo por nutricionista.

## 1. Resumo

| # | Ideia | Complexidade | Tabelas novas | Mudança em funções/constraints existentes | Principal risco |
|---|---|---|---|---|---|
| 1A | Cutucada na Chama Dupla (dentro do app) | **Baixa** | 1 (`chama_cutucadas`) | nenhuma | tom (não pode parecer cobrança) |
| 1B | Cutucada com push de verdade | **Alta** | 1 (tokens de push) + Edge Function | nenhuma | infraestrutura inexistente hoje |
| 2 | Jogo de classificar NOVA | **Baixa–Média** | 0 (MVP) | `eventos_app` se quiser registrar evento | qualidade da classificação NOVA em `alimentos` |
| 3 | Cartas dos 10 passos do Guia | **Média** | 2 (`cartas_guia`, `cartas_usuario`) | nova função de avaliação | conteúdo + arte; poucos passos têm gatilho no app |
| 4 | Leitura de rótulo | **Baixa** (estático) / **Média** (editável pelo admin) | 0 | 0 | conteúdo (rótulos fictícios) e revisão |
| 5 | Resumo semanal em cartão | **Média** | 0 | 1 função nova (RPC) | receitas concluídas só existem em `eventos_app` (adolescente não lê) |
| 6 | Votações / co-criação | **Média–Alta** | 3 | 0 | tela de admin para criar votações; ética/consentimento |

**Ordem sugerida (valor por esforço):** 4 → 2 → 1A → 5 → 3 → 6 → 1B.

## 2. O que já existe e é reaproveitável (verificado no código)

- **Chama Dupla** (`migration_chama_dupla.sql`, `chamaDuplaService.ts`): tabela `chamas_dupla`, tudo via RPC `chama_dupla_*`, RLS ligado sem políticas. `chama_dupla_listar()` já devolve `eu_fiz_hoje` e `dupla_fez_hoje`. Princípio de projeto: *"o banco nunca guarda nem devolve quem falhou; o aviso é neutro"*.
- **Padrão de compartilhamento** (`migration_receita_compartilhada.sql`): tabela fechada, função `security definer` que valida amizade aceita e bloqueio, limite diário, mensagem fixa, listagem dos últimos 7 dias. É o molde para qualquer interação nova entre amigos.
- **Central de Notificações** (`notificacoesApp.ts`, `useNotificacoesApp.ts`): junta pedidos de amizade, convites e avisos da chama, receitas de amigos e missões. Cada fonte é carregada por RPC e falha sozinha. Para uma notificação nova: um tipo em `TipoNotificacaoApp`, uma fonte no hook e uma montagem em `montarNotificacoesApp`.
- **Lembretes** (`lembreteChamaService.ts`, `lembreteService.ts`): são **notificações locais agendadas no aparelho** (`expo-notifications`, trigger por data). Não há servidor envolvido.
- **Gamificação** (`migration_gamificacao_perfil.sql`, `migration_conquistas_marcos_insignias.sql`): `insignias` (catálogo, `categoria` com check `conquista|marco|insignia`, `criterio` jsonb), `insignias_usuario`, função `avaliar_insignias` com critérios `licoes`, `xp`, `sequencia`, `agua`, `refeicao`, `atividade`, `amigos`, `trilha`. XP via `xpService.ts` (cliente soma em `xp_usuario`).
- **Trilha / exercícios** (`questoes_quiz.formato`, `dados_extra` jsonb, `opcoes_quiz.categoria`): formato é texto livre (sem `check`); o comentário da coluna lista `multipla_escolha | verdadeiro_falso | completar | ordene | associe | classifique | cartao | enquete | meta | memoria | prato`. Já existe o componente `Classifique.tsx` (**por toque**, não arrasta) e a seed da trilha já usa `classifique` com alimentos.
- **Alimentos**: `alimentos.classificacao_nova` com 4 valores (`IN_NATURA`, `INGREDIENTE_CULINARIO`, `PROCESSADO`, `ULTRAPROCESSADO`), `grupos_alimentares`, `eh_prato_composto`, `acessivel_ebia`. O dataset TACO está em `scripts/seed-taco/`.
- **Eventos** (`migration_analytics_eventos.sql`): `eventos_app` aceita só os nomes listados num `check`; o adolescente **só insere** (não lê). Admin/nutricionista leem só agregados.
- **Missões** (`missaoService.ts`, `migration_missoes_periodicas.sql`): já calculam coisas como "refeição sem ultraprocessado" e "in natura/ingrediente".
- **Bibliotecas:** `moti`, `react-native-reanimated ~4.1`, `expo-notifications`, `expo-haptics`, `lottie-react-native`. **Não há `react-native-gesture-handler`** nas dependências, então arrastar-e-soltar exigiria instalar algo novo (o time já optou por toque no `Classifique`).

## 3. Descobertas que afetam o planejamento

1. **Não existe infraestrutura de push remoto:** nenhuma tabela de token, nenhuma Edge Function, nenhum `supabase/functions`. Os lembretes de hoje são locais. Isso muda a ideia 1 (ver abaixo).
2. **`eventos_app` não é legível pelo adolescente.** "Receita concluída" (`receita_concluida`) só existe lá. Para o resumo semanal (ideia 5) será preciso uma RPC `security definer` que leia só os eventos do próprio usuário.
3. **Amigos veem todas as insígnias/marcos/conquistas ganhos** (`social_perfil_amigo` não filtra por categoria). Se criar uma categoria nova de insígnia (ideia 3), ela apareceria no perfil do amigo.
4. **Inconsistência de tipos:** `recordatorioService.ts` tipa `classificacao_nova` com 3 valores, mas o banco e `missaoService.ts` usam 4 (inclui `INGREDIENTE_CULINARIO`). Não quebra nada hoje, mas vale alinhar antes do jogo NOVA.
5. **Novos nomes de evento exigem migration** (o `check` de `eventos_app.nome` é fechado).

---

## 4. Ideia 1: Cutucada pronta na Chama Dupla ("bora registrar hoje?")

**Correção importante:** o lembrete existente é local; ele não pode ser disparado pela ação de um amigo. Só a **dupla** (tabela e RPCs) é reaproveitável. Por isso há duas versões.

### 1A. Dentro do app (recomendada)

O amigo vê a cutucada na Central de Notificações (e no sino) quando abrir o app.

**Banco**
- Tabela `chama_cutucadas` (RLS ligado, sem políticas, `revoke all`): `id`, `chama_id` (fk `chamas_dupla` on delete cascade), `remetente_id`, `destinatario_id`, `dia date` (fuso São Paulo), `criado_em`, `unique (chama_id, remetente_id, dia)`.
- RPC `chama_dupla_cutucar(p_id uuid)` retornando `enviada | sem_dupla | ja_fez | ja_cutucou | limite`:
  - valida que a dupla está `ativa` e que o chamador faz parte dela;
  - valida bloqueio (mesmo padrão de `receita_compartilhar`);
  - só permite se o outro **ainda não cumpriu hoje** (a informação já é exposta por `chama_dupla_listar`, então não há vazamento novo);
  - 1 cutucada por dia por dupla; a cutucada só vale no dia.
- RPC `chama_cutucada_listar()` devolvendo as de hoje para o destinatário (apelido do remetente, `chama_id`).

**App**
- Botão "Cutucar" em `ChamaDuplaSection.tsx` (visível só se `dupla_fez_hoje` for falso e `eu_fiz_hoje` for verdadeiro; desativado após enviar).
- `services/chamaCutucadaService.ts` (camada fina sobre as RPCs).
- Novo tipo `cutucada_chama` em `notificacoesApp.ts`, fonte no `useNotificacoesApp.ts`, destino `Social`.
- Texto fixo e neutro, por exemplo "[apelido] te chamou pra acender a chama hoje", nunca "você ainda não fez".

**Estimativa:** Baixa, ~0,5 a 1 dia. Testar também bloqueio, dupla encerrada e virada do dia.

### 1B. Push de verdade (aparece com o app fechado)

**Banco/infra:** tabela `dispositivos_push (usuario_id, token, plataforma, atualizado_em)`; Edge Function que envia via Expo Push API; gatilho (database webhook ou `pg_net`) na inserção da cutucada; credenciais FCM/APNs configuradas no EAS; tela/consentimento para ativar push; tratamento de token inválido.
**Riscos:** público de 10 a 15 anos, regras de notificação, bateria, spam. Precisa de revisão ética.
**Estimativa:** Alta, ~3 a 5 dias mais configuração de infraestrutura. Só vale a pena se a 1A mostrar que as pessoas usam.

---

## 5. Ideia 2: Jogo de classificar os 4 grupos (NOVA)

**Já existe:** `Classifique.tsx` por toque, `alimentos.classificacao_nova` com 4 valores, `grupos_alimentares`. A seed da trilha já tem exercícios `classifique`. Então o diferencial do jogo é ser **rejogável, com alimentos sorteados**, fora da trilha.

**Banco:** nenhuma tabela nova no MVP. Consulta: sortear N alimentos (por exemplo 8) de `alimentos`, balanceando as 4 categorias, excluindo pratos compostos ambíguos (`eh_prato_composto`) e itens de classificação duvidosa. Recomenda-se uma coluna/flag de curadoria (`usar_no_jogo boolean`) **se** a revisão nutricional mostrar itens ambíguos.
Opcionais:
- novo evento `jogo_nova_concluido` (alterar o `check` de `eventos_app`);
- XP pequeno via `xpService` (mas defina um teto diário para não virar farm de XP).

**App**
- Nova tela (ex.: `JogoNovaScreen`) acessível pela Home ou por Missões.
- Mecânica por **toque ou deslizar cartas** (evita instalar `gesture-handler`). Se quiser arrastar de verdade, adicionar `react-native-gesture-handler` e testar com Reanimated 4 e `expo` ~54.
- Feedback por rodada (acertos, e uma frase explicando o erro: "iogurte com corante e aromatizante = ultraprocessado"), sem pontuação humilhante.
- Guardar o recorde só localmente (AsyncStorage), sem tabela.

**Riscos**
- **Qualidade dos dados:** se o rótulo NOVA de algum alimento do seed estiver errado, o jogo ensina errado. Peça a revisão das categorias à nutricionista antes de lançar (ou use apenas uma lista curada de ~60 a 100 alimentos).
- Alimentos regionais/ambíguos (pão francês, queijo, suco de caixinha).

**Estimativa:** Baixa–Média, ~1 a 2 dias para o MVP por toque; +1 dia se arrastar; +0,5 dia para curadoria técnica (a revisão nutricional é à parte).

---

## 6. Ideia 3: Cartas colecionáveis dos 10 passos do Guia

**Conteúdo:** os 10 passos do *Guia Alimentar para a População Brasileira* (2014). **Confira o texto oficial** antes de escrever as cartas; a redação deve ser fiel, só em linguagem de adolescente.

**Problema de design:** só alguns passos têm um gatilho natural no app. Sugestão de mapeamento (a validar):

| Passo (resumo) | Gatilho possível no app |
|---|---|
| Alimentos in natura como base | registrar X refeições com in natura (já há lógica em `missaoService`) |
| Óleos, sal e açúcar em pequenas quantidades | concluir a lição do tema (`trilha`) |
| Limitar processados / evitar ultraprocessados | refeição sem ultraprocessado; jogo NOVA |
| Comer com regularidade, atenção e companhia | sequência de registros; Chama Dupla |
| Compras / planejar tempo / restaurantes | concluir a lição do tema |
| Habilidades culinárias | receita concluída (`receita_concluida`) |
| Ser crítico com propaganda | jogo do rótulo (ideia 4) |

**Opção A (reaproveitar `insignias`):** adicionar `'carta'` ao `check` de `categoria` e usar `avaliar_insignias`. Prós: desbloqueio, marcação "nova" e celebração já prontos. Contras: aparece no perfil e no **perfil do amigo** (o app mapeia categoria desconhecida como `conquista`), exige alterar `social_perfil_amigo` e as telas do perfil, e `avaliar_insignias` precisaria de critérios novos (por exemplo `receita`, `in_natura`).

**Opção B (recomendada): tabelas próprias**
- `cartas_guia (id, passo smallint unique check 1..10, titulo, texto_curto, dica, criterio jsonb, ativa)` com leitura liberada e escrita bloqueada (padrão do catálogo de insígnias).
- `cartas_usuario (usuario_id, carta_id, obtida_em, vista)` com `unique (usuario_id, carta_id)`.
- Função `avaliar_minhas_cartas()` modelada em `avaliar_insignias`, chamada ao abrir o álbum.
- Nenhum vazamento para o perfil do amigo.

**App:** tela "Álbum" (grade 2×5, cartas bloqueadas com "?"), modal de carta com virar (Moti), selo "nova", arte por `codigo` em arquivo de assets (como `insigniasArte.ts`).

**Riscos:** produção de 10 ilustrações; texto aprovado pela nutricionista; critérios de desbloqueio que não dependam de dados que o adolescente não lê (ver descoberta 2).

**Estimativa:** Média, ~3 a 5 dias de desenvolvimento (banco ~0,5, função ~0,5, álbum e carta ~2, integração e testes ~1). Conteúdo e arte à parte.

---

## 7. Ideia 4: Leitura de rótulo ("quantos ingredientes tem?")

**Dois caminhos**

- **Estático (recomendado para começar):** arquivo de dados no app (`rotulosJogo.ts`) com ~15 a 20 rótulos **fictícios** (sem marcas reais): lista de ingredientes, e para cada um quais são "ingredientes de cozinha" e quais são "de fábrica" (aditivos, corantes, aromatizantes, açúcar com outros nomes, maltodextrina etc.). Sem banco. **Baixa, ~1 a 2 dias.**
- **Dentro da trilha, sem migration:** novo `formato` `'rotulo'` em `questoes_quiz` com `dados_extra` jsonb (a coluna é texto livre, sem `check`). Reaproveita o editor de lição do admin (`EditarLicaoScreen`) e o pipeline de conteúdo, mas precisa de um componente novo (`Rotulo.tsx`) e de ajuste no `ExercicioQuizContainer`. **Média, ~2 a 3 dias.**

**Mecânica sugerida:** mostrar a lista, pedir (1) contar os ingredientes, (2) tocar nos que "você não usaria na cozinha de casa", (3) revelar a classificação e a regra prática do Guia (lista curta, ingredientes que você reconhece). Sem decoreba de nomes químicos.

**Riscos:** revisão de conteúdo; não usar fotos de rótulos de marcas reais (direito de imagem e viés).

---

## 8. Ideia 5: Resumo semanal em cartão ("Sua semana")

**O que dá para mostrar:** água, atividades, refeições registradas, lições concluídas, receitas concluídas, sequência. **Nunca** peso, altura, escores ou comparação com outros.

**Banco**
- Nenhuma tabela nova.
- RPC `resumo_semanal(p_inicio date)` `security definer`, filtrando sempre por `auth.uid()`, no fuso `America/Sao_Paulo`, devolvendo contagens: dias com registro de água, total de água (se for exibir), nº de atividades, nº de refeições, nº de lições (`progresso_licao`), nº de receitas concluídas (`eventos_app` com `nome = 'receita_concluida'`).
- A RPC é necessária porque `eventos_app` não é legível pelo cliente e porque juntar `registros_diarios` → `registros_agua`/`refeicoes` em várias consultas pelo cliente é lento e repetitivo (hoje o `aguaService` já faz algo parecido com `.in('registro_diario_id', ids)`).
- Confirme no Supabase as colunas reais das tabelas sem migration no repo (`registros_diarios.data`, etc.).

**App**
- Tela/cartão compartilhável **só como imagem** para a própria pessoa, se quiser (view-shot), nunca publicado.
- Lembrete **local** semanal ("veja sua semana") com `expo-notifications`, no padrão do `lembreteService` (não precisa de servidor).
- Mensagem em tom positivo mesmo quando a semana foi fraca ("semana tranquila, bora recomeçar?"), sem linguagem de nota.

**Riscos:** semana "vazia" não pode gerar sensação de fracasso; definir regra para quem usou pouco. Receitas concluídas dependem de o evento ser registrado (hoje é registrado no fim do passo a passo).

**Estimativa:** Média, ~2 a 3 dias (RPC ~0,5 a 1, tela e design ~1,5, lembrete ~0,5).

---

## 9. Ideia 6: Co-criação por votações curtas

**Banco (3 tabelas, RLS fechado, tudo por RPC)**
- `votacoes (id, titulo, descricao, tipo text check ('receita','nome','outro'), abre_em, fecha_em, status, criado_por, criado_em)`.
- `votacao_opcoes (id, votacao_id fk, rotulo, receita_id nullable fk receitas, ordem)`.
- `votacao_votos (votacao_id, usuario_id, opcao_id, criado_em, primary key (votacao_id, usuario_id))` (um voto por pessoa; troca permitida enquanto aberta, se desejar).
- RPCs: `votacao_listar_abertas()`, `votacao_votar(p_votacao uuid, p_opcao uuid)`, `votacao_resultado(p_votacao uuid)` (devolve **só agregados**; só depois de votar ou de encerrar), e RPCs de admin (`votacao_criar`, `votacao_encerrar`) protegidas por `papel_atual()` (mesmo padrão de `analytics_painel`).
- Considerar: limite mínimo de votos antes de exibir o resultado (evita identificar quem votou numa turma pequena); novo evento `votacao_votou` no `eventos_app` se quiser medir participação.

**App**
- Cartão "Vote" na Home e/ou item na Central de Notificações (novo tipo `votacao_aberta`).
- Tela de votação e tela de resultado (barras agregadas).
- **Admin/Nutricionista:** tela para criar e encerrar votações (é o item que mais pesa; hoje não existe).

**Riscos / ética**
- Alinhar com o orientador e o comitê de ética: voto vinculado a `user_id` é dado de pesquisa. Documentar no TCLE/termos.
- Não aceitar **texto livre** nas opções vindas do adolescente (sem moderação); só opções criadas pela equipe.
- Resultado compreensível sem ranking nominal de pessoas.

**Estimativa:** Média–Alta, ~4 a 7 dias (banco ~1,5; telas do adolescente ~2; admin ~2; testes e segurança ~1).

---

## 10. Ordem recomendada e dependências

1. **Rótulo (4)**: baixo custo, forte valor educativo; alimenta a carta "ser crítico com a propaganda".
2. **Jogo NOVA (2)**: depende só de revisar a classificação dos alimentos.
3. **Cutucada in-app (1A)**: pequena, reaproveita Chama Dupla e a Central de Notificações.
4. **Resumo semanal (5)**: depende da RPC; dá volta de engajamento.
5. **Cartas (3)**: depende de conteúdo/arte e se beneficia de 2 e 4 como gatilhos.
6. **Votações (6)**: depende da tela de admin e da validação ética.
7. **Push (1B)**: só se a 1A provar valor.

## 11. Decisões em aberto (para levar ao orientador / nutricionista)

- Qual lista curada de alimentos entra no jogo NOVA, e quem valida as categorias.
- Texto oficial e linguagem das 10 cartas, e quem aprova.
- Se votações com `user_id` entram no protocolo de ética do projeto.
- Se vale ter push remoto (e o consentimento de responsáveis/escola).
- Se o resumo semanal mostra água em ml ou só "dias que registrou" (a segunda opção evita meta numérica).

## 12. Checklist antes de implementar qualquer item

- [ ] Conferir o schema real no Supabase (o `backup_completo.sql` do repo está vazio).
- [ ] Toda tabela nova com RLS ligado, `revoke all ... from anon, authenticated` e acesso por RPC `security definer` com `set search_path = public`.
- [ ] Toda RPC com `grant execute ... to authenticated` e `revoke ... from public, anon`.
- [ ] Mensagens fixas ou de lista fechada; sem texto livre entre usuários.
- [ ] Nunca expor peso, altura, escores ou comparações entre pessoas.
- [ ] Atualizar `requisitos-social.md` quando a mudança afetar o que o amigo enxerga.
- [ ] Se criar evento novo, alterar o `check` de `eventos_app.nome` na mesma migration.
