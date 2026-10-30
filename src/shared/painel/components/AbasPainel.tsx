// src/shared/painel/components/AbasPainel.tsx
// Abas de uma tela de detalhe (ex.: Visão geral / Avaliações / Registros). Rolam na horizontal
// no celular; alvo de toque >= 44px.
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { typography } from '../../theme/typography';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';

export type AbaPainel<T extends string = string> = { chave: T; label: string; icone?: React.ComponentProps<typeof Ionicons>['name'] };

type Props<T extends string> = { abas: AbaPainel<T>[]; ativa: T; onChange: (chave: T) => void };

export function AbasPainel<T extends string>({ abas, ativa, onChange }: Props<T>) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.trilho}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lista}>
        {abas.map((a) => {
          const on = a.chave === ativa;
          return (
            <Pressable
              key={a.chave}
              onPress={() => onChange(a.chave)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={[styles.aba, on && styles.abaAtiva]}
            >
              {!!a.icone && <Ionicons name={a.icone} size={16} color={on ? tema.chipAtivoTexto : tema.textoSuave} />}
              <AppText style={[styles.texto, on && styles.textoAtivo]}>{a.label}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  trilho: { backgroundColor: t.superficieSuave, borderRadius: 16, padding: 4 } as const,
  lista: { gap: 4 } as const,
  aba: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, paddingHorizontal: 16, borderRadius: 12 } as const,
  abaAtiva: { backgroundColor: t.chipAtivoFundo } as const,
  texto: { fontFamily: typography.bold, fontSize: 13, color: t.textoSuave } as const,
  textoAtivo: { color: t.chipAtivoTexto } as const,
});
