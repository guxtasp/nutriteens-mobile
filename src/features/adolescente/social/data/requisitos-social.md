# Parte social do NutriTeens: decisões e requisitos

Os IDs `RF-SOC-xx` e `RNF-SOC-xx` são provisórios. Renumere quando for juntar com o documento principal de requisitos.

## 1. Decisões de design

1. **Ninguém acha ninguém por nome, nem pelo `codigo_participante`.** O código de participante (`NT-000001`) é da pesquisa. Ele é sequencial (dá para adivinhar `NT-000002`, `NT-000003`…) e liga a pessoa aos dados do estudo. Usá-lo como identificador social quebraria a pseudonimização.
2. **O único caminho para pedir amizade é o código de amizade.** É um código aleatório, em tabela própria, sem relação com o `codigo_participante` nem com o `id`. A pessoa escolhe com quem compartilhar.
3. **O código dá permissão de pedir, nunca de ver.** Quem digita o código vê só o apelido e o avatar do dono. A amizade só existe se o dono aceitar.
4. **Mostramos apelido, nunca o nome real.** O apelido é escolhido pelo próprio usuário. Nome, escola, data de nascimento e gênero nunca saem do perfil. (Se a equipe decidir mostrar o nome real, a mudança é só nas funções `social_*`, mas isso quebra a proteção de menores. Não recomendado.)
5. **Validade de 7 dias, renovável.** Passando disso, um código novo é gerado sob demanda; o usuário também pode trocar o código a qualquer momento (o antigo deixa de valer). Para mudar a validade, edite só `_social_validade_codigo()` na migração.
6. **Recusa silenciosa.** Quem teve o pedido recusado vê a mesma resposta de "enviado", e o dono não recebe nada. Isso evita constrangimento e insistência.
7. **Sem texto livre entre usuários na primeira versão.** O que existe é lista de amigos, bloqueio e denúncia. Reações prontas e comparação de sequência ficam para a próxima etapa (decisão em aberto, ver seção 5).

## 2. O que cada pessoa enxerga

| Momento | Quem vê | O que vê |
|---|---|---|
| Digitou o código (antes de pedir) | quem digitou | apelido e avatar do dono |
| Pedido pendente | o destinatário | apelido e avatar de quem pediu |
| Pedido recusado | ninguém | nada (some para os dois) |
| Amigos | os dois | apelido e avatar |
| Sempre, para qualquer outra pessoa | — | nome real, escola, nascimento, gênero, `codigo_participante`, `id` |

## 3. Requisitos funcionais

- **RF-SOC-01.** O usuário deve poder definir um apelido (3 a 20 caracteres, só letras, números, espaço, ponto, hífen e `_`, sem telefone) e escolher um avatar entre as poses do Broxis.
- **RF-SOC-02.** O usuário deve poder ver e compartilhar o seu código de amizade (formato `XXXX-XXXX`), que só pode ser gerado depois de definir um apelido.
- **RF-SOC-03.** O código de amizade deve expirar em 7 dias, e o usuário deve poder gerar um novo a qualquer momento, o que invalida o anterior.
- **RF-SOC-04.** O usuário deve poder digitar o código de outra pessoa, ver o apelido e o avatar do dono e então confirmar o envio do pedido de amizade.
- **RF-SOC-05.** O destinatário deve poder aceitar ou recusar um pedido recebido. Só ele pode responder.
- **RF-SOC-06.** Se duas pessoas pedirem amizade uma à outra, o segundo pedido deve aceitar o primeiro automaticamente.
- **RF-SOC-07.** O usuário deve poder cancelar um pedido que enviou e desfazer uma amizade.
- **RF-SOC-08.** O usuário deve poder bloquear outra pessoa a partir de um pedido ou de uma amizade. O bloqueio desfaz o vínculo e impede novos pedidos nos dois sentidos, sem revelar o bloqueio ao bloqueado.
- **RF-SOC-09.** O usuário deve poder denunciar outra pessoa a partir de um pedido ou de uma amizade, informando um motivo.
- **RF-SOC-10.** A equipe (papel ADMINISTRADOR) deve poder listar as denúncias, com os apelidos de denunciante e denunciado.

## 4. Requisitos não funcionais (privacidade e segurança)

- **RNF-SOC-01.** O código de amizade é gerado com 8 caracteres de um alfabeto de 32 (sem I, O, 0 e 1), com fonte aleatória criptográfica: 32^8 ≈ 1,1 trilhão de combinações.
- **RNF-SOC-02.** São permitidas no máximo 10 tentativas com código inválido por hora e por usuário. Passando disso, até o código correto é barrado.
- **RNF-SOC-03.** Código inexistente, expirado, revogado e de usuário bloqueado devem dar a mesma resposta ("inválido"), sem revelar qual foi o motivo.
- **RNF-SOC-04.** Cada usuário pode ter no máximo 20 pedidos pendentes enviados.
- **RNF-SOC-05.** As tabelas sociais ficam fechadas ao aplicativo (RLS ligado, sem políticas, sem privilégios para `anon` e `authenticated`). Todo acesso passa por funções `social_*` com `SECURITY DEFINER`, que sempre filtram por `auth.uid()`.
- **RNF-SOC-06.** Por haver menores, o tratamento dos dados sociais deve seguir o melhor interesse do adolescente (LGPD, art. 14), e o ECA Digital também pode se aplicar. Validar o desenho com o orientador, o comitê de ética ou assessoria jurídica antes de abrir ao público.

## 5. Decisões em aberto

- **Interação entre amigos:** reações prontas (parabéns, força) e comparação de sequência são sugestões; chat livre exigiria moderação.
- **Progresso visível:** se amigos veem sequência e XP um do outro, e se isso é opcional.
- **Moderação de apelidos:** o banco só valida o formato. Falta uma lista de palavras proibidas e uma tela para a equipe agir sobre denúncias (hoje só há a função de listagem).
- **Cadastro de contas em massa:** o limite de tentativas é por usuário. Se houver abuso, adicionar limite global ou verificação de e-mail.
- **Pedido recusado:** hoje é permanente; dá para permitir novo pedido depois de um prazo.

## 6. O que já está pronto

- `data/migration_social_amizades.sql`: tabelas, funções e permissões. Testada em PostgreSQL 16 com 76 verificações (formato e viés do código, expiração, limites, recusa silenciosa, bloqueio, denúncia e fechamento das tabelas).
- `services/socialService.ts`: chamadas tipadas às funções do banco.
- `utils/amizade.ts`: normalização e formatação do código, validação do apelido e avatares.

**Falta:** as telas (apelido e avatar, "Meu código", "Adicionar amigo", solicitações e lista de amigos) e a seção de código no Perfil.
