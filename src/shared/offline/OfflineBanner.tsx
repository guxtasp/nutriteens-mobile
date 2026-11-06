// src/shared/offline/OfflineBanner.tsx
// Fica FORA do stack navigator, mas dentro do SafeAreaProvider da raiz (App.tsx),
// então pode usar os insets reais do aparelho (status bar, recorte da câmera,
// ilha dinâmica) em iOS e Android, inclusive com edge-to-edge.
// Faixa discreta no topo quando há registros guardados no aparelho. Some sozinha
// quando tudo foi enviado. Tom neutro: sem culpa, só explica o que está acontecendo.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { typography } from '../theme/typography';
import { useOffline } from './OfflineContext';

export function textoDoAviso(pendentes: number, sincronizando: boolean): string {
  if (sincronizando) return 'Enviando seus registros…';
  const palavra = pendentes === 1 ? 'registro guardado' : 'registros guardados';
  return `${pendentes} ${palavra} no celular. Enviamos quando a internet voltar.`;
}

export default function OfflineBanner() {
  const { pendentes, sincronizando, sincronizarAgora } = useOffline();
  const insets = useSafeAreaInsets();

  if (pendentes === 0 && !sincronizando) return null;

  return (
    <View style={[styles.faixa, { paddingTop: insets.top }]} pointerEvents="box-none">
      <Pressable
        onPress={() => void sincronizarAgora()}
        accessibilityRole="button"
        accessibilityLabel={`${textoDoAviso(pendentes, sincronizando)} Toque para tentar enviar agora.`}
        style={styles.conteudo}
      >
        <Ionicons name={sincronizando ? 'sync' : 'cloud-offline-outline'} size={16} color="#7A4B00" />
        <AppText style={styles.texto}>{textoDoAviso(pendentes, sincronizando)}</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  faixa: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#FFF3CD',
  },
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  texto: { fontFamily: typography.medium, fontSize: 12, color: '#7A4B00', flexShrink: 1 },
});