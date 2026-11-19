// src/shared/painel/PainelLayout.tsx
//
// Casca única do Admin e da Nutricionista:
//  - desktop (>=1024): menu lateral completo, agrupado por seção, com o logotipo
//  - tablet (>=700):   menu compacto com ícone + rótulo curto (só ícone obrigava a decorar)
//  - celular:          barra superior + menu em gaveta (alvos de toque >= 48px)
// Cada tela renderiza <PainelLayout> por dentro; o navigator usa animation:'none'
// para a troca de tela não "piscar" o menu.
import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../ui/AppText';
import { typography } from '../theme/typography';
import { colors } from '../theme/colors';
import { fonte, painel, paddingConteudo } from './painelTheme';
import type { TemaPainel } from './tema/paletas';
import { TEMAS } from './tema/paletas';
import { TemaPainelFixo, useEstilos, useTemaPainel } from './tema/TemaPainelContext';
import { rotaTemTema } from './tema/rotasComTema';
import { SeletorTema } from './components/SeletorTema';
import { useModoPainel } from './hooks/useModoPainel';
import { useSairDoPainel } from './hooks/useSairDoPainel';
import type { ConfigPainel, ItemMenu } from './types';
import { rotaMenuAtiva } from './menuAtivo';
import { LimiteErro } from './components/LimiteErro';
import { usePendentesScanner } from '../../features/adolescente/scanner/hooks/usePendentesScanner';

const LOGO = require('../../../assets/img/logo.png');
const LOGO_PROPORCAO = 460 / 120;

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
  /** true: coloca o filho dentro de um cartão (telas legadas com fundo próprio) */
  moldura?: boolean;
  children: React.ReactNode;
};

type EstadoHover = { pressed: boolean; hovered?: boolean };

function Menu({
  config,
  rotaAtiva,
  compacto,
  onNavegar,
  onSair,
  onFechar,
  pendentesScanner,
}: {
  pendentesScanner: number | null;
  config: ConfigPainel;
  rotaAtiva: string;
  compacto: boolean;
  onNavegar: (rota: string) => void;
  onSair: () => void;
  /** só na gaveta do celular */
  onFechar?: () => void;
}) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);

  return (
    <View style={styles.menu} role="navigation" accessibilityLabel={`Menu do painel: ${config.papelLabel}`}>
      <View style={[styles.marca, compacto && styles.marcaCompacta]}>
        {compacto ? (
          <View style={styles.marcaIcone} accessibilityLabel={`NutriTeens, ${config.papelLabel}`}>
            <Ionicons name="leaf" size={20} color={colors.primaryDark} />
          </View>
        ) : (
          <View style={{ flex: 1, gap: 8 }}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel="NutriTeens" />
            <View style={styles.papelChip}>
              <AppText style={styles.papelTexto}>{config.papelLabel}</AppText>
            </View>
          </View>
        )}
        {!!onFechar && (
          <Pressable onPress={onFechar} style={styles.fecharGaveta} accessibilityRole="button" accessibilityLabel="Fechar menu">
            <Ionicons name="close" size={24} color={tema.menuMarcaTexto} />
          </Pressable>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.itens} showsVerticalScrollIndicator={false}>
        {config.itens.map((item: ItemMenu, i) => {
          const on = item.rota === rotaAtiva;
          const novaSecao = !!item.secao && item.secao !== config.itens[i - 1]?.secao;
          const contador = item.selo === 'SCANNER_PENDENTES' && !!pendentesScanner ? pendentesScanner : 0;
          return (
            <React.Fragment key={item.rota}>
              {novaSecao &&
                (compacto ? (
                  i > 0 && <View style={styles.divisorSecao} />
                ) : (
                  <AppText style={[styles.secao, i === 0 && { marginTop: 0 }]} accessibilityRole="header">
                    {item.secao}
                  </AppText>
                ))}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={contador ? `${item.label}, ${contador} pendentes` : item.label}
                onPress={() => onNavegar(item.rota)}
                style={({ hovered }: EstadoHover) => [
                  styles.item,
                  compacto && styles.itemCompacto,
                  hovered && !on && styles.itemHover,
                  on && styles.itemAtivo,
                ]}
              >
                {on && !compacto && <View style={styles.barraAtiva} />}
                <Ionicons name={item.icone} size={compacto ? 22 : 20} color={on ? tema.menuIconeAtivo : tema.menuTexto} />
                {compacto ? (
                  <AppText numberOfLines={1} style={[styles.itemTextoCompacto, on && styles.itemTextoAtivo]}>
                    {item.rotuloCurto ?? item.label}
                  </AppText>
                ) : (
                  <AppText numberOfLines={1} style={[styles.itemTexto, on && styles.itemTextoAtivo]}>
                    {item.label}
                  </AppText>
                )}
                {contador > 0 && (
                  <View style={[styles.selo, compacto && styles.seloCompacto]}>
                    <AppText style={styles.seloTexto}>{contador > 99 ? '99+' : contador}</AppText>
                  </View>
                )}
              </Pressable>
            </React.Fragment>
          );
        })}
      </ScrollView>

      <View style={styles.rodapeMenu}>
        <SeletorTema variante="menu" compacto={compacto} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
          onPress={onSair}
          style={({ hovered }: EstadoHover) => [styles.item, compacto && styles.itemCompacto, hovered && styles.itemHover]}
        >
          <Ionicons name="log-out-outline" size={20} color={tema.menuTexto} />
          <AppText style={compacto ? styles.itemTextoCompacto : styles.itemTexto}>Sair</AppText>
        </Pressable>
      </View>
    </View>
  );
}

export function PainelLayout({ config, titulo, subtitulo, acao, voltar, rolagem = true, moldura, children }: Props) {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { modo } = useModoPainel();
  const insets = useSafeAreaInsets();
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const { sair: sairDaConta } = useSairDoPainel();
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const pendentesScanner = usePendentesScanner(config.itens.some((i) => i.selo === 'SCANNER_PENDENTES'));
  const celular = modo === 'celular';
  const respiro = paddingConteudo(modo);

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
  async function sair() {
    setGavetaAberta(false);
    await sairDaConta();
  }
  function aoVoltar() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate(config.rotaInicial);
  }

  const cabecalho = (
    <View style={styles.cabecalho}>
      <View style={{ flex: 1, minWidth: 220 }}>
        {voltar && (
          <Pressable onPress={aoVoltar} style={styles.voltar} accessibilityRole="button" accessibilityLabel="Voltar para a tela anterior">
            <Ionicons name="arrow-back" size={18} color={tema.destaqueTexto} />
            <AppText style={styles.voltarTexto}>Voltar</AppText>
          </Pressable>
        )}
        <AppText style={[styles.titulo, celular && styles.tituloCelular]} accessibilityRole="header">
          {titulo}
        </AppText>
        {!!subtitulo && <AppText style={styles.subtitulo}>{subtitulo}</AppText>}
      </View>
      {!!acaoFinal && <View style={[styles.acao, celular && { width: '100%' }]}>{acaoFinal}</View>}
    </View>
  );

  const corpo = rolagem ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.corpoRolagem, { paddingHorizontal: respiro, paddingBottom: 32 + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.coluna}>
        {cabecalho}
        <LimiteErro chaveReset={route.name}>{conteudo}</LimiteErro>
      </View>
    </ScrollView>
  ) : (
    <View style={[styles.corpoRolagem, { flex: 1, paddingHorizontal: respiro, paddingBottom: 16 + insets.bottom }]}>
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
      {!celular && (
        <View style={[styles.sidebar, { width: modo === 'desktop' ? painel.larguraSidebar : painel.larguraRail, paddingTop: insets.top }]}>
          <Menu config={config} rotaAtiva={rotaAtiva} compacto={modo === 'tablet'} onNavegar={navegar} onSair={sair} pendentesScanner={pendentesScanner} />
        </View>
      )}

      <View style={{ flex: 1 }}>
        {celular && (
          <View style={[styles.barraTopo, { paddingTop: insets.top }]}>
            <Pressable onPress={() => setGavetaAberta(true)} style={styles.botaoMenu} accessibilityRole="button" accessibilityLabel="Abrir menu">
              <Ionicons name="menu" size={26} color={tema.menuMarcaTexto} />
              {!!pendentesScanner && <View style={styles.pontoAviso} />}
            </Pressable>
            <Image source={LOGO} style={styles.logoBarra} resizeMode="contain" accessibilityLabel="NutriTeens" />
            <AppText style={styles.barraPapel} numberOfLines={1}>
              {config.papelLabel}
            </AppText>
            <View style={{ flex: 1 }} />
            <SeletorTema variante="barra" />
          </View>
        )}
        {corpo}
      </View>

      {celular && (
        <Modal visible={gavetaAberta} transparent animationType="fade" onRequestClose={() => setGavetaAberta(false)}>
          <View style={styles.gavetaFundo}>
            <View style={[styles.gaveta, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
              <Menu
                config={config}
                rotaAtiva={rotaAtiva}
                compacto={false}
                onNavegar={navegar}
                onSair={sair}
                onFechar={() => setGavetaAberta(false)}
                pendentesScanner={pendentesScanner}
              />
            </View>
            <Pressable style={{ flex: 1 }} onPress={() => setGavetaAberta(false)} accessibilityRole="button" accessibilityLabel="Fechar menu" />
          </View>
        </Modal>
      )}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  root: { flex: 1, flexDirection: 'row', backgroundColor: t.fundo } as const,
  sidebar: { backgroundColor: t.menuFundo, borderRightWidth: t.nome === 'escuro' ? 1 : 0, borderRightColor: t.menuDivisor } as const,
  menu: { flex: 1, paddingHorizontal: 12, paddingBottom: 12 } as const,

  marca: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingTop: 20, paddingBottom: 16, paddingHorizontal: 8 } as const,
  marcaCompacta: { justifyContent: 'center', paddingHorizontal: 0 } as const,
  marcaIcone: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' } as const,
  logo: { width: 148, height: 148 / LOGO_PROPORCAO } as const,
  papelChip: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: 'rgba(255,255,255,0.08)' } as const,
  papelTexto: { fontFamily: typography.semiBold, fontSize: fonte.selo, color: t.menuTexto, letterSpacing: 0.4, textTransform: 'uppercase' } as const,
  fecharGaveta: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' } as const,

  itens: { gap: 2, paddingBottom: 8 } as const,
  secao: { fontFamily: typography.bold, fontSize: fonte.selo, color: t.menuSecao, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 16, marginBottom: 6, paddingHorizontal: 12 } as const,
  divisorSecao: { height: 1, backgroundColor: t.menuDivisor, marginVertical: 8, marginHorizontal: 8 } as const,
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, paddingHorizontal: 12, borderRadius: 10, overflow: 'hidden' } as const,
  itemCompacto: { flexDirection: 'column', justifyContent: 'center', gap: 4, minHeight: 58, paddingHorizontal: 2 } as const,
  itemHover: { backgroundColor: 'rgba(255,255,255,0.06)' } as const,
  itemAtivo: { backgroundColor: t.menuAtivoFundo } as const,
  barraAtiva: { position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, backgroundColor: t.menuIconeAtivo } as const,
  itemTexto: { fontFamily: typography.medium, fontSize: fonte.corpo, color: t.menuTexto, flexShrink: 1 } as const,
  itemTextoCompacto: { fontFamily: typography.medium, fontSize: 10, color: t.menuTexto, textAlign: 'center' } as const,
  itemTextoAtivo: { fontFamily: typography.bold, color: t.menuTextoAtivo } as const,
  selo: { marginLeft: 'auto', minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: t.alerta, alignItems: 'center', justifyContent: 'center' } as const,
  seloCompacto: { position: 'absolute', top: 4, right: 10, marginLeft: 0, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9 } as const,
  seloTexto: { fontFamily: typography.bold, fontSize: 10, color: colors.textOnLight } as const,
  rodapeMenu: { borderTopWidth: 1, borderTopColor: t.menuDivisor, paddingTop: 8, gap: 2 } as const,

  barraTopo: { backgroundColor: t.menuFundo, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 6, paddingBottom: 6 } as const,
  botaoMenu: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' } as const,
  pontoAviso: { position: 'absolute', top: 10, right: 9, width: 10, height: 10, borderRadius: 5, backgroundColor: t.alerta, borderWidth: 2, borderColor: t.menuFundo } as const,
  logoBarra: { width: 96, height: 96 / LOGO_PROPORCAO } as const,
  barraPapel: { fontFamily: typography.medium, fontSize: fonte.legenda, color: t.menuTexto, flexShrink: 1 } as const,
  gavetaFundo: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)' } as const,
  gaveta: { width: '85%', maxWidth: 320, backgroundColor: t.menuFundo } as const,

  corpoRolagem: { paddingTop: 20 } as const,
  coluna: { width: '100%', maxWidth: painel.conteudoMax, alignSelf: 'center', gap: 16 } as const,
  cabecalho: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 4 } as const,
  titulo: { fontFamily: typography.bold, fontSize: fonte.tituloPagina, color: t.texto } as const,
  tituloCelular: { fontSize: fonte.tituloPaginaCelular } as const,
  subtitulo: { fontFamily: typography.regular, fontSize: fonte.apoio, color: t.textoSuave, marginTop: 2 } as const,
  acao: { flexShrink: 0 } as const,
  voltar: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', minHeight: 44, marginLeft: -4, paddingHorizontal: 4 } as const,
  voltarTexto: { fontFamily: typography.semiBold, fontSize: fonte.apoio, color: t.destaqueTexto } as const,
  moldura: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: t.borda, borderColor: t.cardBorda, overflow: 'hidden' } as const,
  // telas ainda sem tema, dentro do tema escuro
  ilhaLegado: { backgroundColor: TEMAS.claro.fundo, borderRadius: t.cardRaio, padding: 12 } as const,
  acaoLegado: { backgroundColor: TEMAS.claro.fundo, borderRadius: 14, padding: 6 } as const,
});
