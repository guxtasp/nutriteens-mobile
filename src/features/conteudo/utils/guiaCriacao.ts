// src/features/conteudo/utils/guiaCriacao.ts
// Conteúdo (puro) do guia "Como criar": o passo a passo visual para montar uma trilha, do zero
// até enviar para revisão. A tela (GuiaCriacao) só desenha estes dados.
import type { CategoriaBloco } from './blocos';

export type IlustracaoGuia = 'trilha' | 'modulos' | 'licoes' | 'blocos' | 'previa' | 'enviar';

export type PassoGuia = {
  id: string;
  titulo: string;
  resumo: string;
  /** o que fazer, em ordem */
  faca: string[];
  dica: string;
  ilustracao: IlustracaoGuia;
  /** cor do passo (a mesma cor dos blocos do editor) */
  cor: CategoriaBloco;
};

export const PASSOS_GUIA: PassoGuia[] = [
  {
    id: 'trilha',
    titulo: 'Crie a trilha',
    resumo: 'A trilha é o assunto inteiro, como uma "unidade" no Duolingo. Tudo começa por ela.',
    faca: [
      'No menu, abra Trilhas e toque em "Nova trilha".',
      'Escreva o título e escolha o tema.',
      'Defina a ordem: 1 aparece primeiro; a seguinte só abre quando a anterior termina.',
      'Toque em CRIAR TRILHA.',
    ],
    dica: 'A trilha nasce como rascunho. Os adolescentes só a veem depois de publicada.',
    ilustracao: 'trilha',
    cor: 'conteudo',
  },
  {
    id: 'modulos',
    titulo: 'Adicione módulos',
    resumo: 'Módulos são os capítulos da trilha. Cada um agrupa algumas lições.',
    faca: [
      'Em "Módulos e lições", escreva o nome do módulo.',
      'Toque em ADICIONAR MÓDULO.',
      'Use ↑ e ↓ para mudar a ordem dos módulos.',
    ],
    dica: 'Dois ou três módulos por trilha deixam o caminho leve de percorrer.',
    ilustracao: 'modulos',
    cor: 'pergunta',
  },
  {
    id: 'licoes',
    titulo: 'Adicione lições',
    resumo: 'Cada lição é um círculo no caminho do adolescente. Escolha o tipo dela.',
    faca: [
      '+ LEITURA: conteúdo para ler (e blocos, se quiser).',
      '+ QUIZ: perguntas e jogos com nota.',
      '+ PRÁTICA REAL: pede para registrar algo de verdade no app (água, refeição, atividade).',
      'Toque em uma lição da lista para editá-la.',
    ],
    dica: 'Uma boa sequência por módulo: Ponto de Partida, Aprendizado, Treino, Prática Real e Revisão.',
    ilustracao: 'licoes',
    cor: 'semNota',
  },
  {
    id: 'blocos',
    titulo: 'Monte a lição com blocos',
    resumo: 'Cada passo da lição é um bloco colorido, como no Scratch. É só empilhar.',
    faca: [
      'Na paleta "Blocos", toque no formato que quer: ele entra depois do bloco selecionado.',
      'Toque em um bloco para abrir e preencher.',
      'Use ↑ ↓ para mover, ⧉ para duplicar e ✕ para remover.',
    ],
    dica: 'Azul = conteúdo, verde = pergunta com nota, laranja = sem nota, roxo = jogo. Comece com um cartão azul e feche com uma pergunta verde.',
    ilustracao: 'blocos',
    cor: 'jogo',
  },
  {
    id: 'previa',
    titulo: 'Veja a prévia ao vivo',
    resumo: 'O celular ao lado mostra, na hora, como o adolescente vai ver o que você está digitando.',
    faca: [
      'Digite ou mude um bloco: a prévia acompanha sozinha.',
      'A prévia começa no bloco selecionado; você pode trocar para "Começa do início".',
      'Em tela estreita, use a aba "Prévia ao vivo".',
    ],
    dica: 'Teste também errando de propósito. E bloco incompleto aparece como cartão de aviso: é só terminar de preencher.',
    ilustracao: 'previa',
    cor: 'conteudo',
  },
  {
    id: 'enviar',
    titulo: 'Salve e envie para revisão',
    resumo: 'Depois de salvar, o conteúdo segue o fluxo de aprovação até ser publicado.',
    faca: [
      'Toque em SALVAR (ou CRIAR) em cada tela.',
      'Volte à página do conteúdo e envie para revisão (a nutricionista pode aprovar e publicar).',
      'Depois de publicada, a trilha entra no caminho dos adolescentes, em sequência.',
    ],
    dica: 'Mudar uma trilha já publicada conta como edição: ela pode voltar para rascunho até ser aprovada de novo.',
    ilustracao: 'enviar',
    cor: 'pergunta',
  },
];

/** Mantém o índice do passo dentro da lista (aceita lixo vindo de rota). */
export function passoValido(i: unknown, total: number = PASSOS_GUIA.length): number {
  const n = typeof i === 'number' && Number.isFinite(i) ? Math.trunc(i) : 0;
  return Math.max(0, Math.min(total - 1, n));
}
