// src/shared/painel/PainelLayout.tsx
//
// Casca única do Admin e da Nutricionista:
//  - desktop (>=1024): sidebar completa + conteúdo central
//  - tablet (>=700):   sidebar compacta só com ícones
//  - celular:          barra superior + menu em gaveta (alvos de toque >= 48px)
// Cada tela renderiza <PainelLayout> por dentro; o navigator usa animation:'none'
// para a troca de tela não "piscar" o menu.
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../ui/AppText';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { painel } from './painelTheme';
import { useModoPainel } from './hooks/useModoPainel';
import type { ConfigPainel, ItemMenu } from './types';
import { LimiteErro } from './components/LimiteErro';

type Props = {
  config: ConfigPainel;
  titulo: string;
  subtitulo?: string;
  /** botão/controle à direita do título (ex.: "+ Novo") */
  acao?: React.ReactNode;
  /** mostra "Voltar" (telas de formulário/detalhe) */
  voltar?: boolean;
  /** true: o layout rola o conteúdo. false: o filho cuida da rolagem (FlatList) */
  rolagem?: boolean;
  /** true: coloca o filho dentro de um cartão branco (telas legadas com fundo próprio) */
  moldura?: boolean;
  children: React.ReactNode;
};

function Menu({
  config,
  rotaAtiva,
  compacto,
  onNavegar,
  onSair,
}: {
  config: ConfigPainel;
  rotaAtiva: string;
  compacto: boolean;
  onNavegar: (rota: string) => void;
  onSair: () => void;
}) {
  function ativo(item: ItemMenu) {
    return item.rota === rotaAtiva || !!item.rotasFilhas?.includes(rotaAtiva);
  }
  return (
    <View style={styles.menu}>
      <View style={[styles.marca, compacto && styles.marcaCompacta]}>
        <View style={styles.marcaIcone}>
          <Ionicons name="leaf" size={20} color={colors.primaryDark} />
        </View>
        {!compacto && (
          <View style={{ flexShrink: 1 }}>
            <AppText style={styles.marcaNome}>NutriTeens</AppText>
            <AppText style={styles.marcaPapel}>{config.papelLabel}</AppText>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.itens} showsVerticalScrollIndicator={false}>
        {config.itens.map((item) => {
          const on = ativo(item);
          return (
            <Pressable
              key={item.rota}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => onNavegar(item.rota)}
              style={[styles.item, compacto && styles.itemCompacto, on && styles.itemAtivo]}
            >
              <Ionicons name={item.icone} size={20} color={on ? colors.primaryDark : colors.textOnDarkMuted} />
              {!compacto && (
                <AppText numberOfLines={1} style={[styles.itemTexto, on && styles.itemTextoAtivo]}>
                  {item.label}
                </AppText>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sair"
        onPress={onSair}
        style={[styles.item, compacto && styles.itemCompacto, styles.sair]}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.textOnDarkMuted} />
        {!compacto && <AppText style={styles.itemTexto}>Sair</AppText>}
      </Pressable>
    </View>
  );
}

export function PainelLayout({ config, titulo, subtitulo, acao, voltar, rolagem = true, moldura, children }: Props) {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { signOut } = useAuth();
  const { modo } = useModoPainel();
  const insets = useSafeAreaInsets();
  const [gavetaAberta, setGavetaAberta] = useState(false);

  function navegar(rota: string) {
    setGavetaAberta(false);
    if (rota !== route.name) navigation.navigate(rota);
  }
  function sair() {
    setGavetaAberta(false);
    signOut().catch((e) => console.error('Erro ao sair:', e));
  }
  function aoVoltar() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate(config.rotaInicial);
  }

  const cabecalho = (
    <View style={styles.cabecalho}>
      <View style={{ flex: 1, minWidth: 200 }}>
        {voltar && (
          <Pressable onPress={aoVoltar} style={styles.voltar} accessibilityRole="button" accessibilityLabel="Voltar">
            <Ionicons name="chevron-back" size={18} color={colors.primaryDark} />
            <AppText style={styles.voltarTexto}>Voltar</AppText>
          </Pressable>
        )}
        <AppText style={styles.titulo}>{titulo}</AppText>
        {!!subtitulo && <AppText style={styles.subtitulo}>{subtitulo}</AppText>}
      </View>
      {!!acao && <View style={styles.acao}>{acao}</View>}
    </View>
  );

  const corpo = rolagem ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.corpoRolagem, { paddingBottom: 32 + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.coluna}>
        {cabecalho}
        <LimiteErro chaveReset={route.name}>{children}</LimiteErro>
      </View>
    </ScrollView>
  ) : (
    <View style={[styles.corpoRolagem, { flex: 1, paddingBottom: 16 + insets.bottom }]}>
      <View style={[styles.coluna, { flex: 1 }]}>
        {cabecalho}
        <View style={[{ flex: 1 }, moldura && styles.moldura]}>
          <LimiteErro chaveReset={route.name}>{children}</LimiteErro>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {modo !== 'celular' && (
        <View
          style={[
            styles.sidebar,
            { width: modo === 'desktop' ? painel.larguraSidebar : painel.larguraRail, paddingTop: insets.top },
          ]}
        >
          <Menu config={config} rotaAtiva={route.name} compacto={modo === 'tablet'} onNavegar={navegar} onSair={sair} />
        </View>
      )}

      <View style={{ flex: 1 }}>
        {modo === 'celular' && (
          <View style={[styles.barraTopo, { paddingTop: insets.top }]}>
            <Pressable
              onPress={() => setGavetaAberta(true)}
              style={styles.botaoMenu}
              accessibilityRole="button"
              accessibilityLabel="Abrir menu"
            >
              <Ionicons name="menu" size={26} color={colors.white} />
            </Pressable>
            <AppText style={styles.barraTitulo}>NutriTeens · {config.papelLabel}</AppText>
          </View>
        )}
        {corpo}
      </View>

      {modo === 'celular' && (
        <Modal visible={gavetaAberta} transparent animationType="fade" onRequestClose={() => setGavetaAberta(false)}>
          <View style={styles.gavetaFundo}>
            <View style={[styles.gaveta, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
              <Menu config={config} rotaAtiva={route.name} compacto={false} onNavegar={navegar} onSair={sair} />
            </View>
            <Pressable style={{ flex: 1 }} onPress={() => setGavetaAberta(false)} accessibilityLabel="Fechar menu" />
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: painel.fundo },
  sidebar: { backgroundColor: colors.background },
  menu: { flex: 1, paddingHorizontal: 12, paddingBottom: 12 },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 20, paddingHorizontal: 8 },
  marcaCompacta: { justifyContent: 'center', paddingHorizontal: 0 },
  marcaIcone: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaNome: { fontFamily: typography.bold, fontSize: 16, color: colors.white },
  marcaPapel: { fontFamily: typography.regular, fontSize: 12, color: colors.textOnDarkMuted },
  itens: { gap: 4, paddingBottom: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  itemCompacto: { justifyContent: 'center', paddingHorizontal: 0 },
  itemAtivo: { backgroundColor: colors.primary },
  itemTexto: { fontFamily: typography.medium, fontSize: 14, color: colors.textOnDarkMuted, flexShrink: 1 },
  itemTextoAtivo: { fontFamily: typography.bold, color: colors.primaryDark },
  sair: { marginTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', borderRadius: 0 },

  barraTopo: { backgroundColor: colors.background, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 6 },
  botaoMenu: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  barraTitulo: { fontFamily: typography.bold, fontSize: 15, color: colors.white, flexShrink: 1 },
  gavetaFundo: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.45)' },
  gaveta: { width: '82%', maxWidth: 300, backgroundColor: colors.background },

  corpoRolagem: { paddingHorizontal: 16, paddingTop: 16 },
  coluna: { width: '100%', maxWidth: painel.conteudoMax, alignSelf: 'center', gap: 16 },
  cabecalho: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  titulo: { fontFamily: typography.bold, fontSize: 24, color: colors.primaryDark },
  subtitulo: { fontFamily: typography.regular, fontSize: 13, color: painel.textoSuave, marginTop: 2 },
  acao: { flexShrink: 0 },
  voltar: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', minHeight: 40, marginLeft: -4 },
  voltarTexto: { fontFamily: typography.medium, fontSize: 13, color: colors.primaryDark },
  moldura: {
    backgroundColor: colors.white,
    borderRadius: painel.cardRaio,
    borderWidth: 2,
    borderColor: painel.cardBorda,
    overflow: 'hidden',
  },
});
