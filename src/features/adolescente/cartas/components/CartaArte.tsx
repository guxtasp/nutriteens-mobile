import React, { useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../shared/ui/AppText';
import { ARTE_CARTAS, alturaDaCarta, corDoPasso, emojiDaCarta } from '../data/cartasArte';

type Props = {
  codigo: string;
  passo: number;
  /** largura da carta; a altura segue a proporção das artes */
  largura: number;
  /**
   * 'mini' (padrão): miniatura leve, para a grade.
   * 'cheia': versão grande, para o modal. Enquanto ela carrega, a miniatura fica por baixo,
   * então nunca aparece um buraco em branco.
   */
  versao?: 'mini' | 'cheia';
};

/**
 * Arte da carta: o PNG já é a carta completa (moldura, número e título), então é só mostrá-lo.
 * Sem arte em ARTE_CARTAS -> placeholder (emoji sobre fundo colorido) na mesma proporção.
 */
export function CartaArte({ codigo, passo, largura, versao = 'mini' }: Props) {
  const arte = ARTE_CARTAS[codigo];
  const altura = alturaDaCarta(largura);
  const opacidadeCheia = useRef(new Animated.Value(0)).current;

  if (arte) {
    return (
      <View style={{ width: largura, height: altura }}>
        <Image source={arte.mini} style={styles.preencher} resizeMode="stretch" fadeDuration={0} />
        {versao === 'cheia' && (
          <Animated.Image
            source={arte.cheia}
            style={[styles.preencher, { opacity: opacidadeCheia }]}
            resizeMode="stretch"
            fadeDuration={0}
            onLoad={() =>
              Animated.timing(opacidadeCheia, { toValue: 1, duration: 180, useNativeDriver: true }).start()
            }
          />
        )}
      </View>
    );
  }

  const cor = corDoPasso(passo);
  return (
    <View
      style={[
        styles.placeholder,
        { width: largura, height: altura, borderRadius: largura * 0.1, backgroundColor: cor.fundo, borderColor: cor.borda },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <AppText style={{ fontSize: largura * 0.4 }}>{emojiDaCarta(codigo)}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  preencher: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderStyle: 'dashed' },
});
