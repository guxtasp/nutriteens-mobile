// src/features/adolescente/scanner/screens/CadastroProdutoScannerScreen.tsx
// "Pedir cadastro à equipe": o produto NÃO entra na base por aqui. O pedido vai para a fila da equipe
// (nutricionista/admin), que confere e cadastra. A pessoa só informa nome e marca; o nível de
// processamento e a categoria são definidos pela equipe.
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { buscarCandidatos, solicitarCadastro } from '../services/scannerService';
import type { Candidato } from '../utils/scanner';

type Nav = NativeStackNavigationProp<AdolescenteStackParamList, 'CadastroProdutoScanner'>;
type Rota = RouteProp<AdolescenteStackParamList, 'CadastroProdutoScanner'>;

function Opcao({ rotulo, detalhe, ativo, onPress }: { rotulo: string; detalhe?: string; ativo: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.opcao, ativo && styles.opcaoAtiva]} accessibilityRole="radio" accessibilityState={{ selected: ativo }}>
      <AppText style={[styles.opcaoTexto, ativo && styles.opcaoTextoAtivo]}>{rotulo}</AppText>
      {!!detalhe && <AppText style={styles.opcaoDetalhe}>{detalhe}</AppText>}
    </Pressable>
  );
}

export default function CadastroProdutoScannerScreen() {
  const navigation = useNavigation<Nav>();
  const { codigo, motivo = 'NAO_ENCONTRADO' } = useRoute<Rota>().params;
  const incompleta = motivo === 'FICHA_INCOMPLETA';
  const [nome, setNome] = useState('');
  const [marca, setMarca] = useState('');
  const [candidatos, setCandidatos] = useState<Candidato[] | null>(null);   // null = ainda não procurou
  const [escolhido, setEscolhido] = useState<Candidato | null>(null);        // null = "nenhum deles"
  const [ocupado, setOcupado] = useState(false);
  const [enviado, setEnviado] = useState<{ jaExistia: boolean; produtoExiste: boolean } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(cand: Candidato | null) {
    const r = await solicitarCadastro({
      codigo, motivo, nome, marca,
      candidato: cand ? { codigoBarras: cand.codigoBarras, nome: cand.nome } : null,
    });
    setEnviado(r);
  }

  async function continuar() {
    if (ocupado) return;
    if (!incompleta && nome.trim().length < 2) { setErro('Conte o nome do produto para a gente registrar o pedido.'); return; }
    setOcupado(true);
    try {
      // 1º toque: procura produtos parecidos (só pista). Se não houver, já envia.
      if (candidatos === null && nome.trim().length >= 3) {
        const achados = await buscarCandidatos(nome, marca);
        setCandidatos(achados);
        if (achados.length > 0) { setOcupado(false); return; }
      }
      await enviar(escolhido);
    } catch (e) {
      console.error('Scanner: pedido de cadastro falhou:', e);
      setErro(e instanceof Error && e.message.startsWith('Você já enviou') ? e.message : 'Não deu para enviar agora. Tente de novo daqui a pouco.');
    } finally {
      setOcupado(false);
    }
  }

  if (enviado) {
    return (
      <SafeAreaView style={styles.tela}>
        <View style={styles.cabecalho}>
          <View style={{ width: 48 }} />
          <AppText style={styles.titulo}>Pedido enviado</AppText>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.sucesso}>
          <MaterialCommunityIcons name="check-circle-outline" size={52} color={colors.primaryDark} />
          <AppText style={styles.secao}>
            {enviado.produtoExiste ? 'Esse produto já foi cadastrado!' : enviado.jaExistia ? 'Outras pessoas também pediram esse produto' : 'Obrigado por avisar!'}
          </AppText>
          <AppText style={[styles.texto, { textAlign: 'center' }]}>
            {enviado.produtoExiste
              ? 'Escaneie de novo para ver o resultado.'
              : 'A equipe vai conferir os dados. Quando ele for cadastrado, vai aparecer aqui na próxima leitura.'}
          </AppText>
          <AppButton label="Escanear outro produto" onPress={() => navigation.navigate('ScannerAlimento')} />
        </View>
      </SafeAreaView>
    );
  }

  const mostrandoCandidatos = candidatos !== null && candidatos.length > 0;

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.cabecalho}>
        <BackButton onPress={() => navigation.goBack()} />
        <AppText style={styles.titulo}>{incompleta ? 'Avisar a equipe' : 'Pedir cadastro'}</AppText>
        <View style={{ width: 48 }} />
      </View>
      <MessageBanner message={erro} onClose={() => setErro(null)} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <AppText style={styles.texto}>Código de barras: {codigo}</AppText>
          <AppText style={styles.texto}>
            Seu pedido vai para a nutricionista e para a administração, que conferem e cadastram o produto.
          </AppText>
          <LabeledInput
            label={incompleta ? 'Nome do produto (opcional)' : 'Nome do produto'}
            value={nome} onChangeText={(t) => { setNome(t); setCandidatos(null); setEscolhido(null); }}
            maxLength={200} placeholder="Ex.: Suco de uva integral"
          />
          <LabeledInput label="Marca (opcional)" value={marca} onChangeText={(t) => { setMarca(t); setCandidatos(null); setEscolhido(null); }} maxLength={120} />

          {mostrandoCandidatos && (
            <View style={{ gap: 10 }}>
              <AppText style={styles.secao}>Algum destes é parecido?</AppText>
              <AppText style={styles.texto}>
                Podem ser versões diferentes (outro tamanho ou sabor). Isso é só uma pista para a equipe: nada é confirmado automaticamente.
              </AppText>
              <View style={{ gap: 8 }}>
                {candidatos!.map((c) => (
                  <Opcao
                    key={c.codigoBarras}
                    rotulo={[c.nome, c.marca].filter(Boolean).join(' · ')}
                    detalhe={`${c.confianca === 'PROVAVEL' ? 'Parece o mesmo produto' : 'Pode ser parecido'} · código ${c.codigoBarras}`}
                    ativo={escolhido?.codigoBarras === c.codigoBarras}
                    onPress={() => setEscolhido(c)}
                  />
                ))}
                <Opcao rotulo="Nenhum deles" ativo={escolhido === null} onPress={() => setEscolhido(null)} />
              </View>
            </View>
          )}

          <AppButton
            label={ocupado ? 'Enviando...' : mostrandoCandidatos ? 'Enviar pedido' : candidatos === null && nome.trim().length >= 3 ? 'Continuar' : 'Enviar pedido'}
            onPress={continuar} disabled={ocupado}
          />
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
  opcao: { borderRadius: 16, borderWidth: 1.5, borderColor: colors.exercicioBorda, paddingHorizontal: 14, paddingVertical: 10 },
  opcaoAtiva: { backgroundColor: colors.primary, borderColor: colors.primaryShadow },
  opcaoTexto: { fontFamily: typography.regular, fontSize: 13, color: colors.primaryDark },
  opcaoTextoAtivo: { fontFamily: typography.bold },
  opcaoDetalhe: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', marginTop: 2 },
  sucesso: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 24 },
});
