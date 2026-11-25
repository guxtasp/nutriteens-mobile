// src/features/adolescente/_shared/components/ChatFab.tsx
//
// Botão flutuante do chat com o Bróxis. Abre a folha do chat, que por enquanto
// é só o design e avisa que está em desenvolvimento (ver ChatBroxisSheet).
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/theme/colors';
import ChatBroxisSheet from './ChatBroxisSheet';
import { useTourAlvo } from '../../tour/TourContext';
import { useAlturaBarraAbas } from './HomeBottomBar';
import { layout } from '../../../../shared/theme/layout';
import { respiroInferior } from '../../../../shared/utils/areaSegura';

// A HomeBottomBar é desenhada por cima de tudo (zIndex/elevation 10). O botão do chat fica acima
// dela, usando a MESMA conta da barra (useAlturaBarraAbas, que já soma a área segura). Em telas sem
// barra de abas (Perfil), passe comBarraAbas={false}: aí ele só respeita a barra do sistema.
type Props = { onPress?: () => void; comBarraAbas?: boolean };

export default function ChatFab({ onPress, comBarraAbas = true }: Props) {
  const [aberto, setAberto] = useState(false);
  const insets = useSafeAreaInsets();
  const alturaBarra = useAlturaBarraAbas();
  const refTour = useTourAlvo('chat');
  const bottom = comBarraAbas
    ? alturaBarra + layout.respiroAcimaDaBarra
    : respiroInferior(insets.bottom, layout.folgaFinalRolagem);

  function handlePress() {
    if (onPress) onPress();
    else setAberto(true);
  }

  return (
    <>
      {/* flutuação suave: chama atenção sem ficar "perdido" nem irritante */}
      <MotiView
        from={{ translateY: 0 }}
        animate={{ translateY: -4 }}
        transition={{ type: 'timing', duration: 1600, loop: true, repeatReverse: true }}
        style={[styles.posicao, { bottom }]}
        pointerEvents="box-none"
      >
        <Pressable
          ref={refTour}
          collapsable={false}
          style={({ pressed }) => [styles.botao, pressed && styles.botaoPressionado]}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel="Conversar com o Bróxis"
        >
          <Image
            source={require('../../../../../assets/img/feedback/supercontente.png')}
            style={styles.mascote}
            resizeMode="contain"
          />
          <View style={styles.balaozinho}>
            <Ionicons name="chatbubble-ellipses" size={12} color="#fff" />
          </View>
        </Pressable>
      </MotiView>

      <ChatBroxisSheet visivel={aberto} onFechar={() => setAberto(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  posicao: {
    position: 'absolute',
    right: 16,
    zIndex: 20, // por cima da barra inferior (zIndex 10)
    elevation: 20,
  },
  botao: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EAF6D9',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  botaoPressionado: { transform: [{ scale: 0.94 }] },
  mascote: { width: 44, height: 44 },
  balaozinho: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryDark,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
