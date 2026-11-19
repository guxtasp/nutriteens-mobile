// src/shared/ui/IconeMissao.tsx
// Desenha o ícone de uma missão/desafio a partir do valor do campo `icone` (nome escolhido no
// painel ou emoji antigo, que é convertido). Ver iconesMissao.ts.
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { resolverIconeMissao, rotuloIconeMissao } from './iconesMissao';

export function IconeMissao({ valor, tamanho = 24, cor }: { valor: string | null | undefined; tamanho?: number; cor: string }) {
  const nome = resolverIconeMissao(valor);
  return <Ionicons name={nome as React.ComponentProps<typeof Ionicons>['name']} size={tamanho} color={cor} accessibilityLabel={rotuloIconeMissao(nome)} />;
}
