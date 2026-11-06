// src/shared/offline/monitorConexao.ts
//
// Mantém o estado de conexão atualizado: sonda a cada 15 s com internet e a cada 4 s
// sem internet (volta rápido), e de novo sempre que o app volta para o primeiro plano.
import { AppState } from 'react-native';
import { estaOnline, verificarConexao } from './conexao';

const INTERVALO_ONLINE_MS = 15_000;
const INTERVALO_OFFLINE_MS = 4_000;

export function iniciarMonitorConexao(): () => void {
  let ativo = true;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const agendar = () => {
    if (!ativo) return;
    timer = setTimeout(async () => {
      if (AppState.currentState === 'active') await verificarConexao();
      agendar();
    }, estaOnline() ? INTERVALO_ONLINE_MS : INTERVALO_OFFLINE_MS);
  };

  void verificarConexao();
  agendar();

  const assinatura = AppState.addEventListener('change', (estado) => {
    if (estado === 'active') void verificarConexao();
  });

  return () => {
    ativo = false;
    if (timer) clearTimeout(timer);
    assinatura.remove();
  };
}
