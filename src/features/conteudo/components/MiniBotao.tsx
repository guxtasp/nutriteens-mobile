// src/features/conteudo/components/MiniBotao.tsx
// Botão pequeno de ação (↑ ↓ ✕ EXCLUIR) para listas editáveis do painel. Área de toque >= 44 px.
import React from 'react';
import { Pressable } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';

export function MiniBotao({ label, onPress, desativado, perigo, acessibilidade }: { label: string; onPress: () => void; desativado?: boolean; perigo?: boolean; acessibilidade?: string }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <Pressable
      onPress={onPress}
      disabled={desativado}
      accessibilityRole="button"
      accessibilityLabel={acessibilidade ?? label}
      style={[styles.mini, perigo && styles.perigo, desativado && { opacity: 0.35 }]}
    >
      <AppText style={[styles.texto, perigo && { color: tema.erro }]}>{label}</AppText>
    </Pressable>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  mini: { minHeight: 44, minWidth: 44, paddingHorizontal: 12, borderRadius: 12, borderWidth: 2, borderColor: t.cardBorda, alignItems: 'center', justifyContent: 'center', backgroundColor: t.card },
  perigo: { borderColor: t.erro },
  texto: { fontFamily: typography.bold, fontSize: 12, color: t.texto },
}) as const;
