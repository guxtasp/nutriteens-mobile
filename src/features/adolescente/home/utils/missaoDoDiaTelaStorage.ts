// src/features/adolescente/home/utils/missaoDoDiaTelaStorage.ts
//
// "Já mostrei a missão de hoje pra esse usuário?" — por usuário+dia, no aparelho (AsyncStorage),
// igual a celebracaoGate.ts: é só preferência de exibição.
import AsyncStorage from '@react-native-async-storage/async-storage';

function chave(usuarioId: string, dataISO: string) {
  return `missao_dia_tela:${usuarioId}:${dataISO}`;
}

export async function jaMostrouMissaoDoDia(usuarioId: string, dataISO: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(chave(usuarioId, dataISO))) === '1';
  } catch (erro) {
    // erro de leitura não pode esconder a tela pra sempre — melhor repetir do que nunca mostrar
    console.warn('Erro ao ler gate da missão do dia:', erro);
    return false;
  }
}

export async function marcarMissaoDoDiaMostrada(usuarioId: string, dataISO: string): Promise<void> {
  try {
    await AsyncStorage.setItem(chave(usuarioId, dataISO), '1');
  } catch (erro) {
    console.warn('Erro ao salvar gate da missão do dia:', erro);
  }
}
