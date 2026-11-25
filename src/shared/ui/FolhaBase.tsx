// src/shared/ui/FolhaBase.tsx
//
// Padrão único de Modal/folha. Por quê: com edge-to-edge no Android, o Modal também é desenhado
// por baixo da barra de navegação; folhas presas embaixo com padding fixo ficavam atrás da barra
// de 3 botões. Aqui o Modal é sempre translúcido em cima e embaixo (comportamento igual em todo
// aparelho) e o conteúdo respeita os insets:
//  - posicao 'baixo': folha presa embaixo, paddingBottom = respiroInferior(insets.bottom, ...);
//  - posicao 'centro': cartão centralizado, com margem dos insets em cima e embaixo.
// Folhas antigas com animação própria seguem o mesmo padrão com useRespiroInferior() e as props
// statusBarTranslucent + navigationBarTranslucent no Modal.
import React from 'react';
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import { respiroInferior } from '../utils/areaSegura';

type Props = {
  visivel: boolean;
  onFechar: () => void;
  children: React.ReactNode;
  posicao?: 'baixo' | 'centro';
  animationType?: 'slide' | 'fade' | 'none';
  /** tocar fora fecha (padrão true) */
  fecharAoTocarFora?: boolean;
  /** respiro de baixo em aparelhos sem barra (só na posição 'baixo') */
  respiroBase?: number;
  estiloFolha?: StyleProp<ViewStyle>;
};

export function FolhaBase({
  visivel,
  onFechar,
  children,
  posicao = 'baixo',
  animationType,
  fecharAoTocarFora = true,
  respiroBase = layout.folhaPaddingInferior,
  estiloFolha,
}: Props) {
  const insets = useSafeAreaInsets();
  const baixo = posicao === 'baixo';
  return (
    <Modal
      visible={visivel}
      transparent
      animationType={animationType ?? (baixo ? 'slide' : 'fade')}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onFechar}
    >
      <View
        style={[
          styles.fundo,
          baixo ? styles.fundoBaixo : [styles.fundoCentro, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }],
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={fecharAoTocarFora ? onFechar : undefined}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          accessible={fecharAoTocarFora}
        />
        <View
          style={[
            baixo ? styles.folhaBaixo : styles.folhaCentro,
            baixo && { paddingBottom: respiroInferior(insets.bottom, respiroBase), maxHeight: '92%' },
            estiloFolha,
          ]}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: colors.sobreposicaoModal },
  fundoBaixo: { justifyContent: 'flex-end' },
  fundoCentro: { justifyContent: 'center', paddingHorizontal: 24 },
  folhaBaixo: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  folhaCentro: { backgroundColor: colors.white, borderRadius: 24, padding: 24, maxHeight: '100%' },
});
