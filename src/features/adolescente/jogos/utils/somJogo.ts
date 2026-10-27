// Som dentro dos jogos: efeitos + música de fundo em loop, com botão de mudo próprio dos jogos
// (guardado no aparelho; não mexe na preferência geral de sons do app). Tudo é à prova de falha:
// sem áudio disponível, o jogo segue normalmente, só sem som.
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tocarSom, somEstaAtivo, precarregarSons, NomeSom } from '../../../../shared/audio/sons';

const CHAVE_MUDO = '@nutriteens:jogos_mudo';
const VOLUME_MUSICA = 0.22;

let mudo = false;
let carregado = false;
const ouvintes = new Set<(m: boolean) => void>();
let player: any = null;

async function carregarPreferencia() {
  if (carregado) return;
  carregado = true;
  try { mudo = (await AsyncStorage.getItem(CHAVE_MUDO)) === '1'; ouvintes.forEach((f) => f(mudo)); } catch { /* segue com som */ }
}

/** Toca um efeito, a menos que os jogos estejam no mudo. */
export function tocarSomJogo(nome: NomeSom): void {
  if (!mudo) tocarSom(nome);
}

export function iniciarMusicaJogo(): void {
  if (mudo || !somEstaAtivo()) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Audio = require('expo-audio');
    precarregarSons(); // configura o modo de áudio (mistura com a música do usuário)
    if (!player) {
      player = Audio.createAudioPlayer(require('../../../../../assets/sounds/musicaJogo.wav'));
      player.loop = true;
      player.volume = VOLUME_MUSICA;
    }
    player.play();
  } catch { /* sem música */ }
}

export function pararMusicaJogo(): void {
  try { player?.pause(); } catch { /* ignora */ }
}

/** [mudo, alternar]. Ao alternar, para ou retoma a música na hora. */
export function useMudoJogo(): [boolean, () => void] {
  const [m, setM] = useState(mudo);
  useEffect(() => {
    ouvintes.add(setM);
    carregarPreferencia();
    return () => { ouvintes.delete(setM); };
  }, []);
  const alternar = useCallback(() => {
    mudo = !mudo;
    ouvintes.forEach((f) => f(mudo));
    AsyncStorage.setItem(CHAVE_MUDO, mudo ? '1' : '0').catch(() => {});
    if (mudo) pararMusicaJogo();
  }, []);
  return [m, alternar];
}
