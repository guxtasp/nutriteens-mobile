// src/features/adolescente/screens/AlimentacaoHomeScreen.tsx
import React from 'react';
import { EmBreveTab } from '../../_shared/components/EmBreveTab';

export default function AlimentacaoHomeScreen() {
  return (
    <EmBreveTab
      activeTab="alimentacao"
      icone="restaurant-outline"
      titulo="Essa área está a caminho"
      subtitulo="Em breve você acompanha por aqui o que já registrou de refeições."
    />
  );
}
