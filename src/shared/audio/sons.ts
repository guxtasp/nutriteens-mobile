// src/shared/audio/sons.ts
//
// Efeitos sonoros do app. Uso:  tocarSom('acerto')
//
// - Nunca lança erro: se o áudio não estiver disponível, simplesmente não toca.
// - Respeita o botão de silencioso do iPhone e não corta a música do usuário.
// - Os arquivos são gerados por scripts/gerar-sons.py (ou troque por outros
//   com o mesmo nome em assets/sounds/).
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AudioPlayer } from 'expo-audio';

const FONTES = {
  toque: require('../../../assets/sounds/toque.wav'),
  acerto: require('../../../assets/sounds/acerto.wav'),
  erro: require('../../../assets/sounds/erro.wav'),
  virar: require('../../../assets/sounds/virar.wav'),
  par: require('../../../assets/sounds/par.wav'),
  pop: require('../../../assets/sounds/pop.wav'),
  gota: require('../../../assets/sounds/gota.wav'),
  registro: require('../../../assets/sounds/registro.wav'),
  conquista: require('../../../assets/sounds/conquista.wav'),
  fanfarra: require('../../../assets/sounds/fanfarra.wav'),
  fanfarraTrilha: require('../../../assets/sounds/fanfarraTrilha.wav'),
} as const;

export type NomeSom = keyof typeof FONTES;

const CHAVE_PREFERENCIA = '@nutriteens:som_ativo';
const VOLUME_GERAL = 0.9;

// carrega o módulo nativo de forma defensiva: se ele não existir no build
// instalado, o app continua funcionando, só sem som
type ModuloAudio = typeof import('expo-audio');
let Audio: ModuloAudio | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Audio = require('expo-audio');
} catch (e) {
  console.warn('[sons] expo-audio indisponível, o app seguirá sem sons:', e);
}

let somAtivo = true;
let modoConfigurado = false;
const players: Partial<Record<NomeSom, AudioPlayer>> = {};

function configurarModo() {
  if (modoConfigurado || !Audio) return;
  modoConfigurado = true;
  Promise.resolve(
    Audio.setAudioModeAsync({
      playsInSilentMode: false, // respeita o botão de silencioso
      interruptionMode: 'mixWithOthers', // não corta a música do usuário
    })
  ).catch((e) => console.warn('[sons] não foi possível configurar o modo de áudio:', e));
}

function obterPlayer(nome: NomeSom): AudioPlayer | null {
  if (!Audio) return null;
  let player = players[nome];
  if (!player) {
    player = Audio.createAudioPlayer(FONTES[nome]);
    player.volume = VOLUME_GERAL;
    players[nome] = player;
  }
  return player;
}

/** Cria todos os players de uma vez, pra o primeiro som não atrasar. */
export function precarregarSons(): void {
  try {
    configurarModo();
    (Object.keys(FONTES) as NomeSom[]).forEach(obterPlayer);
    AsyncStorage.getItem(CHAVE_PREFERENCIA)
      .then((valor) => {
        if (valor === '0') somAtivo = false;
      })
      .catch(() => {});
  } catch (e) {
    console.warn('[sons] falha ao pré-carregar:', e);
  }
}

/** Toca um efeito (reinicia do começo se já estiver tocando). */
export function tocarSom(nome: NomeSom): void {
  if (!somAtivo) return;
  try {
    configurarModo();
    const player = obterPlayer(nome);
    if (!player) return;
    if (__DEV__) console.log('[sons] tocando', nome);
    Promise.resolve(player.seekTo(0)).catch(() => {});
    player.play();
  } catch (e) {
    console.warn('[sons] som indisponível:', nome, e);
  }
}

export function somEstaAtivo(): boolean {
  return somAtivo;
}

/** Liga/desliga todos os sons e guarda a escolha. */
export async function definirSomAtivo(ativo: boolean): Promise<void> {
  somAtivo = ativo;
  try {
    await AsyncStorage.setItem(CHAVE_PREFERENCIA, ativo ? '1' : '0');
  } catch (e) {
    console.warn('[sons] não foi possível salvar a preferência:', e);
  }
}

/**
 * Toca um som de teste e devolve um relatório em texto (pro botão "Testar
 * som" da aba Mais). Toca mesmo com os sons desligados no app, só pra
 * diagnosticar.
 */
export async function diagnosticarSom(): Promise<string> {
  if (!Audio) {
    return (
      'O módulo de áudio (expo-audio) não está disponível neste app.\n\n' +
      'Se você usa uma build de desenvolvimento, gere uma nova build depois de instalar o pacote.'
    );
  }
  try {
    configurarModo();
    const player = obterPlayer('acerto');
    if (!player) return 'Não consegui criar o player de áudio.';

    await Promise.resolve(player.seekTo(0)).catch(() => {});
    player.play();
    await new Promise((resolve) => setTimeout(resolve, 250));

    const carregado = player.isLoaded;
    const tocando = player.playing;
    const dica = !carregado
      ? 'O arquivo de som não carregou.'
      : tocando
        ? 'O app está tocando o som. Se você não ouviu nada, confira o botão de silencioso do iPhone (lateral) e o volume.'
        : 'O arquivo carregou, mas o player não começou a tocar.';

    return (
      `Arquivo carregado: ${carregado ? 'sim' : 'não'}\n` +
      `Tocando agora: ${tocando ? 'sim' : 'não'}\n` +
      `Sons ligados no app: ${somAtivo ? 'sim' : 'não'}\n\n` +
      dica
    );
  } catch (e) {
    return `Erro ao tocar o som de teste:\n${String(e)}`;
  }
}

// pré-carrega quando o módulo é importado pela primeira vez (acontece no
// início do app, porque o navegador importa as telas que usam os sons)
precarregarSons();