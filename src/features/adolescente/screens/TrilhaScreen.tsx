// src/features/adolescente/screens/TrilhaScreen.tsx
import React from 'react';
import { EmBreveTab } from '../components/EmBreveTab';

export default function TrilhaScreen() {
  return (
    <EmBreveTab
      activeTab="trilha"
      icone="book-outline"
      titulo="Sua trilha está a caminho"
      subtitulo="Em breve você acompanha aqui sua jornada de aprendizado."
    />
  );
}
