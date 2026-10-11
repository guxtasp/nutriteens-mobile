// Cartão grande dos hubs do módulo Comer, no mesmo estilo da tela "Alimentação"
// (Registre por foto / Pesquise): fundo escuro, tags, título em caixa alta, subtítulo e ilustração.
//  - ativo: verde-escuro com tags verdes   - inativo ("em breve"): cinza-azulado com tags brancas
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';

type Props = {
  tags: string[];
  titulo: string;
  subtitulo: string;
  icone: string;            // MaterialCommunityIcons
  ativo?: boolean;
  onPress?: () => void;
  onInfo?: () => void;
  atraso?: number;
};

export default function CartaoHub({ tags, titulo, subtitulo, icone, ativo = true, onPress, onInfo, atraso = 0 }: Props) {
  const corTag = ativo ? colors.primary : '#fff';
  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350, delay: atraso }}
    >
      <Pressable
        style={({ pressed }) => [styles.cartao, ativo ? styles.ativo : styles.inativo, pressed && ativo && styles.pressionado]}
        onPress={onPress}
        disabled={!ativo || !onPress}
        accessibilityRole="button"
        accessibilityLabel={titulo}
      >
        <View style={styles.textos}>
          <View style={styles.tagsLinha}>
            {tags.map((t) => (
              <View key={t} style={[styles.tag, { backgroundColor: corTag }]}>
                <AppText style={styles.tagTexto}>{t}</AppText>
              </View>
            ))}
          </View>
          <AppText style={styles.titulo}>{titulo}</AppText>
          <AppText style={styles.subtitulo}>{subtitulo}</AppText>
        </View>

        <View style={styles.ilustracao}>
          <MaterialCommunityIcons name={icone as any} size={46} color={ativo ? colors.primary : '#fff'} />
        </View>

        {!!onInfo && (
          <Pressable style={styles.info} onPress={onInfo} hitSlop={10} accessibilityLabel={`O que é ${titulo}`}>
            <Ionicons name="information-circle" size={22} color={ativo ? colors.primary : '#D9E2E8'} />
          </Pressable>
        )}
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  cartao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 20, padding: 20 },
  ativo: { backgroundColor: colors.primaryDark },
  inativo: { backgroundColor: '#2E3A45' },
  pressionado: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  textos: { flex: 1, paddingRight: 12 },
  tagsLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagTexto: { fontFamily: typography.bold, fontSize: 11, color: '#2E3A45' },
  titulo: { fontFamily: typography.bold, fontSize: 20, color: '#fff', marginBottom: 4, textTransform: 'uppercase' },
  subtitulo: { fontFamily: typography.regular, fontSize: 13, lineHeight: 18, color: '#D9E2E8' },
  ilustracao: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  info: { position: 'absolute', top: 7, right: 11 },
});
