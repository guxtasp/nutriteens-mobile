// src/shared/ui/ScreenHeader.tsx
//
// Cabeçalho único das telas: botão de voltar à esquerda, título (e subtítulo opcional)
// centralizados e um espaço do mesmo tamanho do botão à direita (ou uma ação). Mantém
// tamanho, margens e alinhamento iguais em todo o app; o recuo do topo (notch/status)
// continua vindo do SafeAreaView da própria tela.
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { BackButton } from './BackButton';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  titulo: string;
  subtitulo?: string;
  onVoltar: () => void;
  /** ação à direita (ícone pequeno); sem isso fica um espaço do tamanho do botão, para o título ficar centrado */
  direita?: React.ReactNode;
  /** largura dos dois lados (voltar e ação); aumente só se a ação da direita tiver 2 botões. Padrão 48 */
  larguraLateral?: number;
  style?: StyleProp<ViewStyle>;
};

export function ScreenHeader({ titulo, subtitulo, onVoltar, direita, larguraLateral = 48, style }: Props) {
  return (
    <View style={[styles.linha, style]}>
      <View style={[styles.lateral, { width: larguraLateral, alignItems: 'flex-start' }]}>
        <BackButton onPress={onVoltar} />
      </View>
      <View style={styles.centro}>
        <AppText style={styles.titulo} accessibilityRole="header" numberOfLines={2}>
          {titulo}
        </AppText>
        {!!subtitulo && <AppText style={styles.subtitulo}>{subtitulo}</AppText>}
      </View>
      <View style={[styles.lateral, { width: larguraLateral, alignItems: 'flex-end' }]}>{direita}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
  },
  centro: { flex: 1, alignItems: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark, textAlign: 'center' },
  subtitulo: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', textAlign: 'center', marginTop: 2 },
  lateral: { width: 48, alignItems: 'center', justifyContent: 'center' },
});
