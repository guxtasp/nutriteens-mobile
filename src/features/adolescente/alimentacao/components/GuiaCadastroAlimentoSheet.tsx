// src/features/adolescente/alimentacao/components/GuiaCadastroAlimentoSheet.tsx
//
// "Como preencher?": mostra, para cada origem, a regra dos grupos e exemplos
// reais (ex.: bolo de cenoura -> cenoura = Legumes, ovos = Carnes e Ovos...).
// O conteúdo vem de GUIA_CADASTRO (utils/categoriasAlimento), não daqui.
import React, { useEffect, useState } from 'react';
import { View, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { GUIA_CADASTRO, rotuloCategoria, type OrigemAlimento } from '../utils/categoriasAlimento';
import { INFO_ORIGEM } from '../screens/NovoAlimentoOrigemScreen';

type Props = {
  visivel: boolean;
  onFechar: () => void;
  /** aba que abre primeiro (a origem que a pessoa já escolheu) */
  origemInicial: OrigemAlimento;
  /** ícones dos grupos (tabela grupos_alimentares_info), se já carregaram */
  iconesGrupos?: Record<string, string | undefined>;
};

const ORDEM: OrigemAlimento[] = ['NATURAL', 'PREPARADO_EM_CASA', 'INDUSTRIALIZADO'];

export default function GuiaCadastroAlimentoSheet({ visivel, onFechar, origemInicial, iconesGrupos }: Props) {
  const [aba, setAba] = useState<OrigemAlimento>(origemInicial);

  // sempre abre na origem escolhida, mesmo se a pessoa mexeu nas abas da última vez
  useEffect(() => {
    if (visivel) setAba(origemInicial);
  }, [visivel, origemInicial]);

  const guia = GUIA_CADASTRO[aba];
  const visual = INFO_ORIGEM[aba];

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar}>
      <Pressable style={styles.backdrop} onPress={onFechar} accessibilityLabel="Fechar guia" />
      <View style={styles.sheet}>
        <View style={styles.puxador} />
        <View style={styles.cabecalho}>
          <View style={styles.cabecalhoTitulo}>
            <Ionicons name="bulb" size={20} color="#B7791F" />
            <AppText style={styles.titulo} accessibilityRole="header">Como preencher?</AppText>
          </View>
          <Pressable onPress={onFechar} hitSlop={10} accessibilityRole="button" accessibilityLabel="Fechar">
            <Ionicons name="close" size={22} color={colors.primaryDark} />
          </Pressable>
        </View>

        <View style={styles.abas} accessibilityRole="tablist">
          {ORDEM.map((o) => {
            const ativa = o === aba;
            return (
              <Pressable
                key={o}
                onPress={() => setAba(o)}
                style={[styles.aba, ativa && { backgroundColor: INFO_ORIGEM[o].fundo, borderColor: INFO_ORIGEM[o].cor }]}
                accessibilityRole="tab"
                accessibilityState={{ selected: ativa }}
              >
                <Ionicons name={INFO_ORIGEM[o].icone} size={14} color={ativa ? INFO_ORIGEM[o].cor : '#7A8B94'} />
                <AppText style={[styles.abaTexto, ativa && { color: INFO_ORIGEM[o].cor }]}>{GUIA_CADASTRO[o].rotuloCurto}</AppText>
              </Pressable>
            );
          })}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.corpo}>
          <View style={[styles.regra, { backgroundColor: visual.fundo }]}>
            <Ionicons name="checkbox" size={18} color={visual.cor} />
            <AppText style={[styles.regraTexto, { color: visual.cor }]}>{guia.regra}</AppText>
          </View>

          <AppText style={styles.secao}>Exemplos</AppText>
          {guia.exemplos.map((ex) => (
            <View key={ex.nome} style={styles.exemplo}>
              <View style={styles.exemploTopo}>
                <AppText style={styles.exemploNome}>{ex.nome}</AppText>
                <AppText style={styles.exemploContagem}>
                  {ex.itens.length === 1 ? '1 grupo' : `${ex.itens.length} grupos`}
                </AppText>
              </View>
              {ex.itens.map((item) => (
                <View key={item.ingrediente} style={styles.linha}>
                  <AppText style={styles.ingrediente} numberOfLines={2}>{item.ingrediente}</AppText>
                  <Ionicons name="arrow-forward" size={14} color="#9AA5A0" />
                  <View style={styles.chip}>
                    <Ionicons name={(iconesGrupos?.[item.grupo] as any) ?? 'restaurant-outline'} size={13} color="#2E7D4F" />
                    <AppText style={styles.chipTexto} numberOfLines={1}>{rotuloCategoria(item.grupo)}</AppText>
                  </View>
                </View>
              ))}
              {!!ex.nota && <AppText style={styles.nota}>{ex.nota}</AppText>}
            </View>
          ))}

          <AppText style={styles.secao}>Dicas</AppText>
          {guia.dicas.map((d) => (
            <View key={d} style={styles.dica}>
              <Ionicons name="sparkles" size={14} color="#B7791F" style={{ marginTop: 2 }} />
              <AppText style={styles.dicaTexto}>{d}</AppText>
            </View>
          ))}
        </ScrollView>

        <Pressable style={({ pressed }) => [styles.botao, pressed && styles.botaoPressionado]} onPress={onFechar} accessibilityRole="button">
          <AppText style={styles.botaoTexto}>Entendi</AppText>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 28, 39, 0.55)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '88%',
    backgroundColor: '#F6FAF1', borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 32,
  },
  puxador: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D9E2E8', alignSelf: 'center', marginBottom: 14 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cabecalhoTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titulo: { fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark },

  abas: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  aba: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 9, borderRadius: 14, borderWidth: 1.5, borderColor: '#DDE8D2', backgroundColor: colors.white,
  },
  abaTexto: { fontFamily: typography.bold, fontSize: 12, color: '#7A8B94' },

  corpo: { paddingBottom: 12, gap: 10 },
  regra: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, padding: 14 },
  regraTexto: { flex: 1, fontFamily: typography.bold, fontSize: 14, lineHeight: 20 },
  secao: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark, marginTop: 8 },

  exemplo: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1.5, borderColor: '#DDE8D2', borderBottomWidth: 4, padding: 14, gap: 8 },
  exemploTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exemploNome: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  exemploContagem: { fontFamily: typography.bold, fontSize: 11, color: '#7A8B94' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ingrediente: { flex: 1, fontFamily: typography.medium, fontSize: 13, color: '#3F4F47' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E2F3D3', borderRadius: 12, paddingVertical: 5, paddingHorizontal: 9, maxWidth: '58%' },
  chipTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark, flexShrink: 1 },
  nota: { fontFamily: typography.regular, fontSize: 12, lineHeight: 17, color: '#7A8B94', marginTop: 2 },

  dica: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  dicaTexto: { flex: 1, fontFamily: typography.regular, fontSize: 13, lineHeight: 19, color: '#3F4F47' },

  botao: {
    marginTop: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 18,
    backgroundColor: colors.primary, borderBottomWidth: 4, borderBottomColor: colors.primaryShadow,
  },
  botaoPressionado: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
  botaoTexto: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },
});
