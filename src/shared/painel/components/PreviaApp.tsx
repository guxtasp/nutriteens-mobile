// src/shared/painel/components/PreviaApp.tsx
//
// Moldura "Como vai ficar no app": mostra, ao lado de um cadastro, uma aproximação do cartão
// que o adolescente verá. O app do adolescente é sempre claro e usa as cores da marca, então o
// miolo NÃO segue o tema escuro do painel (só a moldura segue). É uma prévia ilustrativa: a tela
// real do app pode ter pequenas diferenças de espaçamento.
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';
import { fonte } from '../painelTheme';

export function PreviaApp({ titulo = 'Como vai ficar no app', nota, children }: { titulo?: string; nota?: string; children: React.ReactNode }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.moldura} accessibilityLabel={titulo}>
      <View style={styles.topo}>
        <Ionicons name="phone-portrait-outline" size={16} color={tema.destaqueTexto} />
        <AppText style={styles.titulo}>{titulo}</AppText>
        <View style={styles.aoVivo}>
          <View style={styles.ponto} />
          <AppText style={styles.aoVivoTexto}>ao vivo</AppText>
        </View>
      </View>
      <View style={styles.tela}>{children}</View>
      {!!nota && <AppText style={styles.nota}>{nota}</AppText>}
    </View>
  );
}

/** Peças do miolo, já com as cores do app do adolescente (sempre claras). */
export const corApp = {
  fundo: colors.white,
  cartao: colors.white,
  borda: colors.trilhaBalaoBorda,
  texto: colors.primaryDark,
  apoio: colors.trilhaChipTexto,
  destaque: colors.primary,
  destaqueSuave: colors.exercicioAcertoFundo,
} as const;

const criarEstilos = (t: TemaPainel) => ({
  moldura: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: t.borda, borderColor: t.cardBorda, padding: 14, gap: 10 } as const,
  topo: { flexDirection: 'row', alignItems: 'center', gap: 6 } as const,
  titulo: { flex: 1, fontFamily: typography.bold, fontSize: fonte.apoio, color: t.texto } as const,
  aoVivo: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: t.destaqueSuave } as const,
  ponto: { width: 6, height: 6, borderRadius: 3, backgroundColor: t.destaqueTexto } as const,
  aoVivoTexto: { fontFamily: typography.semiBold, fontSize: fonte.selo, color: t.destaqueTexto } as const,
  tela: { backgroundColor: corApp.fundo, borderRadius: 18, borderWidth: 3, borderColor: colors.primaryDark, padding: 14, gap: 10 } as const,
  nota: { fontFamily: typography.regular, fontSize: fonte.selo, color: t.textoSuave, lineHeight: 15 } as const,
});
