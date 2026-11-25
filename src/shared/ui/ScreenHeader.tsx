// src/shared/ui/ScreenHeader.tsx
//
// Cabeçalho único das telas: botão de voltar à esquerda, título (e subtítulo opcional)
// centralizados e um espaço do mesmo tamanho do botão à direita (ou uma ação). Mantém
// tamanho, margens e alinhamento iguais em todo o app; o recuo do topo (notch/status)
// continua vindo do SafeAreaView da própria tela (ou da TelaBase).
//
// Adaptação a celulares: altura mínima fixa (o título não "empurra" a linha em aparelhos
// diferentes), título em até 2 linhas que encolhe até `cabecalhoTituloEscalaMin` com fonte do
// sistema grande, e variante `escuro` para telas de fundo escuro.
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { BackButton } from './BackButton';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import { typography } from '../theme/typography';

type Props = {
  titulo: string;
  subtitulo?: string;
  onVoltar: () => void;
  /** ação à direita (ícone pequeno); sem isso fica um espaço do tamanho do botão, para o título ficar centrado */
  direita?: React.ReactNode;
  /** largura dos dois lados (voltar e ação); aumente só se a ação da direita tiver 2 botões. Padrão 48 */
  larguraLateral?: number;
  /** tela de fundo escuro: título e subtítulo claros */
  escuro?: boolean;
  /** rótulo do botão de voltar para leitor de tela (padrão "Voltar"; use "Fechar" em telas modais) */
  rotuloVoltar?: string;
  style?: StyleProp<ViewStyle>;
};

export function ScreenHeader({ titulo, subtitulo, onVoltar, direita, larguraLateral = 48, escuro, rotuloVoltar, style }: Props) {
  return (
    <View style={[styles.linha, style]}>
      <View style={[styles.lateral, { width: larguraLateral, alignItems: 'flex-start' }]}>
        <BackButton onPress={onVoltar} rotulo={rotuloVoltar} />
      </View>
      <View style={styles.centro}>
        <AppText
          style={[styles.titulo, escuro && styles.tituloEscuro]}
          accessibilityRole="header"
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={layout.cabecalhoTituloEscalaMin}
        >
          {titulo}
        </AppText>
        {!!subtitulo && (
          <AppText style={[styles.subtitulo, escuro && styles.subtituloEscuro]} numberOfLines={2}>
            {subtitulo}
          </AppText>
        )}
      </View>
      <View style={[styles.lateral, { width: larguraLateral, alignItems: 'flex-end' }]}>{direita}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.cabecalhoAlturaMin,
    paddingHorizontal: layout.cabecalhoTelaPaddingH,
    paddingTop: layout.cabecalhoTelaPaddingTop,
    paddingBottom: layout.cabecalhoTelaPaddingBottom,
    gap: 12,
  },
  centro: { flex: 1, alignItems: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark, textAlign: 'center' },
  tituloEscuro: { color: colors.white },
  subtitulo: { fontFamily: typography.regular, fontSize: 12, color: colors.textoSuave, textAlign: 'center', marginTop: 2 },
  subtituloEscuro: { color: colors.textOnDarkMuted },
  lateral: { width: 48, minHeight: layout.alvoToqueMin, alignItems: 'center', justifyContent: 'center' },
});
