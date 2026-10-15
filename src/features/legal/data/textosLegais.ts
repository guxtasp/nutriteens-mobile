// src/features/legal/data/textosLegais.ts
//
// Texto dos Termos de Uso e da Política de Privacidade (RF004).
//
// ⚠️ MINUTA PARA REVISÃO. Escrita em linguagem para adolescentes a partir do que o app faz hoje
// (cadastro, registros de alimentação/água/atividade, triagem, gamificação, social, scanner).
// Precisa ser lida e aprovada pelo orientador/jurídico antes de valer. Os trechos entre
// [COLCHETES] são dados que só a instituição pode preencher/confirmar.
//
// Ao aprovar: troque TEXTO_EM_REVISAO para false (some o aviso na tela) e, se o texto mudar de
// forma relevante, suba VERSAO_TERMOS — é ela que fica gravada em `consentimentos.versao_termo`.

export const VERSAO_TERMOS = '1.0';
export const TEXTO_EM_REVISAO = true;
export const ATUALIZADO_EM = '[DATA DA VERSÃO]';

export type SecaoLegal = { titulo: string; paragrafos: string[] };
export type DocumentoLegal = { titulo: string; intro: string; secoes: SecaoLegal[] };
export type TipoDocumentoLegal = 'termos' | 'privacidade';

export const TERMOS_DE_USO: DocumentoLegal = {
  titulo: 'Termos de Uso',
  intro:
    'Estas são as regras para usar o NutriTeens. Escrevemos de um jeito simples para você entender tudo antes de aceitar.',
  secoes: [
    {
      titulo: '1. O que é o NutriTeens',
      paragrafos: [
        'O NutriTeens é um aplicativo de educação alimentar e hábitos saudáveis para adolescentes. Ele tem trilhas de lições, missões, registro de refeições, água e atividade física, e um espaço para conversar com amigos.',
        'O app é desenvolvido por [NOME DA INSTITUIÇÃO / PROJETO], com orientação de [NOME DO ORIENTADOR / NUTRICIONISTA RESPONSÁVEL].',
      ],
    },
    {
      titulo: '2. O app não substitui um profissional de saúde',
      paragrafos: [
        'As informações do app são educativas. Elas não são diagnóstico, tratamento nem prescrição de dieta.',
        'Se você tem alguma condição de saúde, alergia, está em tratamento ou se sente mal com a comida ou com o seu corpo, converse com um médico ou nutricionista. Você também pode falar com um adulto de confiança.',
      ],
    },
    {
      titulo: '3. Sua conta',
      paragrafos: [
        'Para criar a conta, você informa dados verdadeiros e usa um e-mail que seja seu. Guarde sua senha e não a compartilhe.',
        '[CONFIRMAR COM O JURÍDICO: idade mínima e necessidade de autorização do responsável — ver RF003.]',
        'Se achar que alguém entrou na sua conta, avise a gente pelo contato no fim deste texto.',
      ],
    },
    {
      titulo: '4. Como esperamos que você use o app',
      paragrafos: [
        'Use o app com respeito. Não vale ofender, ameaçar, expor outras pessoas, enviar conteúdo impróprio ou fingir ser outra pessoa.',
        'Não tente burlar o sistema: por exemplo, ganhar pontos sem cumprir a atividade, mexer no app de forma indevida ou acessar dados de outras pessoas.',
        'Quem desrespeitar as regras pode ter recursos limitados ou a conta suspensa.',
      ],
    },
    {
      titulo: '5. Pontos, insígnias e missões',
      paragrafos: [
        'XP, sequência, cartas e insígnias servem para motivar você. Eles não têm valor em dinheiro e não podem ser trocados.',
        'Os pontos são registrados e conferidos pelo servidor do app. Podemos corrigir pontos ganhos por erro ou por uso indevido.',
        'A meta é cuidar de você, não competir ou se cobrar demais. Se as metas estiverem causando ansiedade, pare e converse com alguém de confiança.',
      ],
    },
    {
      titulo: '6. Amigos e conteúdo que você compartilha',
      paragrafos: [
        'Você escolhe se quer usar as funções sociais. Só vê suas informações quem você aceitou como amigo e apenas o que o app mostra no perfil de amigo.',
        'O que você compartilha (como receitas) continua sendo responsabilidade sua. Podemos remover conteúdo que quebre estas regras.',
      ],
    },
    {
      titulo: '7. Conteúdo do app',
      paragrafos: [
        'Textos, lições, imagens, o mascote Broxis e o design do app pertencem a [NOME DA INSTITUIÇÃO] ou a seus autores. Você pode usá-los dentro do app, para seu aprendizado, mas não pode copiar ou vender.',
      ],
    },
    {
      titulo: '8. Mudanças e disponibilidade',
      paragrafos: [
        'O app pode ter falhas, ficar fora do ar para manutenção ou mudar com o tempo. Se estes termos mudarem de forma importante, vamos avisar e pedir um novo aceite.',
      ],
    },
    {
      titulo: '9. Encerrar sua conta',
      paragrafos: [
        'Você pode parar de usar o app quando quiser e pedir a exclusão da conta e dos seus dados pelo contato abaixo.',
      ],
    },
    {
      titulo: '10. Contato',
      paragrafos: ['Dúvidas ou pedidos: [E-MAIL DE CONTATO DO PROJETO].'],
    },
  ],
};

export const POLITICA_DE_PRIVACIDADE: DocumentoLegal = {
  titulo: 'Política de Privacidade',
  intro:
    'Aqui explicamos quais dados do NutriTeens guardamos, para quê, com quem aparecem e como você controla isso. Seguimos a Lei Geral de Proteção de Dados (LGPD).',
  secoes: [
    {
      titulo: '1. Quem cuida dos seus dados',
      paragrafos: [
        'O controlador dos dados é [NOME DA INSTITUIÇÃO / CNPJ].',
        'Encarregado (pessoa para falar sobre seus dados): [NOME E E-MAIL DO ENCARREGADO].',
      ],
    },
    {
      titulo: '2. Quais dados coletamos',
      paragrafos: [
        'Dados do cadastro: nome, e-mail, data de nascimento, gênero, tipo de escola e, se você entrar com o Google, o nome e e-mail dessa conta.',
        'Dados de saúde e hábitos que você informa: peso, altura, refeições e alimentos registrados, água, atividade física, respostas das perguntas de triagem sobre alimentação e a classificação que o app calcula a partir delas. São dados sensíveis, e tratamos com cuidado extra.',
        'Dados de uso: lições concluídas, pontos (XP), sequência de dias, missões, cartas e insígnias, além de eventos de uso do app para entendermos quais partes funcionam.',
        'Dados sociais: seu apelido, avatar, amizades e o que você escolher compartilhar com amigos.',
        'Dados do aparelho: informações técnicas necessárias para o app funcionar e para enviar lembretes, se você permitir notificações. A câmera só é usada no leitor de código de barras, quando você abre essa função.',
      ],
    },
    {
      titulo: '3. Para que usamos',
      paragrafos: [
        'Para criar e manter sua conta; mostrar lições e metas adequadas a você; calcular pontos e evolução; permitir recursos com amigos; enviar lembretes que você ativou; manter o app seguro; e melhorar o app.',
        'Nutricionistas e a equipe responsável podem ver informações dos participantes para acompanhar o projeto: [DESCREVER O QUE O NUTRICIONISTA E O ADMINISTRADOR PODEM VER — CONFIRMAR].',
        '[CONFIRMAR: uso de dados de forma anônima/agregada em pesquisa e o que é necessário para isso.]',
      ],
    },
    {
      titulo: '4. Por que podemos usar (base legal)',
      paragrafos: [
        '[DEFINIR COM O JURÍDICO: base legal para dados de adolescentes e dados de saúde — consentimento (seu e, quando exigido, do responsável) e outras bases aplicáveis. Ver RF003.]',
      ],
    },
    {
      titulo: '5. Com quem compartilhamos',
      paragrafos: [
        'Seus amigos aceitos veem só o que o perfil de amigo mostra.',
        'Usamos serviços de tecnologia para o app funcionar (como hospedagem e banco de dados, login com Google e envio de notificações): [LISTAR OS FORNECEDORES E PAÍSES DOS SERVIDORES].',
        '[CONFIRMAR: o NutriTeens não vende seus dados nem os usa para publicidade.]',
        'Podemos compartilhar dados se uma lei ou ordem judicial exigir.',
      ],
    },
    {
      titulo: '6. Por quanto tempo guardamos',
      paragrafos: [
        'Guardamos seus dados enquanto sua conta existir. Se você pedir exclusão, apagamos ou anonimizamos, salvo o que a lei obrigar a manter: [PRAZOS A DEFINIR].',
      ],
    },
    {
      titulo: '7. Seus direitos',
      paragrafos: [
        'Você pode pedir: confirmação de que tratamos seus dados, acesso a eles, correção, anonimização ou exclusão, informação sobre com quem compartilhamos, e retirar seu consentimento quando quiser.',
        'Para isso, fale com o encarregado pelo contato da seção 1. Respondemos em até [PRAZO].',
      ],
    },
    {
      titulo: '8. Segurança',
      paragrafos: [
        'Usamos medidas técnicas para proteger seus dados, como login protegido, controle de quem acessa cada informação e conferência dos pontos pelo servidor. Nenhum sistema é 100% seguro; se houver um incidente que possa afetar você, vamos avisar.',
      ],
    },
    {
      titulo: '9. Adolescentes e responsáveis',
      paragrafos: [
        'O NutriTeens é feito para adolescentes e tratamos seus dados sempre pensando no seu melhor interesse. Seus responsáveis podem entrar em contato conosco sobre os seus dados: [DEFINIR PROCEDIMENTO — ver RF003].',
      ],
    },
    {
      titulo: '10. Mudanças nesta política',
      paragrafos: [
        'Se mudarmos algo importante, avisamos no app e pedimos um novo aceite quando necessário. A versão e a data ficam no topo deste texto.',
      ],
    },
  ],
};

export const DOCUMENTOS_LEGAIS: Record<TipoDocumentoLegal, DocumentoLegal> = {
  termos: TERMOS_DE_USO,
  privacidade: POLITICA_DE_PRIVACIDADE,
};

/** Texto gravado em `consentimentos.conteudo` junto com o aceite. */
export const CONTEUDO_CONSENTIMENTO = `Termos de uso e política de privacidade versão ${VERSAO_TERMOS}`;
