// src/features/adolescente/alimentacao/screens/NovoAlimentoFormScreen.tsx
//
// Cadastro de alimento, passo 2: nome + grupos alimentares.
//   - Natural: escolhe 1 grupo.
//   - Preparado em casa / industrializado: marca de 1 a 5 grupos (ingredientes principais).
// Tocar numa categoria só MARCA; quem salva é o botão do rodapé (antes, o toque já salvava).
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { typography } from '../../../../shared/theme/typography';
import { colors } from '../../../../shared/theme/colors';
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader';
import { ProgressoCadastro } from '../components/ProgressoCadastro';
import GuiaCadastroAlimentoSheet from '../components/GuiaCadastroAlimentoSheet';
import { criarAlimento, buscarAlimentos, NomeAlimentoInvalidoError, GruposAlimentoInvalidosError, type Alimento } from '../services/alimentacaoService';
import { ehErroDeRede } from '../../../../shared/offline/erroRede';
import { validarNomeAlimento, NOME_ALIMENTO_MAX } from '../utils/nomeAlimento';
import type { ClassificacaoNova } from '../utils/regraFeedbackRefeicao';
import {
  CATEGORIAS,
  GUIA_CADASTRO,
  alternarGrupo,
  gruposDosIngredientes,
  normalizarGrupos,
  regraGrupos,
  rotuloCategoria,
  textoBotaoCadastro,
  type OrigemAlimento,
} from '../utils/categoriasAlimento';
import { INFO_ORIGEM } from './NovoAlimentoOrigemScreen';
import { InfoButton } from '../../../../shared/ui/InfoButton';
import { InfoSheet } from '../../../../shared/ui/InfoSheet';
import { buscarGruposAlimentaresInfo, GrupoAlimentarInfo } from '../services/gruposAlimentaresService';
import { useAuth } from '../../../../shared/contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'NovoAlimentoForm'>;
type RouteProps = RouteProp<AdolescenteStackParamList, 'NovoAlimentoForm'>;

function classificacaoPorOrigem(origem: OrigemAlimento): ClassificacaoNova {
  switch (origem) {
    case 'NATURAL':
      return 'IN_NATURA';
    case 'PREPARADO_EM_CASA':
      return 'PROCESSADO';
    case 'INDUSTRIALIZADO':
      return 'ULTRAPROCESSADO';
  }
}

export default function NovoAlimentoFormScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { params } = useRoute<RouteProps>();
  const { userId } = useAuth();

  const origemEscolhida = params.origem;
  const regra = regraGrupos(origemEscolhida);
  const guia = GUIA_CADASTRO[origemEscolhida];
  const origem = INFO_ORIGEM[origemEscolhida];

  const [nome, setNome] = useState('');
  const [nomeTocado, setNomeTocado] = useState(false);
  const [grupos, setGrupos] = useState<string[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  // só no "preparado em casa": ingredientes buscados no catálogo; os grupos vêm deles
  const [ingredientes, setIngredientes] = useState<Alimento[]>([]);
  const [termoIng, setTermoIng] = useState('');
  const [resultadosIng, setResultadosIng] = useState<Alimento[]>([]);
  const [buscandoIng, setBuscandoIng] = useState(false);
  const porIngredientes = origemEscolhida === 'PREPARADO_EM_CASA';
  const [salvando, setSalvando] = useState(false);
  const salvandoRef = useRef(false); // trava toque duplo antes do React re-renderizar
  const [gruposInfo, setGruposInfo] = useState<Record<string, GrupoAlimentarInfo>>({});
  const [infoAberta, setInfoAberta] = useState<string | null>(null); // valor da categoria
  const [guiaAberto, setGuiaAberto] = useState(false);

  useEffect(() => {
    buscarGruposAlimentaresInfo().then(setGruposInfo).catch(() => setGruposInfo({}));
  }, []);

  // voltou do "Alimento cadastrado" pelo botão de voltar: destrava o formulário
  useEffect(() => {
    const sub = navigation.addListener('focus', () => {
      salvandoRef.current = false;
      setSalvando(false);
    });
    return sub;
  }, [navigation]);

  // o aviso some sozinho
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  // busca de ingrediente (com pausa de 300 ms para não consultar a cada letra)
  useEffect(() => {
    const termo = termoIng.trim();
    if (!porIngredientes || !userId || termo.length < 2) {
      setResultadosIng([]);
      setBuscandoIng(false);
      return;
    }
    let ativo = true;
    setBuscandoIng(true);
    const t = setTimeout(async () => {
      try {
        const r = await buscarAlimentos(termo, userId);
        if (ativo) setResultadosIng(r.filter((a) => !ingredientes.some((i) => i.id === a.id)).slice(0, 6));
      } catch {
        if (ativo) setResultadosIng([]);
      } finally {
        if (ativo) setBuscandoIng(false);
      }
    }, 300);
    return () => {
      ativo = false;
      clearTimeout(t);
    };
  }, [termoIng, porIngredientes, userId, ingredientes]);

  const erroNome = nome.length > 0 ? validarNomeAlimento(nome) : null;
  const nomeValido = nome.trim().length > 0 && validarNomeAlimento(nome) === null;
  // grupos que vêm dos ingredientes + os marcados na mão (para o que não está no catálogo)
  const gruposDerivados = porIngredientes ? gruposDosIngredientes(ingredientes) : [];
  const gruposFinais = normalizarGrupos([...gruposDerivados, ...grupos]);
  const podeSalvar = nomeValido && gruposFinais.length > 0 && !salvando && !!userId;

  function aoTocarGrupo(valor: string) {
    if (salvando) return;
    if (gruposDerivados.includes(valor)) {
      setAviso('Esse grupo veio de um ingrediente. Para tirar, remova o ingrediente.');
      return;
    }
    const novos = alternarGrupo(gruposFinais, valor, origemEscolhida);
    setGrupos(novos.filter((g) => !gruposDerivados.includes(g)));
    setAviso(null);
  }

  function adicionarIngrediente(a: Alimento) {
    setIngredientes((atuais) => (atuais.some((i) => i.id === a.id) ? atuais : [...atuais, a]));
    setTermoIng('');
    setResultadosIng([]);
  }

  function removerIngrediente(id: string) {
    setIngredientes((atuais) => atuais.filter((i) => i.id !== id));
  }

  async function salvar() {
    if (!podeSalvar || salvandoRef.current || !userId) return;
    salvandoRef.current = true;
    setSalvando(true);
    try {
      const { alimento, jaExistia } = await criarAlimento({
        nome,
        classificacaoNova: classificacaoPorOrigem(origemEscolhida),
        gruposAlimentares: gruposFinais,
        userId,
      });
      navigation.navigate('AlimentoCadastrado', {
        tipo: params.tipo,
        nomeRefeicao: params.nomeRefeicao,
        alimento,
        jaExistia,
      });
    } catch (erro) {
      console.error('Erro ao cadastrar alimento:', erro);
      salvandoRef.current = false;
      setSalvando(false);
      if (erro instanceof NomeAlimentoInvalidoError) {
        setNomeTocado(true);
        Alert.alert('Confira o nome', erro.message);
      } else if (erro instanceof GruposAlimentoInvalidosError) {
        Alert.alert('Confira os grupos', erro.message);
      } else if (ehErroDeRede(erro)) {
        // cadastro de alimento novo exige internet (não entra na fila offline)
        Alert.alert('Sem internet', 'Para cadastrar um alimento novo é preciso estar com internet. Tente de novo quando a conexão voltar.');
      } else {
        Alert.alert('Não deu pra cadastrar', 'Algo deu errado ao salvar esse alimento. Tenta de novo em instantes.');
      }
    }
  }

  const textoBotao = textoBotaoCadastro({ nomeValido, qtdGrupos: gruposFinais.length, multiplo: regra.multiplo });
  const iconesGrupos = Object.fromEntries(Object.values(gruposInfo).map((g) => [g.grupo, g.icone]));

  return (
    <SafeAreaView style={styles.tela}>
      <ScreenHeader
        titulo="Novo alimento"
        subtitulo="Passo 2 de 2"
        onVoltar={() => navigation.goBack()}
        larguraLateral={92}
        direita={
          <View style={styles.topoDireita}>
            <InfoButton onPress={() => setGuiaAberto(true)} accessibilityLabel="Como preencher" />
            <Pressable onPress={() => navigation.popToTop()} style={styles.botaoFechar} accessibilityRole="button" accessibilityLabel="Cancelar cadastro" hitSlop={8}>
              <Ionicons name="close" size={16} color={colors.primaryDark} />
            </Pressable>
          </View>
        }
      />
      <ProgressoCadastro passo={2} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          // 1º toque com o teclado aberto não pode ser "engolido" só para fechar o teclado
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.conteudo}
        >
          <View style={[styles.origemPilula, { backgroundColor: origem.fundo }]}>
            <Ionicons name={origem.icone} size={14} color={origem.cor} />
            <AppText style={[styles.origemTexto, { color: origem.cor }]}>{origem.titulo}</AppText>
          </View>

          {/* 1. nome */}
          <AppText style={styles.titulo}>Como ele se chama?</AppText>
          <View style={[styles.campo, nomeValido && styles.campoPreenchido, !!erroNome && nomeTocado && styles.campoErro]}>
            <TextInput
              style={styles.input}
              placeholder={guia.placeholderNome}
              placeholderTextColor="#8A9A93"
              value={nome}
              onChangeText={setNome}
              onBlur={() => setNomeTocado(true)}
              maxLength={NOME_ALIMENTO_MAX}
              autoCapitalize="sentences"
              editable={!salvando}
              returnKeyType="done"
              accessibilityLabel="Nome do alimento"
            />
            {nomeValido ? (
              <Ionicons name="checkmark-circle" size={20} color="#2E7D4F" />
            ) : (
              <AppText style={styles.contador}>{nome.length}/{NOME_ALIMENTO_MAX}</AppText>
            )}
          </View>
          {!!erroNome && nomeTocado ? (
            <View style={styles.linhaMsg} accessibilityLiveRegion="polite">
              <Ionicons name="alert-circle" size={14} color={colors.error} />
              <AppText style={[styles.msg, { color: colors.error }]}>{erroNome}</AppText>
            </View>
          ) : (
            <View style={styles.linhaMsg}>
              <Ionicons name="lock-closed" size={13} color="#5B6B75" />
              <AppText style={styles.msg}>Esse alimento fica só no seu app, ninguém mais vê.</AppText>
            </View>
          )}

          {/* 2. grupos */}
          <View style={styles.secaoTopo}>
            <AppText style={styles.subtitulo}>{guia.tituloGrupos}</AppText>
            {regra.multiplo && (
              <View style={styles.contagem} accessibilityLabel={`${gruposFinais.length} grupos marcados`}>
                <AppText style={styles.contagemTexto}>{gruposFinais.length === 1 ? '1 marcado' : `${gruposFinais.length} marcados`}</AppText>
              </View>
            )}
          </View>
          <AppText style={styles.ajuda}>{guia.subtituloGrupos}</AppText>

          <Pressable
            style={({ pressed }) => [styles.exemploCard, pressed && { opacity: 0.85 }]}
            onPress={() => setGuiaAberto(true)}
            accessibilityRole="button"
            accessibilityLabel={`Exemplo: ${guia.resumoExemplo}. Toque para ver o passo a passo`}
          >
            <View style={styles.exemploIcone}>
              <Ionicons name="bulb" size={18} color="#B7791F" />
            </View>
            <View style={styles.flex}>
              <AppText style={styles.exemploRotulo}>Exemplo</AppText>
              <AppText style={styles.exemploTexto}>{guia.resumoExemplo}</AppText>
            </View>
            <View style={styles.exemploLink}>
              <AppText style={styles.exemploLinkTexto}>Ver guia</AppText>
              <Ionicons name="chevron-forward" size={14} color="#B7791F" />
            </View>
          </Pressable>

          {!!aviso && (
            <View style={styles.avisoLimite} accessibilityLiveRegion="polite">
              <Ionicons name="information-circle" size={16} color="#B7791F" />
              <AppText style={styles.avisoLimiteTexto}>{aviso}</AppText>
            </View>
          )}

          {porIngredientes && (
            <View style={styles.ingBloco}>
              <AppText style={styles.ingTitulo}>Ingredientes principais</AppText>
              <View style={styles.ingCampo}>
                <Ionicons name="search" size={16} color="#8A9A93" />
                <TextInput
                  style={styles.ingInput}
                  placeholder="Buscar ingrediente (ex.: cenoura)"
                  placeholderTextColor="#8A9A93"
                  value={termoIng}
                  onChangeText={setTermoIng}
                  editable={!salvando}
                  autoCorrect={false}
                  accessibilityLabel="Buscar ingrediente"
                />
                {buscandoIng && <ActivityIndicator size="small" color={colors.primaryShadow} />}
              </View>

              {resultadosIng.length > 0 && (
                <View style={styles.ingResultados}>
                  {resultadosIng.map((a) => (
                    <Pressable
                      key={a.id}
                      style={({ pressed }) => [styles.ingResultado, pressed && { backgroundColor: '#EFF9E3' }]}
                      onPress={() => adicionarIngrediente(a)}
                      accessibilityRole="button"
                      accessibilityLabel={`Adicionar ${a.nome}`}
                    >
                      <View style={styles.flex}>
                        <AppText style={styles.ingResultadoNome} numberOfLines={1}>{a.nome}</AppText>
                        <AppText style={styles.ingResultadoGrupos} numberOfLines={1}>
                          {(a.grupos_alimentares ?? []).map(rotuloCategoria).join(' · ')}
                        </AppText>
                      </View>
                      <Ionicons name="add-circle" size={22} color={colors.primaryShadow} />
                    </Pressable>
                  ))}
                </View>
              )}
              {termoIng.trim().length >= 2 && !buscandoIng && resultadosIng.length === 0 && (
                <AppText style={styles.ingVazio}>Não achei esse ingrediente. Marque o grupo dele na mão, logo abaixo.</AppText>
              )}

              {ingredientes.length > 0 && (
                <View style={styles.ingChips}>
                  {ingredientes.map((i) => (
                    <Pressable
                      key={i.id}
                      style={styles.ingChip}
                      onPress={() => removerIngrediente(i.id)}
                      disabled={salvando}
                      accessibilityRole="button"
                      accessibilityLabel={`Remover ${i.nome}`}
                    >
                      <AppText style={styles.ingChipTexto} numberOfLines={1}>{i.nome}</AppText>
                      <Ionicons name="close-circle" size={16} color="#7A8B94" />
                    </Pressable>
                  ))}
                </View>
              )}
              <AppText style={styles.ingManual}>Não achou? Marque o grupo na mão:</AppText>
            </View>
          )}

          <View style={styles.grade}>
            {CATEGORIAS.map((item) => {
              const marcado = gruposFinais.includes(item.valor);
              const deIngrediente = gruposDerivados.includes(item.valor);
              const icone = (gruposInfo[item.valor]?.icone as any) ?? 'restaurant-outline';
              return (
                <Pressable
                  key={item.valor}
                  style={({ pressed }) => [
                    styles.tile,
                    marcado && styles.tileMarcado,
                    pressed && styles.tilePressionado,
                  ]}
                  onPress={() => aoTocarGrupo(item.valor)}
                  disabled={salvando}
                  accessibilityRole={regra.multiplo ? 'checkbox' : 'radio'}
                  accessibilityState={{ checked: marcado, disabled: salvando }}
                  accessibilityLabel={`${item.rotulo}. ${item.exemplo}`}
                >
                  <View style={styles.tileTopo}>
                    <View style={[styles.tileIcone, marcado && { backgroundColor: colors.primary }]}>
                      <Ionicons name={icone} size={22} color={marcado ? colors.primaryDark : '#2E7D4F'} />
                    </View>
                    <View style={[regra.multiplo ? styles.caixa : styles.bolinha, marcado && styles.marcadorLigado]}>
                      {marcado && <Ionicons name="checkmark" size={15} color={colors.primaryDark} />}
                    </View>
                  </View>
                  <View style={styles.tileTituloLinha}>
                    <AppText style={styles.tileTitulo}>{item.rotulo}</AppText>
                    <Pressable
                      hitSlop={10}
                      onPress={() => setInfoAberta(item.valor)}
                      accessibilityRole="button"
                      accessibilityLabel={`Saiba mais sobre ${item.rotulo}`}
                    >
                      <Ionicons name="information-circle-outline" size={19} color="#7A8B94" />
                    </Pressable>
                  </View>
                  <AppText style={styles.tileExemplo} numberOfLines={2}>{deIngrediente ? 'veio de um ingrediente' : item.exemplo}</AppText>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* rodapé fixo: mostra o que já foi marcado e salva */}
        <View style={styles.rodape}>
          {gruposFinais.length > 0 && (
            <View style={styles.resumo}>
              <Ionicons name="restaurant-outline" size={14} color="#2E7D4F" />
              <AppText style={styles.resumoTexto} numberOfLines={2}>
                {gruposFinais.map(rotuloCategoria).join(' · ')}
              </AppText>
            </View>
          )}
          <Pressable
            style={({ pressed }) => [styles.botao, !podeSalvar && !salvando && styles.botaoDesligado, pressed && podeSalvar && styles.botaoPressionado]}
            onPress={salvar}
            disabled={!podeSalvar}
            accessibilityRole="button"
            accessibilityState={{ disabled: !podeSalvar, busy: salvando }}
            accessibilityLabel={salvando ? 'Cadastrando alimento' : textoBotao}
          >
            {salvando ? (
              <ActivityIndicator size="small" color={colors.primaryDark} />
            ) : (
              <AppText style={[styles.botaoTexto, !podeSalvar && styles.botaoTextoDesligado]}>{textoBotao}</AppText>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <GuiaCadastroAlimentoSheet
        visivel={guiaAberto}
        onFechar={() => setGuiaAberto(false)}
        origemInicial={origemEscolhida}
        iconesGrupos={iconesGrupos}
      />

      {infoAberta && gruposInfo[infoAberta] && (
        <InfoSheet
          visivel
          onFechar={() => setInfoAberta(null)}
          titulo={gruposInfo[infoAberta].titulo_amigavel}
          icone={gruposInfo[infoAberta].icone as any}
          explicacao={gruposInfo[infoAberta].explicacao}
          exemplo={gruposInfo[infoAberta].exemplo}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tela: { flex: 1, backgroundColor: '#F6FAF1' },
  topoDireita: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  botaoFechar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E2F3D3', alignItems: 'center', justifyContent: 'center' },
  conteudo: { paddingHorizontal: 20, paddingBottom: 24 },

  origemPilula: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 14, paddingVertical: 6, paddingHorizontal: 12, marginBottom: 14 },
  origemTexto: { fontFamily: typography.bold, fontSize: 12 },

  titulo: { fontFamily: typography.bold, fontSize: 24, lineHeight: 30, color: colors.primaryDark, marginBottom: 12 },
  campo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, borderRadius: 18, borderWidth: 1.5, borderColor: '#DDE8D2', borderBottomWidth: 4, paddingHorizontal: 16 },
  campoPreenchido: { borderColor: colors.primary },
  campoErro: { borderColor: colors.error },
  input: { flex: 1, fontFamily: typography.medium, fontSize: 16, color: colors.primaryDark, paddingVertical: 14 },
  contador: { fontFamily: typography.regular, fontSize: 11, color: '#8A9A93' },
  linhaMsg: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  msg: { flex: 1, fontFamily: typography.regular, fontSize: 12, color: '#5B6B75' },

  secaoTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28 },
  subtitulo: { flex: 1, fontFamily: typography.bold, fontSize: 19, color: colors.primaryDark },
  contagem: { backgroundColor: '#E2F3D3', borderRadius: 12, paddingVertical: 3, paddingHorizontal: 10 },
  contagemTexto: { fontFamily: typography.bold, fontSize: 12, color: '#2E7D4F' },
  ajuda: { fontFamily: typography.regular, fontSize: 13, lineHeight: 19, color: '#5B6B75', marginTop: 4 },

  exemploCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF7E3', borderRadius: 16, borderWidth: 1.5, borderColor: '#F4DFA8', padding: 12, marginTop: 12 },
  exemploIcone: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFEFCF', alignItems: 'center', justifyContent: 'center' },
  exemploRotulo: { fontFamily: typography.bold, fontSize: 11, color: '#B7791F' },
  exemploTexto: { fontFamily: typography.medium, fontSize: 13, lineHeight: 18, color: '#5A4A1E' },
  exemploLink: { flexDirection: 'row', alignItems: 'center' },
  exemploLinkTexto: { fontFamily: typography.bold, fontSize: 12, color: '#B7791F' },

  avisoLimite: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#FFEFCF', borderRadius: 14, padding: 10, marginTop: 12 },
  avisoLimiteTexto: { flex: 1, fontFamily: typography.medium, fontSize: 12, lineHeight: 17, color: '#7A5513' },

  ingBloco: { marginTop: 16, gap: 8 },
  ingTitulo: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  ingCampo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1.5, borderColor: '#DDE8D2', paddingHorizontal: 12 },
  ingInput: { flex: 1, fontFamily: typography.medium, fontSize: 14, color: colors.primaryDark, paddingVertical: 11 },
  ingResultados: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1.5, borderColor: '#DDE8D2', overflow: 'hidden' },
  ingResultado: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#EEF3E8' },
  ingResultadoNome: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  ingResultadoGrupos: { fontFamily: typography.regular, fontSize: 11, color: '#7A8B94', marginTop: 1 },
  ingVazio: { fontFamily: typography.regular, fontSize: 12, lineHeight: 17, color: '#B7791F' },
  ingChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ingChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E2F3D3', borderRadius: 14, paddingVertical: 7, paddingLeft: 12, paddingRight: 8, maxWidth: '100%' },
  ingChipTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark, flexShrink: 1 },
  ingManual: { fontFamily: typography.medium, fontSize: 12, color: '#5B6B75', marginTop: 6 },

  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  tile: { width: '47.8%', flexGrow: 1, minHeight: 128, backgroundColor: colors.white, borderRadius: 20, borderWidth: 1.5, borderColor: '#DDE8D2', borderBottomWidth: 4, padding: 12 },
  tileMarcado: { backgroundColor: '#EFF9E3', borderColor: colors.primary },
  tilePressionado: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
  tileTopo: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  tileIcone: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E2F3D3', alignItems: 'center', justifyContent: 'center' },
  caixa: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: '#C9D6C0', alignItems: 'center', justifyContent: 'center' },
  bolinha: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#C9D6C0', alignItems: 'center', justifyContent: 'center' },
  marcadorLigado: { backgroundColor: colors.primary, borderColor: colors.primaryShadow },
  tileTituloLinha: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4, marginTop: 10 },
  tileTitulo: { flex: 1, fontFamily: typography.bold, fontSize: 14, lineHeight: 18, color: colors.primaryDark },
  tileExemplo: { fontFamily: typography.regular, fontSize: 11, lineHeight: 15, color: '#7A8B94', marginTop: 3 },

  rodape: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, backgroundColor: '#F6FAF1', borderTopWidth: 1, borderTopColor: '#E3EDD9', gap: 8 },
  resumo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resumoTexto: { flex: 1, fontFamily: typography.medium, fontSize: 12, lineHeight: 16, color: '#3F4F47' },
  botao: { alignItems: 'center', justifyContent: 'center', minHeight: 52, borderRadius: 18, backgroundColor: colors.primary, borderBottomWidth: 4, borderBottomColor: colors.primaryShadow },
  botaoDesligado: { backgroundColor: '#E3EDD9', borderBottomColor: '#CFDCC2' },
  botaoPressionado: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
  botaoTexto: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  botaoTextoDesligado: { color: '#7A8B94' },
});
