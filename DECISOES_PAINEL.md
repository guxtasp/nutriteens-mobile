# Painel Admin/Nutricionista: decisões de UX/UI, riscos e pendências

Revisão de UX/UI, Design System e responsividade dos painéis de Administração e Nutricionista,
usando as 10 heurísticas de Nielsen como referência. Nada mudou no banco nem nas regras de negócio.
Ainda **não foi avaliado com usuários** (MVP).

## 1. O que afeta tudo (leia primeiro)

| # | Assunto | Por que importa | O que fazer |
|---|---------|-----------------|-------------|
| A | **Paleta nova do painel** (`shared/painel/tema/paletas.ts`) | Muda a aparência de todas as telas do painel de uma vez (menu verde-tinta, bordas de 1 px, cartões neutros). O app do adolescente não é afetado. | Conferir as telas de conteúdo (editores e prévias) no tema claro e no escuro. |
| B | **Migration nova: `src/features/admin/data/migration_catalogo_nutricionista.sql`** | Sem ela, a nutricionista vê o Catálogo mas recebe "Sem permissão" ao salvar alimento ou prato. | Rodar no SQL Editor **depois** de `migration_painel_dashboard.sql` (função `papel_atual`) e `migration_alimentos_privados.sql` (função `usuario_eh_staff`). Sem `expo install` e sem novo build. |
| C | **Segurança continua no banco** | Menus só mostram rotas que o papel já tinha. `painel_dashboard` e `painel_exportar` já recusam quem não é `ADMINISTRADOR`/`NUTRICIONISTA` (erro 42501). | Nenhuma. |

## 2. Decisões tomadas (edite as que discordar)

| # | Decisão | Alternativa |
|---|---------|-------------|
| D1 | Design System do painel em dois arquivos: cores por tema em `tema/paletas.ts` (tokens novos `destaqueTexto`, `alertaTexto`, `campoBorda`, `borda`, `menuSecao`, `menuIconeAtivo`) e medidas em `painelTheme.ts` (`espaco`, `fonte`, `ALVO_TOQUE`, `paddingConteudo`). | Um único arquivo de tokens. |
| D2 | O verde-lima (`#8BCF4A`) fica só para preenchimentos. Texto e ícones usam `destaqueTexto` (#1F7A4D, ~5,3:1 sobre branco); valores em alerta usam `alertaTexto`. Antes o lima e o âmbar apareciam como texto com contraste de ~2:1. | Escurecer o lima em todo o app (mudaria a marca do adolescente). |
| D3 | Menus agrupados por tarefa (Visão geral, Pessoas, Conteúdo, Dados e sistema / Acompanhamento, Revisão de conteúdo, Dados e conta). | Menu plano (eram 15 itens sem ordem). |
| D4 | Tablet (700–1023 px): menu compacto com ícone e **rótulo curto** (`rotuloCurto`). | Só ícones (obrigava a decorar). |
| D5 | Rota `GuiaCriacao` registrada nos dois navigators: o item "Como criar" existia no menu, mas a rota não, e tocar nele dava erro. | Tirar o item do menu. |
| D6 | "Exportar dados" entrou no menu dos dois papéis. Para a nutricionista a rota `NutriExportar` existia, mas não tinha nenhum caminho até ela. | Deixar a exportação só para a Administração. |
| D7 | Configurações compartilhadas (`shared/painel/screens/ConfiguracoesScreen.tsx`), agora também para a nutricionista: conta, tema, LGPD, ajuda e sessão. O botão da Auditoria só aparece para quem tem a rota. | Só a Administração com Configurações. |
| D8 | Saiu "Mostrar dicas de novo": não fazia mais nada desde que as introduções viraram o botão "Sobre esta página". No lugar dele entrou a seção "Ajuda", com o guia "Como criar". | Manter o botão sem efeito. |
| D9 | Sair da conta pede confirmação em qualquer ponto (`useSairDoPainel`). Antes, o botão de Configurações saía direto. | Confirmar só no menu. |
| D10 | Erros mostram título e orientação em linguagem simples (`utils/mensagemErro.ts`, com teste). A mensagem técnica fica recolhida em "Ver detalhe técnico". | Esconder a mensagem técnica por completo (dificulta o suporte). |
| D11 | Os KPIs dos dashboards são clicáveis e abrem a lista relacionada. Também entraram o horário da última atualização e um botão de atualizar. | KPIs só informativos. |
| D12 | Nutricionista: "Precisa da sua atenção" fica acima dos indicadores, porque aprovar é a tarefa principal do papel. Administração: indicadores primeiro. | Mesma ordem nos dois. |
| D13 | Listas de Usuários e Participantes mostram a tabela só a partir de 900 px de janela; abaixo disso, cartões. Os chips de filtro rolam na horizontal no celular. | Tabela a partir de 700 px (espremia 6 colunas em ~560 px). |
| D14 | Corrigido no tema escuro: o formulário de alimento e o painel de filtros do catálogo usavam um fundo claro fixo com o texto do tema escuro. | — |

| D15 | Catálogo (alimentos e pratos) liberado para a nutricionista: mesmas telas da Administração e escrita no banco **só** em itens do catálogo, nunca em alimentos privados de adolescentes. No menu dela, "Receitas" virou a aba Receitas do Catálogo. | Tela separada para a nutricionista. |
| D16 | Níveis de nutrientes de um alimento: **só a nutricionista edita**; o administrador vê só para leitura. O service grava a fonte `REVISADO_NUTRICIONISTA`, então a edição do administrador marcava o dado como revisado sem ter sido (regra 6). | Deixar o administrador editar e gravar outra fonte (exigiria mudar o banco). |
| D17 | Formulário de alimento/prato: depois de criar, a tela passa a editar o item salvo (antes, salvar de novo **duplicava o prato**). Etapas do prato visíveis (Dados → Ingredientes → Receita), barra fixa de ações com o que falta, "Cadastrar outro" e aviso ao sair sem salvar. | — |
| D18 | Ingredientes do prato: botões −/+ (passo de 0,5) e barra com o % de cada ingrediente no prato; remover pede confirmação. A gravação continua sendo a RPC `substituir_ingredientes_prato`. | Só o campo numérico. |
| D19 | Scanner: revisão em 4 blocos numerados, destaques que o adolescente verá e rejeição com confirmação. Os textos e regras de classificação (`utils/scanner`) não mudaram. | — |
| D20 | Guia "Como criar" com a marca (faixa verde, Broxis, progresso). As cores azul/verde/laranja/roxo ficaram só nos desenhos dos blocos, porque são as cores reais do editor. | Trocar também as cores dos blocos (desalinharia guia e editor). |
| D21 | Editor de trilha: etapas (Dados → Módulos → Lições → Revisão), avisos junto da ação que os gerou, lições com ícone e nome do tipo, botão para a página do conteúdo (enviar para revisão). Regras puras novas em `utils/trilhaEdicao.ts`, com teste. | — |
| D22 | Formulários do painel usam `shared/painel/components/Formulario.tsx` (campo, opções, aviso, etapas). Os editores de receita, lição e troca trocaram o `LabeledInput` do adolescente pelo `CampoRotulado`, de mesma interface. | Reescrever cada editor. |

| D23 | `Assistente` (shared/painel/components): cadastros em etapas, uma por vez, que só avançam com a etapa completa, e prévia "Como vai ficar no app" ao lado ou embaixo. Usado em Alternativa (nova), Desafios, Conquistas e Produtos do scanner. | Página única com todos os campos. |
| D24 | Prévias (`PreviaApp`) são ilustrativas: imitam o cartão do app do adolescente (sempre claro), mas não são a tela real. | Renderizar o componente real do app (acoplaria painel e app). |
| D25 | Lista do fluxo (Trilhas, Alternativas, Conteúdos): o status virou um caminho clicável Rascunho → Em revisão → Aprovado → Publicado (+ Rejeitado/Arquivado), que também filtra; autor e ordem foram para "Mais filtros". Aprovações: do mais antigo para o mais novo, com "aguardando há N dias" (destaque a partir de 7). | 7 chips de status soltos. |
| D26 | Página de revisão em 3 abas: Ler → Histórico → Decidir. Checklist de revisão com as regras do AGENTS.md; **aprovar e publicar só liberam com o checklist completo** (só na interface, não é salvo). Rejeitar continua livre. | Checklist só informativo. |
| D27 | Desafios: uma aba por catálogo, com contagem de ativos; criar/editar abre o assistente no lugar da lista; ativar/desativar por interruptor. | Seções empilhadas e formulário no meio da lista. |
| D28 | **Missões e desafios sem emoji:** ícone escolhido numa grade (`SeletorIconeMissao`), a partir de uma lista curada com nomes em português, conferida contra o mapa do Ionicons por teste. O app do adolescente passou a desenhar o ícone (`IconeMissao`); emojis antigos (banco e missões embutidas) são convertidos para um ícone equivalente. O campo `icone` do banco não mudou (texto). | Migration convertendo os emojis gravados (dá para fazer depois, se quiser limpar o banco). |

| D29 | **Jornada (uso progressivo):** nova migration `src/features/admin/data/migration_analytics_jornada.sql` com `analytics_jornada` (agregada: estágios por semana, retenção por turma, adoção de recursos por idade da conta, horários, progresso nas trilhas) e `painel_participante_jornada` (individual: calendário de 12 semanas, marcos, recursos, período do dia). Só lê; não muda tabela nem constraint de eventos. | Calcular no app (exigiria baixar dados individuais para o painel). |
| D30 | Privacidade: no agregado, turma, célula de horário ou ponto de adoção com menos de 5 pessoas vem sem número (mesma regra do Analytics). A jornada individual só tem dados de USO, por isso vale para a Administração também (como o `painel_usuario_uso`). | Jornada individual só para a nutricionista. |
| D31 | "Ativo num dia" = qualquer evento do app OU registro de água/atividade/refeição. Estágios: frequente (3+ dias na semana), ocasional (1–2), em pausa (0 dias, mas ativo nas 3 semanas anteriores), inativo (0 dias e nada nas 3 anteriores), novo (cadastro na semana). | Usar só eventos de analytics (perderia o uso de antes dos eventos existirem). |
| D32 | Cores: rampa ORDINAL de um só tom (verde da marca) para nível de uso e mapas de calor, e azul à parte para "novos". Validada com `validate_palette.js` (skill dataviz) contra o card de cada tema, com passos próprios no escuro. Como passos vizinhos da rampa ficam próximos (esperado no ordinal), os gráficos têm 2px entre segmentos, legenda, rótulo direto e "Ver tabela". | Paleta categórica (sugeriria categorias sem ordem). |
| D33 | Insights são frases geradas por regras puras (`utils/jornada.ts`, com teste), em tom descritivo, sem julgar o adolescente. Sem dados suficientes, não geram frase. | Texto livre/IA. |

## 3. Pontos para revisão

- **Textos novos de interface** (sem conteúdo nutricional): mensagens de erro em `mensagemErro.ts`, seção "Ajuda" de Configurações, rótulos curtos do menu ("Nutris", "Particip.", "Ajustes", "Guia"). Vale revisar o tom.
- **Permissão (D16):** confirmar se o administrador deve mesmo ficar sem editar nutrientes. A trava está só na interface; no banco a policy nova permite a escrita aos dois papéis.
- **Checklist de revisão (D26):** os 5 itens resumem as regras de domínio; a nutricionista deve validar o texto e decidir se bloquear aprovar/publicar faz sentido.
- **App do adolescente (D28):** mudou o desenho do ícone das missões (Home, tela de Missões, widget). Conferir num aparelho.
- **Jornada (D29–D33):** rodar a migration e conferir com dados reais; os limites dos estágios (3+ dias, 3 semanas) são uma escolha inicial e podem ser ajustados com a equipe de pesquisa.
- **LGPD:** a jornada individual mostra só uso do app (dias, horários, recursos), sem conteúdo dos registros. O nome da própria conta continua vindo de `profiles` (a linha da própria pessoa).

## 4. Riscos

- Telas legadas com estilos próprios (editores de conteúdo, prévias) herdam as bordas mais finas. As prévias que imitam o app do adolescente (`QuadroCelular`, `PreviaAoVivo`) não foram alteradas.
- Não houve teste com login real neste ambiente: tipos, testes e bundle web passam, mas os fluxos precisam de uma conferência visual com uma conta de cada papel.
