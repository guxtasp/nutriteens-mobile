// src/features/adolescente/home/services/compartilharRetrospectiva.ts
//
// Compartilha a retrospectiva. Duas formas, a melhor disponível:
//  1) IMAGEM do cartão final (react-native-view-shot + expo-sharing), se esses dois pacotes
//     estiverem instalados no build — o cartão já parabeniza, resume e traz o nome do app;
//  2) TEXTO pelo compartilhamento do sistema (RN `Share`), que não precisa de nada novo.
// Os dois pacotes são carregados de forma defensiva (como o expo-audio em sons.ts): se não
// existirem, cai direto no texto. Nunca lança erro por falta de pacote.
import { Share } from 'react-native';

export type ResultadoCompartilhar = 'imagem' | 'texto' | 'cancelado' | 'erro';

type CapturarRef = (ref: unknown, opcoes: { format: 'png'; quality: number }) => Promise<string>;
type Sharing = { isAvailableAsync: () => Promise<boolean>; shareAsync: (uri: string, o?: { mimeType?: string; dialogTitle?: string }) => Promise<void> };

function carregarOpcionais(): { captureRef: CapturarRef; Sharing: Sharing } | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const viewShot = require('react-native-view-shot');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sharing = require('expo-sharing');
    if (typeof viewShot?.captureRef === 'function' && typeof sharing?.shareAsync === 'function') {
      return { captureRef: viewShot.captureRef, Sharing: sharing };
    }
  } catch {
    /* pacotes não instalados neste build: segue para o texto */
  }
  return null;
}

export async function compartilharRetrospectiva(params: { texto: string; cartaoRef?: unknown }): Promise<ResultadoCompartilhar> {
  const { texto, cartaoRef } = params;

  const opcionais = cartaoRef ? carregarOpcionais() : null;
  if (opcionais) {
    try {
      if (await opcionais.Sharing.isAvailableAsync()) {
        const uri = await opcionais.captureRef(cartaoRef, { format: 'png', quality: 1 });
        await opcionais.Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartilhar minha retrospectiva' });
        return 'imagem';
      }
    } catch (erro) {
      console.warn('Falha ao compartilhar imagem, usando texto:', erro);
    }
  }

  try {
    const r = await Share.share({ message: texto });
    return r.action === Share.dismissedAction ? 'cancelado' : 'texto';
  } catch (erro) {
    console.warn('Falha ao compartilhar texto:', erro);
    return 'erro';
  }
}
