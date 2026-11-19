// src/features/admin/components/AbasCatalogo.tsx
// Abas do Catálogo (Administração e Nutricionista): Alimentos · Pratos · Receitas. Cada aba é
// uma tela já existente; a barra só leva de uma para outra e fica no topo das listas.
// A rota de Receitas muda por papel (AdminReceitas / NutriReceitas): vem de config.rotaReceitas.
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../shared/ui/AppText';
import { typography } from '../../../shared/theme/typography';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';
import { ALVO_TOQUE, fonte } from '../../../shared/painel/painelTheme';

export type AbaCatalogo = 'ALIMENTOS' | 'PRATOS' | 'RECEITAS';

const ABAS: { chave: AbaCatalogo; label: string; icone: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { chave: 'ALIMENTOS', label: 'Alimentos', icone: 'nutrition-outline' },
  { chave: 'PRATOS', label: 'Pratos', icone: 'restaurant-outline' },
  { chave: 'RECEITAS', label: 'Receitas', icone: 'book-outline' },
];


export function AbasCatalogo({
  ativa,
  onTrocar,
  contagens,
}: {
  ativa: AbaCatalogo;
  onTrocar: (a: AbaCatalogo) => void;
  contagens?: Partial<Record<AbaCatalogo, number>>;
}) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.trilho}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.abas} accessibilityRole="tablist">
        {ABAS.map((a) => {
          const on = a.chave === ativa;
          const n = contagens?.[a.chave];
          return (
            <Pressable
              key={a.chave}
              onPress={() => !on && onTrocar(a.chave)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={n !== undefined ? `${a.label}, ${n}` : a.label}
              style={[styles.aba, on && styles.abaAtiva]}
            >
              <Ionicons name={a.icone} size={16} color={on ? tema.destaqueTexto : tema.textoSuave} />
              <AppText style={[styles.texto, on && styles.textoAtivo]}>{a.label}</AppText>
              {n !== undefined && (
                <View style={[styles.contador, on && styles.contadorAtivo]}>
                  <AppText style={[styles.contadorTexto, on && styles.contadorTextoAtivo]}>{n}</AppText>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  trilho: { borderBottomWidth: 1, borderBottomColor: t.cardBorda },
  abas: { flexDirection: 'row', gap: 4 },
  aba: {
    flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: ALVO_TOQUE + 4, paddingHorizontal: 14,
    borderBottomWidth: 3, borderBottomColor: 'transparent', marginBottom: -1,
  },
  abaAtiva: { borderBottomColor: t.destaqueTexto },
  texto: { fontFamily: typography.semiBold, fontSize: fonte.corpo, color: t.textoSuave },
  textoAtivo: { fontFamily: typography.bold, color: t.texto },
  contador: { minWidth: 24, height: 20, paddingHorizontal: 6, borderRadius: 10, backgroundColor: t.superficieSuave, alignItems: 'center', justifyContent: 'center' },
  contadorAtivo: { backgroundColor: t.destaqueSuave },
  contadorTexto: { fontFamily: typography.bold, fontSize: fonte.selo, color: t.textoSuave },
  contadorTextoAtivo: { color: t.destaqueTexto },
}) as const;
