// src/shared/offline/OfflineBanner.tsx
// Fica FORA do stack navigator, onde não existe SafeAreaProvider (useSafeAreaInsets quebra aqui):
// por isso usa o SafeAreaView do próprio React Native (iOS) e a altura da status bar (Android).
// Faixa discreta no topo quando há registros guardados no aparelho. Some sozinha
// quando tudo foi enviado. Tom neutro: sem culpa, só explica o que está acontecendo.
import React from 'react';
import { Platform, Pressable, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
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

  if (pendentes === 0 && !sincronizando) return null;

  return (
    <SafeAreaView style={styles.faixa} pointerEvents="box-none">
      <Pressable
        onPress={() => void sincronizarAgora()}
        accessibilityRole="button"
        accessibilityLabel={`${textoDoAviso(pendentes, sincronizando)} Toque para tentar enviar agora.`}
        style={styles.conteudo}
      >
        <Ionicons name={sincronizando ? 'sync' : 'cloud-offline-outline'} size={16} color="#7A4B00" />
        <AppText style={styles.texto}>{textoDoAviso(pendentes, sincronizando)}</AppText>
      </Pressable>
    </SafeAreaView>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
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
