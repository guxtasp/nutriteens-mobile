// src/features/adolescente/home/utils/aniversarioStorage.ts
//
// "Já celebrei o aniversário de {ano} pra esse usuário?" — guardado localmente
// (AsyncStorage), no mesmo espírito de celebracaoGate.ts: é só preferência de exibição.
// Quem trocar de aparelho pode ver a mensagem de novo, e isso é aceitável (ver o plano,
// ideia 8). Se um dia for pro banco, só este arquivo muda.
import AsyncStorage from '@react-native-async-storage/async-storage';

function chave(usuarioId: string, ano: number) {
  return `aniversario_celebrado:${usuarioId}:${ano}`;
}

/** true se o aniversário de `ano` já foi mostrado (ou marcado) pra esse usuário. */
export async function jaCelebrouAniversario(usuarioId: string, ano: number): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(chave(usuarioId, ano))) === '1';
  } catch (erro) {
    // erro de leitura não pode travar a mensagem pra sempre — melhor repetir do que nunca mostrar
    console.warn('Erro ao ler gate de aniversário:', erro);
    return false;
  }
}

export async function marcarAniversarioCelebrado(usuarioId: string, ano: number): Promise<void> {
  try {
    await AsyncStorage.setItem(chave(usuarioId, ano), '1');
  } catch (erro) {
    console.warn('Erro ao salvar gate de aniversário:', erro);
  }
}
