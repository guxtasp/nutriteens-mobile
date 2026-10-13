// RF016 — "Onde encontrar": alimentos que são fonte do nutriente, já mostrando o nível de cada um.
// Substitui o uso de AlternativasGrade (de trocas), cujo toque abria um modal de troca sem conteúdo aqui.
import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { typography } from '../../../../shared/theme/typography';
import { iconeDoDestino } from '../../trocas/utils/iconesTrocas';
import type { NivelFonte, OrigemNivel } from '../utils/fontesNutriente';
import { vit } from '../ui/tokens';

export type ItemFonte = { id: string; nome: string; nivel: NivelFonte; origem: OrigemNivel };

const ROTULO: Record<NivelFonte, string> = { FONTE: 'Fonte', ALTO_TEOR: 'Alto teor' };

export default function FontesGrade({ itens, nutrienteNome, limiteInicial = 8 }: {
  itens: ItemFonte[]; nutrienteNome: string; limiteInicial?: number;
}) {
  const [tudo, setTudo] = useState(false);
  const visiveis = tudo ? itens : itens.slice(0, limiteInicial);
  const temEstimativa = itens.some((i) => i.origem === 'GRUPO');

  return (
    <View>
      <AppText style={styles.legenda}>
        <AppText style={styles.legendaNegrito}>Alto teor</AppText> = tem bastante; <AppText style={styles.legendaNegrito}>Fonte</AppText> = ajuda a chegar lá.
      </AppText>

      <View style={styles.grade}>
        {visiveis.map((it, i) => (
          <MotiView
            key={it.id}
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 280, delay: Math.min(i, 8) * 50 }}
            style={styles.celula}
          >
            <View
              style={styles.tile}
              accessible
              accessibilityLabel={`${it.nome}, ${it.nivel === 'ALTO_TEOR' ? 'alto teor' : 'fonte'} de ${nutrienteNome}${it.origem === 'GRUPO' ? ', nível estimado' : ''}`}
            >
              <View style={styles.icone}>
                <MaterialCommunityIcons name={iconeDoDestino(it.nome) as any} size={26} color={vit.texto} />
              </View>
              <AppText style={styles.nome} numberOfLines={2}>{it.nome}</AppText>
              <View style={[styles.chip, it.nivel === 'ALTO_TEOR' ? styles.chipAlto : styles.chipFonte]}>
                <AppText style={styles.chipTexto}>{ROTULO[it.nivel]}{it.origem === 'GRUPO' ? '*' : ''}</AppText>
              </View>
            </View>
          </MotiView>
        ))}
      </View>

      {itens.length > limiteInicial && (
        <Pressable
          onPress={() => setTudo((v) => !v)}
          style={({ pressed }) => [styles.verMais, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel={tudo ? 'Mostrar menos alimentos' : `Mostrar mais ${itens.length - limiteInicial} alimentos`}
        >
          <AppText style={styles.verMaisTexto}>{tudo ? 'Ver menos' : `Ver mais (${itens.length - limiteInicial})`}</AppText>
        </Pressable>
      )}

      {temEstimativa && <AppText style={styles.nota}>* Nível estimado pelo tipo de alimento.</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  legenda: { fontFamily: typography.regular, fontSize: 13, color: vit.textoSuave, lineHeight: 19, marginBottom: 10 },
  legendaNegrito: { fontFamily: typography.bold, color: vit.texto },
  grade: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  celula: { width: '50%', padding: 6 },
  tile: { borderWidth: 1.5, borderColor: vit.borda, borderRadius: 16, padding: 12, alignItems: 'center', gap: 8, minHeight: 138 },
  icone: { width: 48, height: 48, borderRadius: 24, backgroundColor: vit.fundoSuave, alignItems: 'center', justifyContent: 'center' },
  nome: { fontFamily: typography.bold, fontSize: 14, lineHeight: 18, color: vit.texto, textAlign: 'center', minHeight: 36 },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  chipAlto: { backgroundColor: vit.destaque },
  chipFonte: { backgroundColor: vit.fundoDestaque },
  chipTexto: { fontFamily: typography.bold, fontSize: 12, color: vit.texto },
  verMais: { alignSelf: 'center', marginTop: 10, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 22, borderWidth: 1.5, borderColor: vit.texto },
  verMaisTexto: { fontFamily: typography.bold, fontSize: 13, color: vit.texto },
  nota: { fontFamily: typography.regular, fontSize: 12, color: vit.textoSuave, marginTop: 10 },
});
