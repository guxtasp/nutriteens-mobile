// src/shared/painel/PainelLayout.tsx
//
// Casca única do Admin e da Nutricionista:
//  - desktop (>=1024): sidebar completa + conteúdo central
//  - tablet (>=700):   sidebar compacta só com ícones
//  - celular:          barra superior + menu em gaveta (alvos de toque >= 48px)
// Cada tela renderiza <PainelLayout> por dentro; o navigator usa animation:'none'
// para a troca de tela não "piscar" o menu.
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../ui/AppText';
import { useAuth } from '../contexts/AuthContext';
import { typography } from '../theme/typography';
import { painel } from './painelTheme';
import type { TemaPainel } from './tema/paletas';
import { TEMAS } from './tema/paletas';
import { TemaPainelFixo, useEstilos, useTemaPainel } from './tema/TemaPainelContext';
import { rotaTemTema } from './tema/rotasComTema';
import { SeletorTema } from './components/SeletorTema';
import { useModoPainel } from './hooks/useModoPainel';
import type { ConfigPainel, ItemMenu } from './types';
import { rotaMenuAtiva } from './menuAtivo';
import { LimiteErro } from './components/LimiteErro';
import { usePendentesScanner } from '../../features/adolescente/scanner/hooks/usePendentesScanner';

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
  pendentesScanner,
}: {
  pendentesScanner: number | null;
  config: ConfigPainel;
  rotaAtiva: string;
  compacto: boolean;
  onNavegar: (rota: string) => void;
  onSair: () => void;
}) {
  function ativo(item: ItemMenu) {
    return item.rota === rotaAtiva;
  }
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.menu}>
      <View style={[styles.marca, compacto && styles.marcaCompacta]}>
        <View style={styles.marcaIcone}>
          <Ionicons name="leaf" size={20} color={tema.nome === 'escuro' ? '#10241A' : tema.texto} />
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
              <Ionicons name={item.icone} size={20} color={on ? tema.menuTextoAtivo : tema.menuTexto} />
              {!compacto && (
                <AppText numberOfLines={1} style={[styles.itemTexto, on && styles.itemTextoAtivo, { flexShrink: 1 }]}>
                  {item.label}
                </AppText>
              )}
              {item.selo === 'SCANNER_PENDENTES' && !!pendentesScanner && (
                <View style={[styles.selo, compacto && styles.seloCompacto]} accessibilityLabel={`${pendentesScanner} pendentes`}>
                  {!compacto && <AppText style={styles.seloTexto}>{pendentesScanner > 99 ? '99+' : pendentesScanner}</AppText>}
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <SeletorTema variante="menu" compacto={compacto} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sair"
        onPress={onSair}
        style={[styles.item, compacto && styles.itemCompacto, styles.sair]}
      >
        <Ionicons name="log-out-outline" size={20} color={tema.menuTexto} />
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
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const pendentesScanner = usePendentesScanner(config.itens.some((i) => i.selo === 'SCANNER_PENDENTES'));

  // No tema escuro, telas que ainda usam cores fixas aparecem dentro de uma "ilha" clara
  // (texto escuro sobre fundo claro), para continuarem legíveis até serem migradas.
  const legado = tema.nome === 'escuro' && !rotaTemTema(route.name);
  const conteudo = legado ? (
    <TemaPainelFixo nome="claro">
      <View style={[styles.ilhaLegado, !rolagem && { flex: 1 }]}>{children}</View>
    </TemaPainelFixo>
  ) : (
    children
  );
  const acaoFinal =
    acao && legado ? (
      <TemaPainelFixo nome="claro">
        <View style={styles.acaoLegado}>{acao}</View>
      </TemaPainelFixo>
    ) : (
      acao
    );

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
            <Ionicons name="chevron-back" size={18} color={tema.texto} />
            <AppText style={styles.voltarTexto}>Voltar</AppText>
          </Pressable>
        )}
        <AppText style={styles.titulo}>{titulo}</AppText>
        {!!subtitulo && <AppText style={styles.subtitulo}>{subtitulo}</AppText>}
      </View>
      {!!acaoFinal && <View style={styles.acao}>{acaoFinal}</View>}
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
        <LimiteErro chaveReset={route.name}>{conteudo}</LimiteErro>
      </View>
    </ScrollView>
  ) : (
    <View style={[styles.corpoRolagem, { flex: 1, paddingBottom: 16 + insets.bottom }]}>
      <View style={[styles.coluna, { flex: 1 }]}>
        {cabecalho}
        <View style={[{ flex: 1 }, moldura && styles.moldura]}>
          <LimiteErro chaveReset={route.name}>{conteudo}</LimiteErro>
        </View>
      </View>
    </View>
  );

  const rotaAtiva = rotaMenuAtiva(config, route.name, (route.params as any)?.origem) ?? route.name;

  return (
    <View style={styles.root}>
      {modo !== 'celular' && (
        <View
          style={[
            styles.sidebar,
            { width: modo === 'desktop' ? painel.larguraSidebar : painel.larguraRail, paddingTop: insets.top },
          ]}
        >
          <Menu config={config} rotaAtiva={rotaAtiva} compacto={modo === 'tablet'} onNavegar={navegar} onSair={sair} pendentesScanner={pendentesScanner} />
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
              <Ionicons name="menu" size={26} color={tema.menuMarcaTexto} />
            </Pressable>
            <AppText style={styles.barraTitulo}>NutriTeens · {config.papelLabel}</AppText>
            <View style={{ flex: 1 }} />
            <SeletorTema variante="barra" />
          </View>
        )}
        {corpo}
      </View>

      {modo === 'celular' && (
        <Modal visible={gavetaAberta} transparent animationType="fade" onRequestClose={() => setGavetaAberta(false)}>
          <View style={styles.gavetaFundo}>
            <View style={[styles.gaveta, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
              <Menu config={config} rotaAtiva={rotaAtiva} compacto={false} onNavegar={navegar} onSair={sair} pendentesScanner={pendentesScanner} />
            </View>
            <Pressable style={{ flex: 1 }} onPress={() => setGavetaAberta(false)} accessibilityLabel="Fechar menu" />
          </View>
        </Modal>
      )}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  selo: { marginLeft: 'auto', minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: t.destaque, alignItems: 'center', justifyContent: 'center' } as const,
  seloCompacto: { position: 'absolute', top: 6, right: 6, minWidth: 10, width: 10, height: 10, paddingHorizontal: 0, borderRadius: 5 } as const,
  seloTexto: { fontFamily: typography.bold, fontSize: 11, color: '#10241A' } as const,
  root: { flex: 1, flexDirection: 'row', backgroundColor: t.fundo } as const,
  sidebar: { backgroundColor: t.menuFundo } as const,
  menu: { flex: 1, paddingHorizontal: 12, paddingBottom: 12 } as const,
  marca: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 20, paddingHorizontal: 8 } as const,
  marcaCompacta: { justifyContent: 'center', paddingHorizontal: 0 } as const,
  marcaIcone: { width: 36, height: 36, borderRadius: 12, backgroundColor: t.destaque, alignItems: 'center', justifyContent: 'center' } as const,
  marcaNome: { fontFamily: typography.bold, fontSize: 16, color: t.menuMarcaTexto } as const,
  marcaPapel: { fontFamily: typography.regular, fontSize: 12, color: t.menuTexto } as const,
  itens: { gap: 4, paddingBottom: 8 } as const,
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 12, borderRadius: 14 } as const,
  itemCompacto: { justifyContent: 'center', paddingHorizontal: 0 } as const,
  itemAtivo: { backgroundColor: t.menuAtivoFundo } as const,
  itemTexto: { fontFamily: typography.medium, fontSize: 14, color: t.menuTexto, flexShrink: 1 } as const,
  itemTextoAtivo: { fontFamily: typography.bold, color: t.menuTextoAtivo } as const,
  sair: { marginTop: 4, borderTopWidth: 1, borderTopColor: t.menuDivisor, borderRadius: 0 } as const,

  barraTopo: { backgroundColor: t.menuFundo, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 6 } as const,
  botaoMenu: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' } as const,
  barraTitulo: { fontFamily: typography.bold, fontSize: 15, color: t.menuMarcaTexto, flexShrink: 1 } as const,
  gavetaFundo: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.45)' } as const,
  gaveta: { width: '82%', maxWidth: 300, backgroundColor: t.menuFundo } as const,

  corpoRolagem: { paddingHorizontal: 16, paddingTop: 16 } as const,
  coluna: { width: '100%', maxWidth: painel.conteudoMax, alignSelf: 'center', gap: 16 } as const,
  cabecalho: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 } as const,
  titulo: { fontFamily: typography.bold, fontSize: 24, color: t.texto } as const,
  subtitulo: { fontFamily: typography.regular, fontSize: 13, color: t.textoSuave, marginTop: 2 } as const,
  acao: { flexShrink: 0 } as const,
  voltar: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', minHeight: 40, marginLeft: -4 } as const,
  voltarTexto: { fontFamily: typography.medium, fontSize: 13, color: t.texto } as const,
  moldura: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: 2, borderColor: t.cardBorda, overflow: 'hidden' } as const,
  // telas ainda sem tema, dentro do tema escuro
  ilhaLegado: { backgroundColor: TEMAS.claro.fundo, borderRadius: t.cardRaio, padding: 12 } as const,
  acaoLegado: { backgroundColor: TEMAS.claro.fundo, borderRadius: 14, padding: 6 } as const,
});
