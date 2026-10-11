// "Por que essa troca?" — detalhe em 3 partes: o que muda, o que você ganha e como fazer.
// Sem EBIA, sem caloria, sem julgamento.
import React from 'react';
import { View, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { iconeDoDestino } from '../utils/iconesTrocas';
import { CategoriaTroca, CONTEXTO_CATEGORIA, rotulosNutrientes } from '../utils/trocas';

export type TrocaDetalhe = {
  id: string;
  nome: string;
  explicacao?: string;       // o que você ganha (frase da troca)
  dica?: string | null;      // como fazer
  nutrientes?: string[];
  rapida?: boolean;
  categoria?: CategoriaTroca;
};

type Props = { item: TrocaDetalhe | null; origemNome?: string | null; onFechar: () => void };

function Bloco({ icone, titulo, texto }: { icone: string; titulo: string; texto: string }) {
  return (
    <View style={styles.bloco}>
      <View style={styles.blocoIcone}><MaterialCommunityIcons name={icone as any} size={16} color={colors.primaryDark} /></View>
      <View style={{ flex: 1 }}>
        <AppText style={styles.blocoTitulo}>{titulo}</AppText>
        <AppText style={styles.blocoTexto}>{texto}</AppText>
      </View>
    </View>
  );
}

export default function TrocaDetalheSheet({ item, origemNome, onFechar }: Props) {
  if (!item) return null;
  const fontes = rotulosNutrientes(item.nutrientes);
  const contexto = item.categoria ? CONTEXTO_CATEGORIA[item.categoria] : null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onFechar}>
      <Pressable style={styles.backdrop} onPress={onFechar}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={styles.iconeCirculo}>
              <MaterialCommunityIcons name={iconeDoDestino(item.nome) as any} size={34} color={colors.primary} />
            </View>
            <AppText style={styles.titulo}>{origemNome ? `${item.nome} no lugar de ${origemNome}` : `Por que ${item.nome}?`}</AppText>

            {(fontes.length > 0 || item.rapida) && (
              <View style={styles.chips}>
                {fontes.map((f) => (
                  <View key={f} style={styles.chip}><AppText style={styles.chipTexto}>fonte de {f}</AppText></View>
                ))}
                {item.rapida && (
                  <View style={styles.chip}><AppText style={styles.chipTexto}>rápido de levar</AppText></View>
                )}
              </View>
            )}

            {!!contexto && <Bloco icone="swap-horizontal" titulo="O que muda" texto={contexto} />}
            {!!item.explicacao && <Bloco icone="heart-outline" titulo="O que você ganha" texto={item.explicacao} />}
            {!!item.dica && <Bloco icone="lightbulb-on-outline" titulo="Dica pra fazer" texto={item.dica} />}
          </ScrollView>

          <Pressable style={styles.botao} onPress={onFechar}>
            <AppText style={styles.botaoTexto}>Entendi</AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10, 28, 39, 0.55)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  card: { width: '100%', maxHeight: '86%', backgroundColor: colors.white, borderRadius: 24, paddingTop: 24, paddingHorizontal: 20, paddingBottom: 20 },
  scroll: { alignItems: 'stretch', paddingBottom: 4 },
  iconeCirculo: { alignSelf: 'center', width: 68, height: 68, borderRadius: 34, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  titulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark, textAlign: 'center', marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 14 },
  chip: { backgroundColor: '#E2F3D3', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipTexto: { fontFamily: typography.bold, fontSize: 11, color: colors.primaryDark },
  bloco: { flexDirection: 'row', gap: 10, backgroundColor: '#F4F8F5', borderRadius: 14, padding: 12, marginTop: 8 },
  blocoIcone: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E2F3D3', alignItems: 'center', justifyContent: 'center' },
  blocoTitulo: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  blocoTexto: { fontFamily: typography.regular, fontSize: 14, color: '#3F5148', lineHeight: 20 },
  botao: { marginTop: 16, alignSelf: 'center', paddingVertical: 11, paddingHorizontal: 40, backgroundColor: colors.primaryDark, borderRadius: 22 },
  botaoTexto: { fontFamily: typography.bold, fontSize: 13, color: '#fff' },
});
