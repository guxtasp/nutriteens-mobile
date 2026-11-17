// src/features/adolescente/home/utils/primeirosPassosStorage.ts
//
// "A pessoa dispensou o cartão de primeiros passos?" e "já comemorei que ela terminou?" —
// guardado no aparelho (AsyncStorage), no mesmo estilo de boasVindasStorage.ts: é só preferência
// de exibição, não precisa sincronizar entre aparelhos.
import AsyncStorage from '@react-native-async-storage/async-storage';

const chaveDispensado = (usuarioId: string) => `primeiros_passos_dispensado:${usuarioId}`;
const chaveConcluidoVisto = (usuarioId: string) => `primeiros_passos_concluido_visto:${usuarioId}`;

async function ler(chave: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(chave)) === '1';
  } catch (erro) {
    console.warn('Erro ao ler preferência dos primeiros passos:', erro);
    return false;
  }
}

async function gravar(chave: string): Promise<void> {
  try {
    await AsyncStorage.setItem(chave, '1');
  } catch (erro) {
    console.warn('Erro ao salvar preferência dos primeiros passos:', erro);
  }
}

export const jaDispensouPrimeirosPassos = (usuarioId: string) => ler(chaveDispensado(usuarioId));
export const dispensarPrimeirosPassos = (usuarioId: string) => gravar(chaveDispensado(usuarioId));

/** Depois de completar tudo o cartão mostra o "parabéns" uma vez e some. */
export const jaViuConclusaoPrimeirosPassos = (usuarioId: string) => ler(chaveConcluidoVisto(usuarioId));
export const marcarConclusaoPrimeirosPassosVista = (usuarioId: string) => gravar(chaveConcluidoVisto(usuarioId));
