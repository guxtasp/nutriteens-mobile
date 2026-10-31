// src/features/adolescente/social/components/JardimBotao.tsx
//
// Botões do Jardim: um só componente para todos os estilos (antes eram AppButton compacto + links cinza
// minúsculos, sem área de toque decente). Altura mínima 48, relevo embaixo que "afunda" ao tocar,
// ícone opcional e estado de carregamento. Funciona igual no celular e na web.
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';

export type VarianteJardimBotao = 'primario' | 'agua' | 'suave' | 'contorno' | 'perigo' | 'texto';

type Props = {
  label: string;
  onPress: () => void;
  variante?: VarianteJardimBotao;
  icone?: keyof typeof Ionicons.glyphMap;
  carregando?: boolean;
  desabilitado?: boolean;
  /** ocupa a largura toda (padrão); com false encolhe ao conteúdo */
  bloco?: boolean;
  /** 'pequeno' = 40 de altura, para dentro de listas */
  tamanho?: 'normal' | 'pequeno';
  acessibilidade?: string;
  style?: StyleProp<ViewStyle>;
};

const AZUL = '#4AA3F0';
const AZUL_SOMBRA = '#2F7FC4';

const PALETA: Record<VarianteJardimBotao, { fundo: string; borda: string; relevo: string; texto: string; relevoLargura: number }> = {
  primario: { fundo: colors.primary, borda: colors.primary, relevo: colors.primaryShadow, texto: colors.primaryDark, relevoLargura: 4 },
  agua: { fundo: AZUL, borda: AZUL, relevo: AZUL_SOMBRA, texto: colors.white, relevoLargura: 4 },
  suave: { fundo: '#EAF5DD', borda: '#EAF5DD', relevo: '#CFE6B6', texto: colors.primaryDark, relevoLargura: 4 },
  contorno: { fundo: colors.white, borda: '#DDE3DF', relevo: '#DDE3DF', texto: '#3F4F48', relevoLargura: 4 },
  perigo: { fundo: colors.white, borda: '#F1C9C4', relevo: '#F1C9C4', texto: colors.error, relevoLargura: 4 },
  texto: { fundo: 'transparent', borda: 'transparent', relevo: 'transparent', texto: '#5A6B64', relevoLargura: 0 },
};

export default function JardimBotao({
  label, onPress, variante = 'primario', icone, carregando = false, desabilitado = false, bloco = true,
  tamanho = 'normal', acessibilidade, style,
}: Props) {
  const p = PALETA[variante];
  const inativo = desabilitado || carregando;
  const altura = tamanho === 'pequeno' ? 40 : 50;

  return (
    <Pressable
      onPress={inativo ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={acessibilidade ?? label}
      accessibilityState={{ disabled: inativo, busy: carregando }}
      hitSlop={6}
      style={({ pressed }) => [
        estilos.base,
        {
          minHeight: altura,
          backgroundColor: p.fundo,
          borderColor: p.borda,
          borderBottomColor: p.relevo,
          borderBottomWidth: pressed && p.relevoLargura ? 2 : p.relevoLargura,
          borderWidth: variante === 'texto' ? 0 : 2,
          transform: [{ translateY: pressed && p.relevoLargura ? 2 : 0 }],
          opacity: inativo ? 0.55 : 1,
        },
        bloco ? estilos.bloco : estilos.ajustado,
        variante === 'texto' && { paddingHorizontal: 8 },
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator size="small" color={p.texto} />
      ) : (
        <View style={estilos.linha}>
          {!!icone && <Ionicons name={icone} size={tamanho === 'pequeno' ? 16 : 19} color={p.texto} />}
          <AppText style={[estilos.texto, { color: p.texto, fontSize: tamanho === 'pequeno' ? 13 : 14.5 }]}>{label}</AppText>
        </View>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: { borderRadius: 16, paddingHorizontal: 18, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  bloco: { alignSelf: 'stretch' },
  ajustado: { alignSelf: 'flex-start' },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  texto: { fontFamily: typography.bold, letterSpacing: 0.4, textAlign: 'center' },
});
