// src/shared/painel/hooks/useSairDoPainel.ts
//
// Sair da conta no painel, sempre com confirmação (o menu confirmava, mas o botão de
// Configurações deslogava direto). O painel não usa a fila offline do adolescente,
// por isso não há registros pendentes a avisar (mensagemSairDaConta(0)).
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { confirmar } from '../../ui/dialogo';
import { mensagemSairDaConta } from '../../utils/confirmarSaida';

export function useSairDoPainel() {
  const { signOut } = useAuth();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    if (saindo) return;
    const ok = await confirmar('Sair da conta?', mensagemSairDaConta(0), { confirmar: 'Sair', destrutivo: true });
    if (!ok) return;
    setSaindo(true);
    try {
      await signOut();
    } catch {
      console.error('Erro ao sair do painel');
      setSaindo(false);
    }
  }

  return { sair, saindo };
}
