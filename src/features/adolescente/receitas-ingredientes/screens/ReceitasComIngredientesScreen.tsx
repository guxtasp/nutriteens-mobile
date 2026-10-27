// src/features/adolescente/receitas-ingredientes/screens/ReceitasComIngredientesScreen.tsx
// "Receitas com o que tenho" (RF023 a RF029), um canto próprio dentro de Comer:
//  1) o adolescente diz o que tem em casa (autocomplete, editável a qualquer momento);
//  2) vê as receitas da que mais combina para a que menos combina, com o que tem e o que falta;
//  3) se não gostar de nenhuma, vê outras receitas mesmo sem combinação.
// Sem ingrediente nenhum, mostra todas as receitas da mais fácil para a mais difícil.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { BackButton } from '../../../../shared/ui/BackButton';
import { FiltroChips } from '../../../../shared/ui/FiltroChips';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { listarReceitasComIngredientes, type ReceitaComIngredientes } from '../../alimentacao/services/receitasService';
import ReceitaDetalheSheet from '../../alimentacao/components/ReceitaDetalheSheet';
import { EnviarReceitaSheet } from '../../social/components/EnviarReceitaSheet';
import {
  outrasReceitas,
  receitasQueCombinam,
  sugerirIngredientes,
  todasPorDificuldade,
  universoDeIngredientes,
  type IngredienteCasa,
  type ReceitaPontuada,
} from '../utils/combinarReceitas';
import { lerDespensa, salvarDespensa } from '../utils/despensa';
import {
  FILTRO_RECEITA_VAZIO,
  OPCOES_TEMPO_MIN,
  filtrarReceitas,
  type Dificuldade,
  type FiltroReceita,
} from '../../alimentacao/utils/filtrosAlimento';

type Nav = NativeStackNavigationProp<AdolescenteStackParamList, 'ReceitasIngredientes'>;
type Etapa = 'ingredientes' | 'resultados';
type Modo = 'combinam' | 'outras';

const ROTULO_DIFICULDADE: Record<string, string> = { FACIL: 'Fácil', MEDIO: 'Médio', DIFICIL: 'Difícil' };
const OPCOES_DIFICULDADE = (['FACIL', 'MEDIO', 'DIFICIL'] as Dificuldade[]).map((d) => ({ chave: d, label: ROTULO_DIFICULDADE[d] }));
const OPCOES_TEMPO = OPCOES_TEMPO_MIN.map((m) => ({ chave: String(m), label: `Até ${m} min` }));

export default function ReceitasComIngredientesScreen() {
  const navigation = useNavigation<Nav>();
  const { userId } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [receitas, setReceitas] = useState<ReceitaComIngredientes[]>([]);
  const [despensa, setDespensa] = useState<IngredienteCasa[]>([]);
  const [etapa, setEtapa] = useState<Etapa>('ingredientes');
  const [modo, setModo] = useState<Modo>('combinam');
  const [termo, setTermo] = useState('');
  const [filtro, setFiltro] = useState<FiltroReceita>(FILTRO_RECEITA_VAZIO);
  const [aberta, setAberta] = useState<ReceitaComIngredientes | null>(null);
  const [paraEnviar, setParaEnviar] = useState<{ id: string; titulo: string } | null>(null);

  const carregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    setErro(null);
    try {
      const [lista, guardada] = await Promise.all([listarReceitasComIngredientes(userId), lerDespensa(userId)]);
      setReceitas(lista);
      setDespensa(guardada);
      // quem já informou ingredientes antes vai direto para as receitas (e pode editar quando quiser)
      setEtapa(guardada.length > 0 ? 'resultados' : 'ingredientes');
    } catch (e) {
      console.error('Erro ao carregar receitas:', e);
      setErro('Não deu pra carregar as receitas agora. Confira a internet e tente de novo.');
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const universo = useMemo(() => universoDeIngredientes(receitas), [receitas]);
  const sugestoes = useMemo(() => sugerirIngredientes(universo, termo, despensa), [universo, termo, despensa]);

  function mudarDespensa(nova: IngredienteCasa[]) {
    setDespensa(nova);
    setModo('combinam');
    if (userId) void salvarDespensa(userId, nova);
  }

  function adicionar(ingrediente: IngredienteCasa) {
    mudarDespensa([...despensa, ingrediente]);
    setTermo('');
  }

  function remover(id: string) {
    mudarDespensa(despensa.filter((i) => i.id !== id));
  }

  const pontuadas: ReceitaPontuada<ReceitaComIngredientes>[] = useMemo(() => {
    const base =
      despensa.length === 0
        ? todasPorDificuldade(receitas)
        : modo === 'combinam'
          ? receitasQueCombinam(receitas, despensa)
          : outrasReceitas(receitas, despensa);
    return base.filter((p) => filtrarReceitas([p.receita], filtro).length > 0);
  }, [receitas, despensa, modo, filtro]);

  const filtroAtivo = filtro.dificuldade !== null || filtro.tempoMaxMin !== null;

  // ---------- etapa 1: o que você tem em casa ----------
  function renderIngredientes() {
    return (
      <View style={styles.corpo}>
        <AppText style={styles.pergunta}>O que você tem em casa?</AppText>
        <AppText style={styles.dica}>Digite um ingrediente e toque para adicionar. Dá pra mudar a lista quando quiser.</AppText>

        <View style={styles.buscaCaixa}>
          <Ionicons name="search" size={18} color="#7A8B94" />
          <TextInput
            style={styles.buscaInput}
            placeholder="Ex.: ovo, banana, arroz..."
            placeholderTextColor="#7A8B94"
            value={termo}
            onChangeText={setTermo}
            autoCorrect={false}
          />
          {termo.length > 0 && (
            <Pressable onPress={() => setTermo('')} accessibilityLabel="Limpar busca" hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#7A8B94" />
            </Pressable>
          )}
        </View>

        {termo.trim().length > 0 && (
          <View style={styles.sugestoesCaixa}>
            {sugestoes.length === 0 ? (
              <AppText style={styles.vazioTexto}>Não achei "{termo.trim()}" nas nossas receitas. Tenta outro nome.</AppText>
            ) : (
              sugestoes.map((s) => (
                <Pressable key={s.id} style={styles.sugestaoItem} onPress={() => adicionar(s)}>
                  <AppText style={styles.sugestaoTexto}>{s.nome}</AppText>
                  <Ionicons name="add-circle" size={22} color={colors.primary} />
                </Pressable>
              ))
            )}
          </View>
        )}

        <AppText style={styles.secao}>{despensa.length > 0 ? `Você tem (${despensa.length})` : 'Você ainda não adicionou nada'}</AppText>
        <View style={styles.chipsDespensa}>
          {despensa.map((i) => (
            <Pressable key={i.id} style={styles.chipDespensa} onPress={() => remover(i.id)} accessibilityLabel={`Remover ${i.nome}`}>
              <AppText style={styles.chipDespensaTexto}>{i.nome}</AppText>
              <Ionicons name="close" size={14} color={colors.primaryDark} />
            </Pressable>
          ))}
        </View>

        <View style={{ flex: 1 }} />
        <Pressable style={styles.botaoPrimario} onPress={() => { setModo('combinam'); setEtapa('resultados'); }}>
          <AppText style={styles.botaoPrimarioTexto}>
            {despensa.length > 0 ? 'Ver receitas' : 'Pular e ver todas as receitas'}
          </AppText>
        </Pressable>
      </View>
    );
  }

  // ---------- etapa 2: receitas ----------
  const renderCartao = useCallback(
    ({ item }: { item: ReceitaPontuada<ReceitaComIngredientes> }) => {
      const r = item.receita;
      const total = r.ingredientes.length;
      const tem = item.tenho.length;
      const mostraProgresso = despensa.length > 0 && total > 0;
      return (
        <Pressable style={styles.cartao} onPress={() => setAberta(r)}>
          <View style={styles.cartaoTopo}>
            <AppText style={styles.cartaoTitulo} numberOfLines={2}>{r.titulo}</AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </View>
          <AppText style={styles.cartaoMeta}>
            {r.tempo_preparo_min ? `${r.tempo_preparo_min} min • ` : ''}
            {ROTULO_DIFICULDADE[r.dificuldade] ?? ''}
          </AppText>

          {mostraProgresso && (
            <>
              <View style={styles.barraFundo}>
                <View style={[styles.barraPreenchida, { width: `${Math.round((tem / total) * 100)}%` }]} />
              </View>
              <AppText style={styles.cartaoTem}>
                {tem === 0 ? `Você ainda não tem nenhum dos ${total} ingredientes` : `Você tem ${tem} de ${total} ingredientes`}
              </AppText>
            </>
          )}

          {item.tenho.length > 0 && (
            <AppText style={styles.linhaTem} numberOfLines={2}>✓ {item.tenho.map((i) => i.nome).join(', ')}</AppText>
          )}
          {item.faltam.length > 0 && (
            <AppText style={styles.linhaFalta} numberOfLines={3}>
              {despensa.length > 0 ? 'Falta: ' : 'Ingredientes: '}
              {item.faltam.map((i) => (i.quantidadeTexto ? `${i.nome} (${i.quantidadeTexto})` : i.nome)).join(', ')}
            </AppText>
          )}
        </Pressable>
      );
    },
    [despensa.length]
  );

  function renderResultados() {
    return (
      <View style={styles.corpo}>
        <View style={styles.resumoLinha}>
          <AppText style={styles.resumoTexto} numberOfLines={2}>
            {despensa.length > 0 ? `Seus ingredientes: ${despensa.map((i) => i.nome).join(', ')}` : 'Você não informou ingredientes'}
          </AppText>
          <Pressable onPress={() => setEtapa('ingredientes')} style={styles.botaoEditar}>
            <Ionicons name="create-outline" size={16} color={colors.primaryDark} />
            <AppText style={styles.botaoEditarTexto}>{despensa.length > 0 ? 'Editar' : 'Adicionar'}</AppText>
          </Pressable>
        </View>

        <FiltroChips
          rotuloTodos="Qualquer dificuldade"
          opcoes={OPCOES_DIFICULDADE}
          valor={filtro.dificuldade}
          onChange={(c) => setFiltro((f) => ({ ...f, dificuldade: c as Dificuldade | null }))}
        />
        <FiltroChips
          rotuloTodos="Qualquer tempo"
          opcoes={OPCOES_TEMPO}
          valor={filtro.tempoMaxMin === null ? null : String(filtro.tempoMaxMin)}
          onChange={(c) => setFiltro((f) => ({ ...f, tempoMaxMin: c === null ? null : Number(c) }))}
        />

        {modo === 'outras' && (
          <View style={styles.avisoOutras}>
            <AppText style={styles.avisoOutrasTexto}>
              Estas receitas pedem outros ingredientes — mostrei o que falta em cada uma.
            </AppText>
            <Pressable onPress={() => setModo('combinam')}>
              <AppText style={styles.link}>Voltar às sugestões</AppText>
            </Pressable>
          </View>
        )}

        <FlatList
          data={pontuadas}
          keyExtractor={(p) => p.receita.id}
          renderItem={renderCartao}
          contentContainerStyle={{ gap: 12, paddingTop: 8, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.vazioBloco}>
              <AppText style={styles.vazioTexto}>
                {filtroAtivo
                  ? 'Nenhuma receita com esses filtros. Tira um filtro pra ver mais.'
                  : modo === 'outras'
                    ? 'Por enquanto são todas as receitas que temos. Que tal adicionar mais ingredientes?'
                    : 'Ainda não temos receita com esses ingredientes.'}
              </AppText>
              {!filtroAtivo && modo === 'combinam' && despensa.length > 0 && (
                <Pressable onPress={() => setModo('outras')}>
                  <AppText style={styles.link}>Ver outras receitas</AppText>
                </Pressable>
              )}
              {filtroAtivo && (
                <Pressable onPress={() => setFiltro(FILTRO_RECEITA_VAZIO)}>
                  <AppText style={styles.link}>Limpar filtros</AppText>
                </Pressable>
              )}
            </View>
          }
          ListFooterComponent={
            modo === 'combinam' && despensa.length > 0 && pontuadas.length > 0 ? (
              <Pressable style={styles.botaoSecundario} onPress={() => setModo('outras')}>
                <AppText style={styles.botaoSecundarioTexto}>Não gostei de nenhuma</AppText>
              </Pressable>
            ) : null
          }
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.cabecalho}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.tituloBloco}>
          <AppText style={styles.titulo}>Receitas com o que tenho</AppText>
          <AppText style={styles.subtitulo}>Cozinhe com o que já tem em casa</AppText>
        </View>
      </View>

      {carregando ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : erro ? (
        <View style={styles.vazioBloco}>
          <AppText style={styles.vazioTexto}>{erro}</AppText>
          <Pressable onPress={() => void carregar()}>
            <AppText style={styles.link}>Tentar de novo</AppText>
          </Pressable>
        </View>
      ) : etapa === 'ingredientes' ? (
        renderIngredientes()
      ) : (
        renderResultados()
      )}

      <ReceitaDetalheSheet
        receita={aberta}
        onFechar={() => setAberta(null)}
        onEnviarParaAmigo={(r) => {
          // dois Modals ao mesmo tempo falham no iOS: fecha um e abre o outro depois
          setAberta(null);
          setTimeout(() => setParaEnviar({ id: r.id, titulo: r.titulo }), 450);
        }}
      />
      <EnviarReceitaSheet receita={paraEnviar} onFechar={() => setParaEnviar(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  cabecalho: { flexDirection: 'row', marginTop: 30, alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 12 },
  tituloBloco: { flex: 1, alignItems: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark, textAlign: 'center' },
  subtitulo: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', textAlign: 'center', marginTop: 2 },
  corpo: { flex: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },

  pergunta: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark },
  dica: { fontFamily: typography.regular, fontSize: 13, color: '#7A8B94', marginTop: 4, marginBottom: 16 },
  buscaCaixa: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#D9E2E8', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10 },
  buscaInput: { flex: 1, fontFamily: typography.regular, fontSize: 14, color: colors.primaryDark },
  sugestoesCaixa: { borderWidth: 1.5, borderColor: '#D9E2E8', borderRadius: 16, marginTop: 8, paddingHorizontal: 16 },
  sugestaoItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  sugestaoTexto: { fontFamily: typography.medium, fontSize: 14, color: colors.primaryDark },
  secao: { fontFamily: typography.bold, fontSize: 12, color: '#7A8B94', textTransform: 'uppercase', marginTop: 24, marginBottom: 10 },
  chipsDespensa: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipDespensa: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EAF6DA', borderRadius: 20, paddingVertical: 7, paddingHorizontal: 12 },
  chipDespensaTexto: { fontFamily: typography.medium, fontSize: 13, color: colors.primaryDark },

  botaoPrimario: { backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  botaoPrimarioTexto: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },
  botaoSecundario: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 24, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  botaoSecundarioTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },

  resumoLinha: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  resumoTexto: { flex: 1, fontFamily: typography.regular, fontSize: 12, color: '#5B6B75' },
  botaoEditar: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, backgroundColor: '#EAF6DA' },
  botaoEditarTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
  avisoOutras: { backgroundColor: '#EAF2FD', borderRadius: 12, padding: 12, marginTop: 8, gap: 4 },
  avisoOutrasTexto: { fontFamily: typography.regular, fontSize: 12, color: '#2E6DA4' },

  cartao: { borderWidth: 1.5, borderColor: '#D9E2E8', borderRadius: 16, padding: 16, gap: 6 },
  cartaoTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cartaoTitulo: { flex: 1, fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },
  cartaoMeta: { fontFamily: typography.regular, fontSize: 11, color: '#7A8B94' },
  barraFundo: { height: 6, borderRadius: 3, backgroundColor: '#E6EDF1', overflow: 'hidden', marginTop: 4 },
  barraPreenchida: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  cartaoTem: { fontFamily: typography.medium, fontSize: 12, color: colors.primaryDark },
  linhaTem: { fontFamily: typography.regular, fontSize: 12, color: '#1E8449' },
  linhaFalta: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94' },

  vazioBloco: { alignItems: 'center', gap: 10, paddingHorizontal: 32, marginTop: 40 },
  vazioTexto: { fontFamily: typography.regular, fontSize: 13, color: '#7A8B94', textAlign: 'center' },
  link: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark, textDecorationLine: 'underline' },
});
