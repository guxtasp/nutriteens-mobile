// src/features/adolescente/scanner/screens/ResultadoScannerScreen.tsx
// Resultado do scanner (prova de conceito). Tom neutro e acolhedor: sem caloria, sem culpa.
//  - encontrado + ultraprocessado + categoria -> alternativas (AlternativasLista)
//  - encontrado + não ultraprocessado          -> mensagem positiva
//  - não encontrado                            -> buscar por nome / pedir cadastro à equipe / tentar de novo
//  - rede ou Open Food Facts fora do ar        -> "tentar de novo" (NÃO pede cadastro: não sabemos se existe)
//  - código ilegível (dígito verificador)      -> escanear de novo
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { BackButton } from '../../../../shared/ui/BackButton';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { AlternativasLista } from '../../trocas/components/TrocaLista';
import { listarTrocas } from '../../trocas/services/trocasService';
import { ordenarTrocas, ROTULO_CATEGORIA, semDestinoRepetido, Troca } from '../../trocas/utils/trocas';
import { buscarProduto, registrarLeitura, ResultadoBusca } from '../services/scannerService';
import { modoDoResultado, ProdutoScanner, resumoDiagnostico } from '../utils/scanner';
import DiagnosticoProduto from '../components/DiagnosticoProduto';

type Nav = NativeStackNavigationProp<AdolescenteStackParamList, 'ResultadoScanner'>;
type Rota = RouteProp<AdolescenteStackParamList, 'ResultadoScanner'>;

export default function ResultadoScannerScreen() {
  const navigation = useNavigation<Nav>();
  const { codigo } = useRoute<Rota>().params;
  const [res, setRes] = useState<ResultadoBusca | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const registrado = useRef<number>(-1);

  useEffect(() => {
    let ativo = true;
    setRes(null);
    buscarProduto(codigo, { ignorarCacheNegativo: tentativa > 0 }).then((r) => {
      if (!ativo) return;
      setRes(r);
      if (registrado.current !== tentativa) { // 1 evento por busca, mesmo se a tela re-renderizar
        registrado.current = tentativa;
        registrarLeitura(r.status, r.status === 'encontrado' ? r.produto : undefined);
      }
    });
    return () => { ativo = false; };
  }, [codigo, tentativa]);

  const novaLeitura = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.cabecalho}>
        <BackButton onPress={novaLeitura} />
        <AppText style={styles.titulo}>Resultado</AppText>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        {res === null && <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 48 }} />}

        {res?.status === 'encontrado' && <Encontrado produto={res.produto} />}

        {res?.status === 'invalido' && (
          <View style={styles.bloco}>
            <MaterialCommunityIcons name="barcode-scan" size={44} color={colors.primaryDark} />
            <AppText style={styles.tituloBloco}>Não deu para ler o código direito</AppText>
            <AppText style={styles.texto}>Tente de novo com o código bem enquadrado e boa luz.</AppText>
          </View>
        )}

        {res?.status === 'indisponivel' && (
          <View style={styles.bloco}>
            <MaterialCommunityIcons name="wifi-off" size={44} color={colors.primaryDark} />
            <AppText style={styles.tituloBloco}>Não conseguimos consultar agora</AppText>
            <AppText style={styles.texto}>
              A conexão ou a base de produtos está instável, então ainda não dá para saber se ele existe. Código: {codigo}
            </AppText>
            <AppButton label="Tentar de novo" onPress={() => setTentativa((n) => n + 1)} />
          </View>
        )}

        {res?.status === 'nao_encontrado' && (
          <View style={styles.bloco}>
            <MaterialCommunityIcons name="barcode-off" size={44} color={colors.primaryDark} />
            <AppText style={styles.tituloBloco}>
              {res.motivo === 'FICHA_INCOMPLETA' ? 'Esse produto está com a ficha incompleta' : 'Não achamos esse produto por aqui'}
            </AppText>
            <AppText style={styles.texto}>
              {res.motivo === 'FICHA_INCOMPLETA'
                ? 'Ele existe na base, mas sem nome. Você pode avisar a nossa equipe para completar. '
                : 'Ele ainda não está na nossa lista. Você pode pedir para a nossa equipe cadastrar. '}
              Código: {codigo}
            </AppText>
            <AppButton
              label="Pedir cadastro à equipe"
              onPress={() => navigation.navigate('CadastroProdutoScanner', { codigo, motivo: res.motivo })}
            />
            <AppButton
              label="Tentar de novo"
              backgroundColor={colors.white}
              textColor={colors.primaryDark}
              outlineColor={colors.primaryDark}
              onPress={() => setTentativa((n) => n + 1)}
            />
            <AppButton
              label="Buscar por nome"
              backgroundColor={colors.white}
              textColor={colors.primaryDark}
              outlineColor={colors.primaryDark}
              onPress={() => navigation.navigate('TipoRefeicao')}
            />
          </View>
        )}
      </ScrollView>

      {res !== null && (
        <View style={styles.rodape}>
          <AppButton label="Escanear outro produto" onPress={novaLeitura} />
        </View>
      )}
    </SafeAreaView>
  );
}

function Encontrado({ produto }: { produto: ProdutoScanner }) {
  const navigation = useNavigation<Nav>();
  const modo = modoDoResultado(produto);
  const resumo = resumoDiagnostico(produto);
  const imagem = produto.detalhes?.imagemUrl ?? null;
  const [imgErro, setImgErro] = useState(false);

  return (
    <View style={{ gap: 16 }}>
      <View style={styles.cartao}>
        <View style={styles.heroLinha}>
          {!!imagem && !imgErro && (
            <Image source={{ uri: imagem }} style={styles.foto} resizeMode="contain" onError={() => setImgErro(true)} />
          )}
          <View style={{ flex: 1, gap: 4 }}>
            <AppText style={styles.nome}>{produto.nome}</AppText>
            {!!produto.marca && <AppText style={styles.marca}>{produto.marca}</AppText>}
          </View>
        </View>
        {resumo.length > 0 && (
          <View style={styles.resumo}>
            {resumo.map((t) => <View key={t} style={styles.chip}><AppText style={styles.chipTexto}>{t}</AppText></View>)}
          </View>
        )}
      </View>

      <DiagnosticoProduto produto={produto} />

      {modo === 'SEM_CLASSIFICACAO' && (
        <AppButton
          label="Avisar a equipe para completar"
          backgroundColor={colors.white}
          textColor={colors.primaryDark}
          outlineColor={colors.primaryDark}
          onPress={() => navigation.navigate('CadastroProdutoScanner', { codigo: produto.codigoBarras, motivo: 'FICHA_INCOMPLETA' })}
        />
      )}

      {modo === 'POSITIVO' && (
        <View style={styles.positivo}>
          <MaterialCommunityIcons name="check-circle-outline" size={26} color={colors.primaryDark} />
          <AppText style={styles.positivoTexto}>Esse produto combina com a sua rotina. Bom apetite!</AppText>
        </View>
      )}

      {modo === 'ALTERNATIVAS' && produto.categoriaTroca && <Alternativas categoria={produto.categoriaTroca} />}

      {modo === 'SEM_CATEGORIA' && (
        <AppButton
          label="Ver ideias de trocas"
          backgroundColor={colors.white}
          textColor={colors.primaryDark}
          outlineColor={colors.primaryDark}
          onPress={() => navigation.navigate('SugestoesAlimentares')}
        />
      )}
    </View>
  );
}

function Alternativas({ categoria }: { categoria: NonNullable<ProdutoScanner['categoriaTroca']> }) {
  const navigation = useNavigation<Nav>();
  const [trocas, setTrocas] = useState<Troca[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    listarTrocas(categoria)
      .then((l) => { if (ativo) setTrocas(l); })
      .catch((e) => { console.error('Scanner: trocas indisponíveis:', e); if (ativo) setErro(true); });
    return () => { ativo = false; };
  }, [categoria]);

  const opcoes = semDestinoRepetido(ordenarTrocas((trocas ?? []).filter((t) => t.categoria === categoria)));

  return (
    <View style={{ gap: 12 }}>
      <AppText style={styles.tituloBloco}>Que tal estas opções de {ROTULO_CATEGORIA[categoria].toLowerCase()}?</AppText>
      {trocas === null && !erro && <ActivityIndicator color={colors.primary} />}
      {erro && <AppText style={styles.texto}>Não deu para carregar as sugestões agora. Tente de novo daqui a pouco.</AppText>}
      {trocas !== null && opcoes.length === 0 && (
        <AppText style={styles.texto}>Ainda não temos sugestões nessa categoria. Em breve tem novidade!</AppText>
      )}
      {opcoes.length > 0 && (
        <AlternativasLista
          categoria={categoria}
          itens={opcoes.map((t) => ({ id: t.id, nome: t.destinoNome, explicacao: t.frase, dica: t.dica, nutrientes: t.nutrientes, rapida: t.rapida }))}
        />
      )}
      <AppButton
        label="Ver todas as sugestões"
        backgroundColor={colors.white}
        textColor={colors.primaryDark}
        outlineColor={colors.primaryDark}
        onPress={() => navigation.navigate('SugestoesAlimentares', { categoria })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  cabecalho: { marginTop: 30, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 12 },
  titulo: { flex: 1, textAlign: 'center', fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark },
  conteudo: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },
  rodape: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, backgroundColor: colors.white },
  bloco: { alignItems: 'center', gap: 14, marginTop: 24 },
  tituloBloco: { fontFamily: typography.bold, fontSize: 17, color: colors.primaryDark, textAlign: 'center' },
  texto: { fontFamily: typography.regular, fontSize: 14, lineHeight: 20, color: '#5A6B63' },
  cartao: { backgroundColor: '#F2F7F4', borderRadius: 20, padding: 18, gap: 12 },
  heroLinha: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  foto: { width: 76, height: 76, borderRadius: 14, backgroundColor: '#fff' },
  resumo: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nome: { fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark },
  marca: { fontFamily: typography.regular, fontSize: 14, color: '#7A8B94' },
  chip: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  chipTexto: { fontFamily: typography.bold, fontSize: 12, color: '#2E3A45' },
  positivo: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#E9F7EF', borderRadius: 16, padding: 14 },
  positivoTexto: { flex: 1, fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
});
