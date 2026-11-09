// src/features/adolescente/alimentacao/screens/AlimentoCadastradoScreen.tsx
//
// Feedback depois de cadastrar: comemora e MOSTRA o que foi salvo (nome, tipo e grupos),
// para a pessoa conferir. Não fecha sozinha: quem segue é o botão "Colocar no meu prato",
// que volta para a busca (e a busca já põe o alimento no carrinho).
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { BroxisMascot } from '../../../../shared/ui/BroxisMascot';
import ChuvaDeConfete from '../../../../shared/ui/ChuvaDeConfete';
import { useReduzirMovimento } from '../../../../shared/hooks/useReduzirMovimento';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { TEXTO_CLASSIFICACAO, rotuloCategoria } from '../utils/categoriasAlimento';
import { buscarGruposAlimentaresInfo, GrupoAlimentarInfo } from '../services/gruposAlimentaresService';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'AlimentoCadastrado'>;
type RouteProps = RouteProp<AdolescenteStackParamList, 'AlimentoCadastrado'>;

// sem branco: o fundo da tela é claro
const CORES_CONFETE = [colors.primary, '#FFD54A', '#E9578F', '#6ACAF0', '#F5A623'] as const;

const VISUAL_CLASSIFICACAO: Record<string, { icone: keyof typeof Ionicons.glyphMap; fundo: string; cor: string }> = {
  IN_NATURA: { icone: 'leaf', fundo: '#E2F3D3', cor: '#2E7D4F' },
  INGREDIENTE_CULINARIO: { icone: 'flask', fundo: '#FFEFCF', cor: '#B7791F' },
  PROCESSADO: { icone: 'home', fundo: '#FFEFCF', cor: '#B7791F' },
  ULTRAPROCESSADO: { icone: 'cube', fundo: '#FFE1DD', cor: '#C0392B' },
};

export default function AlimentoCadastradoScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { params } = useRoute<RouteProps>();
  const reduzirMovimento = useReduzirMovimento();
  const { alimento, jaExistia } = params;

  const [gruposInfo, setGruposInfo] = useState<Record<string, GrupoAlimentarInfo>>({});
  useEffect(() => {
    buscarGruposAlimentaresInfo().then(setGruposInfo).catch(() => setGruposInfo({}));
  }, []);

  const classificacao = TEXTO_CLASSIFICACAO[alimento.classificacao_nova] ?? TEXTO_CLASSIFICACAO.PROCESSADO;
  const visual = VISUAL_CLASSIFICACAO[alimento.classificacao_nova] ?? VISUAL_CLASSIFICACAO.PROCESSADO;
  const grupos = alimento.grupos_alimentares ?? [];

  function continuar() {
    // volta pra tela de busca JÁ EXISTENTE na pilha (React Navigation 7: `navigate`
    // empilharia uma 2ª busca, e o voltar passaria por Origem/Form/Cadastrado)
    navigation.popTo('BuscaAlimento', {
      tipo: params.tipo,
      nomeRefeicao: params.nomeRefeicao,
      alimentoRecemCriado: alimento,
    });
  }

  const titulo = jaExistia ? 'Esse já estava por aqui!' : 'Alimento cadastrado!';
  const subtitulo = jaExistia
    ? 'Já existe um alimento com esse nome, então usei ele em vez de criar outro.'
    : 'Pronto! Ele já pode ir pro seu prato.';

  const conteudoCartao = (
    <>
          <AppText style={styles.nome} numberOfLines={3}>{alimento.nome}</AppText>

          <View style={[styles.tipoLinha, { backgroundColor: visual.fundo }]}>
            <Ionicons name={visual.icone} size={18} color={visual.cor} />
            <View style={styles.flex}>
              <AppText style={[styles.tipoTitulo, { color: visual.cor }]}>{classificacao.rotulo}</AppText>
              <AppText style={styles.tipoTexto}>{classificacao.explicacao}</AppText>
            </View>
          </View>

          <AppText style={styles.secao}>
            {grupos.length > 1 ? `Entra em ${grupos.length} grupos` : 'Grupo alimentar'}
          </AppText>
          <View style={styles.chips}>
            {grupos.map((g) => (
              <View key={g} style={styles.chip}>
                <Ionicons name={(gruposInfo[g]?.icone as any) ?? 'restaurant-outline'} size={14} color="#2E7D4F" />
                <AppText style={styles.chipTexto}>{gruposInfo[g]?.titulo_amigavel ?? rotuloCategoria(g)}</AppText>
              </View>
            ))}
          </View>

          {!jaExistia && (
            <View style={styles.privado}>
              <Ionicons name="lock-closed" size={13} color="#5B6B75" />
              <AppText style={styles.privadoTexto}>Fica só no seu app, ninguém mais vê.</AppText>
            </View>
          )}
    </>
  );

  return (
    <SafeAreaView style={styles.tela}>
      {!reduzirMovimento && <ChuvaDeConfete cores={CORES_CONFETE} />}

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <View style={styles.mascoteBox}>
          <BroxisMascot size={130} pose="supercontente" entrance={reduzirMovimento ? 'nenhuma' : 'pulo'} showParticles={false} />
          {/* selo de "feito" no canto do círculo; pula um instante depois do Bróxis entrar */}
          {reduzirMovimento ? (
            <View style={styles.selo}>
              <Ionicons name="checkmark" size={20} color={colors.primaryDark} />
            </View>
          ) : (
            <MotiView
              style={styles.selo}
              from={{ scale: 0, rotate: '-25deg' }}
              animate={{ scale: 1, rotate: '0deg' }}
              transition={{ type: 'spring', damping: 8, stiffness: 160, delay: 550 }}
            >
              <Ionicons name="checkmark" size={20} color={colors.primaryDark} />
            </MotiView>
          )}
        </View>

        <View accessibilityLiveRegion="polite" style={styles.cabecalho}>
          <AppText style={styles.titulo} accessibilityRole="header">{titulo}</AppText>
          <AppText style={styles.subtitulo}>{subtitulo}</AppText>
        </View>

        {reduzirMovimento ? (
          <View style={styles.cartao}>{conteudoCartao}</View>
        ) : (
          // o cartão sobe suave; com "reduzir animações" aparece direto (ramo acima)
          <MotiView
            style={styles.cartao}
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 380, delay: 250 }}
          >
            {conteudoCartao}
          </MotiView>
        )}
      </ScrollView>

      <View style={styles.rodape}>
        <Pressable
          style={({ pressed }) => [styles.botao, pressed && styles.botaoPressionado]}
          onPress={continuar}
          accessibilityRole="button"
          accessibilityLabel="Colocar no meu prato"
        >
          <AppText style={styles.botaoTexto}>Colocar no meu prato</AppText>
          <Ionicons name="arrow-forward" size={18} color={colors.primaryDark} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tela: { flex: 1, backgroundColor: '#F6FAF1' },
  conteudo: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 24 },

  cabecalho: { alignItems: 'center' },
  mascoteBox: { width: 130, height: 130, marginBottom: 14 },
  // canto inferior direito do círculo; o anel na cor do fundo separa o selo do desenho
  selo: {
    position: 'absolute', right: 2, bottom: 4, width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#F6FAF1',
  },
  titulo: { fontFamily: typography.bold, fontSize: 26, lineHeight: 32, color: colors.primaryDark, textAlign: 'center' },
  subtitulo: { fontFamily: typography.regular, fontSize: 14, lineHeight: 20, color: '#5B6B75', textAlign: 'center', marginTop: 6, maxWidth: 300 },

  cartao: {
    alignSelf: 'stretch', backgroundColor: colors.white, borderRadius: 24, borderWidth: 1.5, borderColor: '#DDE8D2', borderBottomWidth: 4,
    padding: 18, marginTop: 22, gap: 12,
  },
  nome: { fontFamily: typography.bold, fontSize: 21, lineHeight: 27, color: colors.primaryDark },

  tipoLinha: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 16, padding: 12 },
  tipoTitulo: { fontFamily: typography.bold, fontSize: 14 },
  tipoTexto: { fontFamily: typography.regular, fontSize: 12, lineHeight: 17, color: '#4A5A52', marginTop: 1 },

  secao: { fontFamily: typography.bold, fontSize: 12, color: '#7A8B94', marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E2F3D3', borderRadius: 14, paddingVertical: 7, paddingHorizontal: 11 },
  chipTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },

  privado: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  privadoTexto: { flex: 1, fontFamily: typography.regular, fontSize: 12, color: '#5B6B75' },

  rodape: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  botao: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 54, borderRadius: 18,
    backgroundColor: colors.primary, borderBottomWidth: 4, borderBottomColor: colors.primaryShadow,
  },
  botaoPressionado: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
  botaoTexto: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
});
