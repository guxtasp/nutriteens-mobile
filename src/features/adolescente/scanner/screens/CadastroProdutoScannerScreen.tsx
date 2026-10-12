// src/features/adolescente/scanner/screens/CadastroProdutoScannerScreen.tsx
// "Cadastrar este produto" (SÓ PARA TESTE). Grava com fonte = 'USUARIO' pela RPC do banco.
// Depois de salvar, troca para o resultado do mesmo código (já encontra o produto).
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { BackButton } from '../../../../shared/ui/BackButton';
import { LabeledInput } from '../../../../shared/ui/LabeledInput';
import { MessageBanner } from '../../../../shared/ui/MessageBanner';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import type { ClassificacaoNova } from '../../alimentacao/utils/regraFeedbackRefeicao';
import { CATEGORIAS_TROCA, CategoriaTroca, ROTULO_CATEGORIA } from '../../trocas/utils/trocas';
import { cadastrarProduto } from '../services/scannerService';
import { ROTULO_PROCESSAMENTO } from '../utils/scanner';

type Nav = NativeStackNavigationProp<AdolescenteStackParamList, 'CadastroProdutoScanner'>;
type Rota = RouteProp<AdolescenteStackParamList, 'CadastroProdutoScanner'>;

const NIVEIS = Object.keys(ROTULO_PROCESSAMENTO) as ClassificacaoNova[];

function Opcao({ rotulo, ativo, onPress }: { rotulo: string; ativo: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.opcao, ativo && styles.opcaoAtiva]} accessibilityRole="button" accessibilityState={{ selected: ativo }}>
      <AppText style={[styles.opcaoTexto, ativo && styles.opcaoTextoAtivo]}>{rotulo}</AppText>
    </Pressable>
  );
}

export default function CadastroProdutoScannerScreen() {
  const navigation = useNavigation<Nav>();
  const { codigo } = useRoute<Rota>().params;
  const [nome, setNome] = useState('');
  const [marca, setMarca] = useState('');
  const [nova, setNova] = useState<ClassificacaoNova | null>(null);   // null = "não sei"
  const [categoria, setCategoria] = useState<CategoriaTroca | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    if (salvando) return;
    if (nome.trim().length < 2) { setErro('Conte o nome do produto para a gente salvar.'); return; }
    setSalvando(true);
    try {
      await cadastrarProduto({ codigo, nome, marca, classificacaoNova: nova, categoriaTroca: categoria });
      navigation.replace('ResultadoScanner', { codigo });
    } catch (e) {
      console.error('Scanner: cadastro falhou:', e);
      setErro('Não deu para salvar agora. Tente de novo daqui a pouco.');
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.cabecalho}>
        <BackButton onPress={() => navigation.goBack()} />
        <AppText style={styles.titulo}>Cadastrar produto</AppText>
        <View style={{ width: 48 }} />
      </View>
      <MessageBanner message={erro} onClose={() => setErro(null)} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <AppText style={styles.texto}>Código de barras: {codigo}</AppText>
          <LabeledInput label="Nome do produto" value={nome} onChangeText={setNome} maxLength={200} placeholder="Ex.: Suco de uva" />
          <LabeledInput label="Marca (opcional)" value={marca} onChangeText={setMarca} maxLength={120} />

          <AppText style={styles.secao}>Como é esse produto?</AppText>
          <View style={styles.opcoes}>
            <Opcao rotulo="Não sei" ativo={nova === null} onPress={() => setNova(null)} />
            {NIVEIS.map((n) => <Opcao key={n} rotulo={ROTULO_PROCESSAMENTO[n]} ativo={nova === n} onPress={() => setNova(n)} />)}
          </View>

          <AppText style={styles.secao}>É parecido com (opcional)</AppText>
          <View style={styles.opcoes}>
            <Opcao rotulo="Nenhum" ativo={categoria === null} onPress={() => setCategoria(null)} />
            {CATEGORIAS_TROCA.map((c) => <Opcao key={c} rotulo={ROTULO_CATEGORIA[c]} ativo={categoria === c} onPress={() => setCategoria(c)} />)}
          </View>

          <AppButton label={salvando ? 'Salvando...' : 'Salvar produto'} onPress={salvar} disabled={salvando} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  cabecalho: { marginTop: 30, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 12 },
  titulo: { flex: 1, textAlign: 'center', fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark },
  conteudo: { paddingHorizontal: 20, paddingBottom: 60, gap: 14 },
  texto: { fontFamily: typography.regular, fontSize: 13, color: '#7A8B94' },
  secao: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark, marginTop: 6 },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcao: { borderRadius: 999, borderWidth: 1.5, borderColor: colors.exercicioBorda, paddingHorizontal: 14, paddingVertical: 8 },
  opcaoAtiva: { backgroundColor: colors.primary, borderColor: colors.primaryShadow },
  opcaoTexto: { fontFamily: typography.regular, fontSize: 13, color: colors.primaryDark },
  opcaoTextoAtivo: { fontFamily: typography.bold },
});
