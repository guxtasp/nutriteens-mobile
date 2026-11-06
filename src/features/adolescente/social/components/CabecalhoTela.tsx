// src/features/adolescente/social/components/CabecalhoTela.tsx
//
// Cabeçalho das telas da Turma (Desafio e Jardim). Agora é só um atalho para o `ScreenHeader`
// compartilhado, para que estas telas fiquem iguais às do resto do app.
import React from 'react';
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader';

type Props = { titulo: string; aoVoltar: () => void };

export default function CabecalhoTela({ titulo, aoVoltar }: Props) {
  return <ScreenHeader titulo={titulo} onVoltar={aoVoltar} />;
}
