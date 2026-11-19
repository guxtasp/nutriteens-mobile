# NutriTeens: instruções para agentes de código

Responda sempre em **português do Brasil**.

## O que é este projeto

Aplicativo móvel de **pesquisa de Iniciação Científica (PIBIC/CNPq, DPI/UFV)** que leva o
**Guia Alimentar para a População Brasileira** a adolescentes de **10 a 15 anos** do Ensino
Fundamental II de Viçosa-MG. Foi concebido com Design Centrado no Usuário + Design Participativo
(adolescentes, professores e nutricionista) e segue o **Modelo Conceitual NutriTeens**:
Engajamento, Aprendizagem, Socialização e Contextualização.

O estado atual é um **MVP**: implementa só parte dos 75 requisitos funcionais e 17 não funcionais
especificados e **ainda não foi avaliado com usuários**. Nunca descreva uma funcionalidade como
"validada" ou "testada com usuários".

Perfis de usuário (`profiles.papel`): `ADOLESCENTE`, `NUTRICIONISTA`, `ADMINISTRADOR`. O
`RootNavigator` escolhe o navegador pelo papel e pela `etapa_onboarding`.

## Regras de domínio (inegociáveis)

O público são **menores de idade** e o tema é saúde. Toda mudança precisa respeitar:

1. **Sem contagem de calorias**, metas de peso, IMC ou qualquer métrica corporal exibida ao adolescente.
2. **Sem rankings, placares ou comparação entre usuários.** O social é voluntário e moderado.
3. **Sem diagnóstico e sem prescrição de dieta.** O app é uma "companheira de jornada", não substitui profissional de saúde.
4. **Feedback sem julgamento.** Nada de "errado", "ruim", "proibido", culpa ou cobrança. O tom é calibrado pela EBIA (insegurança alimentar): não presuma que o adolescente escolhe o que come.
5. **Classificação de alimentos segue o Guia** (in natura, minimamente processado, processado, ultraprocessado). Não invente valores nutricionais; a fonte é a TACO ou a Open Food Facts.
6. **Textos com conteúdo nutricional precisam de revisão da nutricionista.** Ao criar ou alterar um texto desses, liste-o no resumo final como "pendente de revisão nutricional".
7. **Linguagem juvenil, clara e curta**, sem infantilizar.
8. **Privacidade (LGPD, menores):** nunca registre nome, e-mail ou texto livre em analytics ou logs; eventos levam só códigos curtos. Toda chamada a serviço de terceiros que envie dado do usuário precisa ser apontada no resumo. Dados de participantes da pesquisa (CAAE 94172425.4.0000.5153) **nunca** entram no repositório.

## Stack (confira sempre o `package.json`, não o README)

- **Expo SDK 54**, React Native 0.81 (nova arquitetura), React 19.1, **TypeScript strict**.
  A API do Expo mudou: consulte https://docs.expo.dev/versions/v54.0.0/ antes de usar qualquer módulo `expo-*`.
- Navegação: React Navigation 7 (`native-stack`). Estado global: Zustand. Animações: Reanimated 4 + Moti.
- Backend: **Supabase** (Auth + PostgreSQL + Storage) via `src/lib/supabase.ts`.
- Testes: Jest + ts-jest (`testEnvironment: node`), arquivos em `**/__tests__/**/*.test.ts`.
- O README cita TanStack Query, React Hook Form, Zod e Lottie, mas **eles não estão instalados**. Não os use sem perguntar.
- Dependência nativa: instale com `npx expo install <pacote>` e avise que é preciso gerar **novo development build** (não roda no Expo Go).

## Estrutura

```
src/
  features/<area>/        # adolescente/<modulo>, admin, auth, conteudo, legal, nutricionista
    screens/  components/  hooks/  services/  utils/  data/  utils/__tests__/
  features/adolescente/_shared/   # o que é comum entre módulos do adolescente
  lib/                    # cliente Supabase, fetchComTimeout
  navigation/             # Root + um navegador por papel
  shared/                 # ui, theme, offline, analytics, contexts, state, painel, services
scripts/                  # seeds (TACO, trilha) e utilitários; usam .env.seed com service_role
```

Ao criar um módulo novo do adolescente, espelhe a estrutura de um módulo existente (por exemplo `trocas/` ou `scanner/`).

## Convenções de código

- **Nomes em português** (funções, variáveis, arquivos, tipos): `listarFluxo`, `registroDiarioService`, `filtrosAuditoria`. Componentes e telas em PascalCase (`EditarTrilhaScreen.tsx`).
- Cada arquivo começa com um comentário com o caminho (`// src/features/...`) e, se não for óbvio, o porquê do módulo. Comentários explicam a **decisão**, não o que a linha faz.
- **Telas não chamam o Supabase diretamente.** O acesso fica em `services/`; a lógica pura (regras, filtros, cálculos, validação) fica em `utils/` e ganha teste em `utils/__tests__/`.
- Services: chamam `supabase.from(...)`/`supabase.rpc(...)`, fazem `if (error) throw error;` e convertem `snake_case` do banco para `camelCase` em tipos explícitos.
- Visual: use os tokens de `shared/theme` (`colors`, `typography` com a fonte Sora, `layout`) e os componentes de `shared/ui` (`AppText`, `AppButton`, `ScreenHeader`, `MessageBanner`...). Não use cores ou espaçamentos soltos; se faltar um token, crie-o em `colors.ts`/`layout.ts` com comentário.
- Acessibilidade: `accessibilityLabel`/`accessibilityRole` em elementos tocáveis, alvo de toque mínimo de 44 pt, respeitar `shared/state/acessibilidade.ts`.
- Rede: o cliente já usa `fetchComTimeout` e o modo offline (`shared/offline`: `filaOffline`, `cacheLocal`, `ehErroDeRede`). Registros do adolescente devem funcionar offline pela fila; não crie um fetch paralelo.
- Erros de interface tratados com mensagem amigável (nunca a mensagem crua do Postgres na tela).

## Banco de dados (Supabase)

- **Permissões ficam no banco** (RLS, `grant`s, RPCs `security definer`), nunca só no app.
- Migrations são arquivos `migration_<assunto>.sql` na pasta `data/` da feature. Escreva-as **idempotentes** (`if not exists`, `create or replace`, `drop policy if exists`) e diga no resumo **em que ordem** rodá-las e de qual migration dependem.
- Ao alterar constraints que listam valores (por exemplo `eventos_app_nome_check`), recrie a lista **completa**, conferindo as migrations mais recentes.
- O papel `anon` não tem acesso a tabelas; não reabra grants.
- **Nunca** use a chave `service_role` no app nem a versione. No app só entram `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` (`.env`).
- Não existe um schema completo documentado: antes de usar uma tabela ou coluna, procure-a nos `.sql` do repositório ou nos services. Se não encontrar, pergunte em vez de inventar.

## Comandos

```bash
npm start            # Expo (npm run android | ios | web)
npm test             # Jest
npx tsc --noEmit     # checagem de tipos
```

Antes de dar uma tarefa por concluída: `npx tsc --noEmit` e `npm test` sem erros.

## Como trabalhar

- Mudanças pequenas e focadas; não refatore o que não foi pedido.
- Para funcionalidades maiores (várias telas, migration, módulo nativo), registre as decisões num arquivo `DECISOES_<FUNCIONALIDADE>.md` na raiz, no formato de `DECISOES_SCANNER.md`: o que afeta tudo, decisões tomadas e alternativas, pontos para revisão da nutricionista, riscos.
- No resumo final, separe: o que foi feito, o que precisa ser rodado à mão (migration, `expo install`, novo build), e o que fica pendente de revisão (nutricional, LGPD, textos).
- Documentos de referência no repositório: `README.md`, `DECISOES_SCANNER.md`, `src/features/adolescente/trilha/data/modelo-pedagogico-trilha*.md`, `src/features/adolescente/social/data/requisitos-social.md`.