import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { PROPORCAO_CARTA, alturaDaCarta, corDoPasso } from '../data/cartasArte';
import { rotuloPasso, type CartaGuia } from '../utils/cartas';
import { CartaArte } from './CartaArte';

type Props = { carta: CartaGuia | null; onFechar: () => void };

/**
 * Carta grande. Obtida: toque para virar (frente = a arte, que já é a carta completa;
 * verso = o que o Guia diz + dica). Bloqueada: uma face só, com "como ganhar".
 * Todas as faces têm a mesma proporção da arte.
 */
export function CartaDetalheModal({ carta, onFechar }: Props) {
  const { width, height } = useWindowDimensions();
  // cabe na tela (sobra espaço para a dica e o botão de fechar) mantendo a proporção da arte
  const larguraCarta = Math.round(Math.min(width - 56, 340, (height - 190) * PROPORCAO_CARTA));
  const alturaCarta = alturaDaCarta(larguraCarta);
  const raio = Math.round(larguraCarta * 0.09);

  const giro = useRef(new Animated.Value(0)).current;
  const [virada, setVirada] = useState(false);

  // cada carta que abre começa de frente
  useEffect(() => {
    giro.setValue(0);
    setVirada(false);
  }, [carta?.id, giro]);

  if (!carta) return null;

  const cor = corDoPasso(carta.passo);

  function virar() {
    Haptics.selectionAsync();
    Animated.timing(giro, {
      toValue: virada ? 0 : 1,
      duration: 380,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
    setVirada((v) => !v);
  }

  const rotacaoFrente = giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const rotacaoVerso = giro.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const tamanhoCarta = { width: larguraCarta, height: alturaCarta };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onFechar}>
      <View style={styles.raiz}>
        <Pressable style={styles.fundo} onPress={onFechar} accessibilityLabel="Fechar carta" />

        <View style={styles.centro} pointerEvents="box-none">
          {carta.obtida ? (
            // um Pressable só vira a carta; as duas faces não recebem toque (evita o verso "escondido" roubar o gesto)
            <Pressable
              onPress={virar}
              style={tamanhoCarta}
              accessibilityRole="button"
              accessibilityLabel={`${rotuloPasso(carta.passo)}: ${carta.titulo}. Toque para ${virada ? 'ver a frente' : 'ler o que o Guia diz'}.`}
            >
              <Animated.View
                pointerEvents="none"
                style={[styles.face, tamanhoCarta, { transform: [{ perspective: 1000 }, { rotateY: rotacaoFrente }] }]}
              >
                <CartaArte codigo={carta.codigo} passo={carta.passo} largura={larguraCarta} versao="cheia" />
              </Animated.View>

              <Animated.View
                pointerEvents="none"
                style={[
                  styles.face,
                  styles.cartaDesenhada,
                  tamanhoCarta,
                  { borderRadius: raio, borderColor: cor.borda, transform: [{ perspective: 1000 }, { rotateY: rotacaoVerso }] },
                ]}
              >
                <View style={[styles.faixa, { backgroundColor: cor.fundo }]}>
                  <AppText style={styles.passo}>{rotuloPasso(carta.passo).toUpperCase()}</AppText>
                  <AppText style={styles.tituloVerso}>{carta.titulo}</AppText>
                </View>
                <View style={styles.versoCorpo}>
                  <AppText style={styles.secao}>O QUE O GUIA DIZ</AppText>
                  <AppText style={styles.texto}>{carta.resumo}</AppText>
                  <View style={[styles.dicaCaixa, { backgroundColor: cor.fundo }]}>
                    <AppText style={styles.secao}>NA PRÁTICA</AppText>
                    <AppText style={styles.texto}>{carta.dica}</AppText>
                  </View>
                </View>
              </Animated.View>
            </Pressable>
          ) : (
            <View style={[styles.face, styles.cartaDesenhada, styles.faceBloqueada, tamanhoCarta, { borderRadius: raio }]}>
              <View style={[styles.faixa, { backgroundColor: colors.trilhaNoBloqueadoFace }]}>
                <AppText style={[styles.passo, { color: colors.placeholder }]}>{rotuloPasso(carta.passo).toUpperCase()}</AppText>
                <AppText style={[styles.tituloVerso, { color: colors.trilhaChipTexto }]}>{carta.titulo}</AppText>
              </View>
              <View style={styles.cadeadoArea}>
                <View style={styles.cadeadoCaixa}>
                  <Ionicons name="lock-closed" size={larguraCarta * 0.2} color={colors.trilhaNoBloqueadoIcone} />
                </View>
              </View>
              <View style={styles.comoGanharCaixa}>
                <AppText style={styles.secao}>COMO GANHAR</AppText>
                <AppText style={styles.texto}>{carta.comoGanhar}</AppText>
              </View>
            </View>
          )}

          {carta.obtida && (
            <View style={styles.dicaVirar}>
              <Ionicons name="sync-outline" size={14} color="#fff" />
              <AppText style={styles.dicaVirarTexto}>{virada ? 'Toque para voltar' : 'Toque para virar'}</AppText>
            </View>
          )}
        </View>

        <Pressable style={styles.fechar} onPress={onFechar} hitSlop={10} accessibilityRole="button" accessibilityLabel="Fechar">
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fundo: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  centro: { alignItems: 'center', justifyContent: 'center' },
  face: { position: 'absolute', backfaceVisibility: 'hidden' },
  // faces que o app desenha (verso e carta bloqueada); a frente é só a arte
  cartaDesenhada: { backgroundColor: '#fff', borderWidth: 4, overflow: 'hidden' },
  faceBloqueada: { position: 'relative', borderColor: colors.trilhaNoBloqueadoBorda, backgroundColor: '#F4F5F4' },
  faixa: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 2 },
  passo: { fontSize: 11, fontFamily: typography.bold, color: colors.primaryDark, letterSpacing: 1, textAlign: 'center' },
  tituloVerso: { fontSize: 18, fontFamily: typography.bold, color: colors.primaryDark, textAlign: 'center' },
  versoCorpo: { flex: 1, paddingHorizontal: 18, paddingTop: 14, gap: 8 },
  secao: { fontSize: 11, fontFamily: typography.bold, color: colors.primaryDark, letterSpacing: 0.6 },
  texto: { fontSize: 14, lineHeight: 21, fontFamily: typography.regular, color: colors.trilhaChipTexto },
  dicaCaixa: { marginTop: 6, borderRadius: 16, padding: 14, gap: 6 },
  cadeadoArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cadeadoCaixa: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.trilhaNoBloqueadoFace,
  },
  comoGanharCaixa: {
    alignSelf: 'stretch',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    backgroundColor: '#fff',
  },
  dicaVirar: {
    position: 'absolute',
    bottom: -34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dicaVirarTexto: { fontSize: 12, fontFamily: typography.semiBold, color: '#fff' },
  fechar: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
