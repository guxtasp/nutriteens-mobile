export const colors = {
  // Marca
  primary: '#8BCF4A',       
  primaryDark: '#1B4332',  
  primaryShadow: '#5B8C1A',

  // Texto
  white: '#FFFFFF',
  textOnDarkMuted: '#D1D5DB',
  textOnLight: '#111827',
  placeholder: '#9AA5A0',

  // Superfícies
  background: '#155946',

  // Estados
  error: '#C0392B',
  info: '#3B82F6',
  success: '#10B981',

  trilhaCeu: '#6ACAF0', 
  trilhaTrilhoBloqueadoSombra: '#515151',
  trilhaTrilhoBloqueado: '#818280',

  // Trilha no estilo "caminho sobre fundo branco": nós bloqueados em cinza
  // claro e balão de ação ("COMEÇAR").
  // Exercícios da trilha (valores tirados dos prints do Figma)
  exercicioTexto: '#1B4332', // textos dos exercícios: verde-escuro do app, nunca preto
  exercicioBorda: '#8B8989', // borda, relevo e texto das opções ainda não escolhidas
  exercicioErro: '#FF4540', // opção errada, título/texto/botão do feedback de erro
  exercicioErroSuave: '#FFAAA8', // fundo do painel de erro e relevo da opção errada
  exercicioAcertoFundo: '#E2F3D3', // fundo do painel de acerto

  trilhaNoBloqueadoFace: '#E5E5E5',
  trilhaNoBloqueadoBorda: '#CFCFCF',
  trilhaNoBloqueadoIcone: '#AFAFAF',
  trilhaBalaoBorda: '#E5E5E5',
  trilhaChipTexto: '#4B4B4B', // texto da divisória "Módulo N"
  


  // Prática Real pendente (nó "em aberto" no caminho da trilha — ver
  // seção 5 do modelo-pedagogico-trilha.md). Âmbar pra diferenciar do
  // verde (concluída/atual normal) sem parecer erro (vermelho).
  warning: '#F5A623',
  warningShadow: '#B8770F',
  warningSoft: 'rgba(245, 166, 35, 0.16)',


  superficieSuave: '#F4F8F5', // fundo de blocos/cartões claros
  superficieSuave2: '#F0F5F1', // círculo de ícone, abas inativas, chips
  bordaSuave: '#D9E2E8', // borda de cartões e tiles
  bordaBalao: '#D9D9D9', // borda do SpeechBubble
  divisoriaSuave: '#E6EEE8', // divisória entre seções do documento legal
  divisoriaLista: '#EEF3EF', // divisória entre itens de lista em folha branca
  textoSuave: '#5A6B63', // texto secundário (5,6:1 no branco)
  textoCorrido: '#3D5A4D', // texto corrido de apoio em folhas brancas
  destaqueTexto: '#3F6B12', // texto/ícone verde sobre exercicioAcertoFundo (#E2F3D3)
  amareloSuave: '#FFF4CC', // fundo de dica, XP e trecho pendente (uso pontual)
  amareloTexto: '#8A5A00', // texto sobre amareloSuave (contraste AA)
  amareloMedio: '#FFEFB0', // círculo de ícone e marca de pendência sobre amareloSuave
  avisoRevisaoFundo: '#FFF4D6', // aviso "texto em revisão" dos documentos legais
  avisoRevisaoTexto: '#6B4E00', // texto do aviso acima
  sobreposicaoModal: 'rgba(10, 28, 39, 0.55)', // fundo escurecido atrás de folhas e modais
  primaryDarkShadow: '#123024', // relevo do AppButton escuro (primaryDark)
  amareloDestaque: '#FCCB28', // tag amarela pontual ("IDEIA DO DIA", XP) sobre o CartaoHub escuro
  pilhaCartaClara: '#DCF1C6', // carta de fundo do baralho de trocas (e selos sobre carta branca)
  pilhaCartaMedia: '#BFE59B', // segunda carta de fundo do baralho
  textoSobreClaro: '#3F5148', // texto corrido nos blocos claros das cartas
  erroSuave: '#FDECEA', // círculo de ícone do "Apagar meus dados" (com error por cima)
  errorShadow: '#8E2A20', // relevo do AppButton vermelho (error)
} as const;

export type ColorKey = keyof typeof colors;
