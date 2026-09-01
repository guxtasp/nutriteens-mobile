// src/features/adolescente/screens/MaisScreen.tsx
import React from 'react';
import { EmBreveTab } from '../components/EmBreveTab';

export default function MaisScreen() {
  return (
    <EmBreveTab
      activeTab="mais"
      icone="menu-outline"
      titulo="Mais opções em breve"
      subtitulo="Configurações e outras funções vão aparecer por aqui."
    />
  );
}
