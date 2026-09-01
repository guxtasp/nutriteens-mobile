// src/features/adolescente/home/utils/celebracaoGate.ts
//
// Controla "já mostrei a celebração de hoje pra esse usuário?" — guardado
// localmente (AsyncStorage) por usuário+data, não no banco: é só uma
// preferência de exibição de UI, não precisa sincronizar entre aparelhos e
// não vale a viagem de rede a cada abertura da Home.
import AsyncStorage from '@react-native-async-storage/async-storage';

function chave(usuarioId: string, dataISO: string) {
  return `celebracao_sequencia:${usuarioId}:${dataISO}`;
}

/** true se a celebração de `dataISO` já foi mostrada (ou marcada) pra esse usuário. */
export async function jaMostrouCelebracaoHoje(usuarioId: string, dataISO: string): Promise<boolean> {
  try {
    const valor = await AsyncStorage.getItem(chave(usuarioId, dataISO));
    return valor === '1';
  } catch (erro) {
    // erro de leitura não pode travar o modal pra sempre — melhor mostrar de
    // novo por engano do que nunca mais mostrar pro usuário
    console.warn('Erro ao ler gate de celebração:', erro);
    return false;
  }
}

/** Marca a celebração de `dataISO` como já mostrada. */
export async function marcarCelebracaoMostrada(usuarioId: string, dataISO: string): Promise<void> {
  try {
    await AsyncStorage.setItem(chave(usuarioId, dataISO), '1');
  } catch (erro) {
    console.warn('Erro ao salvar gate de celebração:', erro);
  }
}
