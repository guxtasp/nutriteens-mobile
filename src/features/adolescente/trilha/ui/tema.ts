// src/features/adolescente/trilha/ui/tema.ts
//
// Identidade visual da trilha: um caminho de pontinhos com nós em forma de "prato"
// (miolo + aro), faixa em verde-claro e fundo levemente esverdeado, para não parecer
// uma cópia do Duolingo. Só aparência: as cores de significado continuam as mesmas
// (verde escuro = concluída, verde claro = atual, cinza = bloqueada, âmbar = prática real).
// Para ajustar o visual da trilha toda, mexa aqui.
import { colors } from '../../../../shared/theme/colors';

export const TEMA_TRILHA = {
  fundoTela: '#F7FAF2',

  // faixa fixa do topo e cartão de nova trilha: verde bem claro com borda fina
  cartaoFundo: '#EAF5DC',
  cartaoBorda: '#CFE8B5',

  // nós: miolo (face) + aro, como a borda de um prato
  concluidaFace: colors.primaryDark,
  concluidaAro: '#CFE8B5',
  atualFace: colors.primary,
  atualAro: '#E2F3D3',
  pendenteFace: colors.warning,
  pendenteAro: '#FCE6BF',
  bloqueadoFace: colors.trilhaNoBloqueadoFace,
  bloqueadoAro: '#F3F3F3',

  // pontinhos entre os nós
  trilhoAtivo: colors.primary,
  trilhoInativo: '#DDE3DF',

  // balão em cima do nó atual
  balaoFundo: '#E2F3D3',
  balaoFundoPendente: '#FCE6BF',
} as const;
