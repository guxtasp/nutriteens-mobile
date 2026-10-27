// Cartão "de jogo" para o hub Comer e para a tela Jogos: colorido, com gradiente,
// ícone que balança e botão JOGAR. Diferente do CartaoHub (sério/escuro) de propósito.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { typography } from '../../../../shared/theme/typography';
import { feedbackToque } from '../../../../shared/audio/feedback';

type Props = { titulo: string; subtitulo: string; icone?: string; atraso?: number; onPress: () => void; onInfo?: () => void };

export default function CartaoJogo({ titulo, subtitulo, icone = 'gamepad-variant', atraso = 0, onPress, onInfo }: Props) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350, delay: atraso }}
    >
      <Pressable
        onPress={() => { feedbackToque(); onPress(); }}
        accessibilityRole="button"
        accessibilityLabel={`${titulo}. ${subtitulo}`}
        style={({ pressed }) => [styles.raiz, pressed && { transform: [{ scale: 0.97 }] }]}
      >
        <LinearGradient colors={['#7C3AED', '#EC4899', '#F59E0B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cartao}>
          <View style={[styles.bolha, { top: -20, right: 40, width: 70, height: 70 }]} />
          <View style={[styles.bolha, { bottom: -25, left: 90, width: 56, height: 56 }]} />
          <View style={styles.textos}>
            <View style={styles.selo}><AppText style={styles.seloTexto}>JOGO</AppText></View>
            <AppText style={styles.titulo}>{titulo}</AppText>
            <AppText style={styles.subtitulo}>{subtitulo}</AppText>
            <View style={styles.jogar}>
              <MaterialCommunityIcons name="play" size={16} color="#7C3AED" />
              <AppText style={styles.jogarTexto}>JOGAR</AppText>
            </View>
          </View>
          <View style={styles.icone}>
            <MaterialCommunityIcons name={icone as any} size={52} color="#fff" />
          </View>
          {!!onInfo && (
            <Pressable style={styles.info} onPress={onInfo} hitSlop={10} accessibilityLabel={`O que é ${titulo}`}>
              <MaterialCommunityIcons name="information" size={22} color="#fff" />
            </Pressable>
          )}
        </LinearGradient>
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  raiz: { borderRadius: 24, shadowColor: '#7C3AED', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  cartao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 24, padding: 20, overflow: 'hidden' },
  bolha: { position: 'absolute', borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.18)' },
  textos: { flex: 1, paddingRight: 12 },
  selo: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 10 },
  seloTexto: { fontFamily: typography.bold, fontSize: 11, color: '#fff' },
  titulo: { fontFamily: typography.bold, fontSize: 21, color: '#fff', textTransform: 'uppercase', marginBottom: 2 },
  subtitulo: { fontFamily: typography.regular, fontSize: 13, lineHeight: 18, color: '#FFF3E0', marginBottom: 12 },
  jogar: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16 },
  jogarTexto: { fontFamily: typography.bold, fontSize: 12, color: '#7C3AED' },
  icone: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  info: { position: 'absolute', top: 8, right: 12 },
});
