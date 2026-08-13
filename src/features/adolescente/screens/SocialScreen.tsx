// src/features/adolescente/screens/SocialScreen.tsx
import React from 'react';
import { EmBreveTab } from '../components/EmBreveTab';

export default function SocialScreen() {
  return (
    <EmBreveTab
      activeTab="social"
      icone="people-outline"
      titulo="Em breve, mais gente por aqui"
      subtitulo="Essa área vai reunir desafios e conquistas com outros usuários."
    />
  );
}
