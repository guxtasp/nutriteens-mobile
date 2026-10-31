// src/features/admin/components/AbasCatalogo.tsx
// Abas do Catálogo do Admin: Alimentos · Pratos · Receitas. Cada aba é uma tela já existente;
// a barra só leva de uma para outra e fica no topo das duas listas.
import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { typography } from '../../../shared/theme/typography';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos } from '../../../shared/painel/tema/TemaPainelContext';

export type AbaCatalogo = 'ALIMENTOS' | 'PRATOS' | 'RECEITAS';

const ABAS: { chave: AbaCatalogo; label: string }[] = [
  { chave: 'ALIMENTOS', label: 'Alimentos' },
  { chave: 'PRATOS', label: 'Pratos' },
  { chave: 'RECEITAS', label: 'Receitas' },
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
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.abas} accessibilityRole="tablist">
      {ABAS.map((a) => {
        const on = a.chave === ativa;
        const n = contagens?.[a.chave];
        return (
          <Pressable
            key={a.chave}
            onPress={() => !on && onTrocar(a.chave)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.aba, on && styles.abaAtiva]}
          >
            <AppText style={[styles.texto, on && styles.textoAtivo]}>
              {a.label}{n !== undefined ? ` (${n})` : ''}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  abas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderBottomWidth: 2, borderBottomColor: t.cardBorda, paddingBottom: 10 },
  aba: { minHeight: 44, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: t.superficieSuave },
  abaAtiva: { backgroundColor: t.botaoFundo },
  texto: { fontFamily: typography.bold, fontSize: 13, color: t.texto },
  textoAtivo: { color: t.botaoTexto },
}) as const;
