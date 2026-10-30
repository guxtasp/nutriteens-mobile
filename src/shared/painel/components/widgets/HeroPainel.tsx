// src/shared/painel/components/widgets/HeroPainel.tsx
// Faixa de boas-vindas do dashboard: saudação, resumo do dia e atalhos.
// O fundo é sempre verde-escuro (marca), nos dois temas, então o texto é sempre claro.
import React from 'react';
import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../../ui/AppText';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import type { IconeNome } from '../../types';
import type { TemaPainel } from '../../tema/paletas';
import { useEstilos, useTemaPainel } from '../../tema/TemaPainelContext';

export type AtalhoHero = { rota: string; label: string; icone: IconeNome; destaque?: boolean };

type Props = {
  saudacao: string;
  papel: string;
  /** frase de resumo (ex.: "2 conteúdos aguardam aprovação · 14 adolescentes ativos") */
  resumo: string;
  atalhos: AtalhoHero[];
};

export function HeroPainel({ saudacao, papel, resumo, atalhos }: Props) {
  const navigation = useNavigation<any>();
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const gradiente: [string, string] = tema.nome === 'escuro' ? ['#16352A', '#0F2119'] : ['#155946', '#1F7A5C'];
  return (
    <LinearGradient colors={gradiente} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.topo}>
        <View style={styles.selo}>
          <Ionicons name="leaf" size={18} color={colors.primaryDark} />
        </View>
        <AppText style={styles.papel}>{papel}</AppText>
      </View>
      <AppText style={styles.saudacao}>{saudacao}!</AppText>
      <AppText style={styles.resumo}>{resumo}</AppText>
      <View style={styles.atalhos}>
        {atalhos.map((a) => (
          <Pressable
            key={a.rota}
            onPress={() => navigation.navigate(a.rota)}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            style={[styles.atalho, a.destaque && styles.atalhoDestaque]}
          >
            <Ionicons name={a.icone} size={16} color={a.destaque ? colors.primaryDark : colors.white} />
            <AppText style={[styles.atalhoTexto, a.destaque && { color: colors.primaryDark }]}>{a.label}</AppText>
          </Pressable>
        ))}
      </View>
    </LinearGradient>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  card: { borderRadius: t.cardRaio, padding: 18, gap: 6, borderWidth: 2, borderColor: t.nome === 'escuro' ? t.cardBorda : 'transparent', overflow: 'hidden' } as const,
  topo: { flexDirection: 'row', alignItems: 'center', gap: 8 } as const,
  selo: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' } as const,
  papel: { fontFamily: typography.medium, fontSize: 12, color: 'rgba(255,255,255,0.78)' } as const,
  saudacao: { fontFamily: typography.bold, fontSize: 24, color: colors.white, marginTop: 4 } as const,
  resumo: { fontFamily: typography.regular, fontSize: 13, color: 'rgba(255,255,255,0.86)', lineHeight: 19 } as const,
  atalhos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 } as const,
  atalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  } as const,
  atalhoDestaque: { backgroundColor: colors.primary, borderColor: colors.primary } as const,
  atalhoTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.white } as const,
});
