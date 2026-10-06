// src/shared/painel/components/AjudaInfo.tsx
// Ícone "i" que abre uma explicação curta (mesmo InfoSheet usado no app do adolescente).
import React, { useState } from 'react';
import { InfoButton } from '../../ui/InfoButton';
import { InfoSheet } from '../../ui/InfoSheet';

type Props = { titulo: string; texto: string; exemplo?: string };

export function AjudaInfo({ titulo, texto, exemplo }: Props) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <InfoButton accessibilityRole="button" accessibilityLabel={`Ajuda: ${titulo}`} onPress={() => setAberto(true)} />
      <InfoSheet visivel={aberto} onFechar={() => setAberto(false)} titulo={titulo} explicacao={texto} exemplo={exemplo} />
    </>
  );
}
