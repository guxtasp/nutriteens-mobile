// src/shared/hooks/useSairDaConta.ts
//
// Fluxo de sair da conta em um só lugar (botão do Perfil e linha do Mais): pede confirmação,
// avisa quantos registros offline ainda não foram enviados e só então desloga.
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOffline } from '../offline/OfflineContext';
import { confirmar } from '../ui/dialogo';
import { mensagemSairDaConta } from '../utils/confirmarSaida';

export function useSairDaConta() {
  const { signOut } = useAuth();
  const { pendentes } = useOffline();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    if (saindo) return;
    const ok = await confirmar('Sair da conta?', mensagemSairDaConta(pendentes), {
      confirmar: 'Sair',
      destrutivo: true,
    });
    if (!ok) return;
    setSaindo(true);
    try {
      await signOut();
      // RootNavigator detecta a sessão nula e troca a stack sozinho
    } catch (err) {
      console.error('Erro ao sair:', err);
      setSaindo(false);
    }
  }

  return { sair, saindo };
}
