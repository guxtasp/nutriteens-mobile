# Auditoria de layout: cabeçalho, parte de baixo e área segura

> Etapa 1 (diagnóstico) + resultado das Etapas 2 e 3 no fim do arquivo. As tabelas abaixo mostram o estado ANTES da correção. Levantamento automático (busca por padrões em cada `.tsx`) conferido à mão nas telas com rodapé fixo, cabeçalho próprio, teclado e nos Modals.

## Contexto técnico que muda tudo

- `app.json`: `android.edgeToEdgeEnabled: true` e `orientation: portrait`; `ios.supportsTablet: false` (iPad roda em modo iPhone; tablet Android abre normal).
- Com edge-to-edge, o app desenha **por baixo** da barra de status e da barra de navegação do Android. Barra de 3 botões ≈ 48 dp; barra de gestos ≈ 16–24 dp. Qualquer `paddingBottom` fixo menor que 48 é um problema no Android com 3 botões.
- `SafeAreaView` (react-native-safe-area-context) com todas as edges já protege embaixo. **Mas** um filho com `position: absolute; bottom: 0` ignora esse padding e cai atrás da barra.
- No RN 0.81 com edge-to-edge ligado, os `Modal` do Android também são desenhados de ponta a ponta (as props `statusBarTranslucent`/`navigationBarTranslucent` deixam de fazer diferença). Ou seja: folha presa embaixo dentro de Modal precisa somar `insets.bottom`. **Confirmar num Android real** (é a hipótese mais importante deste relatório).
- Não há nenhum `<StatusBar>` no app: os ícones da barra de status seguem o tema claro (escuros) em todas as telas, inclusive nas de fundo escuro.
- `KeyboardAvoidingView` usa `behavior` só no iOS na maioria das telas. Com edge-to-edge no Android 15+, o sistema deixa de redimensionar a janela sozinho em alguns aparelhos: campos na parte de baixo podem ficar atrás do teclado. **Teste em aparelho.**

## Componentes compartilhados (já existentes)

| Componente | Situação |
|---|---|
| `shared/ui/ScreenHeader` | Bom ponto de partida: voltar 48×48, título centrado `numberOfLines={2}`, slot `direita`. Falta: altura mínima fixa, `adjustsFontSizeToFit`, variante para fundo escuro; `paddingTop: 20` e cor do subtítulo soltos. |
| `shared/ui/BackButton` | 48×48, ok. |
| `_shared/components/TabHeader` | Cabeçalho das abas (sem voltar), usa `layout.cabecalhoPaddingTop`. Ok. |
| `HomeBottomBar` + `useAlturaBarraAbas()` | Ok: soma `insets.bottom`. É a referência certa para quem rola atrás da barra. |
| `ChatFab` | Ok acima da barra de abas (usa insets); mas usa a mesma conta em telas **sem** barra (Perfil), ficando alto demais. |
| `QuickActionsMenu` | Ok (`110 + insets.bottom`); o estilo base ainda tem um `bottom: 110` morto com comentário "ajuste conforme...". |
| `ChatBroxisSheet` | Ok (`Math.max(insets.bottom, 12) + 8`): é o modelo para as outras folhas. |
| `AuthFormLayout` | Ok: insets + KeyboardAvoidingView + ScrollView. |
| `social/components/CabecalhoTela` | Segundo cabeçalho "padrão" paralelo, usado em 7 telas do social. |
| `shared/painel/PainelLayout` | Painel da equipe já trata insets em cima e embaixo. |

## Resumo (telas do app: adolescente, auth, legal e telas compartilhadas)

- **72 telas** do app + **28 telas do painel da equipe** (admin, nutricionista, conteúdo, painel) + **41 arquivos com Modal/folha**.
- Gravidade nas telas do app: 🔴 quebra **3** · 🟠 verificar no aparelho **5** · 🟡 feio **20** · 🟢 ok **44**.
- Cabeçalhos: ScreenHeader: 29, nenhum: 26, próprio(BackButton): 9, próprio: 4, TabHeader: 3, HomeHeader: 1. ("nenhum" inclui telas de celebração e fluxos que ficam sem cabeçalho de propósito.)

## Telas do app

Legenda: **Área segura**: "SAV todas" = SafeAreaView com as 4 edges (protege embaixo); "edges top" = só em cima; "sem SAV" = trata na mão ou não trata. **Fixo embaixo**: barra de abas, ChatFab ou elemento absoluto. **Rola**: como o último item fica livre. **Teclado**: KAV = KeyboardAvoidingView.

| Gravidade | Tela | Cabeçalho | Voltar | Área segura | Fixo embaixo | Rola | Teclado | Observação |
|---|---|---|---|---|---|---|---|---|
| 🔴 quebra | `scanner/ResultadoScannerScreen` | ScreenHeader | sim | SAV todas | absoluto (sem insets) | sim (SAV protege) | — | Rodapé `position:absolute; bottom:0` dentro do SafeAreaView: o absoluto ignora o padding da área segura, então o botão fica atrás da barra de 3 botões (padding de 20, barra de 48). |
| 🔴 quebra | `scanner/ScannerAlimentoScreen` | próprio(BackButton) | sim | SAV todas | absoluto (sem insets) | não | KAV | Rodapé absoluto com `paddingBottom: 36` fixo: menor que a barra de 3 botões (48). Câmera em tela cheia + teclado (código manual) com `behavior` só no iOS. |
| 🔴 quebra | `trilha/TrilhaScreen` | TabHeader | sim | SAV edges [top] | barra de abas, absoluto (sem insets) | sim (padding fixo) | — | Botão flutuante "lição atual" com `bottom: 112` fixo; a barra de abas mede 96 + insets.bottom, então com 3 botões (inset 48) o botão fica em cima da barra. |
| 🟠 verificar | `social/SocialScreen` | TabHeader | sim | SAV edges [top] | barra de abas (sem insets) | sim (padding fixo) | KAV | Aba com barra de abas, 3 KeyboardAvoidingView (`behavior` só no iOS) e Modal próprio. Teclado no Android precisa de teste. |
| 🟠 verificar | `triagem/recordatorio/RecordatorioRefeicaoScreen` | próprio(BackButton) | sim | sem SAV | — | sim + insets | KAV | Usa insets; `KeyboardAvoidingView behavior="padding"` nas duas plataformas: conferir teclado no Android. |
| 🟠 verificar | `auth/CompletarCadastroScreen` | próprio(BackButton) | sim | sem SAV | — | sim + insets | KAV | Idem ao Signup. |
| 🟠 verificar | `auth/LoginProfissionalScreen` | nenhum | não | sem SAV | absoluto (sem insets) | sim (padding fixo) | sem KAV | Layout próprio com decorações absolutas e inputs, sem insets nem KeyboardAvoidingView. É mais usado no web/tablet, mas abre no celular. |
| 🟠 verificar | `auth/SignupScreen` | nenhum | sim | sem SAV | — | sim + insets | KAV | Insets ok; `behavior="padding"` nas duas plataformas: conferir teclado no Android. |
| 🟡 feio | `_shared/MaisScreen` | nenhum | sim | SAV edges [top] | barra de abas (soma insets) | sim + insets | — | Usa constante própria `BARRA_ABAS_ALTURA = 130` em vez de `useAlturaBarraAbas()`; funciona, mas diverge se a barra mudar. |
| 🟡 feio | `alimentacao/AlimentoCadastradoScreen` | nenhum | não | SAV todas | absoluto (sem insets) | sim (SAV protege) | — | Sem cabeçalho (tela de celebração); ok de área segura (SAV todas). |
| 🟡 feio | `alimentacao/FeedbackRefeicaoScreen` | nenhum | não | SAV todas | — | sim (SAV protege) | — | Sem cabeçalho padrão (tela de retorno); área segura ok. |
| 🟡 feio | `atividade-fisica/BuscaAtividadeScreen` | nenhum | sim | SAV todas | — | sim (SAV protege) | sem KAV | Cabeçalho próprio com campo de busca; `paddingBottom: 100` fixo na lista. |
| 🟡 feio | `home/SequenciaScreen` | próprio | sim | SAV todas | absoluto (sem insets) | sim (SAV protege) | — | Cabeçalho próprio (título "Sequência" + fechar). |
| 🟡 feio | `jogos/JogoMemoriaScreen` | próprio(BackButton) | sim | SAV todas | — | sim (SAV protege) | — | Cabeçalho próprio com BackButton; grade calculada com `useWindowDimensions` (conferir em tela baixa). |
| 🟡 feio | `jogos/JogoNovaScreen` | próprio(BackButton) | sim | SAV todas | — | sim (SAV protege) | — | Cabeçalho próprio com BackButton. |
| 🟡 feio | `perfil/ProfileScreen` | ScreenHeader | sim | SAV todas | ChatFab (soma insets) | sim (SAV protege) | — | ChatFab calcula a altura como se houvesse barra de abas; no Perfil (sem abas) ele flutua alto demais. |
| 🟡 feio | `social/DesafioDetalheScreen` | nenhum | sim | SAV edges [top] | — | sim (padding fixo) | — | Cabeçalho próprio (`CabecalhoTela` do social); edges só top e `paddingBottom: 48` fixo no lugar de insets. |
| 🟡 feio | `social/DesafioGrupoScreen` | nenhum | sim | SAV edges [top] | — | sim (padding fixo) | — | Idem: `CabecalhoTela`, edges top, `paddingBottom: 48` fixo. |
| 🟡 feio | `social/JardimDetalheScreen` | nenhum | sim | SAV edges [top] | — | sim (padding fixo) | — | Idem: `CabecalhoTela`, edges top, `paddingBottom: 60` fixo. |
| 🟡 feio | `social/JardimScreen` | nenhum | sim | SAV edges [top] | — | sim (padding fixo) | — | Idem: `CabecalhoTela`, edges top, `paddingBottom: 60` fixo. |
| 🟡 feio | `social/ListaAmigosScreen` | ScreenHeader | sim | SAV edges [top] | — | sim (padding fixo) | sem KAV | edges só top e lista com `paddingBottom: 40` fixo: o último amigo fica parcialmente atrás da barra de 3 botões. |
| 🟡 feio | `social/NovoDesafioScreen` | nenhum | sim | SAV edges [top] | — | sim (padding fixo) | — | Idem, com botões CRIAR/CANCELAR no fim do formulário (podem ficar colados na barra). |
| 🟡 feio | `social/NovoJardimScreen` | nenhum | sim | SAV edges [top] | — | sim (padding fixo) | — | Idem. |
| 🟡 feio | `trilha/LicaoDetalheScreen` | próprio(BackButton) | sim | SAV todas | — | sim (SAV protege) | — | Cabeçalho próprio (BackButton + progresso); edges condicionais (`usaSessao ? ['top'] : todas`): conferir rodapé dos exercícios. |
| 🟡 feio | `trocas/TrocaTesteiScreen` | próprio | sim | SAV edges [top] | — | sim + insets | — | Cabeçalho próprio (modal com X); área segura ok (insets.bottom). |
| 🟡 feio | `vitaminas/TesteNutrienteScreen` | próprio | sim | SAV edges [top] | — | sim + insets | — | Cabeçalho próprio (X + barra de progresso), de propósito em fluxo de teste; insets ok. |
| 🟡 feio | `auth/OnboardingScreen` | nenhum | não | sem SAV | — | não | — | Fundo verde-escuro (#155946) e nenhum `<StatusBar>` no app: ícones da barra de status saem escuros sobre fundo escuro. |
| 🟡 feio | `legal/LegalDocumentoScreen` | próprio(BackButton) | sim | SAV todas | — | sim (SAV protege) | — | Cabeçalho próprio (BackButton + "PULAR PARA"); área segura ok. |
| 🟢 ok | `_shared/AcessibilidadeScreen` | ScreenHeader | sim | SAV todas | — | sim (SAV protege) | — |  |
| 🟢 ok | `agua/ConsumoAguaScreen` | ScreenHeader | sim | SAV todas | — | sim + insets | — |  |
| 🟢 ok | `alimentacao/AlimentacaoHomeScreen` | TabHeader | sim | SAV edges [top] | barra de abas (soma insets) | sim + insets | — |  |
| 🟢 ok | `alimentacao/BuscaAlimentoScreen` | ScreenHeader | sim | SAV todas | — | sim (SAV protege) | sem KAV |  |
| 🟢 ok | `alimentacao/MetodoRegistroScreen` | ScreenHeader | sim | SAV todas | — | não | — |  |
| 🟢 ok | `alimentacao/NovoAlimentoFormScreen` | ScreenHeader | sim | SAV todas | — | sim (SAV protege) | KAV |  |
| 🟢 ok | `alimentacao/NovoAlimentoOrigemScreen` | ScreenHeader | sim | SAV todas | — | não | — |  |
| 🟢 ok | `alimentacao/SugestoesAlimentaresScreen` | ScreenHeader | sim | SAV edges [top] | barra de abas (soma insets) | sim + insets | — |  |
| 🟢 ok | `alimentacao/TipoRefeicaoScreen` | ScreenHeader | sim | SAV edges [top] | barra de abas (soma insets) | sim + insets | — |  |
| 🟢 ok | `atividade-fisica/AtividadeFisicaScreen` | ScreenHeader | sim | SAV todas | — | sim (SAV protege) | — |  |
| 🟢 ok | `cartas/AlbumCartasScreen` | ScreenHeader | sim | SAV todas | — | sim (SAV protege) | — |  |
| 🟢 ok | `home/HomeScreen` | HomeHeader | sim | SAV edges [top] | barra de abas, ChatFab (soma insets) | sim + insets | — | HomeHeader próprio de propósito (saudação + estatísticas). Rolagem com `alturaBarra + 76`; ChatFab acima da barra. |
| 🟢 ok | `jogos/admin/ImagensJogosScreen` | nenhum | não | sem SAV | — | não | — | Tela da equipe (painel). |
| 🟢 ok | `jogos/JogosScreen` | ScreenHeader | sim | SAV todas | — | sim (SAV protege) | — |  |
| 🟢 ok | `metricas/MetricasScreen` | nenhum | sim | sem SAV | — | não | — | Só monta `MetricasView` (que usa ScreenHeader). |
| 🟢 ok | `metricas/MetricasView` | ScreenHeader | sim | SAV todas | — | sim (SAV protege) | — |  |
| 🟢 ok | `missoes/MissoesScreen` | ScreenHeader | sim | SAV todas | — | sim (SAV protege) | — |  |
| 🟢 ok | `notificacoes/LembretesScreen` | ScreenHeader | sim | SAV todas | — | sim (SAV protege) | — |  |
| 🟢 ok | `notificacoes/NotificacoesScreen` | ScreenHeader | sim | SAV todas | — | sim (SAV protege) | — |  |
| 🟢 ok | `perfil/ApagarConfirmarScreen` | ScreenHeader | sim | SAV todas | absoluto (sem insets) | não | — |  |
| 🟢 ok | `perfil/ApagarDadosScreen` | ScreenHeader | sim | SAV todas | — | sim (SAV protege) | — |  |
| 🟢 ok | `perfil/ApagarProntoScreen` | nenhum | não | SAV todas | — | não | — | Sem cabeçalho de propósito (sem volta); SAV todas. |
| 🟢 ok | `perfil/ExtratoXpScreen` | ScreenHeader | sim | SAV todas | — | sim (SAV protege) | — |  |
| 🟢 ok | `receitas-ingredientes/ReceitasComIngredientesScreen` | ScreenHeader | sim | SAV todas | — | sim (SAV protege) | sem KAV | Botão principal no fluxo (não absoluto) dentro de SAV todas. |
| 🟢 ok | `receitas-ingredientes/ReceitasSalvasScreen` | ScreenHeader | sim | SAV todas | — | sim (SAV protege) | — |  |
| 🟢 ok | `scanner/CadastroProdutoScannerScreen` | ScreenHeader | sim | SAV todas | — | sim (SAV protege) | KAV |  |
| 🟢 ok | `scanner/SolicitacoesScannerScreen` | nenhum | sim | sem SAV | — | não | — | Tela da equipe (painel). |
| 🟢 ok | `social/PerfilAmigoScreen` | ScreenHeader | sim | SAV todas | — | sim (SAV protege) | — |  |
| 🟢 ok | `social/ReceitaCompartilhadaScreen` | nenhum | sim | SAV todas | — | não | — | Só abre o `ReceitaDetalheSheet` (ver Modais). |
| 🟢 ok | `triagem/ebia/EbiaPerguntaScreen` | próprio(BackButton) | sim | sem SAV | — | não | — | Fluxo de triagem com cabeçalho próprio (progresso); usa insets. |
| 🟢 ok | `triagem/BroxisConversaScreen` | próprio(BackButton) | sim | sem SAV | absoluto (soma insets) | sim + insets | — | Rodapé de respostas rápidas com insets.bottom. |
| 🟢 ok | `trilha/LicaoCompletaScreen` | nenhum | não | SAV todas | — | não | — | Tela de celebração sem cabeçalho (de propósito); SAV todas. |
| 🟢 ok | `trilha/ModuloCompletaScreen` | nenhum | não | SAV todas | — | não | — | Idem. |
| 🟢 ok | `trilha/TrilhaCompletaScreen` | nenhum | não | SAV todas | — | não | — | Idem. |
| 🟢 ok | `trocas/TrocaBaralhoScreen` | ScreenHeader | sim | SAV edges [top] | — | não | — |  |
| 🟢 ok | `trocas/TrocasGuardadasScreen` | ScreenHeader | sim | SAV edges [top] | — | sim + insets | — |  |
| 🟢 ok | `vitaminas/NutrienteDetalheScreen` | ScreenHeader | sim | SAV edges [top] | barra de abas (soma insets) | sim + insets | — |  |
| 🟢 ok | `vitaminas/VitaminasScreen` | ScreenHeader | sim | SAV edges [top] | barra de abas (soma insets) | sim + insets | — |  |
| 🟢 ok | `auth/presentation/AppPresentationScreen` | próprio | sim | sem SAV | absoluto (soma insets) | não | — | Cabeçalho próprio de apresentação; usa insets em cima e embaixo. |
| 🟢 ok | `auth/EsqueciSenhaScreen` | nenhum | sim | sem SAV | — | não | sem KAV | AuthFormLayout. |
| 🟢 ok | `auth/LoginScreen` | nenhum | sim | sem SAV | — | não | sem KAV | AuthFormLayout (insets + KeyboardAvoidingView + ScrollView). |
| 🟢 ok | `auth/RedefinirSenhaScreen` | nenhum | não | sem SAV | — | não | sem KAV | AuthFormLayout. |
| 🟢 ok | `src/shared/ui/SemConexaoScreen` | nenhum | não | SAV todas | — | não | — | Sem cabeçalho de propósito. |
| 🟢 ok | `src/shared/ui/SplashScreen` | nenhum | não | sem SAV | — | não | — | Splash. |

## Modais e folhas

| Gravidade | Arquivo | statusBarTranslucent | navigationBarTranslucent | Respeita insets | Observação |
|---|---|---|---|---|---|
| 🔴 quebra | `adolescente/agua/components/GuiaAguaSheet.tsx` | não | não | não | Folha presa embaixo (`bottom: 0`) com `paddingBottom: 36` fixo. |
| 🔴 quebra | `adolescente/alimentacao/components/CarrinhoAlimentarSheet.tsx` | não | não | não | Folha presa embaixo com `paddingBottom: 32` fixo e botão de ação no fim. |
| 🔴 quebra | `adolescente/alimentacao/components/GuiaAlimentacaoSheet.tsx` | não | não | não | Folha presa embaixo, `paddingBottom: 36` fixo. |
| 🔴 quebra | `adolescente/alimentacao/components/GuiaCadastroAlimentoSheet.tsx` | não | não | não | Folha presa embaixo, `paddingBottom: 32` fixo. |
| 🔴 quebra | `adolescente/alimentacao/components/ReceitaDetalheSheet.tsx` | não | não | não | Folha `flex-end` com botões no fim e `paddingBottom: 24/32` fixos. |
| 🔴 quebra | `adolescente/atividade-fisica/components/CarrinhoAtividadesSheet.tsx` | não | não | não | Folha presa embaixo, `paddingBottom: 32` fixo. |
| 🔴 quebra | `adolescente/atividade-fisica/components/GuiaAtividadeSheet.tsx` | não | não | não | Folha presa embaixo, `paddingBottom: 36` fixo. |
| 🔴 quebra | `adolescente/social/components/CartinhasCard.tsx` | não | não | não | Modal `slide` com folha `flex-end` sem insets. |
| 🔴 quebra | `adolescente/social/components/EnviarCartinhaSheet.tsx` | não | não | não | Folha `flex-end`, `paddingBottom: 28` fixo. |
| 🔴 quebra | `adolescente/social/components/EnviarReceitaSheet.tsx` | não | não | não | Folha `flex-end`, `paddingBottom: 32` fixo. |
| 🔴 quebra | `adolescente/social/components/JuntosCard.tsx` | não | não | não | Modal `slide` com folha `flex-end` sem insets. |
| 🔴 quebra | `adolescente/social/components/PedidosAmizadeSheet.tsx` | não | não | não | Folha `flex-end`, `paddingBottom: 24` fixo. |
| 🟠 verificar | `adolescente/atividade-fisica/components/RegistroRapidoSheet.tsx` | sim | sim | sim | Insets ok e translúcido; teclado com `behavior="padding"` dentro de Modal. |
| 🟠 verificar | `adolescente/perfil/components/PesoAlturaModal.tsx` | sim | não | não | Inputs; `behavior` só no iOS dentro de Modal: teclado pode cobrir no Android. |
| 🟡 feio | `adolescente/home/components/AniversarioModal.tsx` | sim | não | não | Tela cheia com elemento em `bottom: 10` sem insets. |
| 🟡 feio | `adolescente/home/components/CelebracaoSequenciaModal.tsx` | sim | não | não | Elemento em `bottom: 8` sem insets. |
| 🟡 feio | `adolescente/home/components/PerdaSequenciaOverlay.tsx` | sim | não | não | Overlay com `bottom: 0` sem insets. |
| 🟢 ok | `adolescente/_shared/components/ChatBroxisSheet.tsx` | sim | não | sim | Modelo a seguir: `Math.max(insets.bottom, 12) + 8`. |
| 🟢 ok | `adolescente/_shared/components/QuickActionsMenu.tsx` | não | não | sim | Usa insets; estilo base com `bottom: 110` morto. |
| 🟢 ok | `adolescente/_shared/components/SucessoRegistroModal.tsx` | sim | não | não | Centralizado. |
| 🟢 ok | `adolescente/cartas/components/CartaDetalheModal.tsx` | não | não | não | Centralizado. |
| 🟢 ok | `adolescente/home/components/BoasVindasModal.tsx` | sim | não | não | Centralizado. |
| 🟢 ok | `adolescente/home/components/ConquistaModal.tsx` | não | não | não | Centralizado. |
| 🟢 ok | `adolescente/home/components/MissaoDoDiaModal.tsx` | sim | não | não | Centralizado. |
| 🟢 ok | `adolescente/receitas-ingredientes/components/ReceitaCasaTela.tsx` | sim | não | sim | Tela cheia com insets em cima e embaixo. |
| 🟢 ok | `adolescente/recompensas/components/CartaGanhaModal.tsx` | sim | não | não | Centralizado. |
| 🟢 ok | `adolescente/recompensas/components/EvolucaoBroxisModal.tsx` | sim | sim | sim | Insets e translúcido. |
| 🟢 ok | `adolescente/recompensas/components/InsigniaGanhaModal.tsx` | sim | não | não | Centralizado. |
| 🟢 ok | `adolescente/social/components/AvisoModeracaoModal.tsx` | não | não | não | Centralizado. |
| 🟢 ok | `adolescente/tour/TourOverlay.tsx` | sim | sim | não | Translúcido; conferir balão perto da barra de abas. |
| 🟢 ok | `adolescente/trilha/components/SeletorTrilhas.tsx` | não | não | sim | Usa insets. |
| 🟢 ok | `adolescente/trocas/components/TrocaDetalheSheet.tsx` | não | não | não | Centralizado (`fade`). |
| 🟢 ok | `auth/components/CampoSelecao.tsx` | sim | sim | sim | Insets e translúcido. |
| 🟢 ok | `auth/components/SairDoCadastroModal.tsx` | sim | sim | não | Centralizado, translúcido. |
| 🟢 ok | `legal/components/ReaceiteModal.tsx` | sim | sim | não | Centralizado, translúcido. |
| 🟢 ok | `legal/components/ResumoTermosSheet.tsx` | sim | sim | sim | Insets e translúcido. |
| 🟢 ok | `src/shared/painel/PainelLayout.tsx` | não | não | sim | Painel da equipe; insets ok. |
| 🟢 ok | `src/shared/painel/components/IntroSecao.tsx` | não | não | não | Painel; centralizado. |
| 🟢 ok | `src/shared/ui/InfoSheet.tsx` | não | não | não | Centralizado (`fade`). |
| 🟢 ok | `src/shared/ui/SeletorDataModal.tsx` | não | não | não | Centralizado (`fade`). |
| 🟢 ok | `src/shared/ui/SeletorDataNativo.tsx` | não | não | sim | Usa insets. |

Modais: 🔴 **12** · 🟠 **2** · 🟡 **3** · 🟢 **24**. As "quebra" dependem da hipótese do Modal edge-to-edge; se o aparelho mostrar a folha acima da barra, elas caem para "feio" (padding fixo).

## Painel da equipe (admin, nutricionista, conteúdo)

28 telas dentro do `PainelLayout`, que já cuida do topo, do fundo e da barra lateral/rail (pensado para web e tablet). Nenhuma usa SafeAreaView própria, e não precisa. **Proposta: deixar fora da migração** (outro layout, outro público).

`AdminDashboardScreen`, `AlimentoFormScreen`, `AlimentosListScreen`, `ModeracaoScreen`, `NutricionistasScreen`, `UsuarioDetalheScreen`, `UsuariosScreen`, `AuditoriaScreen`, `ConteudoDetalheScreen`, `EditarLicaoScreen`, `EditarReceitaScreen`, `EditarTrilhaScreen`, `EditarTrocaScreen`, `FluxoConteudoScreen`, `GuiaCriacaoScreen`, `LicaoPreviewScreen`, `ReceitaPreviewScreen`, `ReceitasListaScreen`, `TrilhaPreviewScreen`, `NutricionistaDashboardScreen`, `ParticipanteDetalheScreen`, `ParticipantesScreen`, `AnalyticsScreen`, `ConfiguracoesScreen`, `DesafiosScreen`, `ExportarDadosScreen`, `JornadaAnalytics`, `PainelEmBreve`.

## Casos de aparelho (o que cada problema afeta)

| Caso | Risco principal hoje |
|---|---|
| Android, 3 botões (inset ≈ 48) | Todas as 🔴: rodapés e folhas com padding fixo < 48; botão "lição atual" da Trilha em cima da barra de abas. |
| Android, gestos (inset ≈ 16–24) | Quase tudo passa; padding fixo de 24–36 fica colado na barrinha de gesto. |
| iPhone com notch/Dynamic Island | Topo protegido nas telas com SAV; telas "sem SAV" do app usam insets.top na mão (ok). Home indicator (34) vs. paddings fixos de 24–32 nas folhas. |
| iPhone SE (667 pt de altura, sem inset embaixo) | Telas de celebração e onboarding com alturas grandes; conferir rolagem. |
| Android pequeno 360×640 dp | Mesmo do SE + barra de 3 botões: o pior caso. Teste prioritário. |
| Tablet Android | Portrait travado; cartões esticam até a largura toda (não quebra, mas fica largo). |
| Fonte do sistema em 130% | `ScreenHeader` tem `numberOfLines={2}` (ok); cabeçalhos próprios e selos podem cortar. Alturas fixas de botões (`height: 44/48/56`) cortam texto grande. |
| Teclado aberto | Android: `behavior` só no iOS em 7 lugares. Com edge-to-edge, conferir se a janela ainda redimensiona. |

## Plano proposto (Etapas 2 e 3), para aprovação

1. **`shared/theme/layout.ts`**: novos tokens com comentário: `cabecalhoAlturaMin` (56), `cabecalhoPaddingTopTela`, `alvoToqueMin` (44), `rodapeEspacoMin` (12), `rolagemFolgaFinal` (24), `folhaRaio`.
2. **`shared/ui/TelaBase`** (novo): fundo, SafeAreaView com edges certas, `cabecalho`, `rodape`, `rolavel`. Regra: com rodapé, o rodapé protege o bottom; sem rodapé, o conteúdo ganha `insets.bottom + folga`.
3. **`ScreenHeader`** (mesma API): altura mínima, `adjustsFontSizeToFit` com `minimumFontScale` legível, prop `escuro` (fundo escuro) e `direita` (já existe). `CabecalhoTela` do social passa a usar o ScreenHeader por dentro.
4. **`shared/ui/RodapeAcoes`** (novo): botões presos embaixo com `paddingBottom: Math.max(insets.bottom, rodapeEspacoMin)`, fundo e divisória do tema; mede a própria altura e informa a `TelaBase` para a rolagem ganhar o espaço.
5. **`shared/ui/FolhaBase`** (novo): Modal de folha presa embaixo (e variante centralizada) com `statusBarTranslucent` + `navigationBarTranslucent` e `insets.bottom` somado, no molde do `ChatBroxisSheet`.
6. **`StatusBar`**: `TelaBase` define o estilo (claro/escuro) por tela, resolvendo o Onboarding.
7. **Migração por módulo**, só layout, com `tsc` e `npm test` ao fim de cada um: primeiro as 🔴 (scanner, trilha, folhas de alimentação/atividade/social), depois auth → home → alimentação → trilha → social → perfil → o resto.
8. **Fora do escopo (proposta)**: painel da equipe; cabeçalhos especiais de propósito (HomeHeader, fluxos de teste/triagem com barra de progresso, telas de celebração) continuam próprios, só ganhando área segura correta.

### Decisões que preciso de você

- Painel da equipe fica de fora? (recomendo que sim)
- Teclado no Android: manter só `KeyboardAvoidingView` (sem dependência nova) e testar, ou avaliar `react-native-keyboard-controller` (dependência nativa nova, exige novo build)? Recomendo começar sem dependência.
- Fluxos com cabeçalho próprio de propósito (teste rápido, EBIA, lição, celebrações): manter próprios (recomendado) ou forçar o ScreenHeader?

---

## Decisões tomadas (25/11/2026)

- **Painel da equipe:** fica fora da migração.
- **Teclado no Android:** começamos só com o `KeyboardAvoidingView` do React Native, sem dependência nova. Testar no aparelho (ver "Próximas orientações").
- **Fluxos com cabeçalho próprio de propósito** (teste rápido, EBIA, lição, celebrações, HomeHeader, busca de atividade): mantêm o cabeçalho; só a área segura foi consertada.

## Etapa 2: componentes padrão (feito)

| Arquivo | O que é |
|---|---|
| `shared/theme/layout.ts` | Tokens novos, com comentário: `cabecalhoAlturaMin`, `cabecalhoTelaPadding*`, `cabecalhoTituloEscalaMin`, `alvoToqueMin`, `respiroAcimaDaBarra`, `rodapeEspacoMin`, `rodapePaddingTop`, `folgaFinalRolagem`, `folhaPaddingInferior`. |
| `shared/utils/areaSegura.ts` (+ teste) | `respiroInferior(inset, base)` = maior entre o respiro original da peça e `inset + 16`. Conta única para rodapés, folhas e botões flutuantes. |
| `shared/hooks/useRespiroInferior.ts` | O mesmo, já lendo `useSafeAreaInsets()`. |
| `shared/hooks/useBarraStatus.ts` | Cor dos ícones da barra de status por tela, só enquanto ela está em foco (um `<StatusBar>` numa tela de baixo da pilha continuaria valendo nas de cima). |
| `shared/ui/ScreenHeader.tsx` | Mesma API + altura mínima, título que encolhe até 80% com fonte grande, subtítulo em até 2 linhas, `escuro`, `rotuloVoltar`. Cores e medidas dos tokens. |
| `shared/ui/BackButton.tsx` | Aceita `rotulo` (ex.: "Fechar"). |
| `shared/ui/TelaBase.tsx` | Fundo, área segura (topo e laterais), barra de status, `cabecalho`, `rodape`, `rolavel`, `alturaSobreposta` (barra de abas). |
| `shared/ui/RodapeAcoes.tsx` | Botões presos embaixo, **no fluxo** (não absoluto): o conteúdo acima termina onde ele começa. `paddingBottom = max(insets.bottom, 16)`. |
| `shared/ui/FolhaBase.tsx` | Modal/folha padrão (`baixo` ou `centro`), sempre `statusBarTranslucent` + `navigationBarTranslucent`, com insets. Folhas antigas com animação própria seguem o mesmo padrão via `useRespiroInferior` + as duas props no Modal. |

## Etapa 3: migração (feito, só layout)

| Módulo | Arquivos | O que mudou |
|---|---|---|
| Scanner | `ResultadoScannerScreen`, `ScannerAlimentoScreen` | Resultado: `TelaBase` + `RodapeAcoes` (antes, rodapé absoluto atrás da barra). Câmera: rodapé com `useRespiroInferior(36)`, cabeçalho sem o `marginTop: 30` solto, ícones claros na barra de status. |
| Trilha | `TrilhaScreen`, `exercicios/ExercicioQuizContainer` | Botão "lição atual" e fim do caminho usam `useAlturaBarraAbas()` (antes 112/104 fixos). Botão de baixo da sessão de exercícios soma a barra do sistema. |
| Folhas (alimentação, água, atividade) | `GuiaAguaSheet`, `GuiaAlimentacaoSheet`, `GuiaCadastroAlimentoSheet`, `CarrinhoAlimentarSheet`, `ReceitaDetalheSheet`, `GuiaAtividadeSheet`, `CarrinhoAtividadesSheet` | Modal translúcido em cima e embaixo + `useRespiroInferior(base antiga)`. |
| Social | `DesafioDetalhe`, `DesafioGrupo`, `JardimDetalhe`, `Jardim`, `NovoDesafio`, `NovoJardim`, `ListaAmigos` + folhas `EnviarCartinhaSheet`, `EnviarReceitaSheet`, `PedidosAmizadeSheet`, `CartinhasCard`, `JuntosCard` | `ScreenHeader` direto (o atalho `CabecalhoTela` foi apagado); fim da rolagem e folhas somam a barra do sistema. |
| Início / Mais / Perfil | `ChatFab`, `QuickActionsMenu`, `MaisScreen`, `ProfileScreen`, `SequenciaScreen` | ChatFab e menu usam a mesma conta da barra de abas; no Perfil (sem abas) o ChatFab só respeita a barra do sistema (`comBarraAbas={false}`). Mais sem a constante própria de 130. Sequência com `ScreenHeader` (o X tinha 36 pt). |
| Auth | `OnboardingScreen`, `LoginProfissionalScreen` | Onboarding: ícones claros na barra de status. Login profissional: insets em cima e embaixo no celular. |
| Atividade | `BuscaAtividadeScreen` | "Cancelar" com alvo de 44 pt e rótulo; lista sem os 100 fixos. |
| Triagem | `EbiaPerguntaScreen` | Botão CONTINUAR soma a barra do sistema (antes 70 fixo). |

**Conferido e sem mudança:** `AniversarioModal`, `CelebracaoSequenciaModal`, `PerdaSequenciaOverlay` (o "absoluto embaixo" eram enfeites dentro do cartão, não rodapé); telas com `SafeAreaView` em todas as edges + `ScreenHeader` (já seguiam a regra).

**Não migrado de propósito:** as 44 telas "ok" não foram reescritas para `TelaBase` só por uniformidade (risco sem ganho visível). `TelaBase`, `RodapeAcoes` e `FolhaBase` são o padrão para telas novas e para quando uma tela "ok" for mexida.

## Próximas orientações (pendentes)

1. **Teclado no Android:** se no aparelho algum campo ficar atrás do teclado (Signup, Completar cadastro, Recordatório, Social, PesoAltura, Registro rápido de atividade, digitar código no Scanner), avaliar `react-native-keyboard-controller`. É nativa: `npx expo install react-native-keyboard-controller` e **novo development build**.
2. **Vídeo:** o app não tem biblioteca de vídeo hoje. Se as lições/conteúdos forem ter vídeo, usar `expo-video` (a recomendada no SDK 54; `expo-av` está descontinuado para vídeo). Também é nativa e exige **novo development build**. Junte com o item 1 para gerar um build só.
3. **Hipótese a confirmar:** Modal edge-to-edge no Android. Todas as folhas agora são translúcidas e somam o inset, então ficam certas nos dois casos; mas vale olhar uma folha com 3 botões.

## Teste manual em Android real (ordem sugerida)

1. **Android pequeno com 3 botões** (360×640 dp): Resultado do scanner (botão "Escanear outro produto"), Trilha (botão "Lição atual" acima da barra; rolar até o fim do caminho), uma folha de Guia (água ou alimentação) e o Carrinho de alimentos.
2. **Social:** Desafio em grupo, Jardim, Sua turma (último amigo visível) e as folhas de cartinha / receita / pedidos de amizade.
3. **Onboarding → Login:** ícones da barra de status claros no Onboarding e escuros no Login.
4. **Perfil:** botão do chat perto do canto, sem "flutuar alto".
5. **Teclado:** Signup e Recordatório com o teclado aberto.
6. **Gestos e iPhone com notch:** repetir 1 e 2 rapidamente.
7. **Fonte do sistema em 130%:** títulos longos no `ScreenHeader` (ex.: "Receitas com o que tenho").
