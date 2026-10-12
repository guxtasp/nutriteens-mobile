# Scanner de alimentos — decisões, riscos e pendências

Versão de teste / prova de conceito. Fases 0 a 5 concluídas.

## 1. O que afeta tudo (leia primeiro)

| # | Assunto | Por que importa | O que fazer |
|---|---------|-----------------|-------------|
| A | **Novo módulo nativo** (`expo-camera`) | Não roda no Expo Go nem no development build antigo. | Rodar `npx expo install expo-camera` (confirma a versão exata e atualiza o `package-lock.json`; coloquei `~17.0.10` no `package.json` sem poder rodar o npm) e **gerar um novo development build**. |
| B | **A migration reescreve a constraint `eventos_app_nome_check`** | Ela recria a lista inteira de eventos. Se alguma migration mais nova que `migration_trocas.sql` acrescentou outro nome, ele seria removido. | Conferir a constraint no banco antes de rodar. A lista que usei é idêntica à do `schema.sql` enviado. |
| C | **Escrita em `produtos_scanner` pelo app** | O pedido era "escrita só para nutricionista/admin", mas o app grava como adolescente (cache da OFF e cadastro de teste). | Resolvi com uma RPC `security definer` (ver D1). Se quiser a regra literal, o cache e o cadastro precisam virar Edge Function ou sair do escopo. |
| D | **Ordem de execução** | O app consulta `produtos_scanner` e chama a RPC. | Rodar `migration_scanner.sql` **depois** de `migration_trocas.sql` e `migration_trocas_painel.sql`, antes de testar. |

## 2. Decisões tomadas (edite as que discordar)

| # | Decisão | Alternativa |
|---|---------|-------------|
| D1 | Tabela com escrita direta só da equipe (`NUTRICIONISTA`/`ADMINISTRADOR`). O app grava pela RPC `scanner_salvar_produto`, que **só insere**, nunca sobrescreve, e só aceita fonte `OPEN_FOOD_FACTS` ou `USUARIO`. | Edge Function que consulta a OFF no servidor (mais seguro, mais trabalho). |
| D2 | `classificacao_nova` é `text` com `check` nos 4 valores. | Usar o enum do banco, se você me disser o nome (não aparece nos SQLs do repositório). |
| D3 | Categoria de troca aceita as 7 categorias de `alimento_trocas`. A inferência pela OFF só produz as 5 de pacote mais as bebidas; `LANCHE` e `REFEICAO` só vêm de cadastro. | Restringir a 5, como em `alimentos.categoria_troca`. |
| D4 | Pasta nova `src/features/adolescente/scanner/` (espelha `trocas/`). | Colocar dentro de `alimentacao/`. |
| D5 | A tela de resultado faz a busca (com carregando). A tela da câmera só lê e navega. | Buscar antes de navegar. |
| D6 | Código validado pelo dígito verificador GS1 antes de ir ao banco ou à rede. | Aceitar qualquer número de 8 a 14 dígitos. |
| D7 | Entrada manual do código ("Prefere digitar o código?"). Não estava no pedido; permite testar em emulador sem câmera. Pode sair antes de ir para produção. | Remover. |
| D8 | "Buscar por nome" leva ao fluxo `TipoRefeicao`, porque o `BuscaAlimento` exige tipo de refeição e registra refeição. | Criar uma busca avulsa só de consulta. |
| D9 | No cadastro, o adolescente escolhe o nível de processamento ("Não sei" é o padrão). Esse dado **não é revisado**. | Cadastro só com nome e marca, e a equipe classifica depois. |
| D10 | Ultraprocessado sem categoria de troca não mostra alternativas inventadas; mostra a explicação e um botão para as sugestões gerais. | Esconder o botão. |
| D11 | Sem classificação (OFF sem `nova_group`): texto neutro, sem conclusão. | Tratar como "não encontrado". |
| D12 | Evento `scanner_lido` com `resultado`, `codigo`, `fonte`, `nova` e `categoria` (só códigos curtos). | Registrar só `resultado`. |

## 3. Pontos que pedem revisão da nutricionista ou do time

- **Textos de processamento** (`ROTULO_PROCESSAMENTO` e `EXPLICACAO_PROCESSAMENTO` em `utils/scanner.ts`) e a frase positiva ("Esse produto combina com a sua rotina").
- **Texto do hub** (`AlimentacaoHomeScreen`): "veja se ele é uma boa escolha" soa como julgamento; sugiro algo como "veja o que ele tem de especial". Não alterei, porque é texto existente.
- **LGPD e menores:** cada leitura envia o código de barras à OFF (serviço de terceiros; o IP do aparelho fica exposto a eles). O código em si é um dado público de produto, mas vale registrar no documento de privacidade.

## 4. Riscos conhecidos

- **Dados da OFF são colaborativos:** nome ou `nova_group` podem estar errados ou ausentes.
- **Cache envenenável:** quem chama a RPC pode gravar dados errados para um código ainda inexistente. O primeiro registro prevalece; a equipe corrige direto na tabela.
- **Categorias da OFF:** as regras em `categoriaPorTags` são heurísticas. Não consegui testar com a API real (sem rede neste ambiente); confira na prática o Nescau (`7891000100103`) e a Coca-Cola (`7894900011517`).
- **Ambiente limpo:** o jest real e o `tsc --noEmit` do projeto inteiro **não foram rodados** (faltava `node_modules`). Os 12 testes de `utils/scanner.ts` passaram num mini-harness, e as telas foram revisadas à mão quanto a tipos.

## 5. O que ficou de fora

- Painel da equipe para revisar/aprovar produtos cadastrados (hoje, direto no Supabase).
- Leitura de outros formatos (QR, Code128) e de UPC-A explícito.
- Cache offline e histórico de produtos lidos.
- Foto do produto, quantidade e porção, calorias (não pertencem ao escopo).
- Testes automatizados do serviço e das telas.
- Web (a câmera foi pensada só para iOS/Android).

## 6. Como validar

1. `npx expo install expo-camera` e gerar o development build.
2. Rodar `migration_scanner.sql` no Supabase.
3. Publicar pelo menos uma troca de `REFRIGERANTE_BEBIDA` (ver `publicar_trocas_teste.sql`).
4. Testar:
   - `7894900011517` (Coca-Cola): deve vir ultraprocessado, com alternativas de bebidas.
   - `7891000100103` (Nescau): encontrado, categoria conforme as tags da OFF.
   - `7891910000197` (açúcar União): conferir o nível de processamento.
   - Um código inventado e válido (ex.: `7899999999999`, com dígito verificador válido): "não encontrado", depois "Cadastrar este produto".
5. Desligar a rede e escanear: deve cair em "Não achamos esse produto" com "Tentar de novo".
6. Negar a permissão da câmera e conferir os dois textos (pode pedir de novo / abrir configurações).
7. `npx tsc --noEmit` e `npm test`.

---

## 7. Atualização (iPhone + diagnóstico visual)

**Rodar de novo `migration_scanner.sql`** (idempotente): adiciona a coluna `detalhes` e troca a assinatura da RPC (a versão antiga é removida). Depois limpe o cache antigo, que não tem os dados do rótulo:

```sql
delete from public.produtos_scanner where fonte = 'OPEN_FOOD_FACTS';
```

| # | Decisão | Alternativa |
|---|---------|-------------|
| D13 | No iPhone (iOS 16+) o scanner usa o **leitor nativo do sistema** (`CameraView.launchScanner`, VisionKit), que abre sozinho. Se não existir ou falhar, cai no preview da câmera na tela. A API foi tipada à mão e **não pude testá-la num aparelho**. | Só preview (o que não funcionou). |
| D14 | Preview ganhou lanterna, `autofocus` explícito e dica de distância (15 a 20 cm). | — |
| D15 | Corrigi um defeito: as camadas de mensagem cobriam o botão de voltar. | — |
| D16 | Diagnóstico visual: termômetro de processamento (4 níveis), Raio-X do rótulo (açúcar, sal, gordura saturada em "pouco / médio / bastante", colheres de chá de açúcar, fonte de fibras/proteína), aditivos e os 3 primeiros ingredientes, mais foto da embalagem e etiquetas-resumo. **Sem calorias.** | Remover colheres de chá ou aditivos. |
| D17 | Faixas por 100 g seguem a referência FSA (açúcar 5/22,5 g; sal 0,3/1,5 g; gordura saturada 1,5/5 g). Barras em verde da marca, sem vermelho. **A nutricionista deve validar as faixas e os textos.** | Faixas da ANVISA (rotulagem frontal). |
| D18 | Produto só é guardado no cache se a OFF trouxe `nova_group` (o registro nunca é sobrescrito). | Permitir atualizar campos vazios na RPC. |
| D19 | A imagem da embalagem vem direto da OFF (terceiros, só `https`). | Não mostrar imagem. |

Limites: os dados do rótulo dependem do que a OFF tem para o produto; quando faltam, o cartão correspondente simplesmente não aparece. Produtos cadastrados à mão (`USUARIO`) mostram só o termômetro.
