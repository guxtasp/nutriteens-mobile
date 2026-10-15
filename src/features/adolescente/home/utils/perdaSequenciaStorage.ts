// src/features/adolescente/home/utils/perdaSequenciaStorage.ts
//
// Guarda localmente (AsyncStorage, por usuário) a última sequência que o aluno viu.
// É só preferência de exibição de UI, no mesmo espírito de celebracaoGate.ts: não
// precisa sincronizar entre aparelhos nem ir pro banco.
import AsyncStorage from '@react-native-async-storage/async-storage';

function chave(usuarioId: string) {
  return `ultima_sequencia_vista:${usuarioId}`;
}

/** Última sequência vista, ou null se nunca foi guardada (ou se a leitura falhou). */
export async function lerUltimaSequenciaVista(usuarioId: string): Promise<number | null> {
  try {
    const valor = await AsyncStorage.getItem(chave(usuarioId));
    if (valor === null) return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
  } catch (erro) {
    // erro de leitura vira "sem registro": melhor não avisar perda do que avisar à toa
    console.warn('Erro ao ler última sequência vista:', erro);
    return null;
  }
}

export async function salvarUltimaSequenciaVista(usuarioId: string, sequencia: number): Promise<void> {
  try {
    await AsyncStorage.setItem(chave(usuarioId), String(sequencia));
  } catch (erro) {
    console.warn('Erro ao salvar última sequência vista:', erro);
  }
}