// src/features/adolescente/home/utils/boasVindasStorage.ts
//
// "Já mostrei as boas-vindas pra esse usuário?" — guardado localmente (AsyncStorage), no
// mesmo espírito de aniversarioStorage.ts e celebracaoGate.ts: é só preferência de exibição.
import AsyncStorage from '@react-native-async-storage/async-storage';

function chave(usuarioId: string) {
  return `boas_vindas_vistas:${usuarioId}`;
}

export async function jaViuBoasVindas(usuarioId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(chave(usuarioId))) === '1';
  } catch (erro) {
    // erro de leitura não pode travar a mensagem pra sempre — melhor repetir do que nunca mostrar
    console.warn('Erro ao ler gate de boas-vindas:', erro);
    return false;
  }
}

export async function marcarBoasVindasVistas(usuarioId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(chave(usuarioId), '1');
  } catch (erro) {
    console.warn('Erro ao salvar gate de boas-vindas:', erro);
  }
}
