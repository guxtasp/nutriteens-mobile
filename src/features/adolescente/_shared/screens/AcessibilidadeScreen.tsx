// src/features/adolescente/_shared/screens/AcessibilidadeScreen.tsx
//
// Tela de acessibilidade do app. Fica em Mais > Configurações > Acessibilidade: ninguém toca
// nela sem querer e nenhuma outra tela ganha botão ou muda de layout. Cada opção explica, em
// poucas palavras, o que muda.
import React, { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { definirSomAtivo, somEstaAtivo, tocarSom } from '../../../../shared/audio/sons';
import { definirPreferencia } from '../../../../shared/state/acessibilidade';
import { useAcessibilidade } from '../../../../shared/hooks/useAcessibilidade';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList>;

type LinhaProps = {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descricao: string;
  valor: boolean;
  onChange: (v: boolean) => void;
};

function LinhaOpcao({ icone, titulo, descricao, valor, onChange }: LinhaProps) {
  return (
    <View style={styles.linha} accessible accessibilityRole="switch" accessibilityLabel={titulo}
      accessibilityHint={descricao} accessibilityState={{ checked: valor }}
      accessibilityActions={[{ name: 'activate' }]} onAccessibilityAction={() => onChange(!valor)}>
      <View style={styles.iconeCirculo}>
        <Ionicons name={icone} size={20} color={colors.primary} />
      </View>
      <View style={styles.textos}>
        <AppText style={styles.linhaTitulo}>{titulo}</AppText>
        <AppText style={styles.linhaSub}>{descricao}</AppText>
      </View>
      <Switch
        value={valor}
        onValueChange={onChange}
        trackColor={{ false: '#D9D9D9', true: colors.primary }}
        thumbColor={colors.white}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      />
    </View>
  );
}

export default function AcessibilidadeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { reduzirAnimacoes, vibracao } = useAcessibilidade();
  const [somLigado, setSomLigado] = useState(somEstaAtivo());

  async function alternarSom(valor: boolean) {
    setSomLigado(valor);
    await definirSomAtivo(valor);
    if (valor) tocarSom('pop');
  }

  function abrirAjustesDoAparelho() {
    Linking.openSettings().catch(() => {});
  }

  return (
    <SafeAreaView style={styles.tela}>
      <ScreenHeader
        titulo="Acessibilidade"
        subtitulo="Deixe o app do seu jeito"
        onVoltar={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.conteudo}>
        <AppText style={styles.intro}>
          Estas opções são só suas e ficam guardadas neste aparelho. Você pode mudar quando quiser.
        </AppText>

        <AppText style={styles.secao}>Menos estímulos</AppText>
        <View style={styles.cartao}>
          <LinhaOpcao
            icone="sparkles-outline"
            titulo="Reduzir animações"
            descricao="Sem confete, brilhos e movimentos que se repetem"
            valor={reduzirAnimacoes}
            onChange={(v) => definirPreferencia('reduzirAnimacoes', v)}
          />
          <View style={styles.divisor} />
          <LinhaOpcao
            icone={somLigado ? 'volume-high' : 'volume-mute'}
            titulo="Sons do app"
            descricao="Efeitos ao responder, registrar e concluir"
            valor={somLigado}
            onChange={alternarSom}
          />
          <View style={styles.divisor} />
          <LinhaOpcao
            icone="phone-portrait-outline"
            titulo="Vibração"
            descricao="O celular vibra ao tocar e ao conquistar algo"
            valor={vibracao}
            onChange={(v) => definirPreferencia('vibracao', v)}
          />
        </View>

        <AppText style={[styles.secao, { marginTop: 20 }]}>No seu aparelho</AppText>
        <View style={styles.cartao}>
          <Pressable
            style={styles.linha}
            onPress={abrirAjustesDoAparelho}
            accessibilityRole="button"
            accessibilityLabel="Abrir os ajustes do celular"
            accessibilityHint="Para aumentar o tamanho do texto ou usar leitor de tela"
          >
            <View style={styles.iconeCirculo}>
              <Ionicons name="text-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.textos}>
              <AppText style={styles.linhaTitulo}>Tamanho do texto e leitor de tela</AppText>
              <AppText style={styles.linhaSub}>
                {Platform.OS === 'ios'
                  ? 'O app segue o tamanho de texto, o VoiceOver e o “reduzir movimento” do iPhone'
                  : 'O app segue o tamanho da fonte, o TalkBack e o “remover animações” do Android'}
              </AppText>
            </View>
            <Ionicons name="open-outline" size={18} color="#9AA5A0" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  conteudo: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  intro: { fontFamily: typography.regular, fontSize: 14, lineHeight: 20, color: '#5E6E66', marginBottom: 18 },
  secao: { fontFamily: typography.semiBold, fontSize: 13, color: '#7A8B94', marginBottom: 10 },
  cartao: { backgroundColor: '#F4F9EE', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, minHeight: 56 },
  iconeCirculo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF6D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: { flex: 1 },
  linhaTitulo: { fontFamily: typography.semiBold, fontSize: 15, color: colors.primaryDark },
  linhaSub: { fontFamily: typography.regular, fontSize: 12, lineHeight: 17, color: '#6B7C74', marginTop: 2 },
  divisor: { height: 1, backgroundColor: '#E1EBD6' },
});
