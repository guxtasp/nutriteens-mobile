// src/features/adolescente/social/components/CartinhaArte.tsx
//
// Arte de uma cartinha: figurinha com gradiente suave, selo redondo com ícone e título. Sem emoji.
// Tamanho "pequena" cabe numa linha da caixa; "grande" é a opção do seletor de envio.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../../shared/ui/AppText';
import { typography } from '../../../../shared/theme/typography';
import type { DefinicaoCartinha } from '../utils/cartinhas';

type Props = { cartinha: DefinicaoCartinha; tamanho?: 'pequena' | 'grande'; marcada?: boolean };

export default function CartinhaArte({ cartinha, tamanho = 'grande', marcada = false }: Props) {
  const grande = tamanho === 'grande';
  return (
    <LinearGradient
      colors={cartinha.fundo}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[estilos.base, grande ? estilos.grande : estilos.pequena, marcada && { borderColor: cartinha.cor, borderWidth: 3 }]}
    >
      <View style={[estilos.selo, grande ? estilos.seloGrande : estilos.seloPequeno]}>
        <Ionicons name={cartinha.icone as any} size={grande ? 26 : 22} color={cartinha.cor} />
      </View>
      {grande && (
        <AppText style={[estilos.titulo, { color: cartinha.cor }]} numberOfLines={2}>
          {cartinha.titulo}
        </AppText>
      )}
      {marcada && (
        <View style={[estilos.check, { backgroundColor: cartinha.cor }]}>
          <Ionicons name="checkmark" size={14} color="#fff" />
        </View>
      )}
    </LinearGradient>
  );
}

const estilos = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)' },
  grande: { width: '100%', minHeight: 104, paddingVertical: 12, paddingHorizontal: 8, gap: 8 },
  pequena: { width: 56, height: 64 },
  selo: { backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  seloGrande: { width: 48, height: 48, borderRadius: 24 },
  seloPequeno: { width: 40, height: 40, borderRadius: 20 },
  titulo: { fontFamily: typography.bold, fontSize: 12, textAlign: 'center' },
  check: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
