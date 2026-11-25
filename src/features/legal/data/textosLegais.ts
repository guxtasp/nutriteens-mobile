// src/features/legal/data/textosLegais.ts
//
// Texto dos Termos de Uso e da Política de Privacidade (RF004) — VERSÃO 2.0.
//
// ⚠️ MINUTA PARA REVISÃO. Reescrita em linguagem para adolescentes a partir do que o app faz hoje
// e dos documentos do projeto (protocolo CEP/UFV, CAAE 94172425.4.0000.5153). Precisa ser lida e
// aprovada pela orientadora/jurídico da UFV antes de valer. Trechos entre [COLCHETES] só a
// instituição pode preencher/confirmar.
//
// Ao aprovar: troque TEXTO_EM_REVISAO para false (some o aviso na tela). VERSAO_TERMOS já está em
// 2.0: quem aceitou a 1.0 vê o reaceite (ver HANDOFF_REBRAND.md, seção Termos).

export const VERSAO_TERMOS = '2.0';
export const TEXTO_EM_REVISAO = true;
export const ATUALIZADO_EM = '[DATA DA APROVAÇÃO]';

export type SecaoLegal = { titulo: string; paragrafos: string[] };
export type DocumentoLegal = { titulo: string; intro: string; secoes: SecaoLegal[] };
export type TipoDocumentoLegal = 'termos' | 'privacidade';

/** Um cartão do resumo "O nosso combinado em 1 minuto". `icone` é um nome do Ionicons. */
export type ItemResumo = { icone: string; titulo: string; texto: string };

export const TERMOS_DE_USO: DocumentoLegal = {
  titulo: 'Termos de Uso',
  intro:
    'As regras pra usar o NutriTeens, escritas de um jeito direto. Leia com calma; se tiver dúvida, pergunte pra gente ou pro seu responsável.',
  secoes: [
    {
      titulo: '1. O que é o NutriTeens',
      paragrafos: [
        'É um app educativo sobre alimentação, água e movimento, baseado no Guia Alimentar para a População Brasileira, feito pra adolescentes de 10 a 15 anos.',
        'Ele faz parte de uma pesquisa de Iniciação Científica (PIBIC/CNPq) do Departamento de Informática da Universidade Federal de Viçosa (UFV). Ainda é uma versão em teste: pode ter falhas e vai mudar com o tempo.',
      ],
    },
    {
      titulo: '2. Quem é responsável',
      paragrafos: [
        'A UFV, por meio da pesquisadora responsável, Profa. Maria Lúcia Bento Villela. A pesquisa foi aprovada pelo Comitê de Ética da UFV (CAAE 94172425.4.0000.5153).',
      ],
    },
    {
      titulo: '3. O app não substitui um profissional de saúde',
      paragrafos: [
        'Tudo aqui é educativo. O app não faz diagnóstico, não passa dieta e não mostra calorias, peso ou ranking.',
        'Se você tem alguma condição de saúde, alergia ou se sente mal com a comida ou com o seu corpo, converse com um médico, um nutricionista ou um adulto de confiança.',
      ],
    },
    {
      titulo: '4. Quem pode usar',
      paragrafos: [
        'Adolescentes que participam da pesquisa, com a autorização do responsável (TCLE) e com o seu próprio "sim" (Termo de Assentimento).',
        'Participar é voluntário. Você ou seu responsável podem desistir a qualquer momento, sem nenhum prejuízo na escola ou fora dela.',
      ],
    },
    {
      titulo: '5. Sua conta',
      paragrafos: [
        'Use dados verdadeiros e um e-mail seu. Guarde a senha e não compartilhe com ninguém. Se entrar com o Google, usamos só o nome e o e-mail dessa conta.',
        'Achou que alguém entrou na sua conta? Avise a gente pelo contato no fim deste texto.',
      ],
    },
    {
      titulo: '6. Combinados de convivência',
      paragrafos: [
        'Respeito sempre: não vale ofender, ameaçar, expor ninguém, mandar conteúdo impróprio ou fingir ser outra pessoa.',
        'Não tente burlar o app, como ganhar pontos sem fazer a atividade ou acessar dados de outra pessoa. Quem quebrar os combinados pode ter funções limitadas ou a conta suspensa.',
      ],
    },
    {
      titulo: '7. Pontos, cartas e desafios',
      paragrafos: [
        'XP, sequência, cartas e figurinhas servem pra motivar. Não valem dinheiro e não podem ser trocados por nada.',
        'Não existe ranking nem comparação com outras pessoas. Se algum desafio te deixar ansioso ou cobrando demais de si, pare e converse com alguém de confiança.',
      ],
    },
    {
      titulo: '8. Turma (amigos)',
      paragrafos: [
        'Usar a Turma é opcional. Só quem você aceitou vê o seu perfil de amigo, e só o que aparece nele.',
        'O que você compartilha, como receitas, é responsabilidade sua. Podemos tirar do ar o que quebrar estes combinados.',
      ],
    },
    {
      titulo: '9. Conteúdo do app',
      paragrafos: [
        'Lições, textos, imagens e o Bróxis foram feitos pela equipe do projeto, e os textos sobre alimentação passam por revisão de nutricionista. Você pode usar tudo dentro do app pra aprender, mas não pode copiar ou vender.',
      ],
    },
    {
      titulo: '10. Mudanças',
      paragrafos: [
        'Se estes termos mudarem de um jeito importante, a gente avisa no app e pede um novo aceite. A versão e a data ficam no topo.',
      ],
    },
    {
      titulo: '11. Sair e apagar a conta',
      paragrafos: [
        'Você pode parar de usar quando quiser e pedir pra apagar sua conta e seus dados pelo contato abaixo. Seu responsável também pode pedir.',
      ],
    },
    {
      titulo: '12. Contato',
      paragrafos: [
        'Profa. Maria Lúcia Bento Villela (pesquisadora responsável) · maria.villela@ufv.br · (31) 3612-6350 · Departamento de Informática, UFV, Viçosa-MG.',
        'Dúvida ou reclamação sobre a ética da pesquisa: CEP/UFV (Comitê de Ética em Pesquisa com Seres Humanos) · cep@ufv.br · (31) 3612-2316 · Edifício Arthur Bernardes, piso inferior, Campus UFV.',
      ],
    },
  ],
};

export const POLITICA_DE_PRIVACIDADE: DocumentoLegal = {
  titulo: 'Política de Privacidade',
  intro:
    'Quais dados o NutriTeens guarda, pra quê, quem vê e como você controla isso. Seguimos a Lei Geral de Proteção de Dados (LGPD) e as regras de ética em pesquisa.',
  secoes: [
    {
      titulo: '1. Quem cuida dos seus dados',
      paragrafos: [
        'A Universidade Federal de Viçosa (UFV) é a controladora dos dados, e a pesquisadora responsável é a Profa. Maria Lúcia Bento Villela.',
        'Encarregado de dados da UFV: [CONFIRMAR NOME E CONTATO DO ENCARREGADO/DPO DA UFV].',
      ],
    },
    {
      titulo: '2. Quais dados guardamos',
      paragrafos: [
        'Cadastro: nome, e-mail, data de nascimento, gênero e tipo de escola. Se você entrar com o Google, o nome e o e-mail dessa conta.',
        'Hábitos que você registra: refeições e alimentos, água, atividade física e o peso que você informa (usado só pra calcular sua meta de água, nunca mostrado como meta de peso).',
        'Perguntas iniciais: o que você comeu no dia anterior e respostas sobre a alimentação em casa, além do resultado que o app calcula. Esses são dados sensíveis e recebem cuidado extra.',
        'Uso do app: lições, XP, sequência, cartas e desafios. Os eventos de uso levam só códigos curtos, nunca seu nome, e-mail ou o que você escreveu.',
        'Turma: apelido, avatar, amizades e o que você escolher compartilhar.',
        'Câmera: só quando você abre o leitor de código de barras. Fotos de produtos que você enviar ficam guardadas no app.',
      ],
    },
    {
      titulo: '3. Pra que usamos',
      paragrafos: [
        'Pra o app funcionar, sugerir lições e ideias que combinem com você, calcular pontos, mostrar lembretes (agendados no seu próprio celular) e manter tudo seguro.',
        'Pra pesquisa: a equipe analisa os dados com códigos no lugar do seu nome. Nenhum resultado publicado identifica você.',
        'Nunca vendemos seus dados e nunca usamos pra propaganda.',
      ],
    },
    {
      titulo: '4. Por que podemos usar (base legal)',
      paragrafos: [
        'Consentimento do seu responsável e o seu assentimento, sempre no seu melhor interesse (art. 14 da LGPD). Para dados sensíveis, o consentimento é específico e destacado (art. 11).',
        '[CONFIRMAR COM O JURÍDICO DA UFV: uso também da base de estudo por órgão de pesquisa e regras para menores de 12 anos.]',
      ],
    },
    {
      titulo: '5. Quem vê seus dados',
      paragrafos: [
        'Você, sempre.',
        'A equipe da pesquisa (pesquisadores e nutricionista do projeto), só pra acompanhar o estudo: [CONFIRMAR O QUE CADA PERFIL VÊ NO PAINEL].',
        'Amigos aceitos veem só o perfil de amigo. Ninguém vê suas refeições, seu peso ou suas respostas iniciais.',
      ],
    },
    {
      titulo: '6. Serviços que o app usa',
      paragrafos: [
        'Supabase: hospeda o banco de dados, o login e as fotos. [CONFIRMAR REGIÃO DO SERVIDOR; se fora do Brasil, há transferência internacional de dados.]',
        'Google: só se você escolher entrar com o Google.',
        'Open Food Facts: quando você usa o leitor, o app envia o código de barras ou o nome do produto que você buscou. Nenhum dado seu vai junto.',
        'Podemos compartilhar dados se uma lei ou ordem judicial exigir.',
      ],
    },
    {
      titulo: '7. Por quanto tempo guardamos',
      paragrafos: [
        'Enquanto sua conta existir. Os dados da pesquisa ficam guardados com segurança por 5 anos depois do fim do estudo e depois são apagados, como manda o protocolo aprovado pelo Comitê de Ética.',
        'Se você pedir pra apagar, apagamos ou deixamos anônimo em até [PRAZO A DEFINIR], salvo o que a lei obrigar a manter.',
      ],
    },
    {
      titulo: '8. Seus direitos (e do seu responsável)',
      paragrafos: [
        'Saber se tratamos seus dados, ver, corrigir, pedir pra apagar ou deixar anônimo, saber com quem compartilhamos e retirar o consentimento quando quiser.',
        'É só falar com a pesquisadora responsável pelo contato abaixo. Respondemos em até [PRAZO, ex.: 15 dias].',
      ],
    },
    {
      titulo: '9. Segurança',
      paragrafos: [
        'Login protegido, conexão criptografada e regras no banco de dados que limitam quem acessa cada informação. Os pontos são conferidos pelo servidor.',
        'Nenhum sistema é 100% seguro. Se acontecer um incidente que possa te afetar, avisamos você, seu responsável e a ANPD.',
      ],
    },
    {
      titulo: '10. Mudanças nesta política',
      paragrafos: [
        'Se algo importante mudar, avisamos no app e pedimos um novo aceite. A versão e a data ficam no topo.',
      ],
    },
    {
      titulo: '11. Contato',
      paragrafos: [
        'Profa. Maria Lúcia Bento Villela (pesquisadora responsável) · maria.villela@ufv.br · (31) 3612-6350 · Departamento de Informática, UFV, Viçosa-MG.',
        'Ética da pesquisa: CEP/UFV (Comitê de Ética em Pesquisa com Seres Humanos) · cep@ufv.br · (31) 3612-2316 · Edifício Arthur Bernardes, piso inferior, Campus UFV.',
      ],
    },
  ],
};

// Folha de resumo (cadastro e reaceite). Tem que continuar fiel ao texto completo acima.
export const RESUMO_COMBINADO: ItemResumo[] = [
  { icone: 'eye-outline', titulo: 'O que a gente guarda', texto: 'Seu cadastro, o que você registra e as respostas das perguntas iniciais.' },
  { icone: 'people-outline', titulo: 'Quem vê', texto: 'Você e a equipe da pesquisa da UFV. Amigos só veem seu perfil de amigo.' },
  { icone: 'shield-checkmark-outline', titulo: 'O que nunca fazemos', texto: 'Vender seus dados, mostrar propaganda, contar calorias ou fazer ranking.' },
  { icone: 'trash-outline', titulo: 'Você manda', texto: 'Pode ver, corrigir ou pedir pra apagar seus dados. Seu responsável também.' },
  { icone: 'cloud-outline', titulo: 'Onde fica', texto: 'Em servidores protegidos. O leitor de código só envia o código do produto.' },
  { icone: 'information-circle-outline', titulo: 'É uma pesquisa', texto: 'Aprovada pelo Comitê de Ética da UFV. Dá pra desistir sem prejuízo.' },
];

// O que mudou em relação à versão anterior (aparece no modal de reaceite).
export const MUDANCAS_DA_VERSAO: string[] = [
  'Contatos da pesquisadora responsável e do Comitê de Ética da UFV',
  'Quais serviços o app usa e o que vai pra cada um',
  'Por quanto tempo os dados da pesquisa ficam guardados',
];

export const DOCUMENTOS_LEGAIS: Record<TipoDocumentoLegal, DocumentoLegal> = {
  termos: TERMOS_DE_USO,
  privacidade: POLITICA_DE_PRIVACIDADE,
};

/** Texto gravado em `consentimentos.conteudo` junto com o aceite. */
export const CONTEUDO_CONSENTIMENTO = `Termos de uso e política de privacidade versão ${VERSAO_TERMOS}`;
